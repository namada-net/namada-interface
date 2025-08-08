mod args;
pub mod events;
pub mod io;
pub mod masp;
mod signature;
mod transaction;
mod tx;
mod wallet;

use self::io::WebIo;
use crate::rpc_client::HttpClient;
use crate::utils::set_panic_hook;
#[cfg(feature = "web")]
use crate::utils::to_bytes;
use crate::utils::to_js_result;
use args::{generate_rng_build_params, masp_sign, BuildParams, MapSaplingSigAuth};
use gloo_utils::format::JsValueSerdeExt;
use js_sys::Uint8Array;
use namada_sdk::address::{Address, ImplicitAddress, MASP};
use namada_sdk::args::{
    GenIbcShieldingTransfer, IbcShieldingTransferAsset, InputAmount, Query, TxExpiration,
};
use namada_sdk::borsh::{self, BorshDeserialize};
use namada_sdk::collections::HashMap;
use namada_sdk::control_flow::time;
use namada_sdk::eth_bridge::bridge_pool::build_bridge_pool_tx;
use namada_sdk::hash::Hash;
use namada_sdk::ibc::convert_masp_tx_to_ibc_memo;
use namada_sdk::ibc::core::host::types::identifiers::{ChannelId, PortId};
use namada_sdk::io::{Client, NamadaIo};
use namada_sdk::key::{common, ed25519, RefTo, SigScheme};
use namada_sdk::masp::shielded_wallet::ShieldedApi;
use namada_sdk::masp::ShieldedContext;
use namada_sdk::masp_primitives::sapling::ViewingKey;
use namada_sdk::masp_primitives::transaction::components::amount::I128Sum;
use namada_sdk::masp_primitives::transaction::TxId;
use namada_sdk::masp_primitives::zip32::{ExtendedFullViewingKey, ExtendedKey};
use namada_sdk::rpc::{self, query_denom, query_epoch, InnerTxResult, TxAppliedEvents, TxResponse};
use namada_sdk::signing::SigningTxData;
use namada_sdk::string_encoding::Format;
use namada_sdk::tendermint_rpc::Url;
use namada_sdk::token::{Amount, DenominatedAmount};
use namada_sdk::token::{MaspTxId, OptionExt};
use namada_sdk::tx::data::{ResultCode, TxType};
use namada_sdk::tx::Section;
use namada_sdk::tx::{
    build_batch, build_bond, build_claim_rewards, build_ibc_transfer, build_redelegation,
    build_reveal_pk, build_shielded_transfer, build_shielding_transfer, build_transparent_transfer,
    build_unbond, build_unshielding_transfer, build_vote_proposal, build_withdraw,
    data::compute_inner_tx_hash, either::Either, gen_ibc_shielding_transfer, Tx,
};
use namada_sdk::wallet::{Store, Wallet};
use namada_sdk::{
    ExtendedViewingKey, Namada, NamadaImpl, PaymentAddress, TransferSource, TransferTarget,
};
use std::collections::BTreeMap;
use std::str::FromStr;
use tx::MaspSigningData;
use wasm_bindgen::{prelude::wasm_bindgen, JsError, JsValue};

/// Represents the Sdk public API.
#[wasm_bindgen]
pub struct Sdk {
    namada: NamadaImpl<HttpClient, wallet::JSWalletUtils, masp::JSShieldedUtils, WebIo>,
    rpc_url: String,
}

#[wasm_bindgen]
/// Sdk mostly wraps the logic of the Sdk struct members, making it a part of public API.
/// For more details, navigate to the corresponding modules.
impl Sdk {
    #[wasm_bindgen(constructor)]
    pub fn new(url: String, native_token: String, path_or_db_name: String) -> Self {
        set_panic_hook();
        let client: HttpClient = HttpClient::new(url.clone());
        let wallet: Wallet<wallet::JSWalletUtils> = Wallet::new(
            wallet::JSWalletUtils::new_utils(&path_or_db_name),
            Store::default(),
        );
        let shielded_ctx: ShieldedContext<masp::JSShieldedUtils> = ShieldedContext::default();

        let namada = NamadaImpl::native_new(
            client,
            wallet,
            shielded_ctx.into(),
            WebIo,
            //NAM address
            Address::from_str(&native_token).unwrap(),
        );

        Sdk {
            namada,
            rpc_url: url,
        }
    }

    pub async fn clear_shielded_context(chain_id: String) -> Result<(), JsValue> {
        masp::JSShieldedUtils::clear(&chain_id).await?;

        Ok(())
    }

    pub async fn has_masp_params() -> Result<JsValue, JsValue> {
        let has = has_masp_params().await?;

        Ok(js_sys::Boolean::from(has.as_bool().unwrap()).into())
    }

    pub async fn fetch_and_store_masp_params(url: Option<String>) -> Result<(), JsValue> {
        fetch_and_store_masp_params(url).await?;
        Ok(())
    }

    #[cfg(feature = "web")]
    pub async fn load_masp_params(
        &self,
        _db_name: JsValue,
        chain_id: String,
    ) -> Result<(), JsValue> {
        // _dn_name is not used in the web version for a time being
        let params = get_masp_params().await?;
        let params_iter = js_sys::try_iter(&params)?.ok_or("Can't iterate over JsValue")?;
        let mut params_bytes = params_iter.map(|p| to_bytes(p.unwrap()));

        let spend = params_bytes.next().unwrap();
        let output = params_bytes.next().unwrap();
        let convert = params_bytes.next().unwrap();

        // We are making sure that there are no more params left
        assert_eq!(params_bytes.next(), None);

        let mut shielded = self.namada.shielded_mut().await;
        *shielded = ShieldedContext::new(
            masp::JSShieldedUtils::new(spend, output, convert, chain_id).await?,
        );

        Ok(())
    }

