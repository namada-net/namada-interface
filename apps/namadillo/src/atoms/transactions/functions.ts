import { DefaultApi } from "@namada/indexer-client";
import {
  IbcTransferMsgValue,
  NamadaKeychainAccount,
  ShieldedTransferMsgValue,
  ShieldingTransferMsgValue,
  TransparentTransferMsgValue,
  UnshieldingTransferMsgValue,
} from "@namada/types";
import { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { isShieldedAddress } from "App/Transfer/common";
import { fetchBlockTimestampByHeight } from "atoms/chain/services";
import BigNumber from "bignumber.js";
import { trackEvent } from "fathom-client";
import invariant from "invariant";
import { getDefaultStore } from "jotai";
import { TransactionPair } from "lib/query";
import { createTransferDataFromNamada } from "lib/transactions";
import {
  Asset,
  ChainRegistryEntry,
  IbcTransferTransactionData,
  NamadaTransferTxKind,
  TransferTransactionData,
} from "types";
import { toBaseAmount } from "utils";
import { TransactionHistory, transactionHistoryAtom } from "./atoms";

export const filterPendingTransactions = (
  tx: TransferTransactionData
): boolean => tx.status === "pending" || tx.status === "idle";

export const filterCompleteTransactions = (
  tx: TransferTransactionData
): boolean => tx.status === "success" || tx.status === "error";

export const searchAllStoredTxByHash = (
  hash: string
): TransferTransactionData | undefined => {
  const store = getDefaultStore();
  const fullTxHistory = store.get(transactionHistoryAtom);
  const allTxs = Object.values(fullTxHistory).flat();
  return allTxs.find((tx) => tx.hash === hash);
};

export const addTimestamps = async (
  api: DefaultApi,
  txs: TransactionHistory[]
): Promise<TransactionHistory[]> =>
  Promise.all(
    txs.map(async (tx) => {
      if (tx.timestamp) return tx;
      try {
        const timestamp = await fetchBlockTimestampByHeight(
          api,
          // @ts-expect-error – indexer type lacks blockHeight; patch later
          tx.blockHeight
        );
        return { ...tx, timestamp };
      } catch (err) {
        console.error("Failed to fetch block timestamp:", err);
        return tx;
      }
    })
  );

// All the state updaters we'll need for each transfer type
export interface TransferExecutionDependencies {
  setCurrentStatus: (status: string) => void;
  setCurrentStatusExplanation: (explanation: string) => void;
  setStatusExplanation: (explanation: string) => void;
  setGeneralErrorMessage: (message: string) => void;
  setTxHash: (hash: string) => void;
  setRefundTarget: (target: string) => void;
  setLedgerStatusStop: (stop: boolean) => void;
  storeTransaction: (
    tx: TransferTransactionData | IbcTransferTransactionData
  ) => void;
}

export interface IbcDepositParams {
  displayAmount: string;
  destinationAddress: string;
  sourceAddress: string;
  memo?: string;
  selectedAsset: Asset;
  chainId: string;
  keplrRegistry: ChainRegistryEntry;
  transferToNamada: UseMutationResult<
    TransferTransactionData,
    Error,
    {
      destinationAddress: string;
      displayAmount: BigNumber;
      memo?: string;
      onUpdateStatus?: (status: string) => void;
    }
  >;
}

export const executeIbcDeposit = async (
  params: IbcDepositParams,
  deps: TransferExecutionDependencies
): Promise<void> => {
  const {
    displayAmount,
    destinationAddress,
    sourceAddress,
    memo,
    keplrRegistry,
    transferToNamada,
  } = params;
  const { setCurrentStatus, setTxHash, storeTransaction } = deps;

  // IBC Deposit - Transfer to Namada from another chain
  invariant(keplrRegistry?.chain, "Error: Chain not selected");
  invariant(displayAmount, "Display amount is required");
  invariant(destinationAddress, "Destination address is required");

  setCurrentStatus("Submitting...");

  const result = await transferToNamada.mutateAsync({
    destinationAddress,
    displayAmount: BigNumber(displayAmount),
    memo,
    onUpdateStatus: setCurrentStatus,
  });

  storeTransaction(result);
  setTxHash(result.hash);
  trackEvent(
    `${isShieldedAddress(sourceAddress ?? "") ? "Shielded " : ""}IbcTransfer: tx submitted (${result.asset.symbol})`
  );
};

export interface IbcWithdrawParams {
  displayAmount: string;
  destinationAddress: string;
  sourceAddress: string;
  memo?: string;
  selectedAsset: Asset;
  chainId: string;
  sourceChannel: string;
  activeKeplrWalletAddress: string;
  shieldedAccount: NamadaKeychainAccount;
  transparentAccount: NamadaKeychainAccount;
  performWithdraw: (params: {
    signer: { publicKey: string; address: string };
    params: Array<{
      amountInBaseDenom: BigNumber;
      channelId: string;
      portId: string;
      token: string;
      source: string;
      receiver: string;
      gasSpendingKey?: string;
      memo?: string;
      refundTarget?: string;
    }>;
  }) => Promise<TransactionPair<IbcTransferMsgValue>>;
  genDisposableSigner: UseQueryResult<{ address: string } | undefined>;
  persistDisposableSigner: (target: string) => Promise<void>;
}

export const executeIbcWithdraw = async (
  params: IbcWithdrawParams,
  deps: TransferExecutionDependencies
): Promise<void> => {
  const {
    displayAmount,
    destinationAddress,
    sourceAddress,
    memo,
    selectedAsset,
    sourceChannel,
    activeKeplrWalletAddress,
    shieldedAccount,
    transparentAccount,
    performWithdraw,
    genDisposableSigner,
    persistDisposableSigner,
  } = params;
  const { setLedgerStatusStop, setRefundTarget } = deps;

  // IBC Withdraw - Transfer from Namada to another chain
  invariant(displayAmount, "Display amount is required");
  invariant(destinationAddress, "Destination address is required");
  invariant(sourceChannel, "No channel ID is set");
  invariant(activeKeplrWalletAddress, "No address is selected");
  invariant(shieldedAccount, "No shielded account is found");
  invariant(transparentAccount, "No transparent account is found");

  const amountInBaseDenom = toBaseAmount(
    selectedAsset,
    BigNumber(displayAmount)
  );
  const shielded = isShieldedAddress(sourceAddress ?? "");
  const source =
    shielded ? shieldedAccount.pseudoExtendedKey! : transparentAccount.address;
  const gasSpendingKey =
    shielded ? shieldedAccount.pseudoExtendedKey : undefined;
  const refundTarget = shielded ? genDisposableSigner.data?.address : undefined;

  setLedgerStatusStop(true);

  try {
    await performWithdraw({
      signer: {
        publicKey: transparentAccount.publicKey!,
        address: transparentAccount.address!,
      },
      params: [
        {
          amountInBaseDenom,
          channelId: sourceChannel.trim(),
          portId: "transfer",
          token: selectedAsset.address ?? "",
          source,
          receiver: destinationAddress,
          gasSpendingKey,
          memo,
          refundTarget,
        },
      ],
    });
  } finally {
    setLedgerStatusStop(false);
  }
};

export interface ShieldTransferParams {
  sourceAddress: string;
  memo?: string;
  selectedAsset: Asset;
  txKind: NamadaTransferTxKind;
  rpcUrl: string;
  performTransfer: (params: {
    memo?: string;
  }) => Promise<
    | TransactionPair<TransparentTransferMsgValue>
    | TransactionPair<ShieldedTransferMsgValue>
    | TransactionPair<ShieldingTransferMsgValue>
    | TransactionPair<UnshieldingTransferMsgValue>
  >;
}

export const executeShieldTransfer = async (
  params: ShieldTransferParams,
  deps: TransferExecutionDependencies
): Promise<void> => {
  const {
    sourceAddress,
    memo,
    selectedAsset,
    txKind,
    rpcUrl,
    performTransfer,
  } = params;
  const { setCurrentStatus, storeTransaction } = deps;

  // Shield transfer - Move assets to shielded pool
  invariant(sourceAddress, "Source address is not defined");

  setCurrentStatus("");

  const txResponse = await performTransfer({ memo });

  if (txResponse) {
    const txList = createTransferDataFromNamada(
      txKind,
      selectedAsset,
      rpcUrl,
      true, // isShielded = true
      txResponse,
      memo
    );

    if (txList.length === 0) {
      throw "Couldn't create TransferData object";
    }

    const tx = txList[0];
    storeTransaction(tx);
  } else {
    throw "Invalid transaction response";
  }
};

export interface UnshieldTransferParams {
  sourceAddress: string;
  memo?: string;
  selectedAsset: Asset;
  txKind: NamadaTransferTxKind;
  rpcUrl: string;
  performTransfer: (params: {
    memo?: string;
  }) => Promise<
    | TransactionPair<TransparentTransferMsgValue>
    | TransactionPair<ShieldedTransferMsgValue>
    | TransactionPair<ShieldingTransferMsgValue>
    | TransactionPair<UnshieldingTransferMsgValue>
  >;
}

export const executeUnshieldTransfer = async (
  params: UnshieldTransferParams,
  deps: TransferExecutionDependencies
): Promise<void> => {
  const {
    sourceAddress,
    memo,
    selectedAsset,
    txKind,
    rpcUrl,
    performTransfer,
  } = params;
  const { storeTransaction } = deps;

  // Unshield transfer - Move assets from shielded pool to transparent
  invariant(sourceAddress, "Source address is not defined");

  const txResponse = await performTransfer({ memo });

  if (txResponse) {
    const txList = createTransferDataFromNamada(
      txKind,
      selectedAsset,
      rpcUrl,
      false, // isShielded = false
      txResponse,
      memo
    );

    if (txList.length === 0) {
      throw "Couldn't create TransferData object";
    }

    const tx = txList[0];
    storeTransaction(tx);
  } else {
    throw "Invalid transaction response";
  }
};

export interface NamadaTransferParams {
  sourceAddress: string;
  customAddress: string;
  memo?: string;
  selectedAsset: Asset;
  txKind: NamadaTransferTxKind;
  rpcUrl: string;
  isTargetShielded: boolean;
  performTransfer: (params: {
    memo?: string;
  }) => Promise<
    | TransactionPair<TransparentTransferMsgValue>
    | TransactionPair<ShieldedTransferMsgValue>
    | TransactionPair<ShieldingTransferMsgValue>
    | TransactionPair<UnshieldingTransferMsgValue>
  >;
}

export const executeNamadaTransfer = async (
  params: NamadaTransferParams,
  deps: TransferExecutionDependencies
): Promise<void> => {
  const {
    sourceAddress,
    customAddress,
    memo,
    selectedAsset,
    txKind,
    rpcUrl,
    isTargetShielded,
    performTransfer,
  } = params;
  const { storeTransaction } = deps;

  // Internal Namada transfer between accounts
  invariant(sourceAddress, "Source address is not defined");
  invariant(customAddress, "Custom address is not defined");
  invariant(
    sourceAddress !== customAddress,
    "The recipient address must differ from the sender address"
  );

  const txResponse = await performTransfer({ memo });

  if (txResponse) {
    const txList = createTransferDataFromNamada(
      txKind,
      selectedAsset,
      rpcUrl,
      isTargetShielded,
      txResponse,
      memo
    );

    if (txList.length === 0) {
      throw "Couldn't create TransferData object";
    }

    const tx = txList[0];
    storeTransaction(tx);
    const shielded = isShieldedAddress(sourceAddress ?? "");
    trackEvent(`${shielded ? "Shielded" : "Transparent"} Transfer: complete`);
  } else {
    throw "Invalid transaction response";
  }
};
