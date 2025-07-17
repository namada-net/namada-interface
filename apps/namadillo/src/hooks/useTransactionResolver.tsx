import { IbcTransferMsgValue } from "@namada/types";
import { determineTransferType } from "App/Transfer";
import { isShieldedAddress } from "App/Transfer/common";
import {
  OnSubmitTransferParams,
  UseTransactionResolverProps,
  UseTransactionResolverReturn,
} from "App/Transfer/types";
import { disposableSignerAtom } from "atoms/accounts";
import { chainAtom } from "atoms/chain";
import {
  executeIbcDeposit,
  executeIbcWithdraw,
  executeNamadaTransfer,
  executeShieldTransfer,
  executeUnshieldTransfer,
  type TransferExecutionDependencies,
} from "atoms/transactions/functions";
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
import { TransferType } from "hooks/useTransferResolver";
import invariant from "invariant";
import { useAtomValue } from "jotai";
import { TransactionPair } from "lib/query";
import { Asset, IbcTransferTransactionData, TransferStep } from "types";
import { toDisplayAmount } from "utils";

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
  setGeneralErrorMessage,
  setTxHash,
  setRefundTarget,
  setLedgerStatus,
}: UseTransactionResolverProps): UseTransactionResolverReturn => {
  const { storeTransaction } = useTransactionActions();
  const disposableSignerQuery = useAtomValue(disposableSignerAtom);
  const namadaChain = useAtomValue(chainAtom);
  const alias = shieldedAccount?.alias ?? transparentAccount?.alias;
  const shielded = isShieldedAddress(sourceAddress ?? "");
  const transferType = determineTransferType({
    destinationAddress,
    sourceAddress,
  });

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

  // Only run IBC transaction hook for IBC deposit transfers
  const isIbcDeposit = transferType === "ibc-deposit";

  // Used for IBC Transfers
  const { transferToNamada, gasConfig: ibcGasConfig } = useIbcTransaction({
    registry: isIbcDeposit ? keplrRegistry : undefined,
    sourceAddress: isIbcDeposit ? sourceAddress : undefined,
    sourceChannel: isIbcDeposit ? sourceChannel : undefined,
    destinationChannel: isIbcDeposit ? destinationChannel : undefined,
    shielded: isIbcDeposit ? isShieldedAddress(sourceAddress ?? "") : undefined,
    selectedAsset: isIbcDeposit ? selectedAsset?.asset : undefined,
  });

  // Used for IBC Withdrawals
  const {
    execute: performWithdraw,
    feeProps: ibcFeeProps,
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
      setCurrentStatusExplanation(
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
      trackEvent(`${shielded ? "Shielded " : ""}IbcWithdraw: tx submitted`);
    },
    onError: async (err, context) => {
      setGeneralErrorMessage(String(err));
      setCurrentStatus("");
      setCurrentStatusExplanation("");

      // Clear disposable signer if the transaction failed on Namada side
      // We do not want to clear the disposable signer if the transaction failed on the target chain
      const refundTarget = context?.encodedTxData.meta?.props[0].refundTarget;
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

  const onSubmitTransfer = async (
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

      // Create dependencies object
      const deps: TransferExecutionDependencies = {
        setCurrentStatus,
        setCurrentStatusExplanation,
        setStatusExplanation: setCurrentStatusExplanation,
        setGeneralErrorMessage,
        setTxHash,
        setRefundTarget,
        setLedgerStatusStop: setLedgerStatus,
        storeTransaction,
      };

      switch (transferType) {
        case "ibc-deposit": {
          await executeIbcDeposit(
            {
              displayAmount: displayAmount ?? "",
              destinationAddress: destinationAddress ?? "",
              sourceAddress: sourceAddress ?? "",
              memo,
              selectedAsset: selectedAsset.asset,
              chainId,
              keplrRegistry: keplrRegistry!,
              transferToNamada,
            },
            deps
          );
          break;
        }

        case "ibc-withdraw": {
          await executeIbcWithdraw(
            {
              displayAmount: displayAmount ?? "",
              destinationAddress: destinationAddress ?? "",
              sourceAddress: sourceAddress ?? "",
              memo,
              selectedAsset: selectedAsset.asset,
              chainId,
              sourceChannel: sourceChannel!,
              activeKeplrWalletAddress: activeKeplrWalletAddress!,
              shieldedAccount: shieldedAccount!,
              transparentAccount: transparentAccount!,
              performWithdraw,
              genDisposableSigner: disposableSignerQuery,
              persistDisposableSigner,
            },
            deps
          );
          break;
        }

        case "shield": {
          await executeShieldTransfer(
            {
              sourceAddress: sourceAddress!,
              memo,
              selectedAsset: selectedAsset.asset,
              txKind,
              rpcUrl,
              performTransfer,
            },
            deps
          );
          break;
        }

        case "unshield": {
          await executeUnshieldTransfer(
            {
              sourceAddress: sourceAddress!,
              memo,
              selectedAsset: selectedAsset.asset,
              txKind,
              rpcUrl,
              performTransfer,
            },
            deps
          );
          break;
        }

        case "namada-transfer": {
          await executeNamadaTransfer(
            {
              sourceAddress: sourceAddress!,
              customAddress: customAddress!,
              memo,
              selectedAsset: selectedAsset.asset,
              txKind,
              rpcUrl,
              isTargetShielded,
              performTransfer,
            },
            deps
          );
          break;
        }

        default:
          throw new Error(`Unknown transfer type: ${transferType}`);
      }
    } catch (err) {
      // Handle errors consistently across all transfer types
      if (transferType === "ibc-deposit") {
        setGeneralErrorMessage(err + "");
        setCurrentStatus("");
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
        trackEvent(`${shielded ? "Shielded" : "Transparent"} Transfer: error`);
      }
    }
  };

  const submitTransfer = (params: OnSubmitTransferParams): Promise<void> => {
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
  };

  return {
    submitTransfer,
    isPending: isPending || isPerformingTransfer,
    isSuccess: isSuccess || isTransferSuccess,
    error: error || transferError || undefined,
    feeProps:
      transferType === "ibc-withdraw" ? ibcFeeProps
      : transferType === "ibc-deposit" && ibcGasConfig.data ?
        {
          ...ibcFeeProps,
          gasConfig: ibcGasConfig.data,
        }
      : transferFeeProps,
    completedAt,
    redirectToTransactionPage,
  };
};
