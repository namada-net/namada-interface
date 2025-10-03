import { BparamsMsgValue, OsmosisSwapProps } from "@namada/sdk-multicore";
import { AccountType } from "@namada/types";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { chainAtom } from "atoms/chain";
import {
  ibcChannelsFamily,
  namadaRegistryChainAssetsMapAtom,
} from "atoms/integrations";
import {
  createNotificationId,
  dispatchToastNotificationAtom,
} from "atoms/notifications";
import { createOsmosisSwapTxAtom } from "atoms/transfer/atoms";
import BigNumber from "bignumber.js";
import { useTransactionFee } from "hooks";
import { useTransactionActions } from "hooks/useTransactionActions";
import invariant from "invariant";
import { useAtomValue, useSetAtom } from "jotai";
import { broadcastTxWithEvents, signTx, TransactionPair } from "lib/query";
import { useCallback, useState } from "react";
import {
  NamadaAsset,
  NamadaIbcTransition,
  OsmosisSwapTransactionData,
  TransferStep,
} from "types";
import { toBaseAmount } from "utils";
import { getSdkInstance } from "utils/sdk";
import { SwapStatus } from "../state";
import {
  swapQuoteAtom,
  swapStateAtom,
  swapStatusAtom,
  swapStorageAtom,
} from "../state/atoms";

// TODO: reused - unify
class TransactionError<T> extends Error {
  public cause: { originalError: unknown; context: TransactionPair<T> };
  constructor(
    public message: string,
    options: {
      cause: { originalError: unknown; context: TransactionPair<T> };
    }
  ) {
    super(message);
    this.cause = options.cause;
  }
}

// TODO: reused - unify;
const getNotificationId = <T,>(tx: TransactionPair<T>): string => {
  const notificationId = createNotificationId(
    tx.encodedTxData.txs.map((tx) => tx.hash)
  );

  return notificationId;
};

// TODO: configurable
const SWAP_CONTRACT_ADDRESS =
  "osmo14q5zmg3fp774kpz2j8c52q7gqjn0dnm3vcj3guqpj4p9xylqpc7s2ezh0h";

export type OsmosisSwapTxProps = {
  localRecoveryAddr: string;
  recipient: string;
};

type TxHash = string;

