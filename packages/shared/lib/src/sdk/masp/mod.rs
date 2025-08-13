#[cfg(feature = "web")]
mod masp_web;

#[cfg(feature = "web")]
pub use masp_web::{
    fetch_and_store_masp_params, get_masp_params, has_masp_params,
    WebShieldedUtils as JSShieldedUtils,
};

#[cfg(feature = "nodejs")]
mod masp_node;

#[cfg(feature = "nodejs")]
pub use masp_node::{
    fetch_and_store_masp_params, get_masp_params, has_masp_params,
    NodeShieldedUtils as JSShieldedUtils,
};

pub mod sync;
