import { OsmosisSwapProps } from "@namada/sdk-multicore";
import { AccountType } from "@namada/types";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { chainAtom } from "atoms/chain";
import {
  dispatchToastNotificationAtom,
  getNotificationId,
} from "atoms/notifications";
import { createOsmosisSwapTxAtom } from "atoms/transfer/atoms";
import {
  clearDisposableSigner,
  getDisposableSigner,
  persistDisposableSigner,
} from "atoms/transfer/services";
import BigNumber from "bignumber.js";
import { useTransactionFee } from "hooks";
import { useTransactionActions } from "hooks/useTransactionActions";
import invariant from "invariant";
import { useAtomValue, useSetAtom } from "jotai";
import { broadcastTxWithEvents, signTx, TransactionPair } from "lib/query";
import { useCallback, useState } from "react";
import { NamadaAsset, OsmosisSwapTransactionData, TransferStep } from "types";
import { TransactionError } from "types/errors";
import { toBaseAmount } from "utils";
import { SwapStatus } from "../state";
import {
  swapMinAmountAtom,
  swapQuoteAtom,
  swapStateAtom,
  swapStatusAtom,
} from "../state/atoms";
import { useSwapBuyAmount } from "./useSwapBuyAmount";
import { useSwapSellAmount } from "./useSwapSellAmount";

// TODO: Should be a different address for housefire
const SWAP_CONTRACT_ADDRESS =
  "osmo14q5zmg3fp774kpz2j8c52q7gqjn0dnm3vcj3guqpj4p9xylqpc7s2ezh0h";

export type OsmosisSwapTxProps = {
  localRecoveryAddr?: string;
};

type TxHash = string;

type UsePerformOsmosisSwapResult = {
  txHash?: TxHash;
  error?: Error;
  performSwap: (props: OsmosisSwapTxProps) => Promise<void>;
};

