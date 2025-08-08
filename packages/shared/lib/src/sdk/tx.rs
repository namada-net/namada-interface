use std::collections::HashMap;
use std::str::FromStr;

use gloo_utils::format::JsValueSerdeExt;
use namada_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use namada_sdk::collections::HashSet;
use namada_sdk::masp_primitives::transaction::components::sapling::builder::StoredBuildParams;
use namada_sdk::masp_primitives::transaction::components::sapling::fees::{InputView, OutputView};
use namada_sdk::masp_primitives::zip32::ExtendedFullViewingKey;
use namada_sdk::signing::SigningTxData;
use namada_sdk::token::{Amount, DenominatedAmount, Transfer};
use namada_sdk::tx::data::compute_inner_tx_hash;
use namada_sdk::tx::either::{self, Either};
use namada_sdk::tx::{
    self, TX_BOND_WASM, TX_CLAIM_REWARDS_WASM, TX_IBC_WASM, TX_REDELEGATE_WASM, TX_REVEAL_PK,
    TX_TRANSFER_WASM, TX_UNBOND_WASM, TX_VOTE_PROPOSAL, TX_WITHDRAW_WASM,
};
use namada_sdk::uint::Uint;
use namada_sdk::{address::Address, key::common::PublicKey};
use namada_sdk::{ExtendedViewingKey, PaymentAddress};
use wasm_bindgen::{prelude::wasm_bindgen, JsError, JsValue};

use super::args::WrapperTxMsg;
use crate::sdk::transaction;
use crate::types::query::WasmHash;

#[wasm_bindgen]
#[derive(BorshSerialize, BorshDeserialize, Copy, Clone, Debug)]
#[borsh(crate = "namada_sdk::borsh", use_discriminant = true)]
pub enum TxType {
    Bond = 1,
    Unbond = 2,
    Withdraw = 3,
    Transfer = 4,
    IBCTransfer = 5,
    EthBridgeTransfer = 6,
    RevealPK = 7,
    VoteProposal = 8,
    Redelegate = 9,
    Batch = 10,
    ClaimRewards = 11,
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug)]
#[borsh(crate = "namada_sdk::borsh")]
pub struct SigningData {
    owner: Option<String>,
    public_keys: Vec<String>,
    threshold: u8,
    account_public_keys_map: Option<Vec<u8>>,
    fee_payer: String,
    shielded_hash: Option<Vec<u8>>,
    masp: Option<Vec<u8>>,
}

impl SigningData {
    // Create serializable struct from Namada type
    pub fn from_signing_tx_data(
        signing_tx_data: SigningTxData,
        masp_signing_data: Option<MaspSigningData>,
    ) -> Result<SigningData, JsError> {
        let owner: Option<String> = signing_tx_data.owner.map(|addr| addr.to_string());
        let public_keys = signing_tx_data
            .public_keys
            .into_iter()
            .map(|pk| pk.to_string())
            .collect();

        let account_public_keys_map = match signing_tx_data.account_public_keys_map {
            Some(pk_map) => Some(borsh::to_vec(&pk_map)?),
            None => None,
        };

        let fee_payer = match signing_tx_data.fee_payer {
            Either::Left(f) => f.0.to_string(),
            Either::Right(_) => return Err(JsError::new("Fee payer must be a public key")),
        };

        let threshold = signing_tx_data.threshold;
        let shielded_hash = match signing_tx_data.shielded_hash {
            Some(v) => Some(borsh::to_vec(&v)?),
            None => None,
        };
        let masp_signing_data = match masp_signing_data {
            Some(v) => Some(borsh::to_vec(&v)?),
            None => None,
        };

        Ok(SigningData {
            owner,
            public_keys,
            threshold,
            account_public_keys_map,
            fee_payer,
            shielded_hash,
            masp: masp_signing_data,
        })
    }

