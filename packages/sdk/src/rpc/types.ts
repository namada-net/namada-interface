/**
 * StakingTotalsResponse
 * [owner, validator, bonds, unbonds, withdrawable]
 */
export type StakingTotalsResponse = [string, string, string, string, string];

/**
 * BondsResponse
 * [owner, validator, amount, startEpoch]
 */
export type BondsResponse = [string, string, string, string];

/**
 * UnbondsResponse:
 * [owner, validator, amount, startEpoch, withdrawableEpoch]
 */
export type UnbondsResponse = [string, string, string, string, string];

export type StakingTotals = {
  owner: string;
  validator: string;
  bonds: string;
  unbonds: string;
  withdrawable: string;
};

export type Bonds = {
  owner: string;
  validator: string;
  amount: string;
  startEpoch: string;
};

export type Unbonds = {
  owner: string;
  validator: string;
  amount: string;
  startEpoch: string;
  withdrawableEpoch: string;
};

export type StakingPositions = {
  bonds: Bonds[];
  unbonds: Unbonds[];
};

export type MaspTokenRewards = {
  name: string;
  address: string;
  maxRewardRate: number;
  kpGain: number;
  kdGain: number;
  lockedAmountTarget: number;
};

/**
 * DelegationTotals
 * Record<address, totalDelegations>
 */
export type DelegationTotals = Record<string, number>;

/**
 * Delegator Votes
 * Record<address, boolean>
 */
export type DelegatorsVotes = Record<string, boolean>;

/**
 * GasCosts
 * [tokenAddress, gasCost][]
 */
export type GasCosts = [string, string][];

/**
 * Balance
 * [tokenAddress, amount][]
 */
export type Balance = [string, string][];

/**
 * Wasm checksum hashes returned from shared package
 */
export type WasmHash = {
  path: string;
  hash: string;
};



/**
 * Next epoch information
 */
export type NextEpochInfo = {
  nextEpoch: bigint;
  minBlockHeight: number;
  minTimeUntilNextEpoch: number; // in seconds
};

/**
 * Block header information
 */
export type BlockHeader = {
  height: number;
  time: string;
  hash: string;
  proposerAddress: string;
};
