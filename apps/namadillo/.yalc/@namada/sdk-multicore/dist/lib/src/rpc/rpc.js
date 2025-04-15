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
import { deserialize } from "@dao-xyz/borsh";
import { DatedViewingKey as DatedViewingKeyWasm, } from "../../../wasm/src";
import { BroadcastTxError, TxResponseMsgValue, } from "../types";
/**
 * API for executing RPC requests with Namada
 */
export class Rpc {
    /**
     * @param sdk - Instance of Sdk struct from wasm lib
     * @param query - Instance of Query struct from wasm lib
     */
    constructor(sdk, query) {
        this.sdk = sdk;
        this.query = query;
    }
    /**
     * Query balances from chain
     * @async
     * @param owner - Owner address
     * @param tokens - Array of token addresses
     * @param chainId - Chain id needed to load specific context
     * @returns [[tokenAddress, amount]]
     */
    queryBalance(owner, tokens, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.query.query_balance(owner, tokens, chainId);
        });
    }
    /**
     * Query native token from chain
     * @async
     * @returns Address of native token
     */
    queryNativeToken() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.query.query_native_token();
        });
    }
    /**
     * Query public key
     * Return string of public key if it has been revealed on chain, otherwise, return null
     * @async
     * @param address - Address to query
     * @returns String of public key if found
     */
    queryPublicKey(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const pk = yield this.query.query_public_key(address);
            return pk;
        });
    }
    /**
     * Query all validator addresses
     * @async
     * @returns Array of all validator addresses
     */
    queryAllValidators() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.query.query_all_validator_addresses();
        });
    }
    /**
     * Query total delegations
     * @async
     * @param owners - Array of owner addresses
     * @param [epoch] - delegations at epoch
     * @returns Promise resolving to total delegations
     */
    queryTotalDelegations(owners, epoch) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.query.get_total_delegations(owners, epoch);
        });
    }
    /**
     * Query delegators votes
     * @async
     * @param proposalId - ID of the proposal
     * @returns Promise resolving to delegators votes
     */
    queryDelegatorsVotes(proposalId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.query.delegators_votes(proposalId);
        });
    }
    /**
     * Query staking totals by owner addresses
     * @async
     * @param owners - Array of owner addresses
     * @returns Promise resolving to staking totals
     */
    queryStakingTotals(owners) {
        return __awaiter(this, void 0, void 0, function* () {
            const stakingAmounts = yield this.query.query_my_validators(owners);
            return stakingAmounts.map(([owner, validator, bonds, unbonds, withdrawable,]) => {
                return {
                    owner,
                    validator,
                    bonds,
                    unbonds,
                    withdrawable,
                };
            });
        });
    }
    /**
     * Query bond and unbond details by owner addresses
     * @async
     * @param owners - Array of owner addresses
     * @returns Promise resolving to staking positions
     */
    queryStakingPositions(owners) {
        return __awaiter(this, void 0, void 0, function* () {
            const [bonds, unbonds] = yield this.query.query_staking_positions(owners);
            return {
                bonds: bonds.map(([owner, validator, amount, startEpoch]) => ({
                    owner,
                    validator,
                    amount,
                    startEpoch,
                })),
                unbonds: unbonds.map(([owner, validator, amount, startEpoch, withdrawableEpoch,]) => ({
                    owner,
                    validator,
                    amount,
                    startEpoch,
                    withdrawableEpoch,
                })),
            };
        });
    }
    /**
     * Query total bonds by owner address
     * @param owner - Owner address
     * @returns Total bonds amount
     */
    queryTotalBonds(owner) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.query.query_total_bonds(owner);
        });
    }
    /**
     * Query pending transactions in the signed bridge pool
     * @async
     * @param owners - Array of owner addresses
     * @returns Promise resolving to pending ethereum transfers
     */
    querySignedBridgePool(owners) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.query.query_signed_bridge_pool(owners);
        });
    }
    /**
     * Query gas costs
     * @async
     * @returns [[tokenAddress, gasCost]]
     */
    queryGasCosts() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.query.query_gas_costs();
        });
    }
    /**
     * Query code paths and their associated hash on chain
     * @async
     * @returns Object
     */
    queryChecksums() {
        return __awaiter(this, void 0, void 0, function* () {
            const wasmHashes = yield this.query.query_wasm_hashes();
            const checksums = wasmHashes.reduce((acc, { path, hash }) => {
                acc[path] = hash;
                return acc;
            }, {});
            return checksums;
        });
    }
    /**
     * Broadcast a Tx to the ledger
     * @async
     * @param signedTxBytes - Transaction with signature
     * @param [deadline] - timeout deadline in seconds, defaults to 60 seconds
     * @returns TxResponseProps object
     */
    broadcastTx(signedTxBytes_1) {
        return __awaiter(this, arguments, void 0, function* (signedTxBytes, deadline = BigInt(60)) {
            const response = yield this.sdk
                .broadcast_tx(signedTxBytes, deadline)
                .catch((e) => {
                throw new BroadcastTxError(e);
            });
            return deserialize(Buffer.from(response), TxResponseMsgValue);
        });
    }
    /**
     * Sync the shielded context
     * @async
     * @param vks - Array of dated viewing keys
     * @param chainId - Chain ID to sync the shielded context for
     * @returns
     */
    shieldedSync(vks, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            const datedViewingKeys = vks.map((vk) => new DatedViewingKeyWasm(vk.key, String(vk.birthday)));
            yield this.query.shielded_sync(datedViewingKeys, chainId);
        });
    }
    /**
     * Return shielded rewards for specific owner for the next masp epoch
     * @async
     * @param owner - Viewing key of an owner
     * @param chainId - Chain ID to load the context for
     * @returns amount in base units
     */
    shieldedRewards(owner, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sdk.shielded_rewards(owner, chainId);
        });
    }
    /**
     * Return global shielded rewards per token
     * @async
     * @returns Array of MaspTokenRewards
     */
    globalShieldedRewardForTokens() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.query.masp_reward_tokens()).map((rewardToken) => {
                const { name, address, max_reward_rate: maxRewardRate, kp_gain: kpGain, kd_gain: kdGain, locked_amount_target: lockedAmountTarget, } = rewardToken;
                return {
                    name,
                    address,
                    maxRewardRate,
                    kpGain,
                    kdGain,
                    lockedAmountTarget,
                };
            });
        });
    }
    /**
     * Return shielded rewards for specific owner and token for the next masp epoch
     * @async
     * @param owner - Viewing key of an owner
     * @param token - Token address
     * @param chainId - Chain ID to load the context for
     * @returns amount in base units
     */
    shieldedRewardsPerToken(owner, token, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sdk.shielded_rewards_per_token(owner, token, chainId);
        });
    }
    /**
     * Simulate shielded rewards per token and amount in next epoch
     * @param chainId - Chain ID to load the context for
     * @param token - Token address
     * @param amount - Denominated amount
     * @returns amount in base units
     */
    simulateShieldedRewards(chainId, token, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sdk.simulate_shielded_rewards(chainId, token, amount);
        });
    }
}
