import { Query as QueryWasm, Sdk as SdkWasm, TransferToEthereum } from "../../../wasm/src";
import { DatedViewingKey, TxResponseProps } from "../types";
import { Balance, DelegationTotals, DelegatorsVotes, GasCosts, MaspTokenRewards, StakingPositions, StakingTotals } from "./types";
/**
 * API for executing RPC requests with Namada
 */
export declare class Rpc {
    protected readonly sdk: SdkWasm;
    protected readonly query: QueryWasm;
    /**
     * @param sdk - Instance of Sdk struct from wasm lib
     * @param query - Instance of Query struct from wasm lib
     */
    constructor(sdk: SdkWasm, query: QueryWasm);
    /**
     * Query balances from chain
     * @async
     * @param owner - Owner address
     * @param tokens - Array of token addresses
     * @param chainId - Chain id needed to load specific context
     * @returns [[tokenAddress, amount]]
     */
    queryBalance(owner: string, tokens: string[], chainId: string): Promise<Balance>;
    /**
     * Query native token from chain
     * @async
     * @returns Address of native token
     */
    queryNativeToken(): Promise<string>;
    /**
     * Query public key
     * Return string of public key if it has been revealed on chain, otherwise, return null
     * @async
     * @param address - Address to query
     * @returns String of public key if found
     */
    queryPublicKey(address: string): Promise<string | undefined>;
    /**
     * Query all validator addresses
     * @async
     * @returns Array of all validator addresses
     */
    queryAllValidators(): Promise<string[]>;
    /**
     * Query total delegations
     * @async
     * @param owners - Array of owner addresses
     * @param [epoch] - delegations at epoch
     * @returns Promise resolving to total delegations
     */
    queryTotalDelegations(owners: string[], epoch?: bigint): Promise<DelegationTotals>;
    /**
     * Query delegators votes
     * @async
     * @param proposalId - ID of the proposal
     * @returns Promise resolving to delegators votes
     */
    queryDelegatorsVotes(proposalId: bigint): Promise<DelegatorsVotes>;
    /**
     * Query staking totals by owner addresses
     * @async
     * @param owners - Array of owner addresses
     * @returns Promise resolving to staking totals
     */
    queryStakingTotals(owners: string[]): Promise<StakingTotals[]>;
    /**
     * Query bond and unbond details by owner addresses
     * @async
     * @param owners - Array of owner addresses
     * @returns Promise resolving to staking positions
     */
    queryStakingPositions(owners: string[]): Promise<StakingPositions>;
    /**
     * Query total bonds by owner address
     * @param owner - Owner address
     * @returns Total bonds amount
     */
    queryTotalBonds(owner: string): Promise<number>;
    /**
     * Query pending transactions in the signed bridge pool
     * @async
     * @param owners - Array of owner addresses
     * @returns Promise resolving to pending ethereum transfers
     */
    querySignedBridgePool(owners: string[]): Promise<TransferToEthereum[]>;
    /**
     * Query gas costs
     * @async
     * @returns [[tokenAddress, gasCost]]
     */
    queryGasCosts(): Promise<GasCosts>;
    /**
     * Query code paths and their associated hash on chain
     * @async
     * @returns Object
     */
    queryChecksums(): Promise<Record<string, string>>;
    /**
     * Broadcast a Tx to the ledger
     * @async
     * @param signedTxBytes - Transaction with signature
     * @param [deadline] - timeout deadline in seconds, defaults to 60 seconds
     * @returns TxResponseProps object
     */
    broadcastTx(signedTxBytes: Uint8Array, deadline?: bigint): Promise<TxResponseProps>;
    /**
     * Sync the shielded context
     * @async
     * @param vks - Array of dated viewing keys
     * @param chainId - Chain ID to sync the shielded context for
     * @returns
     */
    shieldedSync(vks: DatedViewingKey[], chainId: string): Promise<void>;
    /**
     * Return shielded rewards for specific owner for the next masp epoch
     * @async
     * @param owner - Viewing key of an owner
     * @param chainId - Chain ID to load the context for
     * @returns amount in base units
     */
    shieldedRewards(owner: string, chainId: string): Promise<string>;
    /**
     * Return global shielded rewards per token
     * @async
     * @returns Array of MaspTokenRewards
     */
    globalShieldedRewardForTokens(): Promise<MaspTokenRewards[]>;
    /**
     * Return shielded rewards for specific owner and token for the next masp epoch
     * @async
     * @param owner - Viewing key of an owner
     * @param token - Token address
     * @param chainId - Chain ID to load the context for
     * @returns amount in base units
     */
    shieldedRewardsPerToken(owner: string, token: string, chainId: string): Promise<string>;
    /**
     * Simulate shielded rewards per token and amount in next epoch
     * @param chainId - Chain ID to load the context for
     * @param token - Token address
     * @param amount - Denominated amount
     * @returns amount in base units
     */
    simulateShieldedRewards(chainId: string, token: string, amount: string): Promise<string>;
}
