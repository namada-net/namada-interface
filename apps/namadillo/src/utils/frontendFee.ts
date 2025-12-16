import { FrontendSusFeeProps } from "@namada/sdk-multicore";
import { assertNever } from "@namada/utils";
import BigNumber from "bignumber.js";
import { FrontendFee, FrontendFeeEntry } from "types";

export const getFrontendFeeEntry = (
  frontendFee: FrontendFee,
  address: string
): FrontendFeeEntry | undefined => {
  return frontendFee[address] || frontendFee["*"];
};

export const frontendSusMsgFromConfig = (
  frontendFee: FrontendFee,
  token: string,
  whichTarget: "shielded" | "transparent"
): FrontendSusFeeProps | undefined => {
  const entry = getFrontendFeeEntry(frontendFee, token);
  if (!entry) return;

  const { percentage, shieldedTarget, transparentTarget } = entry;

  const target =
    whichTarget === "shielded" ? shieldedTarget
    : whichTarget === "transparent" ? transparentTarget
    : assertNever(whichTarget);

  const frontendSusFee = {
    percentage: percentage,
    target,
  };

  return frontendSusFee;
};

export const calculateAmountWithoutFrontendFee = (
  displayAmount: BigNumber,
  frontendFee: FrontendFeeEntry
): BigNumber => {
  return (
    displayAmount
      .div(frontendFee.percentage.plus(1))
      // We have to round UP here as sdk discards the remainder when calculating the fee,
      // basically rounding down. Otherwise we might end up with remaining dust.
      .decimalPlaces(6, BigNumber.ROUND_UP)
  );
};

export const calculateAmountWithFrontendFee = (
  displayAmount: BigNumber,
  frontendFee: FrontendFeeEntry
): BigNumber => {
  return displayAmount
    .multipliedBy(frontendFee.percentage.plus(1))
    .decimalPlaces(6, BigNumber.ROUND_DOWN);
};

export const calculateFrontendFeeAmount = (
  displayAmount: BigNumber,
  frontendFee: FrontendFeeEntry
): BigNumber => {
  return displayAmount
    .multipliedBy(frontendFee.percentage)
    .decimalPlaces(6, BigNumber.ROUND_DOWN);
};
