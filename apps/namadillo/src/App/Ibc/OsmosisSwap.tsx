import { Panel } from "@namada/components";
import { AccountType } from "@namada/types";
import { SwapIcon } from "App/Icons/SwapIcon";
import { SwapModule } from "App/Transfer/SwapModule";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { namadaShieldedAssetsAtom } from "atoms/balance";
import {
  getChainRegistryByChainId,
  ibcChannelsFamily,
  namadaRegistryChainAssetsMapAtom,
} from "atoms/integrations";
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
import invariant from "invariant";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { toBaseAmount, toDisplayAmount } from "utils";

const SLIPPAGE = 0.005;
const SWAP_CONTRACT_ADDRESS =
  "osmo14q5zmg3fp774kpz2j8c52q7gqjn0dnm3vcj3guqpj4p9xylqpc7s2ezh0h";

// TODO: make this type mroe specific
type SwapState = {
  mode: "sell" | "buy" | "none";
  sourceAmount?: BigNumber;
  targetAmount?: BigNumber;
};
const defaultSwapState: SwapState = {
  mode: "none",
  sourceAmount: undefined,
  targetAmount: undefined,
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

  const [swapState, setSwapState] = useState<SwapState>(defaultSwapState);

  const [recipient, setRecipient] = useState<string>(
    "znam17drxewzvge966gzcl0u6tr4j90traepujm2vd8ptwwkgrftnhs2hdtnyzgl5freyjsdnchn4ddy"
  );
  const [localRecoveryAddr, setLocalRecoveryAddress] = useState<string>(
    "osmo18st0wqx84av8y6xdlss9d6m2nepyqwj6n3q7js"
  );
  const [quote, setQuote] = useState<
    (SwapResponseOk & { minAmount: string }) | undefined
  >();

  const { data: ibcChannels } = useAtomValue(ibcChannelsFamily("osmosis"));

  const feeProps = useTransactionFee(["IbcTransfer"], true);

  useEffect(() => {
    const call = async (): Promise<void> => {
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
        )
          .times(BigNumber(1).minus(SLIPPAGE))
          .toString();

        if (simulateSell && sellAsset) {
          setSwapState((s) => ({
            ...s,
            targetAmount: toDisplayAmount(
              buyAsset,
              BigNumber(r.amount_out as string)
            ),
          }));
        } else if (simulateBuy && buyAsset) {
          setSwapState((s) => ({
            ...s,
            sourceAmount: toDisplayAmount(
              sellAsset,
              BigNumber(r.amount_in as string)
            ),
          }));
        }

        setQuote({ ...(response as SwapResponseOk), minAmount });
      } else {
        setQuote(undefined);
      }
    };
    if (buyAsset && sellAsset) {
      call();
    }
  }, [
    buyAsset?.address,
    sellAsset?.address,
    swapState.targetAmount?.toString(),
    swapState.sourceAmount?.toString(),
  ]);

  const defaultAccounts = useAtomValue(allDefaultAccountsAtom);
  const shieldedAccount = defaultAccounts.data?.find(
    (account) => account.type === AccountType.ShieldedKeys
  );

  //const handleOsmosisSwap = useCallback(async () => {
  //  invariant(transparentAccount, "No transparent account is found");
  //  invariant(shieldedAccount, "No shielded account is found");
  //  invariant(from, "No from asset");
  //  invariant(to, "No to asset");
  //  invariant(ibcChannels, "No ibc channels");
  //  invariant(quote, "No quote");
  //  invariant(localRecoveryAddr, "No local recovery address");
  //  invariant(recipient, "No recipient");

  //  const toTrace = to.traces?.find((t): t is IbcTransition => t.type === "ibc")
  //    ?.chain.path;
  //  invariant(toTrace, "No IBC trace found for the to asset");
  //  invariant(quote.route[0], "No route found in the quote");
  //  const route = quote.route[0].pools.map((p) => ({
  //    poolId: String(p.id),
  //    tokenOutDenom: p.token_out_denom,
  //  }));

  //  let bparams: BparamsMsgValue[] | undefined;
  //  if (transparentAccount.type === AccountType.Ledger) {
  //    const sdk = await getSdkInstance();
  //    const ledger = await sdk.initLedger();
  //    bparams = await ledger.getBparams();
  //    ledger.closeTransport();
  //  }

  //  const transfer = {
  //    amountInBaseDenom: BigNumber(amount),
  //    // osmosis channel
  //    channelId: "channel-1",
  //    portId: "transfer",
  //    token: from.asset.address,
  //    source: shieldedAccount.pseudoExtendedKey!,
  //    gasSpendingKey: shieldedAccount.pseudoExtendedKey!,
  //    receiver: SWAP_CONTRACT_ADDRESS,
  //    bparams,
  //    // TODO: replace with disposable signer
  //    refundTarget: transparentAccount.address,
  //  };
  //  const params = {
  //    transfer,
  //    outputDenom: toTrace,
  //    recipient,
  //    // TODO: this should also be disposable address most likely
  //    overflow: transparentAccount.address,
  //    slippage: {
  //      0: BigNumber(quote.minAmount)
  //        .integerValue(BigNumber.ROUND_DOWN)
  //        .toString(),
  //    },
  //    localRecoveryAddr,
  //    route,
  //    // TODO: not sure if hardcoding is ok, maybe we should connect keplr wallet
  //    osmosisRestRpc: "https://osmosis-rest.publicnode.com",
  //  };

  //  try {
  //    const encodedTxData = await performOsmosisSwap({
  //      signer: {
  //        // TODO: use disposable signer
  //        publicKey: transparentAccount.publicKey!,
  //        address: transparentAccount.address!,
  //      },
  //      account: transparentAccount,
  //      params: [params],
  //      gasConfig: feeProps.gasConfig,
  //    });

  //    // TODO: use disposable signer
  //    const signedTxs = await signTx(
  //      encodedTxData,
  //      transparentAccount.address!
  //    );
  //    const wwww = await broadcastTransaction(encodedTxData, signedTxs);
  //    //eslint-disable-next-line no-console
  //    console.log("Transaction broadcasted:", wwww);
  //    alert("Transaction sent 🚀");
  //  } catch (error) {
  //    console.error("Error performing Osmosis swap:", error);
  //    alert("Transaction errror 🪦");
  //  }
  //}, [transparentAccount, shieldedAccount, quote]);

  //TODO: sucks
  // const toAmount =
  //   quote && sellAmount && sellAsset ?
  //     toDisplayAmount(sellAsset, BigNumber(quote.amount_out))
  //   : undefined;

  return (
    <Panel className="relative rounded-sm flex flex-col flex-1 pt-9">
      <header className="flex flex-col items-center text-center mb-8 gap-5">
        <h1 className="text-yellow"> Shielded Swaps </h1>
        <i className="flex items-center justify-center w-13 mx-auto relative z-10">
          <SwapIcon color={"#FF0"} />
        </i>
        <p>Swap an asset you hold in the shield pool</p>
      </header>
      <SwapModule
        assets={namadaAssets}
        assetsWithBalance={assetsWithBalance}
        quote={quote}
        feeProps={feeProps}
        walletAddress={shieldedAccount?.address}
        tokenPrices={tokenPrices}
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
              setSwapState({
                mode: "none",
                sourceAmount: undefined,
                targetAmount: undefined,
              });
            }
            // setMode("sell");
            // setSellAmount(a ? a.toString() : "");
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
              setSwapState({
                mode: "none",
                sourceAmount: undefined,
                targetAmount: undefined,
              });
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
          if (swapState.mode !== "none" && sellAsset && buyAsset) {
            setSwapStorageBuyAsset(sellAsset.symbol);
            setSwapStorageSellAsset(buyAsset.symbol);

            if (swapState.mode === "sell") {
              setSwapState({
                mode: "buy",
                sourceAmount: swapState.targetAmount,
                targetAmount: swapState.sourceAmount,
              });
            } else {
              setSwapState({
                mode: "sell",
                sourceAmount: swapState.targetAmount,
                targetAmount: swapState.sourceAmount,
              });
            }
          }
        }}
      />
    </Panel>
    // <div className="text-white">
    //   <div>From:</div>
    //   <Stack direction="horizontal">
    //     <select
    //       className="text-black"
    //       onChange={(e) => setFrom(availableAssets?.[e.target.value])}
    //     >
    //       <option value=""></option>
    //       {Object.values(availableAssets || {}).map((al, idx) => (
    //         <option key={`${al.asset.base}_${idx}`} value={al.asset.address}>
    //           {al.asset.symbol}
    //         </option>
    //       ))}
    //     </select>
    //     <div>{from?.amount?.toString()}</div>
    //   </Stack>
    //   <div>To:</div>
    //   <select
    //     className="text-black"
    //     onChange={(e) => setTo(namadaAssets[Number(e.target.value)])}
    //   >
    //     <option value=""></option>
    //     {namadaAssets.map((asset, i) => (
    //       <option key={asset.base} value={i}>
    //         {asset.symbol}
    //       </option>
    //     ))}
    //   </select>
    //   <div>Amount in base denom:</div>
    //   <input
    //     className="text-black"
    //     type="text"
    //     onChange={(e) => setAmount(e.target.value)}
    //   />
    //   <div>Recipient(znam address):</div>
    //   <input
    //     className="text-black"
    //     type="text"
    //     onChange={(e) => setRecipient(e.target.value)}
    //     value={recipient}
    //   />
    //   <div>
    //     Local recovery address(osmosis address to send tokens to in case
    //     something goes wrong on osmisis)
    //   </div>
    //   <input
    //     className="text-black"
    //     type="text"
    //     onChange={(e) => setLocalRecoveryAddress(e.target.value)}
    //     value={localRecoveryAddr}
    //   />
    //   <br />
    //   <button
    //     className="bg-yellow text-black p-4 m-3"
    //     onClick={handleOsmosisSwap}
    //   >
    //     SWAP🎏
    //   </button>

    //   <p>---</p>
    //   <div> Receive: </div>
    //   {quote && (
    //     <div>
    //       <div>
    //         Amount in: {quote.amount_in.amount}
    //         {from?.asset.denom_units[0].aliases?.[0]}
    //       </div>
    //       <div>
    //         Amount out: {quote.amount_out}
    //         {to?.denom_units[0].aliases?.[0]}
    //       </div>
    //       <div>
    //         Min amount out: {quote.minAmount}
    //         {to?.denom_units[0].aliases?.[0]}
    //       </div>
    //       <div>Slippage: {SLIPPAGE * 100}%</div>
    //       <div>Routes: </div>
    //       <div>Effective fee: {BigNumber(quote.effective_fee).toString()}</div>
    //       <div>
    //         Price: 1 {from?.asset.symbol} ≈{" "}
    //         {BigNumber(quote.amount_out).div(BigNumber(amount)).toString()}{" "}
    //         {to?.symbol}
    //       </div>
    //       <div>
    //         Price impact: {BigNumber(quote.price_impact).dp(3).toString()}
    //       </div>
    //       <ul className="list-disc list-inside">
    //         {quote.route.map((r, i) => (
    //           <li key={i}>
    //             Route{i + 1}
    //             <ul className="list-disc list-inside pl-4">
    //               {r.pools.map((p, i) => (
    //                 <li key={i}>
    //                   {p.id}: {p.token_out_denom}
    //                   (Fee: {BigNumber(p.taker_fee).toString()})
    //                 </li>
    //               ))}
    //             </ul>
    //           </li>
    //         ))}
    //       </ul>
    //     </div>
    //   )}
    // </div>
  );
};
