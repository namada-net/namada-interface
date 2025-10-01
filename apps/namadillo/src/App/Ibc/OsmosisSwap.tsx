import { Panel } from "@namada/components";
import { AccountType, BparamsMsgValue, OsmosisSwapProps } from "@namada/types";
import { SwapModule } from "App/Transfer/SwapModule";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { namadaShieldedAssetsAtom } from "atoms/balance";
import { chainAtom } from "atoms/chain";
import {
  getChainRegistryByChainId,
  ibcChannelsFamily,
  namadaRegistryChainAssetsMapAtom,
} from "atoms/integrations";
import {
  createNotificationId,
  dispatchToastNotificationAtom,
} from "atoms/notifications";
import { tokenPricesFamily } from "atoms/prices/atoms";
import { SwapResponse, SwapResponseError, SwapResponseOk } from "atoms/swaps";
import {
  setSwapStorageBuyAssetAtom,
  setSwapStorageSellAssetAtom,
  swapStorageAtom,
} from "atoms/swaps/atoms";
import { createOsmosisSwapTxAtom } from "atoms/transfer/atoms";
import BigNumber from "bignumber.js";
import { useTransactionFee } from "hooks";
import { useTransactionActions } from "hooks/useTransactionActions";
import invariant from "invariant";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { broadcastTxWithEvents, signTx, TransactionPair } from "lib/query";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NamadaAsset,
  NamadaIbcTransition,
  OsmosisSwapTransactionData,
  TransferStep,
} from "types";
import {
  toBaseAmount,
  toDisplayAmount,
  useTransactionEventListener,
} from "utils";
import { getSdkInstance } from "utils/sdk";

const SLIPPAGE = 0.005;
const SWAP_CONTRACT_ADDRESS =
  "osmo14q5zmg3fp774kpz2j8c52q7gqjn0dnm3vcj3guqpj4p9xylqpc7s2ezh0h";

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

// TODO: reused - unify
const getNotificationId = <T,>(tx: TransactionPair<T>): string => {
  const notificationId = createNotificationId(
    tx.encodedTxData.txs.map((tx) => tx.hash)
  );

  return notificationId;
};

// TODO: move this somewhere
export enum SwapStatus {
  Idle = "Idle",
  Building = "Building",
  AwaitingSignature = "AwaitingSignature",
  Broadcasting = "Broadcasting",
  Confirming = "Confirming",
  Completed = "Completed",
  Error = "Error",
}

// TODO: move this somewhere
export const statusMessages: Record<
  SwapStatus,
  { title: string; description: string }
> = {
  [SwapStatus.Idle]: {
    title: "Ready to swap",
    description: "Review the details and submit your swap.",
  },
  [SwapStatus.Building]: {
    title: "Building transaction",
    description:
      "Your transaction is being built. This may take a few moments.",
  },
  [SwapStatus.AwaitingSignature]: {
    title: "Awaiting signature",
    description: "Please sign the transaction in your wallet.",
  },
  [SwapStatus.Broadcasting]: {
    title: "Broadcasting transaction",
    description: "Your transaction is being broadcast to the network.",
  },
  [SwapStatus.Confirming]: {
    title: "Confirming transaction",
    description:
      "Your transaction is being confirmed. This may take a few moments.",
  },
  [SwapStatus.Completed]: {
    title: "Swap completed",
    description: "Your swap has been successfully completed.",
  },
  [SwapStatus.Error]: {
    title: "Transaction error",
    description: "An error occurred during the transaction. Please try again.",
  },
};

// TODO: make this type mroe specific
type SwapState = {
  mode: "sell" | "buy" | "none";
  sourceAmount?: BigNumber;
  targetAmount?: BigNumber;
  unitPrice?: BigNumber;
};
const defaultSwapState: SwapState = {
  mode: "none",
  sourceAmount: undefined,
  targetAmount: undefined,
  unitPrice: undefined,
};

