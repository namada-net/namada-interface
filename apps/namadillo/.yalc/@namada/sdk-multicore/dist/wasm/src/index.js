var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// @ts-nocheck
// TODO: How can we remove the above?
import { Proposal, Proposals } from "./borsh-schemas";
import { Query as RustQuery } from "./sdk/sdk";
export * from "./sdk/sdk";
export * from "./types";
export * from "./utils";
const DEFAULT_TIMEOUT = 60000;
const DEFAULT_OPTS = {
    timeout: DEFAULT_TIMEOUT,
    error: (timeout) => `Promise timed out after ${timeout} ms.`,
};
/**
 *  promiseWithTimeout - calls an async function with specified timeout
 */
const promiseWithTimeout = (fn, opts) => (...args) => {
    const { timeout, error } = Object.assign(Object.assign({}, DEFAULT_OPTS), opts);
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        const t = setTimeout(() => {
            reject(error(timeout));
        }, timeout);
        const res = yield fn(...args);
        clearTimeout(t);
        resolve(res);
    }));
};
//Fallbacks for rust panics
export class Query extends RustQuery {
    constructor() {
        super(...arguments);
        this.query_balance = super.query_balance.bind(this);
        this.query_epoch = promiseWithTimeout(super.query_epoch.bind(this));
        this.query_all_validator_addresses = promiseWithTimeout(super.query_all_validator_addresses.bind(this));
        this.query_my_validators = promiseWithTimeout(super.query_my_validators.bind(this));
        this.query_total_bonds = promiseWithTimeout(super.query_total_bonds.bind(this));
        this.delegators_votes = promiseWithTimeout(super.delegators_votes.bind(this));
        this.get_total_delegations = promiseWithTimeout(super.get_total_delegations.bind(this));
    }
}
export * from "./types";
export { Proposal, Proposals };
