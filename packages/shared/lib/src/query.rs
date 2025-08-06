use gloo_utils::format::JsValueSerdeExt;
use js_sys::Uint8Array;
use namada_sdk::address::Address;
use namada_sdk::borsh::BorshSerialize;
use namada_sdk::collections::{HashMap, HashSet};
use namada_sdk::eth_bridge::bridge_pool::query_signed_bridge_pool;
use namada_sdk::eth_bridge_pool::TransferToEthereum;
use namada_sdk::governance::storage::keys as governance_storage;
use namada_sdk::governance::utils::{
    compute_proposal_result, ProposalVotes, TallyResult, TallyType, VotePower,
};
use namada_sdk::governance::{ProposalType, ProposalVote};
use namada_sdk::hash::Hash;
use namada_sdk::masp::shielded_wallet::ShieldedApi;
use namada_sdk::masp::utils::MaspClient as NamadaMaspClient;
use namada_sdk::masp::utils::RetryStrategy;
use namada_sdk::masp::{
    Conversions, IndexerMaspClient, LedgerMaspClient, LinearBackoffSleepMaspClient,
};
use namada_sdk::masp::{ShieldedContext, ShieldedSyncConfig};
use namada_sdk::masp_primitives::asset_type::AssetType;
use namada_sdk::masp_primitives::sapling::ViewingKey;
use namada_sdk::masp_primitives::transaction::components::{I128Sum, ValueSum};
use namada_sdk::masp_primitives::zip32::ExtendedFullViewingKey;
use namada_sdk::parameters::storage;
use namada_sdk::proof_of_stake::Epoch;
use namada_sdk::queries::RPC;
use namada_sdk::rpc::{
    self, get_public_key_at, get_token_balance, get_total_staked_tokens, is_steward, query_epoch,
    query_masp_epoch, query_masp_reward_tokens, query_native_token, query_proposal_by_id,
    query_proposal_votes, query_storage_value,
};
use namada_sdk::state::Key;
use namada_sdk::token::{self, Change};
use namada_sdk::tx::{
    TX_BOND_WASM, TX_CLAIM_REWARDS_WASM, TX_IBC_WASM, TX_REDELEGATE_WASM, TX_REVEAL_PK,
    TX_TRANSFER_WASM, TX_UNBOND_WASM, TX_VOTE_PROPOSAL, TX_WITHDRAW_WASM,
};
use namada_sdk::uint::I256;
use namada_sdk::wallet::DatedKeypair;
use namada_sdk::ExtendedViewingKey;
use std::collections::BTreeMap;
use std::str::FromStr;
use std::time::Duration;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsError;

use crate::rpc_client::HttpClient;
use crate::sdk::{
    io::WebIo,
    masp::{sync, JSShieldedUtils},
};
use crate::types::masp::DatedViewingKey;
use crate::types::query::{MaspTokenRewardData, ProposalInfo, WasmHash};
use crate::utils::{set_panic_hook, to_js_result};

/// Progress bar names
pub const SDK_SCANNED_PROGRESS_BAR: &str = "namada_sdk::progress_bar::scanned";
pub const SDK_FETCHED_PROGRESS_BAR: &str = "namada_sdk::progress_bar::fetched";
pub const SDK_APPLIED_PROGRESS_BAR: &str = "namada_sdk::progress_bar::applied";

#[wasm_bindgen]
pub struct ProgressBarNames {}

#[wasm_bindgen]
impl ProgressBarNames {
    #[allow(non_snake_case)]
    #[wasm_bindgen(getter)]
    pub fn Scanned() -> String {
        SDK_SCANNED_PROGRESS_BAR.to_string()
    }

    #[allow(non_snake_case)]
    #[wasm_bindgen(getter)]
    pub fn Fetched() -> String {
        SDK_FETCHED_PROGRESS_BAR.to_string()
    }

    #[allow(non_snake_case)]
    #[wasm_bindgen(getter)]
    pub fn Applied() -> String {
        SDK_APPLIED_PROGRESS_BAR.to_string()
    }
}

