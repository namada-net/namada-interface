use async_trait::async_trait;
use gloo_utils::format::JsValueSerdeExt;
use namada_sdk::borsh::{BorshDeserialize, BorshSerialize};
use namada_sdk::masp::{
    v0, ContextSyncStatus, DispatcherCache, ShieldedUtils, VersionedWallet, VersionedWalletRef,
};
use namada_sdk::masp_proofs::prover::LocalTxProver;
use namada_sdk::ShieldedWallet;
use rexie::{Error, ObjectStore, Rexie, TransactionMode};
use wasm_bindgen::{prelude::*, JsError, JsValue};

use crate::utils::to_bytes;

const SHIELDED_CONTEXT_PREFIX: &str = "shielded-context";
const SHIELDED_CONTEXT_KEY_CONFIRMED: &str = "shielded-context-confirmed";
const SHIELDED_CONTEXT_KEY_SPECULATIVE: &str = "shielded-context-speculative";
const SHIELDED_CONTEXT_KEY_TEMP: &str = "shielded-context-temp";

#[derive(Default, Debug, BorshSerialize, BorshDeserialize, Clone)]
#[borsh(crate = "namada_sdk::borsh")]
pub struct WebShieldedUtils {
    spend_param_bytes: Vec<u8>,
    output_param_bytes: Vec<u8>,
    convert_param_bytes: Vec<u8>,
    pub chain_id: String,
}

impl WebShieldedUtils {
    pub async fn new(
        spend_param_bytes: Vec<u8>,
        output_param_bytes: Vec<u8>,
        convert_param_bytes: Vec<u8>,
        chain_id: String,
    ) -> Result<ShieldedWallet<Self>, JsError> {
        let utils = Self {
            spend_param_bytes,
            output_param_bytes,
            convert_param_bytes,
            chain_id: chain_id.clone(),
        };

        let db = Self::build_database(&chain_id).await?;

        let sync_status = if Self::get_context(&db, false, false, &chain_id)
            .await
            .is_ok()
        {
            ContextSyncStatus::Speculative
        } else {
            ContextSyncStatus::Confirmed
        };

        Ok(ShieldedWallet {
            utils,
            sync_status,
            ..Default::default()
        })
    }

    /// Clear all shielded context data from the database.
    pub async fn clear(chain_id: &str) -> Result<(), Error> {
        let db = Self::build_database(chain_id).await?;
        let entry = format!("{}-{}", SHIELDED_CONTEXT_PREFIX, chain_id);

        db.transaction(&[entry.clone()], TransactionMode::ReadWrite)?
            .store(&entry)?
            .delete(&JsValue::from_str(SHIELDED_CONTEXT_KEY_SPECULATIVE))
            .await?;
        db.transaction(&[entry.clone()], TransactionMode::ReadWrite)?
            .store(&entry)?
            .delete(&JsValue::from_str(SHIELDED_CONTEXT_KEY_CONFIRMED))
            .await?;
        db.transaction(&[entry.clone()], TransactionMode::ReadWrite)?
            .store(&entry)?
            .delete(&JsValue::from_str(SHIELDED_CONTEXT_KEY_TEMP))
            .await?;

        Ok(())
    }

    fn to_io_err(e: Error) -> std::io::Error {
        std::io::Error::other(e.to_string())
    }

    pub async fn build_database(chain_id: &str) -> Result<Rexie, Error> {
        let entry = format!("{}-{}", SHIELDED_CONTEXT_PREFIX, chain_id);
        let rexie = Rexie::builder(&entry)
            .version(1)
            .add_object_store(ObjectStore::new(&entry))
            .build()
            .await?;

        Ok(rexie)
    }

    pub async fn set_context(
        rexie: &Rexie,
        context: JsValue,
        confirmed: bool,
        cache: bool,
        chain_id: &str,
    ) -> Result<(), Error> {
        let entry = format!("{}-{}", SHIELDED_CONTEXT_PREFIX, chain_id);
        //TODO: add readwriteflush
        let transaction = rexie.transaction(&[entry.clone()], TransactionMode::ReadWrite)?;

        let context_store = transaction.store(&entry)?;

        let key = Self::get_key(confirmed, cache);

        context_store
            .put(&context, Some(&JsValue::from_str(key)))
            .await?;

        Ok(())
    }

    async fn get_context(
        rexie: &Rexie,
        confirmed: bool,
        cache: bool,
        chain_id: &str,
    ) -> Result<JsValue, Error> {
        let entry = format!("{}-{}", SHIELDED_CONTEXT_PREFIX, chain_id);
        let transaction = rexie.transaction(&[entry.clone()], TransactionMode::ReadOnly)?;

        let context_store = transaction.store(&entry)?;

        let key = Self::get_key(confirmed, cache);

        let context = context_store.get(&JsValue::from_str(key)).await?;

        Ok(context)
    }

    async fn remove_speculative_context(rexie: &Rexie, chain_id: &str) -> Result<(), Error> {
        let entry = format!("{}-{}", SHIELDED_CONTEXT_PREFIX, chain_id);
        let transaction = rexie.transaction(&[entry.clone()], TransactionMode::ReadWrite)?;

        let context_store = transaction.store(&entry)?;

        context_store
            .delete(&JsValue::from_str(SHIELDED_CONTEXT_KEY_SPECULATIVE))
            .await?;

        Ok(())
    }

