import BigNumber from "bignumber.js";
import { useMemo } from "react";
import { NamadaAsset } from "types";
import { SwapState } from "../state";

export const useSwapValidation = ({
  mode,
  sellAmount,
  buyAmount,
  buyAsset,
  sellAsset,
  availableAmountMinusFees,
  walletAddress,
}: {
  mode: SwapState["mode"];
  sellAmount?: BigNumber;
  buyAmount?: BigNumber;
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
    } else if (mode === "none") {
      return "SwapModeNone";
    } else if (!sellAmount || sellAmount.isZero()) {
      return "SellAmountIsZero";
    } else if (!buyAmount || buyAmount.isZero()) {
      return "BuyAmountIsZero";
    } else if (
      !availableAmountMinusFees ||
      (sellAmount &&
        availableAmountMinusFees &&
        sellAmount.gt(availableAmountMinusFees))
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
    mode,
    sellAmount,
    buyAmount,
    walletAddress,
  ]);
};
