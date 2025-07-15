import { IbcTransferMsgValue, NamadaKeychainAccount } from "@namada/types";
import { isShieldedAddress } from "App/Transfer/common";
import { disposableSignerAtom } from "atoms/accounts";
import { chainAtom } from "atoms/chain";
import { createIbcTxAtom } from "atoms/transfer/atoms";
import {
  clearDisposableSigner,
  persistDisposableSigner,
} from "atoms/transfer/services";
import { BigNumber } from "bignumber.js";
import { trackEvent } from "fathom-client";
import { useIbcTransaction } from "hooks/useIbcTransaction";
import { useTransaction } from "hooks/useTransaction";
import { useTransactionActions } from "hooks/useTransactionActions";
import { useTransfer } from "hooks/useTransfer";
import invariant from "invariant";
import { useAtomValue } from "jotai";
import { TransactionPair } from "lib/query";
import { createTransferDataFromNamada } from "lib/transactions";
import { useCallback } from "react";
import {
  Asset,
  ChainRegistryEntry,
  GasConfig,
  IbcTransferTransactionData,
  TransferStep,
} from "types";
import { toBaseAmount, toDisplayAmount } from "utils";
import { TransactionFeeProps } from "./useTransactionFee";

export type TransferType =
  | "ibc-deposit"
  | "ibc-withdraw"
  | "shield"
  | "unshield"
  | "namada-transfer";

export interface OnSubmitTransferParams {
  displayAmount: string;
  destinationAddress: string;
  sourceAddress: string;
  memo?: string;
}

export interface UseTransactionResolverReturn {
  submitTransfer: (params: OnSubmitTransferParams) => Promise<void>;
  isPending: boolean;
  isSuccess: boolean;
  error: Error | undefined;
  feeProps: TransactionFeeProps | undefined;
  ibcGasConfig: GasConfig | undefined;
  completedAt: Date | undefined;
  redirectToTransactionPage: () => void;
}

export interface UseTransactionResolverProps {
  // Asset and chain info
  selectedAsset: { asset: Asset } | undefined;
  chainId: string | undefined;
  rpcUrl: string;

  // Addresses and accounts
  sourceAddress: string | undefined;
  destinationAddress: string | undefined;
  customAddress: string | undefined;
  shieldedAccount: NamadaKeychainAccount | undefined;
  transparentAccount: NamadaKeychainAccount | undefined;
  activeKeplrWalletAddress: string | undefined;

  // IBC specific
  keplrRegistry: ChainRegistryEntry;
  sourceChannel: string | undefined;
  destinationChannel: string | undefined;

  // Transfer specific
  displayAmount: BigNumber | undefined;
  isTargetShielded: boolean;
  isSourceShielded: boolean;
  isShielding: boolean;
  isUnshielding: boolean;

  // Status setters
  setCurrentStatus: (status: string | undefined) => void;
  setCurrentStatusExplanation: (explanation: string) => void;
  setStatusExplanation: (explanation: string) => void;
  setGeneralErrorMessage: (message: string) => void;
  setTxHash: (hash: string) => void;
  setRefundTarget: (target: string) => void;
  setLedgerStatusStop: (stop: boolean) => void;

  // Additional functions
  determineTransferType: (params: {
    destinationAddress: string;
    sourceAddress: string;
  }) => TransferType;
}

