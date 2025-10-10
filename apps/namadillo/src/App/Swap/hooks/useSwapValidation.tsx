import BigNumber from "bignumber.js";
import { useMemo } from "react";
import { NamadaAsset } from "types";
import { SwapState } from "../state";

export const useSwapValidation = ({
  swapState,
  buyAsset,
  sellAsset,
  availableAmountMinusFees,
  walletAddress,
}: {
  swapState: SwapState;
  buyAsset?: NamadaAsset;
  sellAsset?: NamadaAsset;
  availableAmountMinusFees?: BigNumber;
  walletAddress?: string;
}): string => {
  return useMemo(() => {
    if (!sellAsset) {
      return "NoSellAssetSelected";
    } else if (!buyAsset) {
      return "NoBuyAssetSelected";
    } else if (swapState.mode === "none") {
      return "SwapModeNone";
    } else if (!swapState.sellAmount || swapState.sellAmount.isZero()) {
      return "SellAmountIsZero";
    } else if (!swapState.buyAmount || swapState.buyAmount.isZero()) {
      return "BuyAmountIsZero";
    } else if (
      !availableAmountMinusFees ||
      (swapState.sellAmount &&
        availableAmountMinusFees &&
        swapState.sellAmount.gt(availableAmountMinusFees))
    ) {
      return "SellAmountExceedsBalance";
    } else if (!walletAddress) {
      return "NoWalletConnected";
    } else {
      return "Ok";
    }
  }, [
    sellAsset?.address,
    buyAsset?.address,
    swapState.sellAmount,
    swapState.buyAmount,
    walletAddress,
  ]);
};