enum MaspClient {
    Ledger(LinearBackoffSleepMaspClient<LedgerMaspClient<HttpClient>>),
    Indexer(LinearBackoffSleepMaspClient<IndexerMaspClient>),
}

#[wasm_bindgen]
/// Represents an API for querying the ledger
pub struct Query {
    client: HttpClient,
    masp_client: MaspClient,
}

#[wasm_bindgen]
impl Query {
    #[wasm_bindgen(constructor)]
    pub fn new(url: String, masp_url: Option<String>) -> Query {
        set_panic_hook();
        let client = HttpClient::new(url);

        let masp_client = if let Some(url) = masp_url {
            let client = reqwest::Client::builder().build().unwrap();
            // TODO: for now we just concatenate the v1 api path
            let url = reqwest::Url::parse(&format!("{}/api/v1", url)).unwrap();

            MaspClient::Indexer(LinearBackoffSleepMaspClient::new(
                IndexerMaspClient::new(client, url, true, 100),
                Duration::from_millis(5),
            ))
        } else {
            MaspClient::Ledger(LinearBackoffSleepMaspClient::new(
                LedgerMaspClient::new(
                    client.clone(),
                    // Using one does not break the progress indicators
                    1,
                ),
                Duration::from_millis(5),
            ))
        };

        Query {
            client,
            masp_client,
        }
    }

    /// Gets current epoch
    ///
    /// # Errors
    ///
    /// Returns an error if the RPC call fails
    pub async fn query_epoch(&self) -> Result<u64, JsError> {
        let epoch = RPC.shell().epoch(&self.client).await?;

        Ok(epoch.0)
    }

    /// Gets all active validator addresses
    ///
    /// # Errors
    ///
    /// Returns an error if the RPC call fails
    pub async fn query_all_validator_addresses(&self) -> Result<JsValue, JsError> {
        let validator_addresses = RPC
            .vp()
            .pos()
            .validator_addresses(&self.client, &None)
            .await?;

        to_js_result(validator_addresses)
    }

    /// Gets total bonds by validator address
    ///
    /// # Errors
    ///
    /// Returns an error if the RPC call fails
    pub async fn query_total_bonds(&self, address: String) -> Result<JsValue, JsError> {
        let address = Address::from_str(&address)?;

        let total_bonds = RPC
            .vp()
            .pos()
            .validator_stake(&self.client, &address, &None)
            .await?;

        to_js_result(total_bonds)
    }

    /// Gets all delegations for every provided address.
    /// Returns a tuple of:
    /// (owner_address, validator_address, total_bonds, total_unbonds, withdrawable)
    ///
    /// # Arguments
    ///
    /// * `owner_addresses` - Account address in form of bech32, base64 encoded string
    ///
    /// # Errors
    ///
    /// Panics if address can't be deserialized
    pub async fn query_my_validators(
        &self,
        owner_addresses: Box<[JsValue]>,
    ) -> Result<JsValue, JsError> {
        let owner_addresses: Vec<Address> = owner_addresses
            .iter()
            .map(|address| {
                address
                    .as_string()
                    .and_then(|address_str| Address::from_str(&address_str).ok())
                    // TODO: we unwrap but we could also filter_map with warning or map to error
                    .unwrap()
            })
            .collect();

        let mut validators_per_address: HashMap<Address, HashSet<Address>> = HashMap::new();

        for address in owner_addresses.into_iter() {
            let validators = RPC
                .vp()
                .pos()
                .delegation_validators(&self.client, &address, &None)
                .await?;

            validators_per_address.insert(address, validators);
        }

        let mut result: Vec<(Address, Address, String, String, String)> = Vec::new();

        let epoch = query_epoch(&self.client).await?;
        for (owner, validators) in validators_per_address.into_iter() {
            for validator in validators.into_iter() {
                let owner_option = &Some(owner.clone());
                let validator_option = &Some(validator.clone());

                let enriched = RPC
                    .vp()
                    .pos()
                    .enriched_bonds_and_unbonds(&self.client, epoch, owner_option, validator_option)
                    .await?;

                result.push((
                    owner.clone(),
                    validator,
                    enriched.bonds_total.to_string_native(),
                    enriched.unbonds_total.to_string_native(),
                    enriched.total_withdrawable.to_string_native(),
                ));
            }
        }

        to_js_result(result)
    }