    #[cfg(feature = "nodejs")]
    pub async fn load_masp_params(
        &self,
        context_dir: JsValue,
        chain_id: String,
    ) -> Result<(), JsValue> {
        let context_dir = context_dir.as_string().unwrap();

        let mut shielded = self.namada.shielded_mut().await;
        *shielded = ShieldedContext::new(masp::JSShieldedUtils::new(&context_dir, &chain_id).await);

        Ok(())
    }

    pub async fn add_spending_key(&self, xsk: String, alias: String) {
        let mut wallet = self.namada.wallet_mut().await;
        wallet::add_spending_key(&mut wallet, xsk, alias)
    }

    pub async fn add_viewing_key(&self, xvk: String, alias: String) {
        let mut wallet = self.namada.wallet_mut().await;
        wallet::add_viewing_key(&mut wallet, xvk, alias)
    }

    pub async fn add_payment_address(&self, pa: String, alias: String) {
        let mut wallet = self.namada.wallet_mut().await;
        wallet::add_payment_address(&mut wallet, pa, alias)
    }

    pub async fn add_default_payment_address(&self, xvk: String, alias: String) {
        let mut wallet = self.namada.wallet_mut().await;
        wallet::add_default_payment_address(&mut wallet, xvk, alias)
    }

    pub async fn add_keypair(&self, secret_key: String, alias: String, password: Option<String>) {
        let mut wallet = self.namada.wallet_mut().await;
        wallet::add_keypair(&mut wallet, secret_key, alias, password)
    }

    pub async fn save_wallet(&self) -> Result<(), JsValue> {
        let wallet = self.namada.wallet_mut().await;
        wallet.save().map_err(JsError::from)?;

        Ok(())
    }

    pub async fn load_wallet(&self) -> Result<(), JsValue> {
        let mut wallet = self.namada.wallet_mut().await;
        wallet.load().map_err(JsError::from)?;

        Ok(())
    }

    pub async fn sign_masp(&self, xsks: Box<[String]>, tx: Vec<u8>) -> Result<JsValue, JsError> {
        let tx: tx::Tx = borsh::from_slice(&tx)?;
        let mut namada_tx: Tx = borsh::from_slice(&tx.tx_bytes())?;

        // Use keys_map to easily map xfvk to xsk
        let mut keys_map = BTreeMap::new();
        for xsk_s in xsks.iter() {
            let xsk = namada_sdk::ExtendedSpendingKey::from_str(xsk_s)?;
            let xvk = xsk.to_viewing_key();
            let xfvk = ExtendedFullViewingKey::from(xvk);

            keys_map.insert(xfvk, xsk);
        }

        for signing_data in tx.signing_data() {
            if let Some(masp_signing_data) = signing_data.masp() {
                let masp_signing_data =
                    borsh::from_slice::<MaspSigningData>(&masp_signing_data).ok();

                if let Some(masp_signing_data) = masp_signing_data {
                    let signing_tx_data = signing_data.to_signing_tx_data()?;
                    let bparams = masp_signing_data.bparams();

                    for xfvk in masp_signing_data.xfvks() {
                        let xsk = keys_map.get(&xfvk).ok_or_err_msg("Can't map xfvk to xsk")?;
                        masp_sign(&mut namada_tx, &signing_tx_data, bparams.clone(), *xsk).await?;
                    }
                }
            }
        }

        to_js_result(borsh::to_vec(&namada_tx)?)
    }

    pub fn get_descriptor_map(
        &self,
        tx: Vec<u8>,
        shielded_hash: Vec<u8>,
    ) -> Result<JsValue, JsError> {
        // TODO: map expect
        let masp_tx_id: MaspTxId =
            TxId::from_bytes(shielded_hash.try_into().expect("TxId should be 32 bytes")).into();

        let namada_tx: Tx = borsh::from_slice(&tx)?;
        // TODO: map expect
        let masp_builder = namada_tx
            .get_masp_builder(&masp_tx_id)
            .expect("Expected to find the MASP Transaction");

        let sapling_inputs = masp_builder.builder.sapling_inputs();
        let mut descriptor_map = vec![0; sapling_inputs.len()];
        for i in 0.. {
            if let Some(pos) = masp_builder.metadata.spend_index(i) {
                descriptor_map[pos] = i;
            } else {
                break;
            };
        }

        to_js_result(descriptor_map)
    }

