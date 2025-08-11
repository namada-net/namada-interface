import { ActionButton, Panel, SkeletonLoading } from "@namada/components";
import { routes } from "App/routes";
import { UnclaimedRewardsCard } from "App/Staking/UnclaimedRewardsCard";
import { transparentTokensAtom } from "atoms/balance";
import { useAmountsInFiat } from "hooks/useAmountsInFiat";
import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import { TotalBalanceCard } from "./TotalBalanceCard";
import { UnshieldedAssetTable } from "./UnshieldedAssetTable";

export const UnshieldedAssetsOverview = (): JSX.Element => {
  const navigate = useNavigate();
  const transparentTokensQuery = useAtomValue(transparentTokensAtom);
  const { unshieldedAmountInFiat } = useAmountsInFiat();
  const isLoading =
    transparentTokensQuery.isLoading ||
    (transparentTokensQuery.fetchStatus === "idle" &&
      !transparentTokensQuery.isFetched);

  const hasUnshieldedAssets =
    transparentTokensQuery.data?.some((token) => token.amount.gt(0)) ?? false;
  // Hide TotalBalanceCard if unshielded fiat amount is 0 but unshielded assets exist
  const shouldHideBalanceCard =
    transparentTokensQuery.isSuccess &&
    hasUnshieldedAssets &&
    unshieldedAmountInFiat.eq(0);

  return (
    <Panel className="relative px-6 rounded-t-none h-full">
      <div className="flex justify-between items-center gap-16 mt-4">
        {!shouldHideBalanceCard ?
          <TotalBalanceCard
            balanceInFiat={unshieldedAmountInFiat}
            footerButtons={
              <>
                <ActionButton
                  onClick={() => navigate(routes.shield)}
                  size="xs"
                  className="w-auto px-4"
                >
                  Shield Assets
                </ActionButton>
              </>
            }
          />
        : <div />}
        <UnclaimedRewardsCard />
      </div>
      {transparentTokensQuery.isSuccess && (
        <div className="mt-5 overflow-hidden">
          <UnshieldedAssetTable />
        </div>
      )}
      {isLoading && (
        <div className="flex gap-1 flex-col mt-12">
          <div className="mb-4">
            <SkeletonLoading height="1.25em" width="150px" />
          </div>
          <SkeletonLoading height="50px" width="100%" />
          <SkeletonLoading height="50px" width="100%" />
          <SkeletonLoading height="50px" width="100%" />
        </div>
      )}
    </Panel>
  );
};
