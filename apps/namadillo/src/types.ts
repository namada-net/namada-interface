import {
  AssetList,
  Chain,
  Asset as ChainRegistryAsset,
  IBCInfo,
} from "@chain-registry/types";
import { ValidatorStatus } from "@namada/indexer-client";
import { ClaimRewardsMsgValue } from "@namada/sdk-multicore";
import { Account, ChainKey, ExtensionKey } from "@namada/types";
import { MutationStatus } from "@tanstack/query-core";
import BigNumber from "bignumber.js";
import { TxKind } from "types/txKind";

declare module "*.module.css" {
  const content: Record<string, string>;
  //@ts-expect-error Ignoring duplicate name 'class' error
  export default content;
}

// TODO: can we remove this Unique type? We shouldn't be using uuids anywhere
type Unique = {
  uuid: string;
};

export type PublicKey = string;

export type Address = string;

export type BaseDenom = string;

export type ChainId = string;

export type GasLimit = BigNumber;

export type GasPrice = BigNumber;

// For Namada chain, it should be the address. For Ibc, it should be the base denom
export type GasToken = Address | BaseDenom;

export type AddressBalance = Record<Address, BigNumber>;

export type GasConfig = {
  gasLimit: GasLimit;
  gasPriceInMinDenom: GasPrice;
  gasToken: GasToken;
};

export type GasConfigToDisplay = {
  totalDisplayAmount: BigNumber;
  asset: Asset;
};

export type TxGas = Record<Address, GasLimit>;

export type GasTable = Record<TxKind, TxGas>;

export type ChainSettings = {
  id: ChainKey;
  bench32Prefix: string;
  nativeTokenAddress: Address;
  rpcUrl: string;
  chainId: string;
  extensionId: ExtensionKey;
  checksums: Record<string, string>;
};

export type SettingsTomlOptions = {
  indexer_url?: string;
  masp_indexer_url?: string;
  rpc_url?: string;
  localnet_enabled?: boolean;
  fathom_site_id?: string;
};

export type ChainParameters = {
  apr: BigNumber;
  chainId: string;
  nativeTokenAddress: Address;
  unbondingPeriod: string;
  checksums: Record<string, string>;
  maxBlockTime: number;
};

export type SettingsStorage = {
  version: string;
  rpcUrl?: string;
  indexerUrl: string;
  maspIndexerUrl?: string;
  signArbitraryEnabled: boolean;
  advancedMode?: boolean;
};

export type RpcStorage = {
  address: string;
  index: number;
};

export type Validator = Unique & {
  alias?: string;
  address: Address;
  description?: string;
  homepageUrl?: string;
  expectedApr: BigNumber;
  unbondingPeriod: string;
  votingPowerInNAM?: BigNumber;
  votingPowerPercentage?: number;
  commission: BigNumber;
  imageUrl?: string;
  status: ValidatorStatus;
};

export type ValidatorFilterOptions = "all" | "active" | ValidatorStatus;

export type UnbondEntry = {
  amount: BigNumber;
  withdrawEpoch: string;
  withdrawTime: string;
  canWithdraw: boolean;
  timeLeft?: string;
};

export type BondEntry = {
  amount: BigNumber;
};

export type MyValidator = {
  stakedAmount?: BigNumber;
  unbondedAmount?: BigNumber;
  withdrawableAmount?: BigNumber;
  validator: Validator;
  bondItems: BondEntry[];
  unbondItems: UnbondEntry[];
};

export type StakingTotals = {
  totalBonded: BigNumber;
  totalUnbonded: BigNumber;
  totalWithdrawable: BigNumber;
};

export type ChangeInStakingProps = {
  account: Account;
  changes: ChangeInStakingPosition[];
  gasConfig: GasConfig;
};

export type ChangeInStakingPosition = {
  validatorId: Address;
  amount: BigNumber;
};

export type RedelegateChangesProps = {
  account: Account;
  changes: RedelegateChange[];
  gasConfig: GasConfig;
};

export type RedelegateChange = {
  sourceValidator: Address;
  destinationValidator: Address;
  amount: BigNumber;
};

export type ClaimRewardsProps = {
  account: Account;
  params: ClaimRewardsMsgValue[];
  gasConfig: GasConfig;
};

export type Signer = {
  publicKey: string;
  address: string;
};

export type BuildTxAtomParams<T> = {
  account: Account;
  params: T[];
  gasConfig: GasConfig;
  memo?: string;
  signer?: Signer;
};

export type SortOptions = "asc" | "desc" | undefined;

export type SortedColumnPair<T> = [id: T, SortOptions] | undefined;

export type ToastNotification = {
  id: string;
  type: "pending" | "success" | "partialSuccess" | "error";
  title: React.ReactNode;
  description: React.ReactNode;
  failedDescription?: React.ReactNode;
  details?: React.ReactNode;
  timeout?: number;
};

export type ToastNotificationEntryFilter = (
  notification: ToastNotification
) => boolean;

export type WalletProvider = {
  id: ExtensionKey;
  name: string;
  iconUrl: string;
  downloadUrl: {
    chrome: string;
    firefox: string;
  };
};

export type ChainRegistryEntry = {
  assets: AssetList;
  chain: Chain;
  ibc?: IBCInfo[];
};

export type NamadaChainRegistryEntry = ChainRegistryEntry & {
  assets: AssetList & { assets: NamadaAsset[] };
};

export type Asset = ChainRegistryAsset;

// Namada assets should always have address field defined
export type NamadaAsset = Asset & { address: Address };

export type AssetWithAmount = {
  asset: Asset;
  amount: BigNumber;
};