const usePerformOsmosisSwapTx = async (
  props: OsmosisSwapTxProps
): Promise<TxHash | undefined> => {
  const { localRecoveryAddr, recipient } = props;

  // Local state
  const [txHash, setTxHash] = useState<string | undefined>();

  // Feature state
  const swapStorage = useAtomValue(swapStorageAtom);
  const { buyAmount, sellAmount } = useAtomValue(swapStateAtom);
  const setStatus = useSetAtom(swapStatusAtom);
  const quoteQuery = useAtomValue(swapQuoteAtom);

  // Global state
  const chainAssetsMapAtom = useAtomValue(namadaRegistryChainAssetsMapAtom);
  const namadaAssets =
    chainAssetsMapAtom.isSuccess ? Object.values(chainAssetsMapAtom.data) : [];
  const { data: ibcChannels } = useAtomValue(ibcChannelsFamily("osmosis"));
  const namadaChain = useAtomValue(chainAtom);
  const dispatchNotification = useSetAtom(dispatchToastNotificationAtom);
  const { mutateAsync: performOsmosisSwap } = useAtomValue(
    createOsmosisSwapTxAtom
  );
  const defaultAccounts = useAtomValue(allDefaultAccountsAtom);
  const feeProps = useTransactionFee(["IbcTransfer"]);

  // Derived state
  const quote = quoteQuery.data;
  const shieldedAccount = defaultAccounts.data?.find(
    (account) => account.type === AccountType.ShieldedKeys
  );
  const transparentAccount = defaultAccounts.data?.find(
    (account) => account.type !== AccountType.ShieldedKeys
  );
  const sellAsset = namadaAssets.find(
    (asset) => asset.symbol === swapStorage.assetSymbolSell
  );
  const buyAsset = namadaAssets.find(
    (asset) => asset.symbol === swapStorage.assetSymbolBuy
  );

  useCallback(async () => {
    invariant(shieldedAccount, "No shielded account is found");
    invariant(transparentAccount, "No transparentAccount account is found");
    invariant(ibcChannels, "No ibc channels");
    invariant(quote, "No quote");
    invariant(localRecoveryAddr, "No local recovery address");
    invariant(recipient, "No recipient");
    invariant(sellAmount, "No source amount");
    invariant(buyAmount, "No target amount");
    invariant(buyAsset, "No asset to buy selected");
    invariant(sellAsset, "No asset to sell selected");

    const toTrace = buyAsset.traces?.find(
      (t): t is NamadaIbcTransition => t.type === "ibc"
    )?.chain.path;
    invariant(toTrace, "No IBC trace found for the to asset");
    invariant(quote.routes[0], "No route found in the quote");

    const route = quote.routes[0].pools;

    let bparams: BparamsMsgValue[] | undefined;
    if (transparentAccount.type === AccountType.Ledger) {
      const sdk = await getSdkInstance();
      const ledger = await sdk.initLedger();
      bparams = await ledger.getBparams();
      ledger.closeTransport();
    }

    const transfer = {
      amountInBaseDenom: toBaseAmount(sellAsset, sellAmount),
      //TODO: osmosis channel
      channelId: "channel-1",
      portId: "transfer",
      token: sellAsset.address,
      source: shieldedAccount.pseudoExtendedKey!,
      gasSpendingKey: shieldedAccount.pseudoExtendedKey!,
      receiver: SWAP_CONTRACT_ADDRESS,
      bparams,
      // TODO: replace with disposable signer
      refundTarget: transparentAccount.address,
    };
    const params = {
      transfer,
      outputDenom: toTrace,
      recipient,
      // TODO: this should also be disposable address most likely
      overflow: transparentAccount.address,
      slippage: {
        0: BigNumber(quote.minAmount)
          .integerValue(BigNumber.ROUND_DOWN)
          .toString(),
      },
      localRecoveryAddr,
      route,
      // TODO: not sure if hardcoding is ok, maybe we should connect keplr wallet
      osmosisRestRpc: "https://osmosis-rest.publicnode.com",
    };

    try {
      setStatus(SwapStatus.Building);
      const encodedTxData = await performOsmosisSwap({
        signer: {
          // TODO: use disposable signer
          publicKey: transparentAccount.publicKey!,
          address: transparentAccount.address!,
        },
        account: transparentAccount,
        params: [params],
        gasConfig: feeProps.gasConfig,
      });

      setStatus(SwapStatus.AwaitingSignature);
      // TODO: use disposable signer
      const signedTxs = await signTx(
        encodedTxData,
        transparentAccount.address!
      );

      // TODO: move to SwapModule?
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
            Your shielded swap is being processed. This can take a few moments.
          </div>
        ),
      });
      // TODO: end

      setStatus(SwapStatus.Broadcasting);
      try {
        await broadcastTxWithEvents(
          transactionPair.encodedTxData,
          transactionPair.signedTxs,
          transactionPair.encodedTxData.meta?.props,
          // TODO: use correct type here
          "IbcTransfer"
        );

        const ibcTxData = storeTransferTransaction(
          transactionPair,
          sellAmount,
          buyAmount,
          sellAsset,
          buyAsset
        );

        setTxHash(ibcTxData.hash);
        setStatus(SwapStatus.Confirming);
      } catch (error) {
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
    } catch (error) {
      // TODO:
      if (error instanceof TransactionError) {
        setStatus(SwapStatus.Error);
      } else {
        setStatus(SwapStatus.Error);
      }
      throw error;
    }
  }, [transparentAccount?.address, shieldedAccount?.address, quote]);

  // TODO memouze or sth
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    storeTransaction(transferTransaction);
    return transferTransaction;
  };

  return txHash;
};