    // TODO: this should be unified with sign_masp somehow
    pub fn sign_masp_ledger(
        &self,
        tx: Vec<u8>,
        signing_data: Vec<Uint8Array>,
        signatures: Vec<Uint8Array>,
    ) -> Result<JsValue, JsError> {
        let mut namada_tx: Tx = borsh::from_slice(&tx)?;
        let signing_data = signing_data
            .iter()
            .map(|sd| {
                borsh::from_slice(&sd.to_vec()).expect("Expected to deserialize signing data")
            })
            .collect::<Vec<tx::SigningData>>();

        for signing_data in signing_data {
            let signing_tx_data = signing_data.to_signing_tx_data()?;
            if let Some(shielded_hash) = signing_tx_data.shielded_hash {
                let mut masp_tx = namada_tx
                    .get_masp_section(&shielded_hash)
                    .expect("Expected to find the indicated MASP Transaction")
                    .clone();

                let mut authorizations = HashMap::new();

                for (sig_idx, sig) in signatures.iter().enumerate() {
                    let signature =
                        namada_sdk::masp_primitives::sapling::redjubjub::Signature::try_from_slice(
                            &sig.to_vec(),
                        )?;
                    authorizations.insert(sig_idx, signature);
                }

                masp_tx = (*masp_tx)
                    .clone()
                    .map_authorization::<namada_sdk::masp_primitives::transaction::Authorized>(
                        (),
                        MapSaplingSigAuth(authorizations),
                    )
                    .freeze()
                    .unwrap();

                namada_tx.remove_masp_section(&shielded_hash);
                namada_tx.add_section(Section::MaspTx(masp_tx));
            }
        }

        to_js_result(borsh::to_vec(&namada_tx)?)
    }

    pub async fn sign_tx(
        &self,
        tx: Vec<u8>,
        private_keys: Vec<String>,
        chain_id: Option<String>,
    ) -> Result<JsValue, JsError> {
        let tx: tx::Tx = borsh::from_slice(&tx)?;
        let mut namada_tx: Tx = borsh::from_slice(&tx.tx_bytes())?;

        let mut wrapper_signing_key = None;
        let wrapper_fee_payer: Option<Address> = match namada_tx.header().tx_type {
            TxType::Wrapper(wrapper) => Some(wrapper.fee_payer()),
            _ => None,
        };

        // If chain_id is provided, validate this against value in Tx header
        if let Some(c) = chain_id {
            if c != namada_tx.header.chain_id.to_string() {
                return Err(JsError::new(&format!(
                    "chain_id {} does not match Tx header chain_id {}",
                    &c,
                    namada_tx.header.chain_id.as_str()
                )));
            }
        }

        let mut signing_keys: Vec<common::SecretKey> = vec![];
        for private_key in private_keys.into_iter() {
            let signing_key =
                common::SecretKey::Ed25519(ed25519::SecretKey::from_str(&private_key)?);
            signing_keys.push(signing_key.clone());

            if wrapper_signing_key.is_none() {
                // Check address against wrapper_fee_payer
                let wrapper_fee_payer = wrapper_fee_payer.clone();
                let public = common::PublicKey::from(signing_key.ref_to());
                let implicit = Address::Implicit(ImplicitAddress::from(&public));

                if wrapper_fee_payer.is_some() && implicit == wrapper_fee_payer.unwrap() {
                    wrapper_signing_key = Some(signing_key)
                }
            }
        }

        for signing_tx_data in tx.signing_tx_data()? {
            if let Some(account_public_keys_map) = signing_tx_data.account_public_keys_map.clone() {
                // We only sign the raw header for transfers from transparent source
                if !signing_keys.is_empty() {
                    // Sign the raw header
                    namada_tx.sign_raw(
                        signing_keys.clone(),
                        account_public_keys_map,
                        signing_tx_data.owner.clone(),
                    );
                }
            }
        }

        // Sign the fee header
        namada_tx.sign_wrapper(wrapper_signing_key.expect("Wrapper signing key was not provided!"));

        to_js_result(borsh::to_vec(&namada_tx)?)
    }

    // We query tx evcents in loop here as control flow in namada_sdk does not seem to work well in
    // browsers
    async fn query_tx_result(
        &self,
        deadline: u64,
        tx_hash: &str,
    ) -> Result<TxAppliedEvents, JsValue> {
        let mut backoff = 0;
        let deadline = time::Instant::now() + time::Duration::from_secs(deadline);
        let tx_query = rpc::TxEventQuery::Applied(tx_hash);

        let event = loop {
            // We do linear backoff here to avoid hammering the RPC server
            backoff += 1000;

            if time::Instant::now() >= deadline {
                break Err(JsValue::from("Timed out waiting for tx to be applied"));
            }
            let res = rpc::query_tx_events(self.namada.client(), tx_query).await;

            let maybe_response = match res {
                Ok(response) => response,
                Err(_) => {
                    crate::utils::sleep(backoff).await;
                    continue;
                }
            };

            match maybe_response {
                Some(res) => {
                    break Ok(res);
                }
                None => {
                    crate::utils::sleep(backoff).await;
                    continue;
                }
            }
        }?;

        Ok(event)
    }

