/* tslint:disable */
/* eslint-disable */
/**
 * Find next payment address from current index for viewing key
 */
export function gen_payment_address(vk: string, index: number): any;
/**
 * Helper function to bech32 encode a public key from bytes
 */
export function public_key_to_bech32(bytes: Uint8Array): string;
export function get_inner_tx_meta(tx_bytes: Uint8Array): any;
export function deserialize_tx(tx_bytes: Uint8Array, wasm_hashes: any): Uint8Array;
export function initThreadPool(num_threads: number): Promise<any>;
export function wbg_rayon_start_worker(receiver: number): void;
export enum ByteSize {
  N12 = 12,
  N24 = 24,
  N32 = 32,
}
export enum TxType {
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

export enum SdkEvents {
    ProgressBarStarted = "namada_sdk::progress_bar::started",
    ProgressBarIncremented = "namada_sdk::progress_bar::incremented",
    ProgressBarFinished = "namada_sdk::progress_bar::finished",
}


export class AES {
  free(): void;
  constructor(key: VecU8Pointer, iv: Uint8Array);
  encrypt(text: string): Uint8Array;
  decrypt(ciphertext: Uint8Array): VecU8Pointer;
}
export class Address {
  free(): void;
  /**
   * Address helpers for wasm_bindgen
   */
  constructor(secret: string);
  implicit(): string;
  public(): string;
  hash(): string;
}
export class Argon2 {
  free(): void;
  constructor(password: string, salt?: string | null, params?: Argon2Params | null);
  to_hash(): string;
  verify(hash: string): void;
  params(): Argon2Params;
  /**
   * Convert PHC string to serialized key
   */
  key(): VecU8Pointer;
}
export class Argon2Params {
  free(): void;
  constructor(m_cost: number, t_cost: number, p_cost: number);
  readonly m_cost: number;
  readonly t_cost: number;
  readonly p_cost: number;
}
export class BatchTxResult {
  private constructor();
  free(): void;
  is_applied: boolean;
}
export class DatedViewingKey {
  free(): void;
  constructor(key: string, birthday: string);
}
export class DerivationResult {
  private constructor();
  free(): void;
  xsk(): Uint8Array;
  xfvk(): Uint8Array;
  payment_address(): Uint8Array;
}
/**
 * Wrap ExtendedSpendingKey
 */
export class ExtendedSpendingKey {
  free(): void;
  /**
   * Instantiate ExtendedSpendingKey from serialized vector
   */
  constructor(key: Uint8Array);
  static from_string(xsk: string): ExtendedSpendingKey;
  to_viewing_key(): ExtendedViewingKey;
  to_default_address(): any;
  to_proof_generation_key(): ProofGenerationKey;
  to_pseudo_extended_key(): PseudoExtendedKey;
  /**
   * Return ExtendedSpendingKey as Bech32-encoded String
   */
  encode(): string;
}
/**
 * Wrap ExtendedViewingKey
 */
export class ExtendedViewingKey {
  free(): void;
  /**
   * Instantiate ExtendedViewingKey from serialized vector
   */
  constructor(key: Uint8Array);
  /**
   * Return ExtendedViewingKey as Bech32-encoded String
   */
  encode(): string;
  default_payment_address(): any;
}
export class HDWallet {
  free(): void;
  constructor(seed_ptr: VecU8Pointer);
  static from_seed(seed: Uint8Array): HDWallet;
  /**
   * Derive account from a seed and a path
   */
  derive(path: Uint32Array): Key;
  static disposable_keypair(): Key;
}
export class Key {
  free(): void;
  constructor(bytes: Uint8Array);
  to_bytes(): Uint8Array;
  to_hex(): StringPointer;
}
export class Mnemonic {
  free(): void;
  constructor(size: number);
  static validate(phrase: string): boolean;
  static from_phrase(phrase: string): Mnemonic;
  to_seed(passphrase?: StringPointer | null): VecU8Pointer;
  to_words(): VecStringPointer;
  phrase(): string;
}
/**
 * Wrap PaymentAddress
 */
export class PaymentAddress {
  free(): void;
  /**
   * Instantiate PaymentAddress from serialized vector
   */
  constructor(address: Uint8Array);
  /**
   * Retrieve PaymentAddress hash
   */
  hash(): string;
  /**
   * Return PaymentAddress as Bech32-encoded String
   */
  encode(): string;
}
export class ProgressBarNames {
  private constructor();
  free(): void;
  static readonly Scanned: string;
  static readonly Fetched: string;
  static readonly Applied: string;
}
export class ProgressFinish {
  private constructor();
  free(): void;
}
export class ProgressIncrement {
  private constructor();
  free(): void;
}
export class ProgressStart {
  private constructor();
  free(): void;
}
export class ProofGenerationKey {
  private constructor();
  free(): void;
  static from_bytes(ak: Uint8Array, nsk: Uint8Array): ProofGenerationKey;
  encode(): string;
  static decode(encoded: string): ProofGenerationKey;
}
/**
 * Wrap ExtendedSpendingKey
 */
export class PseudoExtendedKey {
  private constructor();
  free(): void;
  encode(): string;
  static decode(encoded: string): PseudoExtendedKey;
  static can_decode(encoded: string): boolean;
  static from(xvk: ExtendedViewingKey, pgk: ProofGenerationKey): PseudoExtendedKey;
  to_viewing_key(): ExtendedViewingKey;
}
/**
 * Represents an API for querying the ledger
 */
export class Query {
  free(): void;
  constructor(url: string, masp_url?: string | null);
  /**
   * Gets current epoch
   *
   * # Errors
   *
   * Returns an error if the RPC call fails
   */
  query_epoch(): Promise<bigint>;
  /**
   * Gets all active validator addresses
   *
   * # Errors
   *
   * Returns an error if the RPC call fails
   */
  query_all_validator_addresses(): Promise<any>;
  /**
   * Gets total bonds by validator address
   *
   * # Errors
   *
   * Returns an error if the RPC call fails
   */
  query_total_bonds(address: string): Promise<any>;
  /**
   * Gets all delegations for every provided address.
   * Returns a tuple of:
   * (owner_address, validator_address, total_bonds, total_unbonds, withdrawable)
   *
   * # Arguments
   *
   * * `owner_addresses` - Account address in form of bech32, base64 encoded string
   *
   * # Errors
   *
   * Panics if address can't be deserialized
   */
  query_my_validators(owner_addresses: any[]): Promise<any>;
  query_staking_positions(owner_addresses: any[]): Promise<any>;
  shielded_sync(vks: DatedViewingKey[], chain_id: string): Promise<void>;
  query_balance(owner: string, tokens: any[], chain_id: string): Promise<any>;
  query_public_key(address: string): Promise<any>;
  query_signed_bridge_pool(owner_addresses: any[]): Promise<any>;
  query_total_staked_tokens(epoch: bigint): Promise<any>;
  query_proposal_counter(): Promise<any>;
  query_proposal_by_id(id: bigint): Promise<Uint8Array>;
  query_proposal_votes(proposal_id: bigint, epoch: bigint): Promise<any>;
  query_proposal_result(proposal_id: bigint, epoch: bigint): Promise<any>;
  query_proposal_code(proposal_id: bigint): Promise<Uint8Array>;
  /**
   * Returns a list of all delegations for given addresses and epoch
   *
   * # Arguments
   *
   * * `addresses` - delegators addresses
   * * `epoch` - epoch in which we want to query delegations
   */
  get_total_delegations(addresses: any[], epoch?: bigint | null): Promise<any>;
  masp_reward_tokens(): Promise<any>;
  /**
   * Returns list of delegators that already voted on a proposal
   *
   * # Arguments
   *
   * * `proposal_id` - id of proposal to get delegators votes from
   */
  delegators_votes(proposal_id: bigint): Promise<any>;
  query_gas_costs(): Promise<any>;
  query_native_token(): Promise<any>;
  static code_paths(): string[];
  query_wasm_hashes(): Promise<any>;
  query_wasm_hash(tx_code_path: string): Promise<string | undefined>;
}
export class Rng {
  private constructor();
  free(): void;
  static generate_bytes(size?: ByteSize | null): Uint8Array;
}
export class Salt {
  free(): void;
  constructor(salt: string);
  static generate(): Salt;
  as_string(): string;
}
/**
 * Represents the Sdk public API.
 */
export class Sdk {
  free(): void;
  constructor(url: string, native_token: string, path_or_db_name: string);
  static clear_shielded_context(chain_id: string): Promise<void>;
  static has_masp_params(): Promise<any>;
  static fetch_and_store_masp_params(url?: string | null): Promise<void>;
  load_masp_params(_db_name: any, chain_id: string): Promise<void>;
  add_spending_key(xsk: string, alias: string): Promise<void>;
  add_viewing_key(xvk: string, alias: string): Promise<void>;
  add_payment_address(pa: string, alias: string): Promise<void>;
  add_default_payment_address(xvk: string, alias: string): Promise<void>;
  add_keypair(secret_key: string, alias: string, password?: string | null): Promise<void>;
  save_wallet(): Promise<void>;
  load_wallet(): Promise<void>;
  sign_masp(xsks: string[], tx: Uint8Array): Promise<any>;
  get_descriptor_map(tx: Uint8Array, shielded_hash: Uint8Array): any;
  sign_masp_ledger(tx: Uint8Array, signing_data: Uint8Array[], signatures: Uint8Array[]): any;
  sign_tx(tx: Uint8Array, private_keys: string[], chain_id?: string | null): Promise<any>;
  broadcast_tx(tx_bytes: Uint8Array, deadline: bigint): Promise<any>;
  /**
   * Build a batch Tx from built transactions and return the bytes
   */
  static build_batch(txs: any): any;
  append_signature(tx_bytes: Uint8Array, sig_msg_bytes: Uint8Array): any;
  build_transparent_transfer(transfer_msg: Uint8Array, wrapper_tx_msg: Uint8Array): Promise<any>;
  build_shielded_transfer(shielded_transfer_msg: Uint8Array, wrapper_tx_msg: Uint8Array, skip_fee_check: boolean): Promise<any>;
  build_unshielding_transfer(unshielding_transfer_msg: Uint8Array, wrapper_tx_msg: Uint8Array, skip_fee_check: boolean): Promise<any>;
  build_shielding_transfer(shielding_transfer_msg: Uint8Array, wrapper_tx_msg: Uint8Array): Promise<any>;
  build_ibc_transfer(ibc_transfer_msg: Uint8Array, wrapper_tx_msg: Uint8Array): Promise<any>;
  build_eth_bridge_transfer(eth_bridge_transfer_msg: Uint8Array, wrapper_tx_msg: Uint8Array): Promise<any>;
  build_vote_proposal(vote_proposal_msg: Uint8Array, wrapper_tx_msg: Uint8Array): Promise<any>;
  build_claim_rewards(claim_rewards_msg: Uint8Array, wrapper_tx_msg: Uint8Array): Promise<any>;
  build_bond(bond_msg: Uint8Array, wrapper_tx_msg: Uint8Array): Promise<any>;
  build_unbond(unbond_msg: Uint8Array, wrapper_tx_msg: Uint8Array): Promise<any>;
  build_withdraw(withdraw_msg: Uint8Array, wrapper_tx_msg: Uint8Array): Promise<any>;
  build_redelegate(redelegate_msg: Uint8Array, wrapper_tx_msg: Uint8Array): Promise<any>;
  build_reveal_pk(wrapper_tx_msg: Uint8Array): Promise<any>;
  sign_arbitrary(signing_key: string, data: string): any;
  verify_arbitrary(public_key: string, signed_hash: string, signature: string): void;
  generate_ibc_shielding_memo(target: string, token: string, amount: string, channel_id: string): Promise<any>;
  build_osmosis_swap(osmosis_swap_msg: Uint8Array, wrapper_tx_msg: Uint8Array): Promise<any>;
  shielded_rewards(owner: string, chain_id: string): Promise<any>;
  shielded_rewards_per_token(owner: string, token: string, chain_id: string): Promise<any>;
  simulate_shielded_rewards(chain_id: string, token: string, amount: string): Promise<any>;
  query_notes_to_spend(owner: string, chain_id: string): Promise<any>;
  masp_address(): string;
}
export class SdkEvents {
  private constructor();
  free(): void;
  static readonly ProgressBarStarted: string;
  static readonly ProgressBarIncremented: string;
  static readonly ProgressBarFinished: string;
}
export class ShieldedHDWallet {
  free(): void;
  constructor(seed: any, path: Uint32Array);
  static new_from_sk(sk_bytes: Uint8Array): ShieldedHDWallet;
  derive(path: Uint32Array, diversifier?: Uint8Array | null): DerivationResult;
}
export class StringPointer {
  free(): void;
  constructor(string: string);
  pointer: number;
  length: number;
}
/**
 * Serializable response for process_tx calls
 */
export class TxResponse {
  private constructor();
  free(): void;
}
export class VecStringPointer {
  private constructor();
  free(): void;
  readonly pointers: Uint32Array;
  readonly lengths: Uint32Array;
}
export class VecU8Pointer {
  free(): void;
  constructor(vec: Uint8Array);
  pointer: number;
  length: number;
}
export class wbg_rayon_PoolBuilder {
  private constructor();
  free(): void;
  numThreads(): number;
  receiver(): number;
  build(): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly __wbg_rng_free: (a: number, b: number) => void;
  readonly rng_generate_bytes: (a: number) => [number, number, number, number];
  readonly __wbg_sdk_free: (a: number, b: number) => void;
  readonly sdk_new: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly sdk_clear_shielded_context: (a: number, b: number) => any;
  readonly sdk_has_masp_params: () => any;
  readonly sdk_fetch_and_store_masp_params: (a: number, b: number) => any;
  readonly sdk_load_masp_params: (a: number, b: any, c: number, d: number) => any;
  readonly sdk_add_spending_key: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_add_viewing_key: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_add_payment_address: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_add_default_payment_address: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_add_keypair: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => any;
  readonly sdk_save_wallet: (a: number) => any;
  readonly sdk_load_wallet: (a: number) => any;
  readonly sdk_sign_masp: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_get_descriptor_map: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
  readonly sdk_sign_masp_ledger: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
  readonly sdk_sign_tx: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => any;
  readonly sdk_broadcast_tx: (a: number, b: number, c: number, d: bigint) => any;
  readonly sdk_build_batch: (a: any) => [number, number, number];
  readonly sdk_append_signature: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
  readonly sdk_build_transparent_transfer: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_build_shielded_transfer: (a: number, b: number, c: number, d: number, e: number, f: number) => any;
  readonly sdk_build_unshielding_transfer: (a: number, b: number, c: number, d: number, e: number, f: number) => any;
  readonly sdk_build_shielding_transfer: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_build_ibc_transfer: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_build_eth_bridge_transfer: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_build_vote_proposal: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_build_claim_rewards: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_build_bond: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_build_unbond: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_build_withdraw: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_build_redelegate: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_build_reveal_pk: (a: number, b: number, c: number) => any;
  readonly sdk_sign_arbitrary: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
  readonly sdk_verify_arbitrary: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
  readonly sdk_generate_ibc_shielding_memo: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => any;
  readonly sdk_build_osmosis_swap: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_shielded_rewards: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_shielded_rewards_per_token: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => any;
  readonly sdk_simulate_shielded_rewards: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => any;
  readonly sdk_query_notes_to_spend: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly sdk_masp_address: (a: number) => [number, number];
  readonly __wbg_vecu8pointer_free: (a: number, b: number) => void;
  readonly vecu8pointer_new: (a: number, b: number) => number;
  readonly __wbg_stringpointer_free: (a: number, b: number) => void;
  readonly __wbg_get_stringpointer_pointer: (a: number) => number;
  readonly __wbg_set_stringpointer_pointer: (a: number, b: number) => void;
  readonly __wbg_get_stringpointer_length: (a: number) => number;
  readonly __wbg_set_stringpointer_length: (a: number, b: number) => void;
  readonly stringpointer_new: (a: number, b: number) => number;
  readonly __wbg_vecstringpointer_free: (a: number, b: number) => void;
  readonly vecstringpointer_pointers: (a: number) => [number, number];
  readonly vecstringpointer_lengths: (a: number) => [number, number];
  readonly __wbg_set_vecu8pointer_pointer: (a: number, b: number) => void;
  readonly __wbg_set_vecu8pointer_length: (a: number, b: number) => void;
  readonly __wbg_get_vecu8pointer_pointer: (a: number) => number;
  readonly __wbg_get_vecu8pointer_length: (a: number) => number;
  readonly __wbg_mnemonic_free: (a: number, b: number) => void;
  readonly mnemonic_new: (a: number) => [number, number, number];
  readonly mnemonic_validate: (a: number, b: number) => number;
  readonly mnemonic_from_phrase: (a: number, b: number) => [number, number, number];
  readonly mnemonic_to_seed: (a: number, b: number) => [number, number, number];
  readonly mnemonic_to_words: (a: number) => [number, number, number];
  readonly mnemonic_phrase: (a: number) => [number, number];
  readonly __wbg_extendedviewingkey_free: (a: number, b: number) => void;
  readonly extendedviewingkey_new: (a: number, b: number) => [number, number, number];
  readonly extendedviewingkey_encode: (a: number) => [number, number];
  readonly extendedviewingkey_default_payment_address: (a: number) => [number, number, number];
  readonly __wbg_proofgenerationkey_free: (a: number, b: number) => void;
  readonly proofgenerationkey_from_bytes: (a: number, b: number, c: number, d: number) => number;
  readonly proofgenerationkey_encode: (a: number) => [number, number];
  readonly proofgenerationkey_decode: (a: number, b: number) => number;
  readonly __wbg_pseudoextendedkey_free: (a: number, b: number) => void;
  readonly pseudoextendedkey_encode: (a: number) => [number, number];
  readonly pseudoextendedkey_decode: (a: number, b: number) => [number, number, number];
  readonly pseudoextendedkey_can_decode: (a: number, b: number) => number;
  readonly pseudoextendedkey_from: (a: number, b: number) => number;
  readonly pseudoextendedkey_to_viewing_key: (a: number) => [number, number, number];
  readonly __wbg_extendedspendingkey_free: (a: number, b: number) => void;
  readonly extendedspendingkey_new: (a: any) => [number, number, number];
  readonly extendedspendingkey_from_string: (a: number, b: number) => [number, number, number];
  readonly extendedspendingkey_to_viewing_key: (a: number) => [number, number, number];
  readonly extendedspendingkey_to_default_address: (a: number) => [number, number, number];
  readonly extendedspendingkey_to_proof_generation_key: (a: number) => number;
  readonly extendedspendingkey_to_pseudo_extended_key: (a: number) => number;
  readonly extendedspendingkey_encode: (a: number) => [number, number];
  readonly __wbg_paymentaddress_free: (a: number, b: number) => void;
  readonly paymentaddress_new: (a: number, b: number) => [number, number, number];
  readonly paymentaddress_hash: (a: number) => [number, number];
  readonly paymentaddress_encode: (a: number) => [number, number];
  readonly gen_payment_address: (a: number, b: number, c: number) => [number, number, number];
  readonly __wbg_datedviewingkey_free: (a: number, b: number) => void;
  readonly datedviewingkey_new: (a: number, b: number, c: number, d: number) => [number, number, number];
  readonly __wbg_argon2params_free: (a: number, b: number) => void;
  readonly argon2params_new: (a: number, b: number, c: number) => number;
  readonly argon2params_m_cost: (a: number) => number;
  readonly argon2params_t_cost: (a: number) => number;
  readonly argon2params_p_cost: (a: number) => number;
  readonly __wbg_argon2_free: (a: number, b: number) => void;
  readonly argon2_new: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
  readonly argon2_to_hash: (a: number) => [number, number, number, number];
  readonly argon2_verify: (a: number, b: number, c: number) => [number, number];
  readonly argon2_params: (a: number) => number;
  readonly argon2_key: (a: number) => [number, number, number];
  readonly public_key_to_bech32: (a: number, b: number) => [number, number, number, number];
  readonly __wbg_address_free: (a: number, b: number) => void;
  readonly address_new: (a: number, b: number) => number;
  readonly address_implicit: (a: number) => [number, number];
  readonly address_public: (a: number) => [number, number];
  readonly address_hash: (a: number) => [number, number];
  readonly __wbg_progressstart_free: (a: number, b: number) => void;
  readonly __wbg_progressfinish_free: (a: number, b: number) => void;
  readonly __wbg_progressincrement_free: (a: number, b: number) => void;
  readonly __wbg_sdkevents_free: (a: number, b: number) => void;
  readonly sdkevents_ProgressBarStarted: () => [number, number];
  readonly sdkevents_ProgressBarIncremented: () => [number, number];
  readonly sdkevents_ProgressBarFinished: () => [number, number];
  readonly get_inner_tx_meta: (a: number, b: number) => [number, number, number];
  readonly deserialize_tx: (a: number, b: number, c: any) => [number, number, number, number];
  readonly __wbg_batchtxresult_free: (a: number, b: number) => void;
  readonly __wbg_get_batchtxresult_is_applied: (a: number) => number;
  readonly __wbg_set_batchtxresult_is_applied: (a: number, b: number) => void;
  readonly __wbg_txresponse_free: (a: number, b: number) => void;
  readonly __wbg_key_free: (a: number, b: number) => void;
  readonly key_new: (a: number, b: number) => [number, number, number];
  readonly key_to_bytes: (a: number) => [number, number];
  readonly key_to_hex: (a: number) => number;
  readonly __wbg_hdwallet_free: (a: number, b: number) => void;
  readonly hdwallet_new: (a: number) => [number, number, number];
  readonly hdwallet_from_seed: (a: number, b: number) => [number, number, number];
  readonly hdwallet_derive: (a: number, b: number, c: number) => [number, number, number];
  readonly hdwallet_disposable_keypair: () => [number, number, number];
  readonly __wbg_derivationresult_free: (a: number, b: number) => void;
  readonly derivationresult_xsk: (a: number) => [number, number];
  readonly derivationresult_xfvk: (a: number) => [number, number];
  readonly derivationresult_payment_address: (a: number) => [number, number];
  readonly __wbg_shieldedhdwallet_free: (a: number, b: number) => void;
  readonly shieldedhdwallet_new: (a: any, b: number, c: number) => [number, number, number];
  readonly shieldedhdwallet_new_from_sk: (a: number, b: number) => [number, number, number];
  readonly shieldedhdwallet_derive: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
  readonly __wbg_salt_free: (a: number, b: number) => void;
  readonly salt_new: (a: number, b: number) => [number, number, number];
  readonly salt_generate: () => number;
  readonly salt_as_string: (a: number) => [number, number];
  readonly __wbg_progressbarnames_free: (a: number, b: number) => void;
  readonly progressbarnames_Scanned: () => [number, number];
  readonly progressbarnames_Fetched: () => [number, number];
  readonly progressbarnames_Applied: () => [number, number];
  readonly __wbg_query_free: (a: number, b: number) => void;
  readonly query_new: (a: number, b: number, c: number, d: number) => number;
  readonly query_query_epoch: (a: number) => any;
  readonly query_query_all_validator_addresses: (a: number) => any;
  readonly query_query_total_bonds: (a: number, b: number, c: number) => any;
  readonly query_query_my_validators: (a: number, b: number, c: number) => any;
  readonly query_query_staking_positions: (a: number, b: number, c: number) => any;
  readonly query_shielded_sync: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly query_query_balance: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => any;
  readonly query_query_public_key: (a: number, b: number, c: number) => any;
  readonly query_query_signed_bridge_pool: (a: number, b: number, c: number) => any;
  readonly query_query_total_staked_tokens: (a: number, b: bigint) => any;
  readonly query_query_proposal_counter: (a: number) => any;
  readonly query_query_proposal_by_id: (a: number, b: bigint) => any;
  readonly query_query_proposal_votes: (a: number, b: bigint, c: bigint) => any;
  readonly query_query_proposal_result: (a: number, b: bigint, c: bigint) => any;
  readonly query_query_proposal_code: (a: number, b: bigint) => any;
  readonly query_get_total_delegations: (a: number, b: number, c: number, d: number, e: bigint) => any;
  readonly query_masp_reward_tokens: (a: number) => any;
  readonly query_delegators_votes: (a: number, b: bigint) => any;
  readonly query_query_gas_costs: (a: number) => any;
  readonly query_query_native_token: (a: number) => any;
  readonly query_code_paths: () => [number, number];
  readonly query_query_wasm_hashes: (a: number) => any;
  readonly query_query_wasm_hash: (a: number, b: number, c: number) => any;
  readonly __wbg_aes_free: (a: number, b: number) => void;
  readonly aes_new: (a: number, b: number, c: number) => [number, number, number];
  readonly aes_encrypt: (a: number, b: number, c: number) => [number, number, number, number];
  readonly aes_decrypt: (a: number, b: number, c: number) => [number, number, number];
  readonly __wbg_wbg_rayon_poolbuilder_free: (a: number, b: number) => void;
  readonly wbg_rayon_poolbuilder_numThreads: (a: number) => number;
  readonly wbg_rayon_poolbuilder_receiver: (a: number) => number;
  readonly wbg_rayon_poolbuilder_build: (a: number) => void;
  readonly initThreadPool: (a: number) => any;
  readonly wbg_rayon_start_worker: (a: number) => void;
  readonly memory: WebAssembly.Memory;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_3: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_7: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __externref_drop_slice: (a: number, b: number) => void;
  readonly closure1342_externref_shim_multivalue_shim: (a: number, b: number, c: any) => [number, number];
  readonly closure2382_externref_shim: (a: number, b: number, c: any) => void;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h0e89cefb6390b03b: (a: number, b: number) => void;
  readonly closure3085_externref_shim: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_thread_destroy: (a?: number, b?: number, c?: number) => void;
  readonly __wbindgen_start: (a: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput, memory?: WebAssembly.Memory, thread_stack_size?: number }} module - Passing `SyncInitInput` directly is deprecated.
* @param {WebAssembly.Memory} memory - Deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput, memory?: WebAssembly.Memory, thread_stack_size?: number } | SyncInitInput, memory?: WebAssembly.Memory): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput>, memory?: WebAssembly.Memory, thread_stack_size?: number }} module_or_path - Passing `InitInput` directly is deprecated.
* @param {WebAssembly.Memory} memory - Deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path: { module_or_path: InitInput | Promise<InitInput>, memory?: WebAssembly.Memory, thread_stack_size?: number } | InitInput | Promise<InitInput>, memory?: WebAssembly.Memory): Promise<InitOutput>;
