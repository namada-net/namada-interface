import { Panel } from "@namada/components";
import { SwapModule } from "./SwapModule";

export const OsmosisSwap: React.FC = () => {
  //// global state
  //const { mutateAsync: performOsmosisSwap } = useAtomValue(
  //  createOsmosisSwapTxAtom
  //);
  //const { data: assetsWithBalance, isLoading: _isLoadingAssets } = useAtomValue(
  //  namadaShieldedAssetsAtom
  //);
  //const chainAssetsMapAtom = useAtomValue(namadaRegistryChainAssetsMapAtom);
  //const namadaAssets =
  //  chainAssetsMapAtom.isSuccess ? Object.values(chainAssetsMapAtom.data) : [];

  //const { data: tokenPrices } = useAtomValue(
  //  tokenPricesFamily(namadaAssets.map((a) => a.address))
  //);
  //const swapStorage = useAtomValue(swapStorageAtom);

  //const [status, setStatus] = useAtom(swapStatusAtom);

  //const defaultAccounts = useAtomValue(allDefaultAccountsAtom);
  //const namadaChain = useAtomValue(chainAtom);

  //////end global state

  //////derived global state

  //const sellAsset = namadaAssets.find(
  //  (asset) => asset.symbol === swapStorage.assetSymbolSell
  //);
  //const buyAsset = namadaAssets.find(
  //  (asset) => asset.symbol === swapStorage.assetSymbolBuy
  //);
  //////derived global state end

  //////local state
  //const [txHash, setTxHash] = useState<string | undefined>();
  //const [swapState, setSwapState] = useAtom(swapStateAtom);
  //const swapStateRef = useRef(swapState);

  //const [recipient, setRecipient] = useState<string>(
  //  "znam1a84q94utg8tc35hrfr39k044qauh28vnjd3zgvx9ygkgaahpn73ffnfdq8ntwmwr93t0zgj6sys"
  //);
  //const [localRecoveryAddr, setLocalRecoveryAddress] = useState<string>(
  //  "osmo18st0wqx84av8y6xdlss9d6m2nepyqwj6n3q7js"
  //);

  // const quoteQuery = useAtomValue(swapQuoteAtom);
  // const [quote, setQuote] = useState<SwapQuote | undefined>(quoteQuery.data);

  // useEffect(() => {
  //   if (quoteQuery.data) {
  //     setQuote(quoteQuery.data);
  //   }
  // }, [quoteQuery.data]);

  // useEffect(() => {
  //   swapStateRef.current = swapState;
  // }, [swapState]);

  // useEffect(() => {
  //   const asd = (
  //     buyAsset: NamadaAsset,
  //     sellAsset: NamadaAsset,
  //     quote: SwapQuote,
  //     swapState: SwapState
  //   ): void => {
  //     const baseAmount =
  //       swapState.mode === "sell" ? quote.amountIn : quote.amountOut;

  //     const unitPrice = toDisplayAmount(
  //       buyAsset,
  //       quote.minAmount.div(toDisplayAmount(buyAsset, baseAmount))
  //     );

  //     const simulateSell =
  //       swapState.mode === "sell" || swapState.mode === "none";
  //     const simulateBuy = swapState.mode === "buy";

  //     if (simulateSell && sellAsset) {
  //       // We kame sure that we do not update after user has changed the amount
  //       if (swapState.sellAmount === swapStateRef.current.sellAmount) {
  //         setSwapState((s) => ({
  //           ...s,
  //           buyAmount: toDisplayAmount(buyAsset, quote.amountOut),
  //           unitPrice,
  //         }));
  //       }
  //     } else if (simulateBuy && buyAsset) {
  //       // We kame sure that we do not update after user has changed the amount
  //       if (swapState.buyAmount === swapStateRef.current.buyAmount) {
  //         setSwapState((s) => ({
  //           ...s,
  //           sellAmount: toDisplayAmount(sellAsset, quote.amountIn),
  //           unitPrice,
  //         }));
  //       }
  //     }
  //   };

  //   if (swapState && buyAsset && sellAsset && quoteQuery.data) {
  //     asd(buyAsset, sellAsset, quoteQuery.data, swapState);
  //   }
  // }, [quote, sellAsset?.address, buyAsset?.address]);
  //end local state

  return (
    <Panel className="relative rounded-sm flex flex-col flex-1 pt-9">
      <>
        <SwapModule />
      </>
    </Panel>
  );
};
