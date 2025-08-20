//! PaymentAddress - Provide wasm_bindgen bindings for shielded addresses
//! See @namada/crypto for zip32 HD wallet functionality.
use std::str::FromStr;

use crate::utils::to_js_result;
use js_sys::Uint8Array;
use namada_sdk::borsh::{self, BorshDeserialize};
use namada_sdk::masp_primitives::sapling;
use namada_sdk::masp_primitives::sapling::ViewingKey;
use namada_sdk::masp_primitives::zip32::{self, DiversifierIndex, ExtendedKey};
use namada_sdk::masp_proofs::jubjub;
use namada_sdk::state::BlockHeight;
use namada_sdk::wallet::DatedKeypair;
use namada_sdk::{
    ExtendedSpendingKey as NamadaExtendedSpendingKey,
    ExtendedViewingKey as NamadaExtendedViewingKey, PaymentAddress as NamadaPaymentAddress,
};
use thiserror::Error;
use wasm_bindgen::prelude::*;

#[derive(Debug, Error)]
pub enum MaspError {
    #[error("PaymentAddress from_str failed!")]
    PaymentAddress,
    #[error("BorshDeserialize failed!")]
    BorshDeserialize,
}

/// Wrap ExtendedViewingKey
#[wasm_bindgen]
pub struct ExtendedViewingKey(pub(crate) NamadaExtendedViewingKey);

/// wasm_bindgen bindings for ExtendedViewingKey
#[wasm_bindgen]
impl ExtendedViewingKey {
    /// Instantiate ExtendedViewingKey from serialized vector
    #[wasm_bindgen(constructor)]
    pub fn new(key: &[u8]) -> Result<ExtendedViewingKey, String> {
        let xfvk: zip32::ExtendedFullViewingKey = BorshDeserialize::try_from_slice(key)
            .map_err(|err| format!("{}: {:?}", MaspError::BorshDeserialize, err))?;

        let vk = NamadaExtendedViewingKey::from(xfvk);

        Ok(ExtendedViewingKey(vk))
    }

    /// Return ExtendedViewingKey as Bech32-encoded String
    pub fn encode(&self) -> String {
        self.0.to_string()
    }

    pub fn default_payment_address(&self) -> Result<JsValue, JsError> {
        let xfvk = zip32::ExtendedFullViewingKey::from(self.0);
        let (diversifier_index, payment_address) = xfvk.default_address();
        let div_idx = u32::try_from(diversifier_index)?;

        to_js_result((div_idx, PaymentAddress(payment_address.into()).encode()))
    }
}

#[wasm_bindgen]
pub struct ProofGenerationKey(pub(crate) sapling::ProofGenerationKey);

#[wasm_bindgen]
impl ProofGenerationKey {
    pub fn from_bytes(ak: Vec<u8>, nsk: Vec<u8>) -> ProofGenerationKey {
        let concatenated: Vec<u8> = ak.iter().chain(nsk.iter()).cloned().collect();
        let pgk = sapling::ProofGenerationKey::try_from_slice(concatenated.as_slice())
            .expect("Deserializing ProofGenerationKey should not fail!");

        ProofGenerationKey(pgk)
    }

    pub fn encode(&self) -> String {
        hex::encode(
            borsh::to_vec(&self.0).expect("Serializing ProofGenerationKey should not fail!"),
        )
    }

    pub fn decode(encoded: String) -> ProofGenerationKey {
        let decoded = hex::decode(encoded).expect("Decoding ProofGenerationKey should not fail!");

        ProofGenerationKey(
            sapling::ProofGenerationKey::try_from_slice(decoded.as_slice())
                .expect("Deserializing ProofGenerationKey should not fail!"),
        )
    }
}

/// Wrap ExtendedSpendingKey
#[wasm_bindgen]
pub struct PseudoExtendedKey(pub(crate) zip32::PseudoExtendedKey);

#[wasm_bindgen]
impl PseudoExtendedKey {
    pub fn encode(&self) -> String {
        hex::encode(borsh::to_vec(&self.0).expect("Serializing PseudoExtendedKey should not fail!"))
    }

