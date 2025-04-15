import { Proposal, Proposals } from "./borsh-schemas";
import { Query as RustQuery } from "./sdk/sdk";
export * from "./sdk/sdk";
export * from "./types";
export * from "./utils";
export declare class Query extends RustQuery {
    query_balance: (owner: string, tokens: any[], chain_id: string) => Promise<any>;
    query_epoch: () => Promise<bigint>;
    query_all_validator_addresses: () => Promise<any>;
    query_my_validators: (owner_addresses: any[]) => Promise<any>;
    query_total_bonds: (address: string) => Promise<any>;
    delegators_votes: (proposal_id: bigint) => Promise<any>;
    get_total_delegations: (addresses: any[], epoch?: bigint | null | undefined) => Promise<any>;
}
export * from "./types";
export { Proposal, Proposals };