    fn get_decoded_balance(
        decoded_balance: ValueSum<Address, I256>,
    ) -> Vec<(Address, token::Amount)> {
        let mut result = Vec::new();

        for (token_addr, amount) in decoded_balance.components() {
            let amount = token::Amount::from_change(*amount);
            result.push((token_addr.clone(), amount));
        }

        result
    }

    pub async fn query_staking_positions(
        &self,
        owner_addresses: Box<[JsValue]>,
    ) -> Result<JsValue, JsError> {
        let owner_addresses: Vec<Address> = owner_addresses
            .iter()
            .filter_map(|address| address.as_string())
            .filter_map(|address| Address::from_str(&address).ok())
            .collect();

        let mut validators_per_address: HashMap<Address, HashSet<Address>> = HashMap::new();

        for address in owner_addresses.into_iter() {
            let validators = RPC
                .vp()
                .pos()
                .delegation_validators(&self.client, &address, &None)
                .await?;

            validators_per_address.insert(address, validators);
        }

        let mut bonds = vec![];
        let mut unbonds = vec![];

        let epoch = query_epoch(&self.client).await?;
        for (owner, validators) in validators_per_address.into_iter() {
            for validator in validators.into_iter() {
                let owner_option = &Some(owner.clone());
                let validator_option = &Some(validator.clone());

                let enriched = RPC
                    .vp()
                    .pos()
                    .enriched_bonds_and_unbonds(&self.client, epoch, owner_option, validator_option)
                    .await?;

                for (bond_id, details) in &enriched.data {
                    for bond in &details.data.bonds {
                        bonds.push((
                            bond_id.source.clone(),
                            bond_id.validator.clone(),
                            bond.amount.to_string_native(),
                            bond.start.to_string(),
                        ));
                    }

                    for unbond in &details.data.unbonds {
                        unbonds.push((
                            bond_id.source.clone(),
                            bond_id.validator.clone(),
                            unbond.amount.to_string_native(),
                            unbond.start.to_string(),
                            unbond.withdraw.to_string(),
                        ));
                    }
                }
            }
        }

        to_js_result((bonds, unbonds))
    }

    /// Queries transparent balance for a given address
    ///
    /// # Arguments
    ///
    /// * `owner` - Account address in form of bech32, base64 encoded string
    async fn query_transparent_balance(
        &self,
        owner: Address,
        tokens: Vec<Address>,
    ) -> Result<Vec<(Address, token::Amount)>, JsError> {
        let mut result = vec![];
        for token in tokens {
            let balances = get_token_balance(&self.client, &token, &owner, None).await?;
            result.push((token, balances));
        }

        Ok(result)
    }

    pub async fn shielded_sync(
        &self,
        vks: Box<[DatedViewingKey]>,
        chain_id: String,
    ) -> Result<(), JsError> {
        let dated_keypairs = vks.iter().map(|vk| vk.0).collect::<Vec<_>>();

        match &self.masp_client {
            MaspClient::Indexer(client) => {
                web_sys::console::info_1(&"Syncing using IndexerMaspClient".into());
                self.sync(client.clone(), dated_keypairs, chain_id).await?
            }
            MaspClient::Ledger(client) => {
                web_sys::console::info_1(&"Syncing using LedgerMaspClient".into());
                self.sync(client.clone(), dated_keypairs, chain_id).await?
            }
        };

        Ok(())
    }