    pub fn decode(encoded: String) -> Result<PseudoExtendedKey, JsError> {
        let decoded = hex::decode(encoded).map_err(|err| JsError::new(&err.to_string()))?;
        let pek = zip32::PseudoExtendedKey::try_from_slice(decoded.as_slice())
            .map_err(|err| JsError::new(&err.to_string()))?;

        Ok(PseudoExtendedKey(pek))
    }

    pub fn from(xvk: ExtendedViewingKey, pgk: ProofGenerationKey) -> Self {
        let mut pxk = zip32::PseudoExtendedKey::from(zip32::ExtendedFullViewingKey::from(xvk.0));
        pxk.augment_proof_generation_key(pgk.0)
            .expect("Augmenting proof generation key should not fail!");

        pxk.augment_spend_authorizing_key_unchecked(sapling::redjubjub::PrivateKey(
            jubjub::Fr::default(),
        ));

        Self(pxk)
    }

    pub fn to_viewing_key(&self) -> Result<ExtendedViewingKey, String> {
        let xfvk = self.0.to_viewing_key();
        ExtendedViewingKey::new(&borsh::to_vec(&xfvk).map_err(|e| e.to_string())?)
    }
}

/// Wrap ExtendedSpendingKey
#[wasm_bindgen]
pub struct ExtendedSpendingKey(pub(crate) NamadaExtendedSpendingKey);

/// wasm_bindgen bindings for ExtendedViewingKey
#[wasm_bindgen]
impl ExtendedSpendingKey {
    /// Instantiate ExtendedSpendingKey from serialized vector
    #[wasm_bindgen(constructor)]
    pub fn new(key: Uint8Array) -> Result<ExtendedSpendingKey, String> {
        let xsk: zip32::ExtendedSpendingKey =
            BorshDeserialize::try_from_slice(key.to_vec().as_slice())
                .map_err(|err| format!("{}: {:?}", MaspError::BorshDeserialize, err))?;

        let xsk = NamadaExtendedSpendingKey::from(xsk);

        Ok(ExtendedSpendingKey(xsk))
    }

    pub fn from_string(xsk: String) -> Result<ExtendedSpendingKey, String> {
        let xsk = NamadaExtendedSpendingKey::from_str(&xsk).map_err(|err| err.to_string())?;

        Ok(ExtendedSpendingKey(xsk))
    }

    pub fn to_viewing_key(&self) -> Result<ExtendedViewingKey, String> {
        ExtendedViewingKey::new(&self.0.to_viewing_key().to_bytes())
    }

    pub fn to_default_address(&self) -> Result<JsValue, JsError> {
        let xsk = zip32::ExtendedSpendingKey::from(self.0);
        let xfvk = zip32::ExtendedFullViewingKey::from(&xsk);
        let (div_idx, payment_address) = xfvk.default_address();

        let index = u32::try_from(div_idx)?;
        to_js_result((index, PaymentAddress(payment_address.into()).encode()))
    }

    pub fn to_proof_generation_key(&self) -> ProofGenerationKey {
        let xsk = zip32::ExtendedSpendingKey::from(self.0);
        let pgk = xsk
            .to_proof_generation_key()
            .expect("Converting to proof generation key should not fail!");

        ProofGenerationKey(pgk)
    }

    pub fn to_pseudo_extended_key(&self) -> PseudoExtendedKey {
        let xsk = zip32::ExtendedSpendingKey::from(self.0);
        let mut pxk = zip32::PseudoExtendedKey::from(xsk);
        pxk.augment_spend_authorizing_key_unchecked(sapling::redjubjub::PrivateKey(
            jubjub::Fr::default(),
        ));

        PseudoExtendedKey(pxk)
    }

    /// Return ExtendedSpendingKey as Bech32-encoded String
    pub fn encode(&self) -> String {
        self.0.to_string()
    }
}

/// Wrap PaymentAddress
#[wasm_bindgen]
pub struct PaymentAddress(pub(crate) NamadaPaymentAddress);