    pub async fn broadcast_tx(&self, tx_bytes: &[u8], deadline: u64) -> Result<JsValue, JsValue> {
        #[derive(serde::Serialize)]
        struct TxErrResponse {
            pub code: u32,
            pub info: String,
        }
        let tx = Tx::try_from_slice(tx_bytes).expect("Should be able to deserialize a Tx");
        let cmts = tx.commitments().clone();
        let wrapper_hash = tx.wrapper_hash();
        let tx_hash = tx.header_hash().to_string();

        let response = self.namada.client().broadcast_tx_sync(tx.to_bytes()).await;

        match response {
            Ok(res) => {
                if res.clone().code != 0.into() {
                    // We return an error if tx was rejected during tendermint rpc broadcast
                    return Err(JsValue::from(
                        &serde_json::to_string(&TxErrResponse {
                            code: res.code.into(),
                            info: res.log,
                        })
                        .map_err(|e| JsValue::from_str(&e.to_string()))?,
                    ));
                }

                let event = self.query_tx_result(deadline, &tx_hash).await?;
                let tx_response = TxResponse::from_events(event);

                let mut batch_tx_results: Vec<tx::BatchTxResult> = vec![];
                let code =
                    u8::try_from(tx_response.code.to_usize()).expect("Code should fit in u8");
                let gas_used = tx_response.gas_used.to_string();
                let height = tx_response.height.to_string();
                let info = tx_response.info.to_string();
                let log = tx_response.log.to_string();

                let result = tx_response.batch_result();
                for cmt in cmts {
                    let hash = compute_inner_tx_hash(wrapper_hash.as_ref(), Either::Right(&cmt));
                    let result = result.get(&hash);

                    match result {
                        Some(InnerTxResult::Success(_)) => {
                            batch_tx_results.push(tx::BatchTxResult::new(
                                hash.to_string(),
                                true,
                                None,
                            ));
                        }
                        Some(InnerTxResult::VpsRejected(res)) => {
                            let errors = res
                                .vps_result
                                .errors
                                .iter()
                                .cloned()
                                .map(|(_, err)| err)
                                .collect::<Vec<_>>();
                            batch_tx_results.push(tx::BatchTxResult::new(
                                hash.to_string(),
                                false,
                                Some(errors.join(" ")),
                            ));
                        }

                        Some(InnerTxResult::OtherFailure(res)) => {
                            batch_tx_results.push(tx::BatchTxResult::new(
                                hash.to_string(),
                                false,
                                Some(res.to_string()),
                            ));
                        }
                        None => {
                            batch_tx_results.push(tx::BatchTxResult::new(
                                hash.to_string(),
                                false,
                                None,
                            ));
                        }
                    };
                }

                let was_nothing_applied = batch_tx_results
                    .iter()
                    .all(|tx_result| !tx_result.is_applied);

                // We also return an error if all inner txs were rejected during wasm runtime
                if tx_response.code != ResultCode::Ok && was_nothing_applied {
                    return Err(JsValue::from(
                        &serde_json::to_string(&TxErrResponse {
                            code: tx_response.code.into(),
                            info: tx_response.info,
                        })
                        .map_err(|e| JsValue::from_str(&e.to_string()))?,
                    ));
                }

                // If at least some of the inner tx were applied, we return the result
                let tx_response = tx::TxResponse::new(
                    code,
                    batch_tx_results,
                    gas_used,
                    wrapper_hash.unwrap().to_string(),
                    height,
                    info,
                    log,
                );
                Ok(JsValue::from(
                    borsh::to_vec(&tx_response).map_err(|e| JsValue::from_str(&e.to_string()))?,
                ))
            }
            Err(e) => Err(JsValue::from(e.to_string())),
        }
    }

    /// Build a batch Tx from built transactions and return the bytes
    pub fn build_batch(txs: JsValue) -> Result<JsValue, JsError> {
        let mut built_txs: Vec<tx::Tx> = vec![];
        let built_txs_bytes: Vec<Vec<u8>> = txs.into_serde().unwrap();

        for bytes in built_txs_bytes.iter() {
            let tx: tx::Tx = borsh::from_slice(bytes)?;
            built_txs.push(tx);
        }

        // Get wrapper args
        let first_tx = built_txs
            .first()
            .expect("At least one Tx is required for building batches!");

        let args = first_tx.args();

        let mut txs: Vec<(Tx, SigningTxData)> = vec![];
        let mut masp_map: BTreeMap<MaspTxId, MaspSigningData> = BTreeMap::new();

        // Iterate through provided tx::Tx and deserialize bytes to Namada Tx
        for built_tx in built_txs.into_iter() {
            let tx_bytes = built_tx.tx_bytes();
            let signing_data = built_tx.signing_data();
            let first_signing_data = signing_data
                .first()
                .expect("At least one signing data should be present on a Tx");

            let signing_tx_data = first_signing_data.to_signing_tx_data()?;

            if let Some(sh) = signing_tx_data.shielded_hash {
                let masp_signing_data = first_signing_data.masp();

                // We do not need to insert masp_signing_data when we shield
                if let Some(masp_signing_data) = masp_signing_data {
                    let masp_signing_data = <MaspSigningData>::try_from_slice(&masp_signing_data)?;
                    masp_map.insert(sh, masp_signing_data);
                }
            }

            let tx: Tx = Tx::try_from_slice(&tx_bytes)?;

            txs.push((tx, signing_tx_data.to_owned()));
        }

        let (tx, signing_data) = build_batch(txs.clone())?;

        let signing_data = signing_data
            .iter()
            .cloned()
            .map(|sd| {
                if let Some(sh) = sd.shielded_hash {
                    (sd, masp_map.get(&sh).cloned())
                } else {
                    (sd, None)
                }
            })
            .collect::<Vec<_>>();

        to_js_result(borsh::to_vec(&tx::Tx::new(
            tx,
            &borsh::to_vec(&args)?,
            signing_data,
        )?)?)
    }