    async fn sync<C>(
        &self,
        client: C,
        dated_keypairs: Vec<DatedKeypair<ViewingKey>>,
        chain_id: String,
    ) -> Result<(), JsError>
    where
        C: NamadaMaspClient + Send + Sync + Unpin + 'static,
    {
        let progress_bar_scanned = sync::ProgressBarWeb::new(SDK_SCANNED_PROGRESS_BAR);
        let progress_bar_fetched = sync::ProgressBarWeb::new(SDK_FETCHED_PROGRESS_BAR);
        let progress_bar_applied = sync::ProgressBarWeb::new(SDK_APPLIED_PROGRESS_BAR);
        let shutdown_signal_web = sync::ShutdownSignalWeb {};
        // batch size does not matter for masp ledger client, and if we set to sth else than 1 it breaks
        // progress bar
        let batch_size = match self.masp_client {
            MaspClient::Ledger(_) => 1,
            MaspClient::Indexer(_) => 100,
        };

        let config = ShieldedSyncConfig::builder()
            .client(client)
            .scanned_tracker(progress_bar_scanned)
            .fetched_tracker(progress_bar_fetched)
            .applied_tracker(progress_bar_applied)
            .shutdown_signal(shutdown_signal_web)
            .block_batch_size(batch_size)
            .wait_for_last_query_height(true)
            // Total of requests that can be failed before sync is aborted
            .retry_strategy(RetryStrategy::Times(1000))
            .build();

        let env = sync::TaskEnvWeb::new();

        let mut shielded_context: ShieldedContext<JSShieldedUtils> = ShieldedContext::default();
        shielded_context.utils.chain_id = chain_id.clone();

        shielded_context
            .sync(env, config, None, &[], dated_keypairs.as_slice())
            .await
            .map_err(|e| JsError::new(&format!("{:?}", e)))?;

        Ok(())
    }

    pub async fn query_notes_to_spend(
        &self,
        owner: String,
        tokens: Box<[JsValue]>,
        chain_id: String,
    ) -> Result<JsValue, JsError> {
        let tokens: Vec<Address> = tokens
            .iter()
            .map(|address| {
                let address_str = address.as_string().unwrap();
                Address::from_str(&address_str).unwrap()
            })
            .collect();
        let xvk = ExtendedViewingKey::from_str(&owner)?;
        let viewing_key = ExtendedFullViewingKey::from(xvk).fvk.vk;

        // We are recreating shielded context to avoid multiple mutable borrows
        let mut shielded: ShieldedContext<JSShieldedUtils> = ShieldedContext::default();
        shielded.utils.chain_id = chain_id.clone();
        shielded.try_load(async |_| {}).await;
        shielded
            .precompute_asset_types(&self.client, tokens.iter().collect())
            .await
            .map_err(|e| JsError::new(&format!("{:?}", e)))?;
        let _ = shielded.save().await;

        let epoch = query_masp_epoch(&self.client).await?;

        let mut notes = vec![];
        let mut conv = Conversions::new();
        // Retrieve the notes that can be spent by this key
        if let Some(avail_notes) = shielded.pos_map.get(&viewing_key) {
            for note_idx in avail_notes {
                // Spent notes cannot contribute a new transaction's pool
                if shielded.spents.contains(note_idx) {
                    continue;
                }
                // Get note associated with this ID
                let note = shielded.note_map.get(note_idx).unwrap();
                // Finally add value to multi-asset accumulator
                notes.push(
                    I128Sum::from_nonnegative(note.asset_type, i128::from(note.value)).unwrap(),
                );
            }
        }

        for n in &notes {
            for (asset_type, _) in n.components() {
                shielded
                    .query_allowed_conversion(&self.client, *asset_type, &mut conv)
                    .await
                    .map_err(|e| JsError::new(&format!("{:?}", e)))?;
            }
        }

        let mut dupa = vec![];

        for note in notes.iter() {
            for (asset_type, val) in note.components() {
                let decoded = shielded.decode_asset_type(&self.client, *asset_type).await;
                let conv = conv.get(asset_type);
                match decoded {
                    Some(pre_asset_type) if pre_asset_type.epoch.is_none_or(|e| e <= epoch) => {
                        let decoded_change =
                            Change::from_masp_denominated(*val, pre_asset_type.position)
                                .expect("expected this to fit");
                        let www = ValueSum::from_pair(pre_asset_type.token.clone(), decoded_change);

                        let www = Self::get_decoded_balance(www);
                        let zzz = www
                            .into_iter()
                            .map(|(token, amount)| (token, amount, conv.is_some()))
                            .collect::<Vec<_>>();

                        if conv.is_some() {
                            web_sys::console::log_1(
                                &format!("Adding conversion for entry {:?} ", zzz)
                                    .into(),
                            );
                            for (_, val) in
                                I128Sum::from(conv.unwrap().0.clone()).components()
                            {

                                let decoded_change =
                                    Change::from_masp_denominated(*val, pre_asset_type.position)
                                        .expect("expected this to fit");
                                let www = ValueSum::from_pair(
                                    pre_asset_type.token.clone(),
                                    decoded_change,
                                );

                                let www = Self::get_decoded_balance(www);
                                web_sys::console::log_1(&format!("Conversion {:?}", www).into());
                            }
                        }

                        dupa.push(zzz);
                    }
                    _ => {}
                }
            }
        }

        let flat = dupa.into_iter().flatten().collect::<Vec<_>>();

        to_js_result(flat)
    }