export type NamadaAssetWithAmount = {
  asset: NamadaAsset;
  amount: BigNumber;
};

export type AssetWithMinDenomAmount = {
  asset: Asset;
  minDenomAmount: BigNumber;
};

export type Coin = {
  denom: string;
  minDenomAmount: string;
};

export type TokenBalance = {
  address: Address;
  asset: Asset;
  amount: BigNumber;
  dollar?: BigNumber;
};

export type IbcChannels = {
  namadaChannel: string;
  ibcChannel: string;
};

export enum TransferStep {
  Sign = "sign",
  ZkProof = "zk-proof",
  TransparentToShielded = "transparent-to-shielded",
  ShieldedToTransparent = "shielded-to-transparent",
  TransparentToTransparent = "transparent-to-transparent",
  ShieldedToShielded = "shielded-to-shielded",
  IbcWithdraw = "ibc-withdraw",
  IbcToShielded = "ibc-to-shielded",
  IbcToTransparent = "ibc-to-transparent",
  WaitingConfirmation = "waiting-confirmation",
  Complete = "complete",
}

// Defines the steps in the Namada <> Namada transfer progress for tracking transaction stages.
export const namadaTransferStages = {
  TransparentToShielded: [
    TransferStep.ZkProof,
    TransferStep.Sign,
    TransferStep.TransparentToShielded,
    TransferStep.Complete,
  ] as const,
  ShieldedToTransparent: [
    TransferStep.ZkProof,
    TransferStep.Sign,
    TransferStep.ShieldedToTransparent,
    TransferStep.Complete,
  ] as const,
  ShieldedToShielded: [
    TransferStep.ZkProof,
    TransferStep.Sign,
    TransferStep.ShieldedToShielded,
    TransferStep.Complete,
  ] as const,
  TransparentToTransparent: [
    TransferStep.ZkProof,
    TransferStep.Sign,
    TransferStep.TransparentToTransparent,
    TransferStep.Complete,
  ] as const,
};

// Defines the steps in the IBC <> Namada transfer progress for tracking transaction stages.
export const ibcTransferStages = {
  ShieldedToIbc: [
    TransferStep.Sign,
    TransferStep.IbcWithdraw,
    TransferStep.WaitingConfirmation,
    TransferStep.Complete,
  ] as const,
  TransparentToIbc: [
    TransferStep.Sign,
    TransferStep.IbcWithdraw,
    TransferStep.WaitingConfirmation,
    TransferStep.Complete,
  ] as const,
  IbcToShielded: [
    TransferStep.Sign,
    TransferStep.ZkProof,
    TransferStep.IbcToShielded,
    TransferStep.WaitingConfirmation,
    TransferStep.Complete,
  ] as const,
  IbcToTransparent: [
    TransferStep.Sign,
    TransferStep.IbcToTransparent,
    TransferStep.WaitingConfirmation,
    TransferStep.Complete,
  ] as const,
};

export const allTransferStages = {
  ...namadaTransferStages,
  ...ibcTransferStages,
};

export const transferPossibleStages = [
  ...new Set(Object.values(allTransferStages).flat()),
] as const;

type NamadaTransferStages = typeof namadaTransferStages;
type IbcTransferStages = typeof ibcTransferStages;
export type AllTransferStages = typeof allTransferStages;

export type NamadaTransferTxKind = keyof NamadaTransferStages;

export type IbcTransferTxKind = keyof IbcTransferStages;

export type AllTransferTxKind = NamadaTransferTxKind | IbcTransferTxKind;

export type NamadaTransferStage = {
  [P in NamadaTransferTxKind]: {
    type: P;
    currentStep: TransferStep;
  };
}[NamadaTransferTxKind];

export type IbcTransferStage = {
  [P in IbcTransferTxKind]: {
    type: P;
    currentStep: TransferStep;
  };
}[IbcTransferTxKind];

export type TransferStage = IbcTransferStage | NamadaTransferStage;

export type BaseTransferTransaction = TransferStage & {
  rpc: string;
  asset: Asset;
  hash: string;
  innerHash: string;
  displayAmount: BigNumber;
  chainId: string;
  sourceAddress: string;
  destinationAddress: string;
  destinationChainId?: string;
  feePaid?: BigNumber;
  tipPaid?: BigNumber;
  resultTxHash?: string;
  errorMessage?: string;
  memo?: string;
  status: MutationStatus;
  shielded?: boolean;
  createdAt: Date;
  updatedAt: Date;
  timestamp?: number;
};

export type IbcTransferTransactionData = BaseTransferTransaction & {
  type: IbcTransferTxKind;
  sequence: BigNumber;
  sourceChannel: string;
  destinationChannel?: string;
  sourcePort: string;
  destinationChainId: string;
};

export type TransferTransactionData =
  | BaseTransferTransaction
  | IbcTransferTransactionData;

export type PartialTransferTransactionData = Partial<TransferTransactionData> &
  Pick<TransferTransactionData, "type" | "chainId" | "asset">;

export type ChainStatus = {
  height: number;
  epoch: number;
};

export type LocalnetToml = {
  chain_id: string;
  token_address: string;
  chain_1_channel: string;
  chain_2_channel: string;
};

export type LedgerAccountInfo = {
  deviceConnected: boolean;
  errorMessage: string;
};

export type MaspAssetRewards = {
  asset: Asset;
  address: Address | undefined;
  kdGain: BigNumber;
  kpGain: BigNumber;
  lockedAmountTarget: BigNumber;
  maxRewardRate: BigNumber;
};
