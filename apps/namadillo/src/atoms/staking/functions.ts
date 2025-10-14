import BigNumber from "bignumber.js";
import { MyValidator, StakingTotals } from "types";

export const toStakingTotal = (myValidators: MyValidator[]): StakingTotals => {
  const totalBonded = myValidators.reduce(
    (acc: BigNumber, validator: MyValidator) =>
      acc.plus(validator.stakedAmount ?? 0),
    new BigNumber(0)
  );

  const totalUnbonded = myValidators.reduce(
    (acc: BigNumber, validator: MyValidator) =>
      acc.plus(validator.unbondedAmount ?? 0),
    new BigNumber(0)
  );

  const totalWithdrawable = myValidators.reduce(
    (acc: BigNumber, validator: MyValidator) =>
      acc.plus(validator.withdrawableAmount ?? 0),
    new BigNumber(0)
  );

  return { totalBonded, totalUnbonded, totalWithdrawable };
};