    // Append signatures and return tx bytes
    pub fn append_signature(
        &self,
        tx_bytes: &[u8],
        sig_msg_bytes: &[u8],
    ) -> Result<JsValue, JsError> {
        let mut tx: Tx = Tx::try_from_slice(tx_bytes)?;
        let signature::SignatureMsg {
            pubkey,
            raw_indices,
            raw_signature,
            wrapper_indices,
            wrapper_signature,
        } = signature::SignatureMsg::try_from_slice(sig_msg_bytes)?;

        let raw_sig_section =
            signature::construct_signature_section(&pubkey, &raw_indices, &raw_signature, &tx)?;
        tx.add_section(raw_sig_section);

        let wrapper_sig_section = signature::construct_signature_section(
            &pubkey,
            &wrapper_indices,
            &wrapper_signature,
            &tx,
        )?;
        tx.add_section(wrapper_sig_section);

        tx.protocol_filter();

        to_js_result(borsh::to_vec(&tx)?)
    }

    pub async fn build_transparent_transfer(
        &self,
        transfer_msg: &[u8],
        wrapper_tx_msg: &[u8],
    ) -> Result<JsValue, JsError> {
        let mut args = args::transparent_transfer_tx_args(transfer_msg, wrapper_tx_msg)?;
        let (tx, signing_data) = build_transparent_transfer(&self.namada, &mut args).await?;
        self.serialize_tx_result(tx, wrapper_tx_msg, signing_data, None)
    }

    pub async fn build_shielded_transfer(
        &self,
        shielded_transfer_msg: &[u8],
        wrapper_tx_msg: &[u8],
    ) -> Result<JsValue, JsError> {
        let (mut args, bparams) =
            args::shielded_transfer_tx_args(shielded_transfer_msg, wrapper_tx_msg)?;

        let bparams = if let Some(bparams) = bparams {
            BuildParams::StoredBuildParams(bparams)
        } else {
            generate_rng_build_params()
        };

        // TODO: pass handler
        let _ = &self
            .namada
            .shielded_mut()
            .await
            .try_load(async |_| {})
            .await;

        let xfvks = args
            .sources
            .iter()
            .map(|data| data.source.to_viewing_key())
            .collect::<Vec<_>>();

        let ((tx, signing_data), masp_signing_data) = match bparams {
            BuildParams::RngBuildParams(mut bparams) => {
                let tx =
                    build_shielded_transfer(&self.namada, &mut args, &mut bparams, false).await?;
                let masp_signing_data = MaspSigningData::new(
                    bparams
                        .to_stored()
                        .ok_or_err_msg("Cannot convert bparams to stored")?,
                    xfvks,
                );

                (tx, masp_signing_data)
            }
            BuildParams::StoredBuildParams(mut bparams) => {
                let tx =
                    build_shielded_transfer(&self.namada, &mut args, &mut bparams, false).await?;
                let masp_signing_data = MaspSigningData::new(bparams, xfvks);

                (tx, masp_signing_data)
            }
        };

        self.serialize_tx_result(tx, wrapper_tx_msg, signing_data, Some(masp_signing_data))
    }

    pub async fn build_unshielding_transfer(
        &self,
        unshielding_transfer_msg: &[u8],
        wrapper_tx_msg: &[u8],
    ) -> Result<JsValue, JsError> {
        let (mut args, bparams) =
            args::unshielding_transfer_tx_args(unshielding_transfer_msg, wrapper_tx_msg)?;

        let bparams = if let Some(bparams) = bparams {
            BuildParams::StoredBuildParams(bparams)
        } else {
            generate_rng_build_params()
        };

        // TODO: pass handler
        let _ = &self
            .namada
            .shielded_mut()
            .await
            .try_load(async |_| {})
            .await;

        let xfvks = args
            .sources
            .iter()
            .map(|s| s.source.to_viewing_key())
            .collect();

        let ((tx, signing_data), masp_signing_data) = match bparams {
            BuildParams::RngBuildParams(mut bparams) => {
                let tx = build_unshielding_transfer(&self.namada, &mut args, &mut bparams, false)
                    .await?;
                let masp_signing_data = MaspSigningData::new(
                    bparams
                        .to_stored()
                        .ok_or_err_msg("Cannot convert bparams to stored")?,
                    xfvks,
                );

                (tx, masp_signing_data)
            }
            BuildParams::StoredBuildParams(mut bparams) => {
                let tx = build_unshielding_transfer(&self.namada, &mut args, &mut bparams, false)
                    .await?;
                let masp_signing_data = MaspSigningData::new(bparams, xfvks);

                (tx, masp_signing_data)
            }
        };

        self.serialize_tx_result(tx, wrapper_tx_msg, signing_data, Some(masp_signing_data))
    }

    pub async fn build_shielding_transfer(
        &self,
        shielding_transfer_msg: &[u8],
        wrapper_tx_msg: &[u8],
    ) -> Result<JsValue, JsError> {
        let (mut args, bparams) =
            args::shielding_transfer_tx_args(shielding_transfer_msg, wrapper_tx_msg)?;
        let bparams = if let Some(bparams) = bparams {
            BuildParams::StoredBuildParams(bparams)
        } else {
            generate_rng_build_params()
        };
        // TODO: pass handler
        let _ = &self
            .namada
            .shielded_mut()
            .await
            .try_load(async |_| {})
            .await;

        let (tx, signing_data, _) = match bparams {
            BuildParams::RngBuildParams(mut bparams) => {
                build_shielding_transfer(&self.namada, &mut args, &mut bparams).await?
            }
            BuildParams::StoredBuildParams(mut bparams) => {
                build_shielding_transfer(&self.namada, &mut args, &mut bparams).await?
            }
        };

        self.serialize_tx_result(tx, wrapper_tx_msg, signing_data, None)
    }