/// wasm_bindgen bindings for PaymentAddress
#[wasm_bindgen]
impl PaymentAddress {
    /// Instantiate PaymentAddress from serialized vector
    #[wasm_bindgen(constructor)]
    pub fn new(address: &[u8]) -> Result<PaymentAddress, String> {
        let payment_address: sapling::PaymentAddress = BorshDeserialize::try_from_slice(address)
            .map_err(|err| format!("{}: {:?}", MaspError::BorshDeserialize, err))?;
        let payment_address = NamadaPaymentAddress::from(payment_address);
        Ok(PaymentAddress(payment_address))
    }

    /// Retrieve PaymentAddress hash
    pub fn hash(&self) -> String {
        self.0.hash()
    }

    /// Return PaymentAddress as Bech32-encoded String
    pub fn encode(&self) -> String {
        self.0.to_string()
    }
}

/// Find next payment address from current index for viewing key
#[wasm_bindgen]
pub fn gen_payment_address(vk: String, index: u32) -> Result<JsValue, JsError> {
    let diversifier_index = DiversifierIndex::from(index);

    let xfvk = zip32::ExtendedFullViewingKey::from(
        NamadaExtendedViewingKey::from_str(&vk)
            .expect("Parsing ExtendedViewingKey should not fail!"),
    );
    let (div_idx, masp_payment_addr) = xfvk
        .find_address(diversifier_index)
        .expect("Exhausted payment addresses");

    let payment_addr = NamadaPaymentAddress::from(masp_payment_addr);
    let payment_address = PaymentAddress(payment_addr);
    let index: u32 = u32::try_from(div_idx)?;

    to_js_result((index, payment_address.encode()))
}

#[wasm_bindgen]
pub struct DatedViewingKey(pub(crate) DatedKeypair<ViewingKey>);

