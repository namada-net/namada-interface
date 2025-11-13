import BigNumber from "bignumber.js";
import { useAtomValue } from "jotai";
import { useMemo, useRef } from "react";
import { toDisplayAmount } from "utils";
import { SwapQuote } from "../state";
import { swapQuoteAtom, swapStateAtom } from "../state/atoms";

export const useSwapSellAmount = (): BigNumber | undefined => {
  const {
    mode,
    sellAsset,
    sellAmount: stateSellAmount,
  } = useAtomValue(swapStateAtom);
  const quote = useAtomValue(swapQuoteAtom).data;

  const lastQuoteRef = useRef<SwapQuote | null>(null);

  const sellAmount = useMemo(() => {
    if (mode === "sell" || mode === "none") {
      return stateSellAmount;
    }

    // Update ref when we have a quote
    if (quote) {
      lastQuoteRef.current = quote;
    }

    // Use current quote or fallback to last known quote
    const quoteToUse = quote ?? lastQuoteRef.current;

    if (quoteToUse && sellAsset) {
      return toDisplayAmount(sellAsset, quoteToUse.amountIn);
    }
  }, [mode, stateSellAmount, quote, sellAsset]);

  return sellAmount;
};
