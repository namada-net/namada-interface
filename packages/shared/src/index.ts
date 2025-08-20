import { Proposal, Proposals } from "./borsh-schemas";
import { Query as RustQuery } from "./shared/shared.js";
export * from "./shared/shared.js";
export * from "./types";

type TimeoutOpts = {
  // Timeout in milliseconds
  timeout?: number;
  // Error message
  error?: (timeout: number) => string;
};

const DEFAULT_TIMEOUT = 60000;

const DEFAULT_OPTS: Required<TimeoutOpts> = {
  timeout: DEFAULT_TIMEOUT,
  error: (timeout) => `Promise timed out after ${timeout} ms.`,
};

/**
 *  promiseWithTimeout - calls an async function with specified timeout
 */
const promiseWithTimeout =
  <U extends unknown[], T>(
    fn: (...args: U) => Promise<T>,
    opts?: TimeoutOpts
  ) =>
  (...args: U): Promise<T> => {
    const { timeout, error } = { ...DEFAULT_OPTS, ...opts };

    return new Promise(async (resolve, reject) => {
      const t = setTimeout(() => {
        reject(error(timeout));
      }, timeout);

      const res = await fn(...args);
      clearTimeout(t);
      resolve(res);
    });
  };

//Fallbacks for rust panics
export class Query extends RustQuery {
  query_balance = super.query_balance.bind(this);
  query_epoch = promiseWithTimeout(super.query_epoch.bind(this));
  query_all_validator_addresses = promiseWithTimeout(
    super.query_all_validator_addresses.bind(this)
  );
  query_my_validators = promiseWithTimeout(
    super.query_my_validators.bind(this)
  );
  query_total_bonds = promiseWithTimeout(super.query_total_bonds.bind(this));
  delegators_votes = promiseWithTimeout(super.delegators_votes.bind(this));
  get_total_delegations = promiseWithTimeout(
    super.get_total_delegations.bind(this)
  );
  query_native_token = promiseWithTimeout(super.query_native_token.bind(this));
  query_public_key = promiseWithTimeout(super.query_public_key.bind(this));
  query_staking_positions = promiseWithTimeout(
    super.query_staking_positions.bind(this)
  );
  query_signed_bridge_pool = promiseWithTimeout(
    super.query_signed_bridge_pool.bind(this)
  );
  query_gas_costs = promiseWithTimeout(super.query_gas_costs.bind(this));
  query_wasm_hashes = promiseWithTimeout(super.query_wasm_hashes.bind(this));
  shielded_sync = promiseWithTimeout(super.shielded_sync.bind(this));
  masp_reward_tokens = promiseWithTimeout(super.masp_reward_tokens.bind(this));
}

export * from "./types";
export { Proposal, Proposals };