export const useTransactionResolver = ({
  selectedAsset,
  chainId,
  rpcUrl,
  sourceAddress,
  destinationAddress,
  customAddress,
  shieldedAccount,
  transparentAccount,
  activeKeplrWalletAddress,
  keplrRegistry,
  sourceChannel,
  destinationChannel,
  displayAmount,
  isTargetShielded,
  isSourceShielded,
  isShielding,
  isUnshielding,
  setCurrentStatus,
  setCurrentStatusExplanation,
  setStatusExplanation,
  setGeneralErrorMessage,
  setTxHash,
  setRefundTarget,
  setLedgerStatusStop,
  determineTransferType,
}: UseTransactionResolverProps): UseTransactionResolverReturn => {
  const { storeTransaction } = useTransactionActions();
  const { refetch: genDisposableSigner } = useAtomValue(disposableSignerAtom);
  const namadaChain = useAtomValue(chainAtom);
  const alias = shieldedAccount?.alias ?? transparentAccount?.alias;

  // Local function to store IBC transfer transaction
  const storeTransferTransaction = (
    tx: TransactionPair<IbcTransferMsgValue>,
    displayAmount: BigNumber,
    destinationChainId: string,
    asset: Asset,
    shielded: boolean
  ): IbcTransferTransactionData => {
    const props = tx.encodedTxData.meta?.props[0];
    invariant(props, "Invalid transaction data");

    const transferTransaction: IbcTransferTransactionData = {
      hash: tx.encodedTxData.txs[0].hash,
      innerHash: tx.encodedTxData.txs[0].innerTxHashes[0].toLowerCase(),
      currentStep: TransferStep.WaitingConfirmation,
      rpc: "",
      type: shielded ? "ShieldedToIbc" : "TransparentToIbc",
      status: "pending",
      sourcePort: "transfer",
      asset,
      chainId: namadaChain.data?.chainId || "",
      destinationChainId,
      memo: tx.encodedTxData.wrapperTxProps.memo || props.memo,
      displayAmount,
      shielded,
      sourceAddress: shielded ? `${alias} - shielded` : props.source,
      sourceChannel: props.channelId,
      destinationAddress: props.receiver,
      createdAt: new Date(),
      updatedAt: new Date(),
      sequence: new BigNumber(0),
    };

    storeTransaction(transferTransaction);
    return transferTransaction;
  };

  // Used for IBC Transfers
  const { transferToNamada, gasConfig: ibcGasConfig } = useIbcTransaction({
    registry: keplrRegistry,
    sourceAddress,
    sourceChannel,
    destinationChannel,
    shielded: isShieldedAddress(sourceAddress ?? ""),
    selectedAsset: selectedAsset?.asset,
  });

  // Used for IBC Withdrawals
  const {
    execute: performWithdraw,
    feeProps,
    error,
    isPending,
    isSuccess,
  } = useTransaction({
    eventType: "IbcTransfer",
    createTxAtom: createIbcTxAtom,
    params: [],
    useDisposableSigner: isShieldedAddress(sourceAddress ?? ""),
    parsePendingTxNotification: () => ({
      title: "IBC withdrawal transaction in progress",
      description: "Your IBC transaction is being processed",
    }),
    parseErrorTxNotification: () => ({
      title: "IBC withdrawal failed",
      description: "",
    }),
    onBeforeBuildTx: () => {
      setCurrentStatus("Creating IBC transaction...");
    },
    onBeforeSign: () => {
      setCurrentStatus("Waiting for signature...");
    },
    onBeforeBroadcast: async (tx) => {
      const shielded = isShieldedAddress(sourceAddress ?? "");
      const props = tx.encodedTxData.meta?.props[0];
      if (shielded && props) {
        const refundTarget = props.refundTarget;
        invariant(refundTarget, "Refund target is not provided");

        await persistDisposableSigner(refundTarget);
        setRefundTarget(refundTarget);
      }

      setCurrentStatus("Broadcasting transaction to Namada...");
    },
    onBroadcasted: (tx) => {
      setCurrentStatus("Waiting for confirmation from target chain...");
      setStatusExplanation(
        "This step may take a few minutes, depending on the current workload of the IBC relayers."
      );

      const props = tx.encodedTxData.meta?.props[0];
      invariant(props, "EncodedTxData not provided");
      invariant(selectedAsset, "Selected asset is not defined");
      invariant(chainId, "Chain ID is not provided");
      const displayAmount = toDisplayAmount(
        selectedAsset.asset,
        props.amountInBaseDenom
      );
      const ibcTxData = storeTransferTransaction(
        tx,
        displayAmount,
        chainId,
        selectedAsset.asset,
        isShieldedAddress(sourceAddress ?? "")
      );
      setTxHash(ibcTxData.hash);
      const shielded = isShieldedAddress(sourceAddress ?? "");
      trackEvent(`${shielded ? "Shielded " : ""}IbcWithdraw: tx submitted`);
    },
    onError: async (err, context) => {
      setGeneralErrorMessage(String(err));
      setCurrentStatus("");
      setStatusExplanation("");

      // Clear disposable signer if the transaction failed on Namada side
      // We do not want to clear the disposable signer if the transaction failed on the target chain
      const refundTarget = context?.encodedTxData.meta?.props[0].refundTarget;
      const shielded = isShieldedAddress(sourceAddress ?? "");
      if (shielded && refundTarget) {
        await clearDisposableSigner(refundTarget);
      }
    },
  });

  // Used for Shielding/Unshielding/Transparent Transfers
  const {
    execute: performTransfer,
    isPending: isPerformingTransfer,
    isSuccess: isTransferSuccess,
    error: transferError,
    txKind,
    feeProps: transferFeeProps,
    completedAt,
    redirectToTransactionPage,
  } = useTransfer({
    source: sourceAddress ?? "",
    target: destinationAddress ?? "",
    token: selectedAsset?.asset.address ?? "",
    displayAmount: displayAmount ?? new BigNumber(0),
    onUpdateStatus: setCurrentStatus,
    onBeforeBuildTx: () => {
      if (isSourceShielded) {
        setCurrentStatus("Generating MASP Parameters...");
        setCurrentStatusExplanation(
          "Generating MASP parameters can take a few seconds. Please wait..."
        );
      } else {
        setCurrentStatus("Preparing transaction...");
        setCurrentStatusExplanation("");
      }
    },
    onBeforeSign: () => {
      setCurrentStatus("Waiting for signature...");
      setCurrentStatusExplanation("");
    },
    onBeforeBroadcast: async () => {
      let broadcastMessage = "Broadcasting transaction to Namada...";
      if (isShielding) {
        broadcastMessage = "Broadcasting Shielding transaction...";
      } else if (isUnshielding) {
        broadcastMessage = "Broadcasting unshielding transaction...";
      }
      setCurrentStatus(broadcastMessage);
      setCurrentStatusExplanation("");
    },
    onError: async (originalError) => {
      setCurrentStatus("");
      setCurrentStatusExplanation("");
      setGeneralErrorMessage((originalError as Error).message);
    },
    asset: selectedAsset?.asset,
  });

  const onSubmitTransfer = useCallback(
    async (
      params: OnSubmitTransferParams,
      transferType: TransferType
    ): Promise<void> => {
      const { displayAmount, destinationAddress, sourceAddress, memo } = params;

      try {
        // Common error state reset
        setGeneralErrorMessage("");

        // Common validations
        invariant(selectedAsset, "No asset is selected");
        invariant(chainId, "Chain ID is undefined");

        switch (transferType) {
          case "ibc-deposit": {
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
            break;
          }

          case "ibc-withdraw": {
            // IBC Withdraw - Transfer from Namada to another chain
            invariant(displayAmount, "Display amount is required");
            invariant(destinationAddress, "Destination address is required");
            invariant(sourceChannel, "No channel ID is set");
            invariant(activeKeplrWalletAddress, "No address is selected");
            invariant(shieldedAccount, "No shielded account is found");
            invariant(transparentAccount, "No transparent account is found");

            const amountInBaseDenom = toBaseAmount(
              selectedAsset.asset,
              BigNumber(displayAmount)
            );
            const shielded = isShieldedAddress(sourceAddress ?? "");
            const source =
              shielded ?
                shieldedAccount.pseudoExtendedKey!
              : transparentAccount.address;
            const gasSpendingKey =
              shielded ? shieldedAccount.pseudoExtendedKey : undefined;
            const refundTarget =
              shielded ?
                (await genDisposableSigner()).data?.address
              : undefined;

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
                    token: selectedAsset.asset.address ?? "",
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
            break;
          }

          case "shield": {
            // Shield transfer - Move assets to shielded pool
            invariant(sourceAddress, "Source address is not defined");

            setCurrentStatus("");

            const txResponse = await performTransfer({ memo });

            if (txResponse) {
              const txList = createTransferDataFromNamada(
                txKind,
                selectedAsset.asset,
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
            break;
          }

          case "unshield": {
            // Unshield transfer - Move assets from shielded pool to transparent
            invariant(sourceAddress, "Source address is not defined");

            const txResponse = await performTransfer({ memo });

            if (txResponse) {
              const txList = createTransferDataFromNamada(
                txKind,
                selectedAsset.asset,
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
            break;
          }

          case "namada-transfer": {
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
                selectedAsset.asset,
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
              trackEvent(
                `${shielded ? "Shielded" : "Transparent"} Transfer: complete`
              );
            } else {
              throw "Invalid transaction response";
            }
            break;
          }

          default:
            throw new Error(`Unknown transfer type: ${transferType}`);
        }
      } catch (err) {
        // Handle errors consistently across all transfer types
        if (transferType === "ibc-deposit") {
          setGeneralErrorMessage(err + "");
          setCurrentStatus(undefined);
        } else {
          // For other transfer types, only set error if not already set
          const currentError = "";
          if (currentError === "") {
            setGeneralErrorMessage(
              err instanceof Error ? err.message : String(err)
            );
          }
        }

        // Track error events for applicable transfer types
        if (transferType === "namada-transfer") {
          const shielded = isShieldedAddress(sourceAddress ?? "");
          trackEvent(
            `${shielded ? "Shielded" : "Transparent"} Transfer: error`
          );
        }
      }
    },
    [
      selectedAsset,
      chainId,
      keplrRegistry,
      sourceChannel,
      activeKeplrWalletAddress,
      shieldedAccount,
      transparentAccount,
      customAddress,
      isTargetShielded,
      txKind,
      rpcUrl,
      sourceAddress,
      transferToNamada,
      performWithdraw,
      performTransfer,
      setCurrentStatus,
      setCurrentStatusExplanation,
      setStatusExplanation,
      setGeneralErrorMessage,
      setTxHash,
      setRefundTarget,
      setLedgerStatusStop,
    ]
  );

  const submitTransfer = useCallback(
    (params: {
      displayAmount: string;
      destinationAddress: string;
      sourceAddress: string;
      memo?: string;
    }) => {
      const { displayAmount, destinationAddress, sourceAddress, memo } = params;

      if (!displayAmount) throw new Error("Amount is not valid");
      if (!sourceAddress || !destinationAddress)
        throw new Error("Address is not provided");
      if (!selectedAsset) throw new Error("Asset is not selected");

      const transferType = determineTransferType({
        destinationAddress,
        sourceAddress,
      });

      return onSubmitTransfer(
        {
          displayAmount,
          destinationAddress,
          sourceAddress,
          memo,
        },
        transferType
      );
    },
    [onSubmitTransfer, selectedAsset, determineTransferType]
  );

  return {
    submitTransfer,
    isPending: isPending || isPerformingTransfer,
    isSuccess: isSuccess || isTransferSuccess,
    error: error || transferError || undefined,
    feeProps: feeProps || transferFeeProps,
    ibcGasConfig: ibcGasConfig.data,
    completedAt,
    redirectToTransactionPage,
  };
};
