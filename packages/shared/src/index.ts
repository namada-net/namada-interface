import { Proposal, Proposals } from "./borsh-schemas";
import { Query as RustQuery } from "./shared/shared";
export * from "./shared/shared";
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
  query_next_epoch_info = promiseWithTimeout(super.query_next_epoch_info.bind(this));
  query_block_header = promiseWithTimeout(super.query_block_header.bind(this));
}

export * from "./types";
export { Proposal, Proposals };