    // Create Namada type from this struct
    pub fn to_signing_tx_data(&self) -> Result<SigningTxData, JsError> {
        let owner: Option<Address> = match &self.owner {
            Some(addr) => Some(Address::from_str(addr)?),
            None => None,
        };

        let mut public_keys = HashSet::new();
        for pk in self.public_keys.clone() {
            let pk = PublicKey::from_str(&pk)?;
            public_keys.insert(pk);
        }

        let fee_payer = PublicKey::from_str(&self.fee_payer)?;
        let fee_payer = either::Left((fee_payer, false));
        let threshold = self.threshold;
        let account_public_keys_map = match &self.account_public_keys_map {
            Some(pk_map) => Some(borsh::from_slice(pk_map)?),
            None => None,
        };
        let shielded_hash = match &self.shielded_hash {
            Some(v) => Some(borsh::from_slice(v)?),
            None => None,
        };

        Ok(SigningTxData {
            owner,
            public_keys,
            fee_payer,
            threshold,
            // Assume no signatures at this point
            signatures: vec![],
            account_public_keys_map,
            shielded_hash,
        })
    }

    pub fn masp(&self) -> Option<Vec<u8>> {
        self.masp.clone()
    }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug)]
#[borsh(crate = "namada_sdk::borsh")]
pub struct MaspSigningData {
    pub bparams: StoredBuildParams,
    pub xfvks: Vec<ExtendedFullViewingKey>,
}

impl MaspSigningData {
    pub fn new(bparams: StoredBuildParams, xfvks: Vec<ExtendedFullViewingKey>) -> MaspSigningData {
        MaspSigningData { bparams, xfvks }
    }

    pub fn xfvks(&self) -> Vec<ExtendedFullViewingKey> {
        self.xfvks.clone()
    }

    pub fn bparams(&self) -> StoredBuildParams {
        self.bparams.clone()
    }
}

/// Serializable Tx for exported build functions
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug)]
#[borsh(crate = "namada_sdk::borsh")]
pub struct Tx {
    args: WrapperTxMsg,
    hash: String,
    bytes: Vec<u8>,
    pub signing_data: Vec<SigningData>,
}

impl Tx {
    pub fn new(
        tx: tx::Tx,
        args: &[u8],
        signing_tx_data: Vec<(SigningTxData, Option<MaspSigningData>)>,
    ) -> Result<Tx, JsError> {
        let args: WrapperTxMsg = borsh::from_slice(args)?;
        let mut signing_data: Vec<SigningData> = vec![];
        for (sd, msd) in signing_tx_data.into_iter() {
            let sd = SigningData::from_signing_tx_data(sd, msd)?;
            signing_data.push(sd);
        }
        let hash = tx.wrapper_hash();
        let bytes: Vec<u8> = borsh::to_vec(&tx)?;

        Ok(Tx {
            args,
            hash: hash.unwrap().to_string(),
            bytes,
            signing_data,
        })
    }

    pub fn tx_bytes(&self) -> Vec<u8> {
        self.bytes.clone()
    }

    pub fn signing_tx_data(&self) -> Result<Vec<SigningTxData>, JsError> {
        let mut signing_tx_data: Vec<SigningTxData> = vec![];
        for sd in self.signing_data.clone().iter() {
            signing_tx_data.push(sd.to_signing_tx_data()?);
        }

        Ok(signing_tx_data)
    }

    pub fn signing_data(&self) -> Vec<SigningData> {
        self.signing_data.clone()
    }

    pub fn args(&self) -> WrapperTxMsg {
        self.args.clone()
    }
}

// Given the bytes of a Namada Tx, return all inner Tx hashes
#[wasm_bindgen]
pub fn get_inner_tx_hashes(tx_bytes: &[u8]) -> Result<Vec<String>, JsError> {
    let nam_tx: tx::Tx = borsh::from_slice(tx_bytes)?;
    let hash = nam_tx.wrapper_hash();
    let cmts = nam_tx.commitments();
    let mut inner_tx_hashes: Vec<String> = vec![];

    for cmt in cmts {
        let inner_tx_hash = compute_inner_tx_hash(hash.as_ref(), Either::Right(cmt));
        inner_tx_hashes.push(inner_tx_hash.to_string());
    }

    Ok(inner_tx_hashes)
}