    pub async fn build_ibc_transfer(
        &self,
        ibc_transfer_msg: &[u8],
        wrapper_tx_msg: &[u8],
    ) -> Result<JsValue, JsError> {
        let (args, bparams) = args::ibc_transfer_tx_args(
            ibc_transfer_msg,
            wrapper_tx_msg,
            self.namada.native_token(),
        )?;

        let bparams = if let Some(bparams) = bparams {
            BuildParams::StoredBuildParams(bparams)
        } else {
            generate_rng_build_params()
        };

        // TODO: pass handler
        let _ = &self
            .namada
            .shielded_mut()
            .await
            .try_load(async |_| {})
            .await;

        let xfvks = match args.source {
            TransferSource::Address(_) => vec![],
            TransferSource::ExtendedKey(pek) => vec![pek.to_viewing_key()],
        };

        let ((tx, signing_data, _), masp_signing_data) = match bparams {
            BuildParams::RngBuildParams(mut bparams) => {
                let tx = build_ibc_transfer(&self.namada, &args, &mut bparams, false).await?;
                let masp_signing_data = MaspSigningData::new(
                    bparams
                        .to_stored()
                        .ok_or_err_msg("Cannot convert bparams to stored")?,
                    xfvks,
                );

                (tx, masp_signing_data)
            }
            BuildParams::StoredBuildParams(mut bparams) => {
                let tx = build_ibc_transfer(&self.namada, &args, &mut bparams, false).await?;
                let masp_signing_data = MaspSigningData::new(bparams, xfvks);

                (tx, masp_signing_data)
            }
        };

        self.serialize_tx_result(tx, wrapper_tx_msg, signing_data, Some(masp_signing_data))
    }

    pub async fn build_eth_bridge_transfer(
        &self,
        eth_bridge_transfer_msg: &[u8],
        wrapper_tx_msg: &[u8],
    ) -> Result<JsValue, JsError> {
        let args = args::eth_bridge_transfer_tx_args(eth_bridge_transfer_msg, wrapper_tx_msg)?;
        let (tx, signing_data) = build_bridge_pool_tx(&self.namada, args.clone()).await?;
        self.serialize_tx_result(tx, wrapper_tx_msg, signing_data, None)
    }

    pub async fn build_vote_proposal(
        &self,
        vote_proposal_msg: &[u8],
        wrapper_tx_msg: &[u8],
    ) -> Result<JsValue, JsError> {
        let args = args::vote_proposal_tx_args(vote_proposal_msg, wrapper_tx_msg)?;
        let epoch = query_epoch(self.namada.client()).await?;
        let (tx, signing_data) = build_vote_proposal(&self.namada, &args, epoch)
            .await
            .map_err(JsError::from)?;
        self.serialize_tx_result(tx, wrapper_tx_msg, signing_data, None)
    }

    pub async fn build_claim_rewards(
        &self,
        claim_rewards_msg: &[u8],
        wrapper_tx_msg: &[u8],
    ) -> Result<JsValue, JsError> {
        let args = args::claim_rewards_tx_args(claim_rewards_msg, wrapper_tx_msg)?;
        let (tx, signing_data) = build_claim_rewards(&self.namada, &args)
            .await
            .map_err(JsError::from)?;
        self.serialize_tx_result(tx, wrapper_tx_msg, signing_data, None)
    }

    pub async fn build_bond(
        &self,
        bond_msg: &[u8],
        wrapper_tx_msg: &[u8],
    ) -> Result<JsValue, JsError> {
        let args = args::bond_tx_args(bond_msg, wrapper_tx_msg)?;
        let (tx, signing_data) = build_bond(&self.namada, &args).await?;
        self.serialize_tx_result(tx, wrapper_tx_msg, signing_data, None)
    }

    pub async fn build_unbond(
        &self,
        unbond_msg: &[u8],
        wrapper_tx_msg: &[u8],
    ) -> Result<JsValue, JsError> {
        let args = args::unbond_tx_args(unbond_msg, wrapper_tx_msg)?;
        let (tx, signing_data, _) = build_unbond(&self.namada, &args).await?;
        self.serialize_tx_result(tx, wrapper_tx_msg, signing_data, None)
    }

    pub async fn build_withdraw(
        &self,
        withdraw_msg: &[u8],
        wrapper_tx_msg: &[u8],
    ) -> Result<JsValue, JsError> {
        let args = args::withdraw_tx_args(withdraw_msg, wrapper_tx_msg)?;
        let (tx, signing_data) = build_withdraw(&self.namada, &args).await?;
        self.serialize_tx_result(tx, wrapper_tx_msg, signing_data, None)
    }

    pub async fn build_redelegate(
        &self,
        redelegate_msg: &[u8],
        wrapper_tx_msg: &[u8],
    ) -> Result<JsValue, JsError> {
        let args = args::redelegate_tx_args(redelegate_msg, wrapper_tx_msg)?;
        let (tx, signing_data) = build_redelegation(&self.namada, &args).await?;
        self.serialize_tx_result(tx, wrapper_tx_msg, signing_data, None)
    }

