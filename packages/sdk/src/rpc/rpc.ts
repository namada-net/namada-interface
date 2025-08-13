import { deserialize } from "@dao-xyz/borsh";
import {
  DatedViewingKey as DatedViewingKeyWasm,
  Query as QueryWasm,
  Sdk as SdkWasm,
  TransferToEthereum,
} from "@namada/shared";
import {
  BroadcastTxError,
  DatedViewingKey,
  TxResponseMsgValue,
  TxResponseProps,
} from "@namada/types";

import {
  Balance,
  BlockHeader,
  BondsResponse,
  DelegationTotals,
  DelegatorsVotes,
  GasCosts,
  MaspTokenRewards,
  NextEpochInfo,
  StakingPositions,
  StakingTotals,
  StakingTotalsResponse,
  UnbondsResponse,
  WasmHash,
} from "./types";

/**
 * API for executing RPC requests with Namada
 */
export class Rpc {
  /**
   * @param sdk - Instance of Sdk struct from wasm lib
   * @param query - Instance of Query struct from wasm lib
   */
  constructor(
    protected readonly sdk: SdkWasm,
    protected readonly query: QueryWasm
  ) { }

  /**
   * Query balances from chain
   * @async
   * @param owner - Owner address
   * @param tokens - Array of token addresses
   * @param chainId - Chain id needed to load specific context
   * @returns [[tokenAddress, amount]]
   */
  async queryBalance(
    owner: string,
    tokens: string[],
    chainId: string
  ): Promise<Balance> {
    return await this.query.query_balance(owner, tokens, chainId);
  }

  /**
   * Query native token from chain
   * @async
   * @returns Address of native token
   */
  async queryNativeToken(): Promise<string> {
    return await this.query.query_native_token();
  }

  /**
   * Query public key
   * Return string of public key if it has been revealed on chain, otherwise, return null
   * @async
   * @param address - Address to query
   * @returns String of public key if found
   */
  async queryPublicKey(address: string): Promise<string | undefined> {
    const pk = await this.query.query_public_key(address);
    return pk;
  }

  /**
   * Query all validator addresses
   * @async
   * @returns Array of all validator addresses
   */
  async queryAllValidators(): Promise<string[]> {
    return await this.query.query_all_validator_addresses();
  }

  /**
   * Query total delegations
   * @async
   * @param owners - Array of owner addresses
   * @param [epoch] - delegations at epoch
   * @returns Promise resolving to total delegations
   */
  async queryTotalDelegations(
    owners: string[],
    epoch?: bigint
  ): Promise<DelegationTotals> {
    return await this.query.get_total_delegations(owners, epoch);
  }

  /**
   * Query delegators votes
   * @async
   * @param proposalId - ID of the proposal
   * @returns Promise resolving to delegators votes
   */
  async queryDelegatorsVotes(proposalId: bigint): Promise<DelegatorsVotes> {
    return await this.query.delegators_votes(proposalId);
  }

  /**
   * Query staking totals by owner addresses
   * @async
   * @param owners - Array of owner addresses
   * @returns Promise resolving to staking totals
   */
  async queryStakingTotals(owners: string[]): Promise<StakingTotals[]> {
    const stakingAmounts = await this.query.query_my_validators(owners);
    return stakingAmounts.map(
      ([
        owner,
        validator,
        bonds,
        unbonds,
        withdrawable,
      ]: StakingTotalsResponse) => {
        return {
          owner,
          validator,
          bonds,
          unbonds,
          withdrawable,
        };
      }
    );
  }

  /**
   * Query bond and unbond details by owner addresses
   * @async
   * @param owners - Array of owner addresses
   * @returns Promise resolving to staking positions
   */
  async queryStakingPositions(owners: string[]): Promise<StakingPositions> {
    const [bonds, unbonds]: [BondsResponse[], UnbondsResponse[]] =
      await this.query.query_staking_positions(owners);

    return {
      bonds: bonds.map(
        ([owner, validator, amount, startEpoch]: BondsResponse) => ({
          owner,
          validator,
          amount,
          startEpoch,
        })
      ),
      unbonds: unbonds.map(
        ([
          owner,
          validator,
          amount,
          startEpoch,
          withdrawableEpoch,
        ]: UnbondsResponse) => ({
          owner,
          validator,
          amount,
          startEpoch,
          withdrawableEpoch,
        })
      ),
    };
  }

