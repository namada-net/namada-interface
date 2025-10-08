import invariant from "invariant";
import { useEffect, useRef } from "react";
import { toDisplayAmount } from "utils";
import { SwapQuote, SwapState } from "../state";

// TODO: no need to pass props, use atoms directly
export const useSwapSimulation = ({
  swapState,
  setInternalSwapState,
  quote,
}: {
  swapState: SwapState;
  setInternalSwapState: React.Dispatch<React.SetStateAction<SwapState>>;
  quote?: SwapQuote;
}): void => {
  const swapStateRef = useRef(swapState);

  useEffect(() => {
    swapStateRef.current = swapState;
  }, [swapState]);

  useEffect(() => {
    const simulate = (quote: SwapQuote, swapState: SwapState): void => {
      const { sellAsset, buyAsset } = swapState;
      // Sanity checks
      invariant(buyAsset, "Buy asset is required for simulation");
      invariant(sellAsset, "Sell asset is required for simulation");

      const baseAmount =
        swapState.mode === "sell" ? quote.amountIn : quote.amountOut;

      const sellAmountPerOneBuy = toDisplayAmount(
        buyAsset,
        quote.minAmount.div(toDisplayAmount(buyAsset, baseAmount))
      );

      const simulateSell =
        swapState.mode === "sell" || swapState.mode === "none";
      const simulateBuy = swapState.mode === "buy";

      if (simulateSell && sellAsset) {
        if (swapState.sellAmount === swapStateRef.current.sellAmount) {
          setInternalSwapState((s) => ({
            ...s,
            buyAmount: toDisplayAmount(buyAsset, quote.amountOut),
            sellAmountPerOneBuy,
          }));
        }
      } else if (simulateBuy && buyAsset) {
        if (swapState.buyAmount === swapStateRef.current.buyAmount) {
          setInternalSwapState((s) => ({
            ...s,
            sellAmount: toDisplayAmount(sellAsset, quote.amountIn),
            sellAmountPerOneBuy,
          }));
        }
      }
    };

    if (swapState.sellAsset && swapState.buyAsset && quote) {
      simulate(quote, swapState);
    }
  }, [quote, swapState.sellAsset?.symbol, swapState.buyAsset?.symbol]);
};