pub fn wasm_hash_to_tx_type(wasm_hash: &str, wasm_hashes: &Vec<WasmHash>) -> Option<TxType> {
    let type_map: HashMap<String, TxType> = HashMap::from([
        (TX_TRANSFER_WASM.to_string(), TxType::Transfer),
        (TX_BOND_WASM.to_string(), TxType::Bond),
        (TX_REDELEGATE_WASM.to_string(), TxType::Redelegate),
        (TX_UNBOND_WASM.to_string(), TxType::Unbond),
        (TX_WITHDRAW_WASM.to_string(), TxType::Withdraw),
        (TX_CLAIM_REWARDS_WASM.to_string(), TxType::ClaimRewards),
        (TX_REVEAL_PK.to_string(), TxType::RevealPK),
        (TX_VOTE_PROPOSAL.to_string(), TxType::VoteProposal),
        (TX_IBC_WASM.to_string(), TxType::IBCTransfer),
    ]);

    for wh in wasm_hashes {
        if wh.hash() == wasm_hash {
            let tx_type = type_map.get(&wh.path());

            if let Some(tx_type) = tx_type {
                return Some(*tx_type);
            }
        }
    }

    None
}

// Deserialize Tx commitments into Borsh-serialized struct
#[wasm_bindgen]
pub fn deserialize_tx(tx_bytes: Vec<u8>, wasm_hashes: JsValue) -> Result<Vec<u8>, JsError> {
    let tx = TxDetails::from_bytes(tx_bytes, wasm_hashes)?;
    Ok(borsh::to_vec(&tx)?)
}

#[derive(BorshSerialize, BorshDeserialize)]
#[borsh(crate = "namada_sdk::borsh")]
pub struct TxIn {
    pub token: String,
    pub value: String,
    pub owner: String,
}

#[derive(BorshSerialize, BorshDeserialize)]
#[borsh(crate = "namada_sdk::borsh")]
pub struct TxOut {
    pub token: String,
    pub value: String,
    pub address: String,
}

#[derive(BorshSerialize, BorshDeserialize)]
#[borsh(crate = "namada_sdk::borsh")]
pub struct Commitment {
    tx_type: TxType,
    hash: String,
    tx_code_id: String,
    data: Vec<u8>,
    memo: Option<String>,
    masp_tx_in: Option<Vec<TxIn>>,
    masp_tx_out: Option<Vec<TxOut>>,
}

#[derive(BorshSerialize, BorshDeserialize)]
#[borsh(crate = "namada_sdk::borsh")]
pub struct TxDetails {
    wrapper_tx: WrapperTxMsg,
    commitments: Vec<Commitment>,
}

impl TxDetails {
    pub fn from_bytes(tx_bytes: Vec<u8>, wasm_hashes: JsValue) -> Result<TxDetails, JsError> {
        let tx: tx::Tx = borsh::from_slice(&tx_bytes)?;
        let chain_id = tx.header().chain_id.to_string();
        let expiration = tx.header().expiration;

        match tx.header().tx_type {
            tx::data::TxType::Wrapper(wrapper) => {
                let fee_amount = wrapper.fee.amount_per_gas_unit.to_string();
                let gas_limit = Uint::from(wrapper.gas_limit).to_string();
                let token = wrapper.fee.token.to_string();
                let wrapper_fee_payer = wrapper.fee_payer();

                let expiration: Option<u64> = expiration.map(|exp| exp.to_unix_timestamp() as u64);

                let wrapper_tx = WrapperTxMsg::new(
                    token,
                    fee_amount,
                    gas_limit,
                    chain_id,
                    None,
                    None,
                    None,
                    expiration,
                    Some(wrapper_fee_payer.to_string()),
                );
                let mut commitments: Vec<Commitment> = vec![];
                let wasm_hashes: Vec<WasmHash> = wasm_hashes.into_serde().unwrap();

                for cmt in tx.commitments() {
                    let memo = tx
                        .memo(cmt)
                        .map(|memo_bytes| String::from_utf8_lossy(&memo_bytes).to_string());

                    let hash = cmt.get_hash().to_string();
                    let tx_code_id = tx
                        .get_section(cmt.code_sechash())
                        .and_then(|s| s.code_sec())
                        .map(|s| s.code.hash().0)
                        .map(|bytes| {
                            String::from_utf8(subtle_encoding::hex::encode(bytes)).unwrap()
                        });

                    if tx_code_id.is_some() {
                        let tx_code_id = tx_code_id.unwrap();
                        let tx_type = wasm_hash_to_tx_type(&tx_code_id, &wasm_hashes);

                        if tx_type.is_some() {
                            let tx_type = tx_type.unwrap();
                            let tx_data = tx.data(cmt).unwrap_or_default();
                            let tx_kind = transaction::TransactionKind::from(tx_type, &tx_data);
                            let data = tx_kind.to_bytes()?;

                            let (inputs, outputs) = get_masp_details(&tx, &tx_kind);

                            commitments.push(Commitment {
                                tx_type,
                                hash,
                                tx_code_id,
                                data,
                                memo,
                                masp_tx_out: outputs,
                                masp_tx_in: inputs,
                            });
                        }
                    }
                }

                Ok(TxDetails {
                    wrapper_tx,
                    commitments,
                })
            }
            _ => Err(JsError::new("Invalid transaction type!")),
        }
    }
}