  /**
   * Query total bonds by owner address
   * @param owner - Owner address
   * @returns Total bonds amount
   */
  async queryTotalBonds(owner: string): Promise<number> {
    return await this.query.query_total_bonds(owner);
  }

  /**
   * Query pending transactions in the signed bridge pool
   * @async
   * @param owners - Array of owner addresses
   * @returns Promise resolving to pending ethereum transfers
   */
  async querySignedBridgePool(owners: string[]): Promise<TransferToEthereum[]> {
    return await this.query.query_signed_bridge_pool(owners);
  }

  /**
   * Query gas costs
   * @async
   * @returns [[tokenAddress, gasCost]]
   */
  async queryGasCosts(): Promise<GasCosts> {
    return await this.query.query_gas_costs();
  }

  /**
   * Query code paths and their associated hash on chain
   * @async
   * @returns Object
   */
  async queryChecksums(): Promise<Record<string, string>> {
    const wasmHashes: WasmHash[] = await this.query.query_wasm_hashes();
    const checksums = wasmHashes.reduce(
      (acc: Record<string, string>, { path, hash }: WasmHash) => {
        acc[path] = hash;
        return acc;
      },
      {} as Record<string, string>
    );

    return checksums;
  }

  /**
   * Query block header information
   * @async
   * @param height - Block height to query (optional, defaults to latest)
   * @returns Block header information
   * @throws Error when Rust WASM method is not yet implemented
   */
  async queryBlockHeader(height?: number): Promise<BlockHeader> {
    // Check if the method exists (will be available once Rust implementation is added)
    if (!(this.query as any).query_block_header) {
      throw new Error("query_block_header is not yet implemented in the Rust WASM layer");
    }

    const blockHeader = await (this.query as any).query_block_header(height || null) as any;

    // Type-safe parsing of the response
    if (!blockHeader || typeof blockHeader !== 'object') {
      throw new Error("Invalid block header response from Rust SDK");
    }

    return {
      height: Number(blockHeader.height),
      time: String(blockHeader.time),
      hash: String(blockHeader.hash),
      proposerAddress: String(blockHeader.proposer_address),
    };
  }

  /**
   * Get next epoch information including epoch number, min block height, and time until next epoch
   * @async
   * @returns Next epoch information with timing details
   * @throws Error when Rust WASM methods are not yet implemented
   */
  async getNextEpoch(): Promise<NextEpochInfo> {
    try {
      // Check if the methods exist (will be available once Rust implementation is added)
      if (!(this.query as any).query_next_epoch_info) {
        throw new Error("query_next_epoch_info is not yet implemented in the Rust WASM layer");
      }
      if (!(this.query as any).query_block_header) {
        throw new Error("query_block_header is not yet implemented in the Rust WASM layer");
      }

      // Get next epoch info from Rust SDK
      const nextEpochInfo = await (this.query as any).query_next_epoch_info() as any;

      // Get current block header to calculate timing
      const currentBlockHeader = await (this.query as any).query_block_header(null) as any;

      // Type-safe parsing of the responses
      if (!nextEpochInfo || typeof nextEpochInfo !== 'object') {
        throw new Error("Invalid next epoch info response from Rust SDK");
      }
      if (!currentBlockHeader || typeof currentBlockHeader !== 'object') {
        throw new Error("Invalid block header response from Rust SDK");
      }

      // Parse the response (structure will depend on Rust implementation)
      const nextEpoch = BigInt(nextEpochInfo.next_epoch);
      const minBlockHeight = Number(nextEpochInfo.min_block_height);
      const nextEpochTime = new Date(nextEpochInfo.next_epoch_time);
      const currentTime = new Date(currentBlockHeader.time);

      // Validate parsed data
      if (isNaN(minBlockHeight)) {
        throw new Error("Invalid min_block_height in next epoch info");
      }
      if (isNaN(nextEpochTime.getTime())) {
        throw new Error("Invalid next_epoch_time in next epoch info");
      }
      if (isNaN(currentTime.getTime())) {
        throw new Error("Invalid time in current block header");
      }

      // Calculate time until next epoch in seconds
      const minTimeUntilNextEpoch = Math.max(0, Math.floor((nextEpochTime.getTime() - currentTime.getTime()) / 1000));

      return {
        nextEpoch,
        minBlockHeight,
        minTimeUntilNextEpoch,
      };
    } catch (error) {
      throw new Error(`Failed to get next epoch information: ${error}`);
    }
  }