    /// Queries shielded balance for a given extended viewing key
    ///
    /// # Arguments
    ///
    /// * `xvk` - Extended viewing key
    async fn query_shielded_balance(
        &self,
        xvk: ExtendedViewingKey,
        tokens: Vec<Address>,
        chain_id: String,
    ) -> Result<Vec<(Address, token::Amount)>, JsError> {
        let viewing_key = ExtendedFullViewingKey::from(xvk).fvk.vk;

        // We are recreating shielded context to avoid multiple mutable borrows
        let mut shielded: ShieldedContext<JSShieldedUtils> = ShieldedContext::default();
        shielded.utils.chain_id = chain_id.clone();
        // TODO: pass handler
        shielded.try_load(async |_| {}).await;
        shielded
            .precompute_asset_types(&self.client, tokens.iter().collect())
            .await
            .map_err(|e| JsError::new(&format!("{:?}", e)))?;
        let _ = shielded.save().await;

        let epoch = query_masp_epoch(&self.client).await?;
        let balance = shielded
            .compute_exchanged_balance(&self.client, &WebIo, &viewing_key)
            .await
            .map_err(|e| JsError::new(&format!("{:?}", e)))?;

        let res = match balance {
            Some(balance) => {
                let decoded_balance = shielded
                    .decode_combine_sum_to_epoch(&self.client, balance, epoch)
                    .await;

                Self::get_decoded_balance(decoded_balance.0)
            }
            None => vec![],
        };

        Ok(res)
    }

    pub async fn query_balance(
        &self,
        owner: String,
        tokens: Box<[JsValue]>,
        // We need to pass chain id to load correct context
        chain_id: String,
    ) -> Result<JsValue, JsError> {
        let tokens: Vec<Address> = tokens
            .iter()
            .map(|address| {
                let address_str = address.as_string().unwrap();
                Address::from_str(&address_str).unwrap()
            })
            .collect();

        let result = match Address::from_str(&owner) {
            Ok(addr) => self.query_transparent_balance(addr, tokens).await,
            Err(e1) => match ExtendedViewingKey::from_str(&owner) {
                Ok(xvk) => self.query_shielded_balance(xvk, tokens, chain_id).await,
                Err(e2) => return Err(JsError::new(&format!("{} {}", e1, e2))),
            },
        }?;

        let mut mapped_result: Vec<(Address, String)> = vec![];
        for (token, amount) in result {
            mapped_result.push((token.clone(), amount.to_string()))
        }

        to_js_result(mapped_result)
    }

    pub async fn query_public_key(&self, address: &str) -> Result<JsValue, JsError> {
        let addr = Address::from_str(address).map_err(JsError::from)?;
        let pk = get_public_key_at(&self.client, &addr, 0).await?;

        let result = pk.map(|v| v.to_string());

        to_js_result(result)
    }

    pub async fn query_signed_bridge_pool(
        &self,
        owner_addresses: Box<[JsValue]>,
    ) -> Result<JsValue, JsError> {
        let bridge_pool = query_signed_bridge_pool(&self.client, &WebIo).await?;

        let owner_addresses: Vec<Address> = owner_addresses
            .iter()
            .filter_map(|address| address.as_string())
            .filter_map(|address| Address::from_str(&address).ok())
            .collect();

        let result: Vec<TransferToEthereum> = bridge_pool
            .into_iter()
            .filter_map(|(_hash, pending_transfer)| {
                if owner_addresses.contains(&pending_transfer.transfer.sender) {
                    Some(pending_transfer.transfer)
                } else {
                    None
                }
            })
            .collect();

        to_js_result(result)
    }