export const OsmosisSwap: React.FC = () => {
  const { mutateAsync: performOsmosisSwap } = useAtomValue(
    createOsmosisSwapTxAtom
  );
  const { data: assetsWithBalance, isLoading: _isLoadingAssets } = useAtomValue(
    namadaShieldedAssetsAtom
  );

  const chainAssetsMapAtom = useAtomValue(namadaRegistryChainAssetsMapAtom);
  const namadaAssets =
    chainAssetsMapAtom.isSuccess ? Object.values(chainAssetsMapAtom.data) : [];

  const osmosisAssets =
    getChainRegistryByChainId("osmosis-1")?.assets.assets || [];

  const { data: tokenPrices } = useAtomValue(
    tokenPricesFamily(namadaAssets.map((a) => a.address))
  );
  const swapStorage = useAtomValue(swapStorageAtom);
  const [, setSwapStorageBuyAsset] = useAtom(setSwapStorageBuyAssetAtom);
  const [, setSwapStorageSellAsset] = useAtom(setSwapStorageSellAssetAtom);
  const sellAsset = namadaAssets.find(
    (asset) => asset.symbol === swapStorage.assetSymbolSell
  );
  const buyAsset = namadaAssets.find(
    (asset) => asset.symbol === swapStorage.assetSymbolBuy
  );

  const [txHash, setTxHash] = useState<string | undefined>();

  const [swapState, setSwapState] = useState<SwapState>(defaultSwapState);
  const swapStateRef = useRef(swapState);
  useEffect(() => {
    swapStateRef.current = swapState;
  }, [swapState]);

  const [recipient, setRecipient] = useState<string>(
    "znam1a84q94utg8tc35hrfr39k044qauh28vnjd3zgvx9ygkgaahpn73ffnfdq8ntwmwr93t0zgj6sys"
  );
  const [localRecoveryAddr, setLocalRecoveryAddress] = useState<string>(
    "osmo18st0wqx84av8y6xdlss9d6m2nepyqwj6n3q7js"
  );
  const [quote, setQuote] = useState<
    (SwapResponseOk & { minAmount: BigNumber }) | undefined
  >();

  const { data: ibcChannels } = useAtomValue(ibcChannelsFamily("osmosis"));

  const feeProps = useTransactionFee(["IbcTransfer"], true);

  const [status, setStatus] = useState<SwapStatus>(SwapStatus.Idle);

  const dispatchNotification = useSetAtom(dispatchToastNotificationAtom);

  // Outside your component or in useMemo
  const debouncedCall = useMemo(
    () =>
      debounce(
        async (
          swapState: SwapState,
          buyAsset: NamadaAsset,
          sellAsset: NamadaAsset
        ) => {
          invariant(buyAsset, "No from asset selected");
          invariant(sellAsset, "No to asset selected");
          // We have to map namada assets to osmosis assets to get correct base
          const fromOsmosis = osmosisAssets.find(
            (assets) => assets.symbol === sellAsset.symbol
          );
          const toOsmosis = osmosisAssets.find(
            (assets) => assets.symbol === buyAsset.symbol
          );
          // If amount is empty, we still want to get a quote for 1 unit of the asset
          const baseAmount =
            swapState.mode === "sell" ?
              toBaseAmount(sellAsset, swapState.sourceAmount!)
            : swapState.mode === "buy" ?
              toBaseAmount(buyAsset, swapState.targetAmount!)
            : toBaseAmount(buyAsset, BigNumber(1));

          invariant(fromOsmosis, "From asset is not found in Osmosis assets");
          invariant(toOsmosis, "To asset is not found in Osmosis assets");

          const simulateSell =
            swapState.mode === "sell" || swapState.mode === "none";
          const simulateBuy = swapState.mode === "buy";

          const params: Record<string, string> =
            simulateSell ?
              {
                tokenIn: `${baseAmount}${fromOsmosis.base}`,
                tokenOutDenom: toOsmosis.base,
              }
            : {
                tokenOut: `${baseAmount}${toOsmosis.base}`,
                tokenInDenom: fromOsmosis.base,
              };

          const quote = await fetch(
            "https://sqs.osmosis.zone/router/quote?" +
              new URLSearchParams({
                ...params,
                humanDenoms: "false",
              }).toString()
          );
          const response: SwapResponse = await quote.json();

          if (!(response as SwapResponseError).message) {
            const r = response as SwapResponseOk;
            const minAmount = BigNumber(
              simulateSell ? (r.amount_out as string) : (r.amount_in as string)
            ).times(BigNumber(1).minus(SLIPPAGE));

            const unitPrice = toDisplayAmount(
              buyAsset,
              minAmount.div(toDisplayAmount(buyAsset, baseAmount))
            );

            if (simulateSell && sellAsset) {
              // We kame sure that we do not update after user has changed the amount
              if (
                swapState.sourceAmount === swapStateRef.current.sourceAmount
              ) {
                setSwapState((s) => ({
                  ...s,
                  targetAmount: toDisplayAmount(
                    buyAsset,
                    BigNumber(r.amount_out as string)
                  ),
                  unitPrice,
                }));
              }
            } else if (simulateBuy && buyAsset) {
              // We kame sure that we do not update after user has changed the amount
              if (
                swapState.targetAmount === swapStateRef.current.targetAmount
              ) {
                setSwapState((s) => ({
                  ...s,
                  sourceAmount: toDisplayAmount(
                    sellAsset,
                    BigNumber(r.amount_in as string)
                  ),
                  unitPrice,
                }));
              }
            }

            setQuote({ ...(response as SwapResponseOk), minAmount });
          } else {
            setQuote(undefined);
          }
        },
        300
      ),
    [] // Dependencies that should recreate the debounced function
  );

  useTransactionEventListener(["ShieldedOsmosisSwap.Success"], async (e) => {
    if (txHash && e.detail.hash === txHash) {
      setStatus(SwapStatus.Completed);
    }
  });

  useEffect(() => {
    if (buyAsset && sellAsset) {
      debouncedCall(swapState, buyAsset, sellAsset);
    }

    return () => {
      debouncedCall.cancel(); // Cancel pending calls on cleanup
    };
  }, [
    debouncedCall,
    swapState.targetAmount?.toString(),
    swapState.sourceAmount?.toString(),
    swapState.mode,
    buyAsset?.address,
    sellAsset?.address,
  ]);

  const defaultAccounts = useAtomValue(allDefaultAccountsAtom);
  const shieldedAccount = defaultAccounts.data?.find(
    (account) => account.type === AccountType.ShieldedKeys
  );
  const transparentAccount = defaultAccounts.data?.find(
    (account) => account.type !== AccountType.ShieldedKeys
  );

  const handleOsmosisSwap = useCallback(async () => {
    invariant(shieldedAccount, "No shielded account is found");
    invariant(transparentAccount, "No transparentAccount account is found");
    invariant(ibcChannels, "No ibc channels");
    invariant(quote, "No quote");
    invariant(localRecoveryAddr, "No local recovery address");
    invariant(recipient, "No recipient");
    invariant(swapState.sourceAmount, "No source amount");
    invariant(swapState.targetAmount, "No target amount");
    invariant(buyAsset, "No asset to buy selected");
    invariant(sellAsset, "No asset to sell selected");

    const toTrace = buyAsset.traces?.find(
      (t): t is NamadaIbcTransition => t.type === "ibc"
    )?.chain.path;
    invariant(toTrace, "No IBC trace found for the to asset");
    invariant(quote.route[0], "No route found in the quote");

    const route = quote.route[0].pools.map((p) => ({
      poolId: String(p.id),
      tokenOutDenom: p.token_out_denom,
    }));

    let bparams: BparamsMsgValue[] | undefined;
    if (transparentAccount.type === AccountType.Ledger) {
      const sdk = await getSdkInstance();
      const ledger = await sdk.initLedger();
      bparams = await ledger.getBparams();
      ledger.closeTransport();
    }

    const transfer = {
      amountInBaseDenom: toBaseAmount(sellAsset, swapState.sourceAmount),
      // osmosis channel
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
          swapState.sourceAmount,
          swapState.targetAmount,
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
  }, [transparentAccount, shieldedAccount, quote]);

  //TODO: memoize or sth
  const { storeTransaction } = useTransactionActions();
  const namadaChain = useAtomValue(chainAtom);

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

  return (
    <Panel className="relative rounded-sm flex flex-col flex-1 pt-9">
      <SwapModule
        status={status}
        slippage={SLIPPAGE}
        assets={namadaAssets}
        assetsWithBalance={assetsWithBalance}
        quote={quote}
        feeProps={feeProps}
        walletAddress={shieldedAccount?.address}
        tokenPrices={tokenPrices}
        unitPrice={swapState.unitPrice}
        onSubmitSwap={handleOsmosisSwap}
        onComplete={() => {
          setStatus(SwapStatus.Idle);
          setSwapState(defaultSwapState);
          setQuote(undefined);
          setTxHash(undefined);
        }}
        source={{
          amount: swapState.sourceAmount,
          selectedAssetAddress: sellAsset?.address,
          onChangeAmount: (a) => {
            if (a) {
              setSwapState((s) => ({
                ...s,
                mode: "sell",
                sourceAmount: a,
              }));
            } else {
              setSwapState((s) => ({
                mode: "none",
                // we do not want to reset unit price when clearing the amount as this will hide the UI
                // it will fix itself after new quote is fetched
                unitPrice: s.unitPrice,
              }));
            }
          },
          onChangeSellSelectedAsset: (address) => {
            const asset = namadaAssets.find((a) => a.address === address);
            if (asset?.address === buyAsset?.address) {
              setSwapStorageBuyAsset(sellAsset?.symbol);
            }
            setSwapStorageSellAsset(asset?.symbol);
          },
        }}
        target={{
          amount: swapState.targetAmount,
          selectedAssetAddress: buyAsset?.address,
          onChangeAmount: (a) => {
            if (a) {
              setSwapState((s) => ({
                ...s,
                mode: "buy",
                targetAmount: a,
              }));
            } else {
              setSwapState((s) => ({
                mode: "none",
                // we do not want to reset unit price when clearing the amount as this will hide the UI
                // it will fix itself after new quote is fetched
                unitPrice: s.unitPrice,
              }));
            }
          },
          onChangeBuySelectedAsset: (address) => {
            const asset = namadaAssets.find((a) => a.address === address);
            if (asset?.address === sellAsset?.address) {
              setSwapStorageSellAsset(buyAsset?.symbol);
            }
            setSwapStorageBuyAsset(asset?.symbol);
          },
        }}
        onSwapArrowsClick={() => {
          if (sellAsset && buyAsset) {
            setSwapStorageBuyAsset(sellAsset.symbol);
            setSwapStorageSellAsset(buyAsset.symbol);

            if (swapState.mode === "sell") {
              setSwapState((s) => ({
                mode: "buy",
                sourceAmount: swapState.targetAmount,
                targetAmount: swapState.sourceAmount,
                unitPrice: s.unitPrice,
              }));
            } else if (swapState.mode === "buy") {
              setSwapState((s) => ({
                mode: "sell",
                sourceAmount: swapState.targetAmount,
                targetAmount: swapState.sourceAmount,
                unitPrice: s.unitPrice,
              }));
            }
          }
        }}
      />
    </Panel>
  );
};
