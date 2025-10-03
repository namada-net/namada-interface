//
// Local types specific to the swap feature, should not be used outside of it
// If any of those are used outside of the swap feature, consider moving them up to a more global types file

import BigNumber from "bignumber.js";

export enum SwapStatus {
  Idle = "Idle",
  Review = "Review",
  Building = "Building",
  AwaitingSignature = "AwaitingSignature",
  Broadcasting = "Broadcasting",
  Confirming = "Confirming",
  Completed = "Completed",
  Error = "Error",
}

export const statusMessages: Record<
  SwapStatus,
  { title: string; description: string }
> = {
  [SwapStatus.Idle]: {
    title: "Ready to swap",
    description: "Review the details and submit your swap.",
  },
  [SwapStatus.Review]: {
    title: "Reviewing transaction",
    description: "Please review the transaction details before proceeding.",
  },
  [SwapStatus.Building]: {
    title: "Building transaction",
    description:
      "Your transaction is being built. This may take a few moments.",
  },
  [SwapStatus.AwaitingSignature]: {
    title: "Awaiting signature",
    description: "Please sign the transaction in your wallet.",
  },
  [SwapStatus.Broadcasting]: {
    title: "Broadcasting transaction",
    description: "Your transaction is being broadcast to the network.",
  },
  [SwapStatus.Confirming]: {
    title: "Confirming transaction",
    description:
      "Your transaction is being confirmed. This may take a few moments.",
  },
  [SwapStatus.Completed]: {
    title: "Swap completed",
    description: "Your swap has been successfully completed.",
  },
  [SwapStatus.Error]: {
    title: "Transaction error",
    description: "An error occurred during the transaction. Please try again.",
  },
};

// TODO: make this type mroe specific
export type SwapState = {
  mode: "sell" | "buy" | "none";
  sellAmount?: BigNumber;
  buyAmount?: BigNumber;
  unitPrice?: BigNumber;
};

export type SwapQuote = {
  amountIn: BigNumber;
  amountOut: BigNumber;
  minAmount: BigNumber;
  effectiveFee: BigNumber;
  priceImpact: BigNumber;
  routes: {
    pools: {
      poolId: string;
      tokenOutDenom: string;
    }[];
  }[];
};