fn get_masp_details(
    tx: &tx::Tx,
    tx_kind: &transaction::TransactionKind,
) -> (Option<Vec<TxIn>>, Option<Vec<TxOut>>) {
    let parse = |transfer: &Transfer| {
        if let Some(shielded_hash) = transfer.shielded_section_hash {
            let masp_builder = tx
                .get_masp_builder(&shielded_hash)
                .expect("Masp builder to exist");

            let asset_types = &masp_builder.asset_types;

            let inputs = masp_builder
                .builder
                .sapling_inputs()
                .iter()
                .map(|input| {
                    let asset_data = asset_types
                        .iter()
                        .find(|ad| ad.encode().unwrap() == input.asset_type())
                        .expect("Asset data to exist");

                    let amount = Amount::from_u64(input.value());
                    let denominated_amount = DenominatedAmount::new(amount, asset_data.denom);

                    TxIn {
                        token: asset_data.token.to_string(),
                        value: denominated_amount.to_string(),
                        owner: ExtendedViewingKey::from(*input.key()).to_string(),
                    }
                })
                .collect::<Vec<_>>();

            let outputs = masp_builder
                .builder
                .sapling_outputs()
                .iter()
                .map(|output| {
                    let asset_data = asset_types
                        .iter()
                        .find(|ad| ad.encode().unwrap() == output.asset_type())
                        .expect("Asset data to exist");

                    let amount = Amount::from_u64(output.value());
                    let denominated_amount = DenominatedAmount::new(amount, asset_data.denom);

                    TxOut {
                        token: { asset_data.token.to_string() },
                        value: denominated_amount.to_string(),
                        address: PaymentAddress::from(output.address()).to_string(),
                    }
                })
                .collect::<Vec<_>>();

            (Some(inputs), Some(outputs))
        } else {
            (None, None)
        }
    };

    match tx_kind {
        transaction::TransactionKind::IbcTransfer(ibc_transfer) => match &ibc_transfer.transfer {
            Some(transfer) => parse(transfer),
            None => (None, None),
        },
        transaction::TransactionKind::Transfer(transfer) => parse(transfer),
        _ => (None, None),
    }
}

#[wasm_bindgen]
#[derive(BorshSerialize, BorshDeserialize, Debug)]
#[borsh(crate = "namada_sdk::borsh")]
pub struct BatchTxResult {
    hash: String,
    pub is_applied: bool,
    error: Option<String>,
}

impl BatchTxResult {
    pub fn new(hash: String, is_applied: bool, error: Option<String>) -> BatchTxResult {
        BatchTxResult {
            hash,
            is_applied,
            error,
        }
    }
}

/// Serializable response for process_tx calls
#[wasm_bindgen]
#[derive(BorshSerialize, BorshDeserialize)]
#[borsh(crate = "namada_sdk::borsh")]
pub struct TxResponse {
    code: u8,
    commitments: Vec<BatchTxResult>,
    gas_used: String,
    hash: String,
    height: String,
    info: String,
    log: String,
}

impl TxResponse {
    pub fn new(
        code: u8,
        commitments: Vec<BatchTxResult>,
        gas_used: String,
        hash: String,
        height: String,
        info: String,
        log: String,
    ) -> TxResponse {
        TxResponse {
            code,
            commitments,
            gas_used,
            hash,
            height,
            info,
            log,
        }
    }
}
