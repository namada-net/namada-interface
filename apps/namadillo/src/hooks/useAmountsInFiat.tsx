import { shieldedTokensAtom, transparentTokensAtom } from "atoms/balance";
import { getTotalDollar } from "atoms/balance/functions";
import { nativeTokenAddressAtom } from "atoms/chain";
import { tokenPricesFamily } from "atoms/prices/atoms";
import { getStakingTotalAtom } from "atoms/staking";
import BigNumber from "bignumber.js";
import { useAtomValue } from "jotai";
import { AtomWithQueryResult } from "jotai-tanstack-query";
import { useMemo } from "react";

type AmountsInFiatOutput = {
  shieldedAmountInFiat: BigNumber;
  unshieldedAmountInFiat: BigNumber;
  stakingAmountInFiat: BigNumber;
  totalAmountInFiat: BigNumber;
  shieldedQuery: AtomWithQueryResult;
  unshieldedQuery: AtomWithQueryResult;
  stakingQuery: AtomWithQueryResult;
  isLoading: boolean;
  hasAnyAssets: boolean;
  hasShieldedAssets: boolean;
  hasUnshieldedAssets: boolean;
  hasStakingAssets: boolean;
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

  const stakingDollars = useMemo(() => {
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
  }, [
    stakingTotalsQuery.data,
    nativeTokenAddressQuery.data,
    tokenPricesQuery.data,
  ]);

  const totalAmountInDollars = shieldedDollars
    .plus(unshieldedDollars)
    .plus(stakingDollars);

  const assetFlags = useMemo(() => {
    // Check if there are any shielded assets with non-zero balance
    const hasShieldedAssets = (shieldedTokensQuery.data ?? []).some((token) =>
      token.amount.gt(0)
    );

    // Check if there are any transparent assets with non-zero balance
    const hasUnshieldedAssets = (unshieldedTokensQuery.data ?? []).some(
      (token) => token.amount.gt(0)
    );

    // Check if there are any staking amounts
    const hasStakingAssets =
      stakingTotalsQuery.data ?
        stakingTotalsQuery.data.totalBonded.gt(0) ||
        stakingTotalsQuery.data.totalUnbonded.gt(0) ||
        stakingTotalsQuery.data.totalWithdrawable.gt(0)
      : false;

    return {
      hasShieldedAssets,
      hasUnshieldedAssets,
      hasStakingAssets,
      hasAnyAssets:
        hasShieldedAssets || hasUnshieldedAssets || hasStakingAssets,
    };
  }, [
    shieldedTokensQuery.data,
    unshieldedTokensQuery.data,
    stakingTotalsQuery.data,
  ]);

  return {
    shieldedQuery: shieldedTokensQuery,
    unshieldedQuery: unshieldedTokensQuery,
    stakingQuery: stakingTotalsQuery,
    totalAmountInFiat: totalAmountInDollars,
    shieldedAmountInFiat: shieldedDollars,
    unshieldedAmountInFiat: unshieldedDollars,
    stakingAmountInFiat: stakingDollars,
    ...assetFlags,
    isLoading:
      shieldedTokensQuery.isLoading ||
      unshieldedTokensQuery.isLoading ||
      stakingTotalsQuery.isLoading ||
      nativeTokenAddressQuery.isLoading ||
      tokenPricesQuery.isLoading,
  };
};
