import { Panel, SkeletonLoading, Stack, Tooltip } from "@namada/components";
import { FiatCurrency } from "App/Common/FiatCurrency";
import { MaspSyncIndicator } from "App/Layout/MaspSyncIndicator";
import { shieldedBalanceAtom } from "atoms/balance";
import { applicationFeaturesAtom } from "atoms/settings";
import clsx from "clsx";
import { useAmountsInFiat } from "hooks/useAmountsInFiat";
import { useRequiresNewShieldedSync } from "hooks/useRequiresNewShieldedSync";
import { useAtomValue } from "jotai";
import { GoInfo } from "react-icons/go";

export const TotalBalanceBanner = (): JSX.Element => {
  const { namTransfersEnabled } = useAtomValue(applicationFeaturesAtom);
  const { isFetching: isShieldSyncing } = useAtomValue(shieldedBalanceAtom);
  const requiresNewShieldedSync = useRequiresNewShieldedSync();
  const shouldWaitForShieldedSync = requiresNewShieldedSync && isShieldSyncing;
  const {
    shieldedQuery,
    unshieldedQuery,
    stakingQuery,
    totalAmountInFiat,
    hasUnshieldedAssets,
    hasShieldedAssets,
  } = useAmountsInFiat();
  const balancesHaveLoaded =
    shieldedQuery.isSuccess &&
    unshieldedQuery.isSuccess &&
    stakingQuery.isSuccess;
  const hasErrors =
    shieldedQuery.isError && unshieldedQuery.isError && stakingQuery.isError;
  const balanceIsLoading = !balancesHaveLoaded && !hasErrors;
  const hasAnyAssets = hasUnshieldedAssets || hasShieldedAssets;

  // Hide banner if totalAmountInFiat is 0 but we have assets (means pricing is unavailable)
  const shouldHideBanner =
    balancesHaveLoaded && hasAnyAssets && totalAmountInFiat.eq(0);

  if (shouldHideBanner) return <></>;

  return (
    <Panel className="py-4">
      <Stack
        direction="horizontal"
        className="items-center justify-between px-4"
      >
        <div className="text-white">
          <header className="text-sm mb-3">
            <div className="flex items-center">
              Total Balance in Namada
              <span className="relative px-1.5 text-yellow group/tooltip">
                <GoInfo />
                <Tooltip className="z-40 w-74 mt-4" position="right">
                  This includes the transparent balance, shielded balance, total
                  staked, total unbonding and total withdrawable NAM
                </Tooltip>
              </span>
            </div>
            {!namTransfersEnabled && (
              <small className="block text-xxs text-neutral-400">
                Balance excludes NAM until phase 5
              </small>
            )}
          </header>
          {balanceIsLoading && (
            <SkeletonLoading height="1em" width="200px" className="text-5xl" />
          )}
          {balancesHaveLoaded && (
            <div className={clsx("flex items-center text-5xl leading-none")}>
              <FiatCurrency amount={totalAmountInFiat} />
              {shouldWaitForShieldedSync && (
                <div className="z-30 ml-5">
                  <MaspSyncIndicator
                    syncingChildren={
                      <div className="text-sm text-white leading-normal">
                        Syncing your shielded assets now. Balances will update
                        when sync is complete.
                      </div>
                    }
                    syncedChildren={<div>Shielded sync completed</div>}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        {/* <aside className="hidden lg:flex gap-4 items-center flex-wrap">
          <ActionButton
            onClick={() =>
              navigate(routes.maspShield)
            }
            size="sm"
            className="w-auto px-3 py-1.5"
          >
            Shield your Assets!
          </ActionButton>
          <div className="w-[140px]">
            <TokensAnimation />
          </div>
        </aside> */}
      </Stack>
    </Panel>
  );
};
