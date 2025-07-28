import { shieldedTokensAtom, transparentTokensAtom } from "atoms/balance";
import { getTotalDollar } from "atoms/balance/functions";
import { nativeTokenAddressAtom } from "atoms/chain";
import { tokenPricesFamily } from "atoms/prices/atoms";
import { getStakingTotalAtom } from "atoms/staking";
import BigNumber from "bignumber.js";
import { useAtomValue } from "jotai";
import { AtomWithQueryResult } from "jotai-tanstack-query";

type AmountsInFiatOutput = {
  shieldedAmountInFiat: BigNumber;
  unshieldedAmountInFiat: BigNumber;
  stakingAmountInFiat: BigNumber;
  totalAmountInFiat: BigNumber;
  shieldedQuery: AtomWithQueryResult;
  unshieldedQuery: AtomWithQueryResult;
  stakingQuery: AtomWithQueryResult;
};

export const useAmountsInFiat = (): AmountsInFiatOutput => {
  const shieldedTokensQuery = useAtomValue(shieldedTokensAtom);
  const unshieldedTokensQuery = useAtomValue(transparentTokensAtom);
  const stakingTotalsQuery = useAtomValue(getStakingTotalAtom);
  const nativeTokenAddressQuery = useAtomValue(nativeTokenAddressAtom);
  const tokenPricesQuery = useAtomValue(
    tokenPricesFamily(
      nativeTokenAddressQuery.data ? [nativeTokenAddressQuery.data] : []
    )
  );

  const shieldedDollars = getTotalDollar(shieldedTokensQuery.data);
  const unshieldedDollars = getTotalDollar(unshieldedTokensQuery.data);

  const stakingDollars = (() => {
    if (
      !stakingTotalsQuery.data ||
      !nativeTokenAddressQuery.data ||
      !tokenPricesQuery.data
    ) {
      return new BigNumber(0);
    }

    const { totalBonded, totalUnbonded, totalWithdrawable } =
      stakingTotalsQuery.data;
    const totalStakingAmount = totalBonded
      .plus(totalUnbonded)
      .plus(totalWithdrawable);
    const namPrice =
      tokenPricesQuery.data[nativeTokenAddressQuery.data] ?? new BigNumber(0);

    return totalStakingAmount.multipliedBy(namPrice);
  })();

  const totalAmountInDollars = shieldedDollars
    .plus(unshieldedDollars)
    .plus(stakingDollars);

  return {
    shieldedQuery: shieldedTokensQuery,
    unshieldedQuery: unshieldedTokensQuery,
    stakingQuery: stakingTotalsQuery,
    totalAmountInFiat: totalAmountInDollars,
    shieldedAmountInFiat: shieldedDollars,
    unshieldedAmountInFiat: unshieldedDollars,
    stakingAmountInFiat: stakingDollars,
  };
};