#[wasm_bindgen]
impl DatedViewingKey {
    #[wasm_bindgen(constructor)]
    pub fn new(key: String, birthday: String) -> Result<DatedViewingKey, String> {
        let xfvk = zip32::ExtendedFullViewingKey::from(
            NamadaExtendedViewingKey::from_str(&key)
                .expect("Parsing ExtendedViewingKey should not fail!"),
        )
        .fvk
        .vk;
        let birthday = BlockHeight::from_str(&birthday).expect("Parsing birthday should not fail!");

        Ok(DatedViewingKey(DatedKeypair {
            key: xfvk,
            birthday,
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn can_deserialize_an_extended_spending_key() {
        // BorshSerialize'd slice, generated from @namada/crypto - zip32
        let encoded_xsk: &[u8] = &[
            1, 233, 222, 184, 155, 1, 0, 0, 0, 232, 94, 130, 41, 9, 58, 197, 35, 245, 249, 232,
            225, 222, 38, 148, 105, 204, 14, 230, 30, 241, 22, 214, 38, 221, 49, 17, 147, 255, 136,
            219, 250, 71, 230, 226, 2, 146, 75, 94, 233, 234, 254, 128, 142, 209, 73, 65, 180, 64,
            235, 159, 125, 24, 77, 12, 246, 113, 174, 41, 217, 5, 190, 215, 6, 76, 189, 55, 31, 96,
            85, 114, 22, 215, 250, 140, 98, 162, 95, 203, 154, 180, 0, 231, 40, 172, 36, 137, 30,
            142, 181, 225, 143, 180, 110, 135, 2, 213, 181, 237, 102, 55, 178, 202, 2, 123, 161,
            104, 49, 91, 37, 62, 52, 132, 72, 103, 7, 60, 110, 171, 49, 22, 100, 146, 44, 79, 205,
            112, 25, 36, 51, 226, 228, 45, 242, 201, 220, 212, 220, 58, 92, 127, 47, 214, 59, 174,
            182, 74, 90, 65, 229, 187, 76, 65, 246, 34, 237, 107, 208, 178, 243,
        ];
        let xsk = ExtendedSpendingKey::new(encoded_xsk.into())
            .expect("Instantiating ExtendedSpendingKey struct should not fail!");

        let key = xsk.encode();
        let expected_key =
            format!(
                "{}{}{}",
                "zsknam1q85aawymqyqqqq8gt6pzjzf6c53lt70gu80zd9rfes8wv8h3zmtzdhf3zxfllzxmlfr7dcszjf94a602l6qga52fgx6yp6ul05vy6r",
                "8kwxhznkg9hmtsvn9axu0kq4tjzmtl4rrz5f0uhx45qrnj3tpy3y0gad0p376xapcz6k676e3hkt9qy7apdqc4kff7xjzysec883h2kvgkvjf",
                "zcn7dwqvjgvlzuskl9jwu6nwr5hrl9ltrht4kffdyredmf3qlvghdd0gt9ucw4ccj7",
            );

        assert!(key.starts_with("zsknam"));
        assert_eq!(key, expected_key);
    }

    #[wasm_bindgen_test]
    fn can_deserialize_an_extended_viewing_key() {
        // BorshSerialize'd slice, generated from @namada/crypto - zip32
        let encoded_xfvk: &[u8] = &[
            1, 233, 222, 184, 155, 1, 0, 0, 0, 232, 94, 130, 41, 9, 58, 197, 35, 245, 249, 232,
            225, 222, 38, 148, 105, 204, 14, 230, 30, 241, 22, 214, 38, 221, 49, 17, 147, 255, 136,
            219, 250, 231, 141, 253, 33, 141, 45, 47, 253, 94, 99, 2, 58, 233, 84, 152, 142, 60,
            45, 175, 100, 10, 5, 32, 126, 133, 46, 214, 50, 136, 235, 250, 73, 125, 112, 103, 142,
            119, 204, 205, 75, 30, 208, 119, 223, 218, 19, 88, 206, 173, 185, 244, 228, 224, 32,
            104, 193, 189, 255, 9, 147, 22, 21, 240, 191, 213, 181, 237, 102, 55, 178, 202, 2, 123,
            161, 104, 49, 91, 37, 62, 52, 132, 72, 103, 7, 60, 110, 171, 49, 22, 100, 146, 44, 79,
            205, 112, 25, 36, 51, 226, 228, 45, 242, 201, 220, 212, 220, 58, 92, 127, 47, 214, 59,
            174, 182, 74, 90, 65, 229, 187, 76, 65, 246, 34, 237, 107, 208, 178, 243,
        ];
        let xfvk = ExtendedViewingKey::new(encoded_xfvk)
            .expect("Instantiating ExtendedViewingKey struct should not fail!");

        let key = xfvk.encode();
        let expected_key =
            format!(
                "{}{}{}",
                "zvknam1q85aawymqyqqqq8gt6pzjzf6c53lt70gu80zd9rfes8wv8h3zmtzdhf3zxfllzxmltncmlfp35kjll27vvpr4625nz8rctd0vs9",
                "q2gr7s5hdvv5ga0ayjltsv7880nxdfv0dqa7lmgf43n4dh86wfcpqdrqmmlcfjvtptu9l6k676e3hkt9qy7apdqc4kff7xjzysec883h2k",
                "vgkvjfzcn7dwqvjgvlzuskl9jwu6nwr5hrl9ltrht4kffdyredmf3qlvghdd0gt9uce7vx4v",
            );
        assert!(key.starts_with("zvknam"));
        assert_eq!(key, expected_key);
    }

    #[wasm_bindgen_test]
    fn can_deserialize_a_payment_address() {
        // BorshSerialize'd slice, generated from @namada/crypto - zip32
        let encoded_payment_address: &[u8] = &[
            100, 199, 34, 96, 93, 67, 18, 95, 86, 139, 123, 213, 141, 228, 147, 169, 218, 247, 75,
            83, 195, 72, 73, 44, 65, 232, 243, 229, 209, 63, 183, 1, 87, 87, 203, 40, 180, 242,
            103, 187, 245, 224, 36,
        ];
        let payment_address = PaymentAddress::new(encoded_payment_address)
            .expect("Instantiating PaymentAddress struct should not fail!");

        let address = payment_address.encode();
        let hash = payment_address.hash();

        let expected_address =
            "znam1vnrjyczagvf9745t002cmeyn48d0wj6ncdyyjtzpare7t5flkuq4w47t9z60yeam7hszgyhdw2j";

        let expected_hash = "4E11B97D220F336CF36A14E8DDFE15ED34BC489D";

        assert!(address.starts_with("znam"));
        assert_eq!(address, expected_address);
        assert_eq!(hash, expected_hash);
    }
}
