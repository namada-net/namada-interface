import {
  IbcTransferProps,
  SdkWasmOptions,
  ShieldedTransferProps,
  ShieldingTransferProps,
  TxResponseProps,
  UnshieldingTransferProps,
} from "@namada/sdk-multicore";
import { Account } from "@namada/types";
import BigNumber from "bignumber.js";
import { EncodedTxData, TransactionPair } from "lib/query";
import { ChainSettings, GasConfig } from "types";
import { WebWorkerMessage } from "./utils";

export type Init = WebWorkerMessage<"init", SdkWasmOptions>;
export type InitDone = WebWorkerMessage<"init-done", null>;

type ShieldPayload = {
  account: Account;
  gasConfig: GasConfig;
  props: ShieldingTransferProps[];
  chain: ChainSettings;
  publicKeyRevealed: boolean;
  memo?: string;
};
export type Shield = WebWorkerMessage<"shield", ShieldPayload>;
export type ShieldDone = WebWorkerMessage<
  "shield-done",
  EncodedTxData<ShieldingTransferProps>
>;

type UnshieldPayload = {
  account: Account;
  gasConfig: GasConfig;
  props: UnshieldingTransferProps[];
  chain: ChainSettings;
  memo?: string;
  maspFeePaymentProps?: UnshieldingTransferProps & { memo: string }; // Optional masp fee payment properties
};
export type Unshield = WebWorkerMessage<"unshield", UnshieldPayload>;
export type UnshieldDone = WebWorkerMessage<
  "unshield-done",
  EncodedTxData<UnshieldingTransferProps>
>;

type ShieldedTransferPayload = {
  account: Account;
  gasConfig: GasConfig;
  props: ShieldedTransferProps[];
  chain: ChainSettings;
  memo?: string;
  maspFeePaymentProps?: UnshieldingTransferProps & { memo: string }; // Optional masp fee payment properties
};
export type ShieldedTransfer = WebWorkerMessage<
  "shielded-transfer",
  ShieldedTransferPayload
>;
export type ShieldedTransferDone = WebWorkerMessage<
  "shielded-transfer-done",
  EncodedTxData<ShieldedTransferProps>
>;

type IbcTransferPayload = {
  account: Account;
  gasConfig: GasConfig;
  props: IbcTransferProps[];
  chain: ChainSettings;
  memo?: string;
  publicKeyRevealed: boolean;
};
export type IbcTransfer = WebWorkerMessage<"ibc-transfer", IbcTransferPayload>;
export type IbcTransferDone = WebWorkerMessage<
  "ibc-transfer-done",
  EncodedTxData<IbcTransferProps>
>;

type GenerateIbcShieldingMemoPayload = {
  target: string;
  token: string;
  amount: BigNumber;
  destinationChannelId: string;
  chainId: string;
};
export type GenerateIbcShieldingMemo = WebWorkerMessage<
  "generate-ibc-shielding-memo",
  GenerateIbcShieldingMemoPayload
>;
export type GenerateIbcShieldingMemoDone = WebWorkerMessage<
  "generate-ibc-shielding-memo-done",
  string
>;

type ShieldedRewardsPayload = {
  viewingKey: string;
  chainId: string;
};
export type ShieldedRewards = WebWorkerMessage<
  "shielded-rewards",
  ShieldedRewardsPayload
>;
export type ShieldedRewardsDone = WebWorkerMessage<
  "shielded-rewards-done",
  string
>;

type ShieldedRewardsPerTokenPayload = {
  viewingKey: string;
  tokens: string[];
  chainId: string;
};
export type ShieldedRewardsPerToken = WebWorkerMessage<
  "shielded-rewards-per-token",
  ShieldedRewardsPerTokenPayload
>;
export type ShieldedRewardsPerTokenDone = WebWorkerMessage<
  "shielded-rewards-per-token-done",
  Record<string, BigNumber>
>;

type BroadcastPayload = TransactionPair<unknown>;

export type Broadcast = WebWorkerMessage<"broadcast", BroadcastPayload>;
export type BroadcastDone = WebWorkerMessage<
  "broadcast-done",
  TxResponseProps[]
>;
