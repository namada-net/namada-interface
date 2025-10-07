import { useEffect, useRef } from "react";
import { NamadaAsset } from "types";
import { toDisplayAmount } from "utils";
import { SwapQuote, SwapState } from "../state";

export const useSwapSimulation = ({
  swapState,
  setSwapState,
  quote,
  buyAsset,
  sellAsset,
}: {
  swapState: SwapState;
  setSwapState: React.Dispatch<React.SetStateAction<SwapState>>;
  quote?: SwapQuote;
  buyAsset?: NamadaAsset;
  sellAsset?: NamadaAsset;
}): void => {
  const swapStateRef = useRef(swapState);

  useEffect(() => {
    swapStateRef.current = swapState;
  }, [swapState]);

  useEffect(() => {
    const simulate = (
      buyAsset: NamadaAsset,
      sellAsset: NamadaAsset,
      quote: SwapQuote,
      swapState: SwapState
    ): void => {
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
          setSwapState((s) => ({
            ...s,
            buyAmount: toDisplayAmount(buyAsset, quote.amountOut),
            sellAmountPerOneBuy,
          }));
        }
      } else if (simulateBuy && buyAsset) {
        if (swapState.buyAmount === swapStateRef.current.buyAmount) {
          setSwapState((s) => ({
            ...s,
            sellAmount: toDisplayAmount(sellAsset, quote.amountIn),
            sellAmountPerOneBuy,
          }));
        }
      }
    };

    if (swapState && buyAsset && sellAsset && quote) {
      simulate(buyAsset, sellAsset, quote, swapState);
    }
  }, [quote, sellAsset?.address, buyAsset?.address]);
};