    fn get_key(force_confirmed: bool, cache: bool) -> &'static str {
        if cache {
            SHIELDED_CONTEXT_KEY_TEMP
        } else if force_confirmed {
            SHIELDED_CONTEXT_KEY_CONFIRMED
        } else {
            SHIELDED_CONTEXT_KEY_SPECULATIVE
        }
    }
}

fn get_confirmed(status: &ContextSyncStatus) -> bool {
    match status {
        ContextSyncStatus::Confirmed => true,
        ContextSyncStatus::Speculative => false,
    }
}

#[async_trait(?Send)]
impl ShieldedUtils for WebShieldedUtils {
    fn local_tx_prover(&self) -> LocalTxProver {
        LocalTxProver::from_bytes(
            &self.spend_param_bytes,
            &self.output_param_bytes,
            &self.convert_param_bytes,
        )
    }

    async fn load<U: ShieldedUtils>(
        &self,
        ctx: &mut ShieldedWallet<U>,
        force_confirmed: bool,
    ) -> std::io::Result<()> {
        let db = Self::build_database(&self.chain_id)
            .await
            .map_err(Self::to_io_err)?;
        let confirmed = force_confirmed || get_confirmed(&ctx.sync_status);

        let stored_ctx = Self::get_context(&db, confirmed, false, &self.chain_id)
            .await
            .map_err(Self::to_io_err)?;
        let stored_ctx_bytes = to_bytes(stored_ctx);

        let context: ShieldedWallet<U> = if stored_ctx_bytes.is_empty() {
            ShieldedWallet::default()
        } else {
            match VersionedWallet::<U>::deserialize(&mut &stored_ctx_bytes[..]) {
                Ok(w) => w,
                Err(_) => VersionedWallet::V0(v0::ShieldedWallet::<U>::deserialize(
                    &mut &stored_ctx_bytes[..],
                )?),
            }
            .migrate()
            .map_err(std::io::Error::other)?
        };

        *ctx = ShieldedWallet {
            utils: ctx.utils.clone(),
            ..context
        };

        Ok(())
    }

    async fn save<'a, U: ShieldedUtils>(
        &'a self,
        ctx: VersionedWalletRef<'a, U>,
        sync_status: ContextSyncStatus,
    ) -> std::io::Result<()> {
        let mut bytes = Vec::new();
        ctx.serialize(&mut bytes)
            .expect("cannot serialize shielded context");

        let db = Self::build_database(&self.chain_id)
            .await
            .map_err(Self::to_io_err)?;
        let confirmed = get_confirmed(&sync_status);

        Self::set_context(
            &db,
            JsValue::from_serde(&bytes).unwrap(),
            confirmed,
            false,
            &self.chain_id,
        )
        .await
        .map_err(Self::to_io_err)?;

        if let ContextSyncStatus::Confirmed = sync_status {
            Self::remove_speculative_context(&db, &self.chain_id)
                .await
                .map_err(Self::to_io_err)?;
        }

        Ok(())
    }

    /// Save a cache of data as part of shielded sync if that
    /// process gets interrupted.
    async fn cache_save(&self, cache: &DispatcherCache) -> std::io::Result<()> {
        let mut bytes = Vec::new();
        cache.serialize(&mut bytes).expect("cannot serialize cache");

        let db = Self::build_database(&self.chain_id)
            .await
            .map_err(Self::to_io_err)?;
        Self::set_context(
            &db,
            JsValue::from_serde(&bytes).unwrap(),
            false,
            true,
            &self.chain_id,
        )
        .await
        .map_err(Self::to_io_err)
    }

    /// Load a cache of data as part of shielded sync if that
    /// process gets interrupted.
    async fn cache_load(&self) -> std::io::Result<DispatcherCache> {
        let db = Self::build_database(&self.chain_id)
            .await
            .map_err(Self::to_io_err)?;

        let stored_cache = Self::get_context(&db, false, true, &self.chain_id)
            .await
            .map_err(Self::to_io_err)?;
        let stored_cache_bytes = to_bytes(stored_cache);

        DispatcherCache::deserialize(&mut &stored_cache_bytes[..])
    }
}

pub async fn has_masp_params() -> Result<JsValue, JsValue> {
    let has = js_has_masp_params().await?;

    Ok(js_sys::Boolean::from(has.as_bool().unwrap()).into())
}

pub async fn fetch_and_store_masp_params(url: Option<String>) -> Result<(), JsValue> {
    js_fetch_and_store_masp_params(url).await?;
    Ok(())
}

pub async fn get_masp_params() -> Result<JsValue, JsValue> {
    let params = js_get_masp_params().await?;
    Ok(params)
}

#[wasm_bindgen(module = "/src/sdk/masp/masp.web.js")]
extern "C" {
    #[wasm_bindgen(catch, js_name = "getMaspParams")]
    async fn js_get_masp_params() -> Result<JsValue, JsValue>;
    #[wasm_bindgen(catch, js_name = "hasMaspParams")]
    async fn js_has_masp_params() -> Result<JsValue, JsValue>;
    #[wasm_bindgen(catch, js_name = "fetchAndStoreMaspParams")]
    async fn js_fetch_and_store_masp_params(url: Option<String>) -> Result<JsValue, JsValue>;
}