    pub async fn build_osmosis_swap(
        &self,
        osmosis_swap_msg: &[u8],
        wrapper_tx_msg: &[u8],
    ) -> Result<JsValue, JsError> {
        let (args, bparams) = args::osmosis_swap_tx_args(
            osmosis_swap_msg,
            wrapper_tx_msg,
            self.namada.native_token(),
        )?;

        let _ = &self
            .namada
            .shielded_mut()
            .await
            .try_load(async |_| {})
            .await;

        // TODO: check if returning true is correct here
        let tx = args
            .into_ibc_transfer(&self.namada, |_route, _min_amount, _quote_amount| true)
            .await?;

        let bparams = if let Some(bparams) = bparams {
            BuildParams::StoredBuildParams(bparams)
        } else {
            generate_rng_build_params()
        };

        let xfvks = match tx.source {
            TransferSource::Address(_) => vec![],
            TransferSource::ExtendedKey(pek) => vec![pek.to_viewing_key()],
        };

        let ((tx, signing_data, _), masp_signing_data) = match bparams {
            BuildParams::RngBuildParams(mut bparams) => {
                // TODO: replace flase
                let tx = build_ibc_transfer(&self.namada, &tx, &mut bparams, false).await?;
                let masp_signing_data = MaspSigningData::new(
                    bparams
                        .to_stored()
                        .ok_or_err_msg("Cannot convert bparams to stored")?,
                    xfvks,
                );

                (tx, masp_signing_data)
            }
            BuildParams::StoredBuildParams(mut bparams) => {
                // TODO: replace flase
                let tx = build_ibc_transfer(&self.namada, &tx, &mut bparams, false).await?;
                let masp_signing_data = MaspSigningData::new(bparams, xfvks);

                (tx, masp_signing_data)
            }
        };

        self.serialize_tx_result(tx, wrapper_tx_msg, signing_data, Some(masp_signing_data))
    }

    pub async fn build_reveal_pk(&self, wrapper_tx_msg: &[u8]) -> Result<JsValue, JsError> {
        let args = args::tx_args_from_slice(wrapper_tx_msg)?;
        let public_key = args.signing_keys[0].clone();
        let (tx, signing_data) = build_reveal_pk(&self.namada, &args.clone(), &public_key).await?;
        self.serialize_tx_result(tx, wrapper_tx_msg, signing_data, None)
    }

    // Sign arbitrary data with the provided signing key
    pub fn sign_arbitrary(&self, signing_key: String, data: String) -> Result<JsValue, JsError> {
        let hash = Hash::sha256(data);
        let secret = common::SecretKey::Ed25519(ed25519::SecretKey::from_str(&signing_key)?);
        let signature = common::SigScheme::sign(&secret, hash);
        let sig_bytes = signature.to_bytes();

        to_js_result((hash.to_string().to_lowercase(), hex::encode(sig_bytes)))
    }

    // Verify signed arbitrary data
    pub fn verify_arbitrary(
        &self,
        public_key: String,
        signed_hash: String,
        signature: String,
    ) -> Result<(), JsError> {
        let public_key = common::PublicKey::from_str(&public_key)?;
        let sig = common::Signature::try_from_slice(&hex::decode(signature)?)?;
        let signed_hash = Hash::from_str(&signed_hash)?;

        common::SigScheme::verify_signature(&public_key, &signed_hash, &sig).map_err(JsError::from)
    }

    pub async fn generate_ibc_shielding_memo(
        &self,
        target: &str,
        token: String,
        amount: &str,
        channel_id: &str,
    ) -> Result<JsValue, JsError> {
        // TODO: pass handler
        let _ = &self
            .namada
            .shielded_mut()
            .await
            .try_load(async |_| {})
            .await;

        let ledger_address = Url::from_str(&self.rpc_url).expect("RPC URL is a valid URL");
        let target = TransferTarget::PaymentAddress(
            PaymentAddress::from_str(target).expect("target is a valid shielded address"),
        );

        // As the value we get is always in the base denom, we can use from_string_precise to get the
        // amount and drop denom info
        let amount = Amount::from_string_precise(amount).expect("Amount to be valid.");

        let denominated_amount = if token.contains(&self.namada.native_token().to_string()) {
            DenominatedAmount::native(amount)
        } else {
            DenominatedAmount::new(amount, 0u8.into())
        };
        let amount = InputAmount::Validated(denominated_amount);

        let channel_id = ChannelId::from_str(channel_id).expect("channel ID is valid");

        let args = GenIbcShieldingTransfer {
            query: Query { ledger_address },
            output_folder: None,
            target,
            amount,
            expiration: TxExpiration::Default,
            asset: IbcShieldingTransferAsset::LookupNamadaAddress {
                token,
                port_id: PortId::transfer(),
                channel_id,
            },
        };

        if let Some(masp_tx) = gen_ibc_shielding_transfer(&self.namada, args).await? {
            let memo = convert_masp_tx_to_ibc_memo(&masp_tx);
            to_js_result(memo)
        } else {
            Err(JsError::new(
                "Generating ibc shielding transfer generated nothing",
            ))
        }
    }