  /**
   * Broadcast a Tx to the ledger
   * @async
   * @param signedTxBytes - Transaction with signature
   * @param [deadline] - timeout deadline in seconds, defaults to 60 seconds
   * @returns TxResponseProps object
   */
  async broadcastTx(
    signedTxBytes: Uint8Array,
    deadline: bigint = BigInt(60)
  ): Promise<TxResponseProps> {
    const response = await this.sdk
      .broadcast_tx(signedTxBytes, deadline)
      .catch((e) => {
        throw new BroadcastTxError(e);
      });
    return deserialize(Buffer.from(response), TxResponseMsgValue);
  }

  /**
   * Sync the shielded context
   * @async
   * @param vks - Array of dated viewing keys
   * @param chainId - Chain ID to sync the shielded context for
   * @returns
   */
  async shieldedSync(vks: DatedViewingKey[], chainId: string): Promise<void> {
    const datedViewingKeys = vks.map(
      (vk) => new DatedViewingKeyWasm(vk.key, String(vk.birthday))
    );

    await this.query.shielded_sync(datedViewingKeys, chainId);
  }

  /**
   * Return shielded rewards for specific owner for the next masp epoch
   * @async
   * @param owner - Viewing key of an owner
   * @param chainId - Chain ID to load the context for
   * @returns amount in base units
   */
  async shieldedRewards(owner: string, chainId: string): Promise<string> {
    return await this.sdk.shielded_rewards(owner, chainId);
  }

  /**
   * Return global shielded rewards per token
   * @async
   * @returns Array of MaspTokenRewards
   */
  async globalShieldedRewardForTokens(): Promise<MaspTokenRewards[]> {
    return (await this.query.masp_reward_tokens()).map(
      (rewardToken: {
        name: string;
        address: string;
        max_reward_rate: number;
        kp_gain: number;
        kd_gain: number;
        locked_amount_target: number;
      }) => {
        const {
          name,
          address,
          max_reward_rate: maxRewardRate,
          kp_gain: kpGain,
          kd_gain: kdGain,
          locked_amount_target: lockedAmountTarget,
        } = rewardToken;
        return {
          name,
          address,
          maxRewardRate,
          kpGain,
          kdGain,
          lockedAmountTarget,
        };
      }
    );
  }

  /**
   * Return shielded rewards for specific owner and token for the next masp epoch
   * @async
   * @param owner - Viewing key of an owner
   * @param token - Token address
   * @param chainId - Chain ID to load the context for
   * @returns amount in base units
   */
  async shieldedRewardsPerToken(
    owner: string,
    token: string,
    chainId: string
  ): Promise<string> {
    return await this.sdk.shielded_rewards_per_token(owner, token, chainId);
  }

  /**
   * Simulate shielded rewards per token and amount in next epoch
   * @param chainId - Chain ID to load the context for
   * @param token - Token address
   * @param amount - Denominated amount
   * @returns amount in base units
   */
  async simulateShieldedRewards(
    chainId: string,
    token: string,
    amount: string
  ): Promise<string> {
    return await this.sdk.simulate_shielded_rewards(chainId, token, amount);
  }
}
