//
// Local types specific to the swap feature, should not be used outside of it
// If any of those are used outside of the swap feature, consider moving them up to a more global types file

import BigNumber from "bignumber.js";
import { NamadaAsset } from "types";

export type SwapStatusType =
  | { t: "Idle" }
  | { t: "Review" }
  | { t: "Building" }
  | { t: "AwaitingSignature" }
  | { t: "Broadcasting" }
  | { t: "Confirming"; txHash: string }
  | { t: "Completed" }
  | { t: "Error"; message: string };

export const SwapStatus = {
  idle: (): SwapStatusType => ({ t: "Idle" }),
  review: (): SwapStatusType => ({ t: "Review" }),
  building: (): SwapStatusType => ({ t: "Building" }),
  awaitingSignature: (): SwapStatusType => ({ t: "AwaitingSignature" }),
  broadcasting: (): SwapStatusType => ({ t: "Broadcasting" }),
  confirming: (txHash: string): SwapStatusType => ({ t: "Confirming", txHash }),
  completed: (): SwapStatusType => ({ t: "Completed" }),
  error: (message: string): SwapStatusType => ({ t: "Error", message }),
};

export const statusMessages: Record<
  SwapStatusType["t"],
  { title: string; description: string }
> = {
  Idle: {
    title: "Ready to swap",
    description: "Review the details and submit your swap.",
  },
  Review: {
    title: "Reviewing transaction",
    description: "Please review the transaction details before proceeding.",
  },
  Building: {
    title: "Building transaction",
    description:
      "Your transaction is being built. This may take a few moments.",
  },
  AwaitingSignature: {
    title: "Awaiting signature",
    description: "Please sign the transaction in your wallet.",
  },
  Broadcasting: {
    title: "Broadcasting transaction",
    description: "Your transaction is being broadcast to the network.",
  },
  Confirming: {
    title: "Confirming transaction",
    description:
      "Your transaction is being confirmed. This may take a few moments.",
  },
  Completed: {
    title: "Swap completed",
    description: "Your swap has been successfully completed.",
  },
  Error: {
    title: "Transaction error",
    description: "An error occurred during the transaction. Please try again.",
  },
};

export type SwapState = {
  mode: "sell" | "buy" | "none";
  sellAmount?: BigNumber;
  buyAmount?: BigNumber;
  sellAsset?: NamadaAsset;
  buyAsset?: NamadaAsset;
};

export type SwapQuote = {
  amountIn: BigNumber;
  amountOut: BigNumber;
  amount: BigNumber;
  effectiveFee: BigNumber;
  priceImpact: BigNumber;
  routes: {
    pools: {
      poolId: string;
      tokenOutDenom: string;
    }[];
  }[];
};