    pub async fn query_total_staked_tokens(&self, epoch: u64) -> Result<JsValue, JsError> {
        let total_staked_tokens = get_total_staked_tokens(&self.client, Epoch(epoch)).await?;

        to_js_result(total_staked_tokens)
    }

    pub async fn query_proposal_counter(&self) -> Result<JsValue, JsError> {
        let proposal_counter_key = governance_storage::get_counter_key();
        let proposal_counter =
            query_storage_value::<HttpClient, u64>(&self.client, &proposal_counter_key)
                .await
                .unwrap();

        to_js_result(proposal_counter)
    }

    pub async fn query_proposal_by_id(&self, id: u64) -> Result<Uint8Array, JsError> {
        let proposal = query_proposal_by_id(&self.client, id)
            .await
            .unwrap()
            .expect("Proposal should be written to storage.");

        let content = serde_json::to_string(&proposal.content)?;

        let is_steward = is_steward(&self.client, &proposal.author).await;
        let tally_type = proposal.get_tally_type(is_steward);
        let tally_type_string = match tally_type {
            // TODO: Change in interface
            TallyType::TwoFifths => "two-fifths",
            TallyType::OneHalfOverOneThird => "one-half-over-one-third",
            TallyType::LessOneHalfOverOneThirdNay => "less-one-half-over-one-third-nay",
        };

        let (proposal_type, data) = match proposal.r#type {
            ProposalType::Default => ("default", None),
            ProposalType::DefaultWithWasm(hash) => ("default", Some(hash.to_string())),
            ProposalType::PGFSteward(data) => {
                let data_string = serde_json::to_string(&data)?;
                ("pgf_steward", Some(data_string))
            }
            ProposalType::PGFPayment(data) => {
                let data_string = serde_json::to_string(&data)?;
                ("pgf_payment", Some(data_string))
            }
        };

        let proposal_info = ProposalInfo {
            id: proposal.id,
            author: proposal.author.to_string(),
            start_epoch: proposal.voting_start_epoch.0,
            end_epoch: proposal.voting_end_epoch.0,
            grace_epoch: proposal.activation_epoch.0,
            content,
            tally_type: String::from(tally_type_string),
            proposal_type: String::from(proposal_type),
            data,
        };

        let mut writer = vec![];
        BorshSerialize::serialize(&proposal_info, &mut writer)?;

