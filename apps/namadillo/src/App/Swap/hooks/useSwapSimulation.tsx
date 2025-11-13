import invariant from "invariant";
import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { toDisplayAmount } from "utils";
import { SwapQuote, SwapState } from "../state";
import {
  internalSwapStateAtom,
  swapQuoteAtom,
  swapStateAtom,
} from "../state/atoms";

export const useSwapSimulation = (): void => {
  const { data: quote } = useAtomValue(swapQuoteAtom);
  const [internalSwapState, setInternalSwapState] = useAtom(
    internalSwapStateAtom
  );
  const swapState = useAtomValue(swapStateAtom);

  useEffect(() => {
    const simulate = (quote: SwapQuote, swapState: SwapState): void => {
      const { sellAsset, buyAsset } = swapState;
      // Sanity checks
      invariant(buyAsset, "Buy asset is required for simulation");
      invariant(sellAsset, "Sell asset is required for simulation");

      const simulateSell =
        swapState.mode === "sell" || swapState.mode === "none";
      const simulateBuy = swapState.mode === "buy";

      if (simulateSell && sellAsset) {
        if (swapState.sellAmount === internalSwapState.sellAmount) {
          setInternalSwapState((s) => ({
            ...s,
            buyAmount: toDisplayAmount(buyAsset, quote.amountOut),
          }));
        }
      } else if (simulateBuy && buyAsset) {
        if (swapState.buyAmount === internalSwapState.buyAmount) {
          setInternalSwapState((s) => ({
            ...s,
            sellAmount: toDisplayAmount(sellAsset, quote.amountIn),
          }));
        }
      }
    };

    if (swapState.sellAsset && swapState.buyAsset && quote) {
      simulate(quote, swapState);
    }
  }, [quote, swapState.sellAsset?.symbol, swapState.buyAsset?.symbol]);
};