export function usePerformOsmosisSwapTx(): UsePerformOsmosisSwapResult {
  const [txHash, setTxHash] = useState<TxHash | undefined>();
  const [error, setError] = useState<Error | undefined>();

  // Feature state
  const setStatus = useSetAtom(swapStatusAtom);
  const { buyAsset, sellAsset } = useAtomValue(swapStateAtom);
  const sellAmount = useSwapSellAmount();
  const buyAmount = useSwapBuyAmount();
  const quoteQuery = useAtomValue(swapQuoteAtom);
  const minAmount = useAtomValue(swapMinAmountAtom);

  // Global state
  const namadaChain = useAtomValue(chainAtom);
  const { mutateAsync: performOsmosisSwap } = useAtomValue(
    createOsmosisSwapTxAtom
  );
  const defaultAccounts = useAtomValue(allDefaultAccountsAtom);
  const shieldedAccount = defaultAccounts.data?.find(
    (a) => a.type === AccountType.ShieldedKeys
  );
  const transparentAccount = defaultAccounts.data?.find(
    (a) => a.type !== AccountType.ShieldedKeys
  );
  const dispatchNotification = useSetAtom(dispatchToastNotificationAtom);
  const feeProps = useTransactionFee(["IbcTransfer"]);

  const { storeTransaction } = useTransactionActions();

  const storeTransferTransaction = (
    tx: TransactionPair<OsmosisSwapProps>,
    displayAmount: BigNumber,
    displayTargetMinAmount: BigNumber,
    asset: NamadaAsset,
    targetAsset: NamadaAsset
  ): OsmosisSwapTransactionData => {
    // We have to use the last element from lists in case we revealPK
    const props = tx.encodedTxData.meta?.props.pop();
    const lastTx = tx.encodedTxData.txs.pop();
    invariant(props && lastTx, "Invalid transaction data");
    const lastInnerTxHash = lastTx.innerTxHashes.pop();
    invariant(lastInnerTxHash, "Inner tx not found");
    invariant(props.transfer.refundTarget, "No refund target found");

    const transferTransaction: OsmosisSwapTransactionData = {
      hash: lastTx.hash,
      innerHash: lastInnerTxHash.toLowerCase(),
      currentStep: TransferStep.WaitingConfirmation,
      rpc: "",
      type: "ShieldedOsmosisSwap",
      status: "pending",
      asset,
      targetAsset,
      minAmountOut: displayTargetMinAmount,
      chainId: namadaChain.data?.chainId || "",
      destinationChainId: "",
      memo: tx.encodedTxData.wrapperTxProps.memo || props.transfer.memo,
      displayAmount,
      shielded: true,
      sourceAddress: `${transparentAccount?.alias} - shielded`,
      destinationAddress: props.transfer.receiver,
      refundTarget: props.transfer.refundTarget,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    storeTransaction(transferTransaction);
    return transferTransaction;
  };

  const performSwap = useCallback(
    async (props: OsmosisSwapTxProps): Promise<void> => {
      const { localRecoveryAddr } = props;
      setError(undefined);
      setTxHash(undefined);
      setStatus(SwapStatus.building());

      try {
        const quote = quoteQuery.data;

        invariant(localRecoveryAddr, "No local recovery address found");
        invariant(shieldedAccount, "No shielded account found");
        invariant(transparentAccount, "No transparent account found");
        invariant(quote, "No quote found");
        invariant(sellAmount, "No sell amount");
        invariant(buyAmount, "No buy amount");
        invariant(sellAsset && buyAsset, "Missing swap assets");
        invariant(minAmount, "No minimum amount calculated");

        const toTrace =
          buyAsset.traces?.find((t) => t.type === "ibc")?.chain.path ||
          // For NAM token, we want to use address directly
          buyAsset.address;
        invariant(toTrace, "No IBC trace found");

        const route = quote.routes[0]?.pools;
        invariant(route, "No swap route found");

        const disposableRefundTarget = await getDisposableSigner();
        const transfer = {
          amountInBaseDenom: toBaseAmount(sellAsset, sellAmount),
          channelId: "channel-1",
          portId: "transfer",
          token: sellAsset.address,
          source: shieldedAccount.pseudoExtendedKey!,
          gasSpendingKey: shieldedAccount.pseudoExtendedKey!,
          receiver: SWAP_CONTRACT_ADDRESS,
          refundTarget: disposableRefundTarget.address,
        };

        const params = {
          transfer,
          outputDenom: toTrace,
          recipient: shieldedAccount.address,
          overflow: transparentAccount.address,
          slippage: {
            0: minAmount.integerValue(BigNumber.ROUND_DOWN).toString(),
          },
          localRecoveryAddr,
          route,
          osmosisRestRpc: "https://osmosis-rest.publicnode.com",
        };

        setStatus(SwapStatus.building());

        const signer = await getDisposableSigner();

        await persistDisposableSigner(disposableRefundTarget.address);
        const encodedTxData = await performOsmosisSwap({
          signer,
          account: transparentAccount,
          params: [params],
          gasConfig: feeProps.gasConfig,
        });

        setStatus(SwapStatus.awaitingSignature());
        const signedTxs = await signTx(encodedTxData, signer.address);

        const transactionPair: TransactionPair<OsmosisSwapProps> = {
          signedTxs,
          encodedTxData,
        };

        const notificationId = getNotificationId(transactionPair);

        dispatchNotification({
          id: notificationId,
          type: "pending",
          title: "Transaction pending",
          description: (
            <div>
              Your shielded swap is being processed. This can take a few
              moments.
            </div>
          ),
        });

        setStatus(SwapStatus.broadcasting());

        try {
          await broadcastTxWithEvents(
            transactionPair.encodedTxData,
            transactionPair.signedTxs,
            transactionPair.encodedTxData.meta?.props,
            "ShieldedOsmosisSwap"
          );
        } catch (error) {
          await clearDisposableSigner(disposableRefundTarget.address);

          dispatchNotification({
            id: notificationId,
            details: error instanceof Error ? error.message : undefined,
            type: "error",
            title: "Swap error",
            description: "",
          });
          throw new TransactionError<OsmosisSwapProps>("Transaction error", {
            cause: {
              originalError: error,
              context: transactionPair,
            },
          });
        }

        const ibcTxData = storeTransferTransaction(
          transactionPair,
          sellAmount,
          buyAmount,
          sellAsset,
          buyAsset
        );

        setTxHash(ibcTxData.hash);
        setStatus(SwapStatus.confirming(ibcTxData.hash));
      } catch (err) {
        setError(err as Error);
        setStatus(SwapStatus.error((err as Error).message));
      }
    },
    [
      buyAmount?.toString(),
      sellAmount?.toString(),
      transparentAccount?.address,
      shieldedAccount?.address,
      feeProps.gasConfig.gasLimit,
      minAmount,
    ]
  );

  return {
    txHash,
    error,
    performSwap,
  };
}