        Ok(Uint8Array::from(writer.as_slice()))
    }

    #[allow(clippy::type_complexity)]
    pub async fn query_proposal_votes(
        &self,
        proposal_id: u64,
        epoch: u64,
    ) -> Result<JsValue, JsError> {
        let votes = compute_proposal_votes(&self.client, proposal_id, Epoch(epoch)).await;

        let validator_votes: Vec<(Address, String, token::Amount)> =
            Vec::from_iter(votes.validators_vote.iter().map(|(address, vote)| {
                let vote = match vote {
                    ProposalVote::Yay => "yay",
                    ProposalVote::Nay => "nay",
                    ProposalVote::Abstain => "abstain",
                };

                let voting_power = *votes
                    .validator_voting_power
                    .get(address)
                    .expect("validator has voting power entry");

                (address.clone(), String::from(vote), voting_power)
            }));

        // TODO: refactor this to fix type_complexity clippy warning
        let delegator_votes: Vec<(Address, String, Vec<(Address, token::Amount)>)> =
            Vec::from_iter(votes.delegators_vote.iter().map(|(address, vote)| {
                let vote = match vote {
                    ProposalVote::Yay => "yay",
                    ProposalVote::Nay => "nay",
                    ProposalVote::Abstain => "abstain",
                };

                let voting_power = votes
                    .delegator_voting_power
                    .get(address)
                    .expect("delegator has voting power entry")
                    .clone()
                    .into_iter()
                    .collect();

                (address.clone(), String::from(vote), voting_power)
            }));

        to_js_result((validator_votes, delegator_votes))
    }

    pub async fn query_proposal_result(
        &self,
        proposal_id: u64,
        epoch: u64,
    ) -> Result<JsValue, JsError> {
        let epoch = Epoch(epoch);

        let votes = compute_proposal_votes(&self.client, proposal_id, epoch).await;

        let total_voting_power = get_total_staked_tokens(&self.client, epoch).await?;

        let proposal = query_proposal_by_id(&self.client, proposal_id)
            .await
            .unwrap()
            .expect("Proposal should be written to storage.");
        let is_steward = is_steward(&self.client, &proposal.author).await;
        let tally_type = proposal.get_tally_type(is_steward);

        let proposal_result = compute_proposal_result(votes, total_voting_power, tally_type)
            .expect("could compute proposal result");

        let passed = match proposal_result.result {
            TallyResult::Passed => true,
            TallyResult::Rejected => false,
        };

        to_js_result((
            passed,
            proposal_result.total_yay_power,
            proposal_result.total_nay_power,
            proposal_result.total_abstain_power,
            proposal_result.total_voting_power,
        ))
    }

    pub async fn query_proposal_code(&self, proposal_id: u64) -> Result<Uint8Array, JsError> {
        let proposal_code_key = governance_storage::get_proposal_code_key(proposal_id);
        let code =
            query_storage_value::<HttpClient, Vec<u8>>(&self.client, &proposal_code_key).await?;

        Ok(Uint8Array::from(code.as_slice()))
    }

    /// Returns a list of all delegations for given addresses and epoch
    ///
    /// # Arguments
    ///
    /// * `addresses` - delegators addresses
    /// * `epoch` - epoch in which we want to query delegations
    pub async fn get_total_delegations(
        &self,
        addresses: Box<[JsValue]>,
        epoch: Option<u64>,
    ) -> Result<JsValue, JsError> {
        let addresses: Vec<Address> = addresses
            .iter()
            .filter_map(|address| address.as_string())
            .filter_map(|address| Address::from_str(&address).ok())
            .collect();

        let epoch = epoch.map(Epoch);

        let mut delegations: HashMap<Address, token::Amount> = HashMap::new();

        for address in addresses.into_iter() {
            let validators: HashMap<Address, token::Amount> = RPC
                .vp()
                .pos()
                .delegations(&self.client, &address, &epoch)
                .await?;
            let sum_of_delegations = validators
                .into_values()
                .fold(token::Amount::zero(), |acc, curr| {
                    acc.checked_add(curr).expect("Amount overflow")
                });

            delegations.insert(address, sum_of_delegations);
        }

        to_js_result(delegations)
    }

    pub async fn masp_reward_tokens(&self) -> Result<JsValue, JsError> {
        let rewards = query_masp_reward_tokens(&self.client).await?;
        let serializable_rewards: Vec<MaspTokenRewardData> = rewards
            .iter()
            .map(|reward| MaspTokenRewardData {
                name: reward.name.clone(),
                address: reward.address.clone(),
                max_reward_rate: reward.max_reward_rate,
                kp_gain: reward.kp_gain,
                kd_gain: reward.kd_gain,
                locked_amount_target: reward.locked_amount_target,
            })
            .collect();
        to_js_result(serializable_rewards)
    }

    /// Returns list of delegators that already voted on a proposal
    ///
    /// # Arguments
    ///
    /// * `proposal_id` - id of proposal to get delegators votes from
    pub async fn delegators_votes(&self, proposal_id: u64) -> Result<JsValue, JsError> {
        let votes = query_proposal_votes(&self.client, proposal_id).await?;
        let res: Vec<(Address, bool)> = votes
            .into_iter()
            .map(|vote| {
                let is_yay = match vote.data {
                    ProposalVote::Yay => true,
                    ProposalVote::Nay => false,
                    ProposalVote::Abstain => false,
                };
                (vote.delegator, is_yay)
            })
            .collect();

        to_js_result(res)
    }

    pub async fn query_gas_costs(&self) -> Result<JsValue, JsError> {
        let key = storage::get_gas_cost_key();
        let gas_cost_table =
            query_storage_value::<HttpClient, BTreeMap<Address, token::Amount>>(&self.client, &key)
                .await
                .expect("Parameter should be defined.");

        let mut result: Vec<(String, String)> = Vec::new();

        for (token, gas_cost) in gas_cost_table {
            result.push((token.to_string(), gas_cost.to_string_native()));
        }

        to_js_result(result)
    }

    pub async fn query_native_token(&self) -> Result<JsValue, JsError> {
        let address = query_native_token(&self.client).await?;
        to_js_result(address)
    }

    // Vec of code paths of supported transactions
    pub fn code_paths() -> Vec<String> {
        vec![
            TX_TRANSFER_WASM.to_string(),
            TX_BOND_WASM.to_string(),
            TX_REDELEGATE_WASM.to_string(),
            TX_UNBOND_WASM.to_string(),
            TX_WITHDRAW_WASM.to_string(),
            TX_CLAIM_REWARDS_WASM.to_string(),
            TX_REVEAL_PK.to_string(),
            TX_VOTE_PROPOSAL.to_string(),
            TX_IBC_WASM.to_string(),
        ]
    }

    // Query supported wasm code-paths, and return a serialized vec of object containing path and hash
    pub async fn query_wasm_hashes(&self) -> Result<JsValue, JsError> {
        let mut results: Vec<WasmHash> = vec![];
        let code_paths = Query::code_paths();

        for path in code_paths {
            let hash = self.query_wasm_hash(&path).await;

            if hash.is_some() {
                let wasm_hash = WasmHash::new(path, hash.unwrap());
                results.push(wasm_hash);
            }
        }

        Ok(JsValue::from_serde(&results).unwrap())
    }

    // Query hash of wasm code on chain
    pub async fn query_wasm_hash(&self, tx_code_path: &str) -> Option<String> {
        let hash_key = Key::wasm_hash(tx_code_path);
        let (tx_code_res, _) = rpc::query_storage_value_bytes(&self.client, &hash_key, None, false)
            .await
            .ok()?;
        if let Some(tx_code_bytes) = tx_code_res {
            let tx_code = Hash::try_from(&tx_code_bytes[..]).expect("Invalid code hash");
            Some(tx_code.to_string())
        } else {
            None
        }
    }
}

