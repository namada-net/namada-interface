import BigNumber from "bignumber.js";
import { useAtomValue } from "jotai";
import { useMemo, useRef } from "react";
import { toDisplayAmount } from "utils";
import { SwapQuote } from "../state";
import { swapQuoteAtom, swapStateAtom } from "../state/atoms";

export const useSwapBuyAmount = (): BigNumber | undefined => {
  const {
    mode,
    buyAsset,
    buyAmount: stateBuyAmount,
  } = useAtomValue(swapStateAtom);
  const quote = useAtomValue(swapQuoteAtom).data;

  const lastQuoteRef = useRef<SwapQuote | null>(null);

  const buyAmount = useMemo(() => {
    if (mode === "buy") {
      return stateBuyAmount;
    }

    // Update ref when we have a quote
    if (quote) {
      lastQuoteRef.current = quote;
    }

    // Use current quote or fallback to last known quote
    const quoteToUse = quote ?? lastQuoteRef.current;

    if (quoteToUse && buyAsset) {
      return toDisplayAmount(buyAsset, quoteToUse.amountOut);
    }
  }, [mode, stateBuyAmount, quote, buyAsset]);

  return buyAmount;
};