    // This should be a part of query.rs but we have to pass whole "namada" into estimate_next_epoch_rewards
    pub async fn shielded_rewards(
        &self,
        owner: String,
        chain_id: String,
    ) -> Result<JsValue, JsError> {
        let mut shielded: ShieldedContext<masp::JSShieldedUtils> = ShieldedContext::default();
        shielded.utils.chain_id = chain_id.clone();
        // TODO: pass handler
        shielded.try_load(async |_| {}).await;

        let xvk = ExtendedViewingKey::from_str(&owner)?;
        let raw_balance = shielded
            .compute_shielded_balance(&xvk.as_viewing_key())
            .await
            .map_err(|e| JsError::new(&e.to_string()))?;

        let rewards = match raw_balance {
            Some(balance) => shielded
                .estimate_next_epoch_rewards(&self.namada, &balance)
                .await
                .map(|r| r.amount())
                .map_err(|e| JsError::new(&e.to_string()))?,
            None => Amount::zero(),
        };

        to_js_result(rewards.to_string())
    }

    async fn compute_shielded_balance_per_token(
        &self,
        shielded: &mut ShieldedContext<masp::JSShieldedUtils>,
        vk: ViewingKey,
        token: Address,
    ) -> Option<I128Sum> {
        // Cannot query the balance of a key that's not in the map
        if !shielded.pos_map.contains_key(&vk) {
            return None;
        }
        let mut val_acc = I128Sum::zero();
        // Retrieve the notes that can be spent by this key
        let mut notes = vec![];
        if let Some(avail_notes) = shielded.pos_map.get(&vk) {
            for note_idx in avail_notes {
                // Spent notes cannot contribute a new transaction's pool

                if shielded.spents.contains(note_idx) {
                    continue;
                }
                let note = shielded.note_map.get(note_idx).expect("Note not found");
                notes.push((note.asset_type, note.value));
            }
        }

        for (asset_type, value) in notes {
            let asset_data = shielded
                .decode_asset_type(&self.namada.client, asset_type)
                .await;

            // If asset is not found then skip
            if asset_data.is_none() {
                continue;
            }

            // If asset is not the one we are looking for then skip
            if asset_data.unwrap().token != token {
                continue;
            }
            val_acc += I128Sum::from_nonnegative(asset_type, i128::from(value))
                .expect("Can't convert to I128Sum");
        }

        Some(val_acc)
    }

    pub async fn shielded_rewards_per_token(
        &self,
        owner: String,
        token: String,
        chain_id: String,
    ) -> Result<JsValue, JsError> {
        let token = Address::from_str(&token)?;

        let mut shielded: ShieldedContext<masp::JSShieldedUtils> = ShieldedContext::default();
        shielded.utils.chain_id = chain_id.clone();
        // TODO: pass handler
        shielded.try_load(async |_| {}).await;

        let xvk = ExtendedViewingKey::from_str(&owner)?;
        let raw_balance = self
            .compute_shielded_balance_per_token(&mut shielded, xvk.as_viewing_key(), token)
            .await;

        let rewards = match raw_balance {
            Some(balance) => shielded
                .estimate_next_epoch_rewards(&self.namada, &balance)
                .await
                .map(|r| r.amount())
                .map_err(|e| JsError::new(&e.to_string()))?,
            None => Amount::zero(),
        };

        to_js_result(rewards.to_string())
    }

    pub async fn simulate_shielded_rewards(
        &self,
        chain_id: String,
        token: String,
        amount: String,
    ) -> Result<JsValue, JsError> {
        let token = Address::from_str(&token)?;
        // TODO: as an improvement we could pass the denom from the client
        let denom = query_denom(&self.namada.client, &token)
            .await
            .ok_or(JsError::new(&format!(
                "Denom for token {} not found",
                token
            )))?;
        let amount = DenominatedAmount::new(Amount::from_str(amount, denom)?, denom);

        let mut shielded: ShieldedContext<masp::JSShieldedUtils> = ShieldedContext::default();
        shielded.utils.chain_id = chain_id.clone();
        // TODO: pass handler
        shielded.try_load(async |_| {}).await;

        let epoch = rpc::query_masp_epoch(self.namada.client()).await?;

        let (_, masp_value) = shielded
            .convert_namada_amount_to_masp(
                self.namada.client(),
                epoch,
                &token,
                amount.denom(),
                amount.amount(),
            )
            .await
            .map_err(|e| JsError::new(&e.to_string()))?;

        let reward = shielded
            .estimate_next_epoch_rewards(&self.namada, &I128Sum::from_sum(masp_value.clone()))
            .await
            .map_err(|e| JsError::new(&e.to_string()))?;

        to_js_result(reward)
    }

    pub fn masp_address(&self) -> String {
        MASP.to_string()
    }

    fn serialize_tx_result(
        &self,
        tx: Tx,
        wrapper_tx_msg: &[u8],
        signing_data: SigningTxData,
        masp_signing_data: Option<MaspSigningData>,
    ) -> Result<JsValue, JsError> {
        let tx = tx::Tx::new(tx, wrapper_tx_msg, vec![(signing_data, masp_signing_data)])?;

        to_js_result(borsh::to_vec(&tx)?)
    }
}

#[wasm_bindgen(module = "/src/sdk/mod.js")]
extern "C" {
    #[wasm_bindgen(catch, js_name = "getMaspParams")]
    async fn get_masp_params() -> Result<JsValue, JsValue>;
    #[wasm_bindgen(catch, js_name = "hasMaspParams")]
    async fn has_masp_params() -> Result<JsValue, JsValue>;
    #[wasm_bindgen(catch, js_name = "fetchAndStoreMaspParams")]
    async fn fetch_and_store_masp_params(url: Option<String>) -> Result<JsValue, JsValue>;
}