//TODO: remove after moving this fn from apps to shared
pub async fn compute_proposal_votes(
    client: &HttpClient,
    proposal_id: u64,
    epoch: Epoch,
) -> ProposalVotes {
    let votes = query_proposal_votes(client, proposal_id).await.unwrap();

    let mut validators_vote: HashMap<Address, ProposalVote> = HashMap::default();
    let mut validator_voting_power: HashMap<Address, VotePower> = HashMap::default();
    let mut delegators_vote: HashMap<Address, ProposalVote> = HashMap::default();
    let mut delegator_voting_power: HashMap<Address, HashMap<Address, VotePower>> =
        HashMap::default();

    for vote in votes {
        if vote.is_validator() {
            let validator_stake = RPC
                .vp()
                .pos()
                .validator_stake(client, &vote.validator.clone(), &Some(epoch))
                .await
                .expect("Validator stake should be present")
                .unwrap_or_default();

            validators_vote.insert(vote.validator.clone(), vote.data);
            validator_voting_power.insert(vote.validator, validator_stake);
        } else {
            let delegator_stake = RPC
                .vp()
                .pos()
                .bond_with_slashing(client, &vote.delegator, &vote.validator, &Some(epoch))
                .await
                .expect("Delegator stake should be present");

            delegators_vote.insert(vote.delegator.clone(), vote.data);
            delegator_voting_power
                .entry(vote.delegator.clone())
                .or_default()
                .insert(vote.validator, delegator_stake);
        }
    }

    ProposalVotes {
        validators_vote,
        validator_voting_power,
        delegators_vote,
        delegator_voting_power,
    }
}
