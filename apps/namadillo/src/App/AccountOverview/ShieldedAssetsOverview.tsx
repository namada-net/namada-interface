import { ActionButton, Panel } from "@namada/components";
import { MaspSyncCover } from "App/Common/MaspSyncCover";
import { ShieldedAssetTable } from "App/Masp/ShieldedAssetTable";
import { routes } from "App/routes";
import { applicationFeaturesAtom } from "atoms/settings";
import clsx from "clsx";
import { useAmountsInFiat } from "hooks/useAmountsInFiat";
import { useRequiresNewShieldedSync } from "hooks/useRequiresNewShieldedSync";
import { useAtomValue } from "jotai";
import { EstimateShieldingRewardsCard } from "./EstimateShieldingRewardsCard";
import { TotalBalanceCard } from "./TotalBalanceCard";

export const ShieldedAssetsOverview = (): JSX.Element => {
  const { shieldingRewardsEnabled } = useAtomValue(applicationFeaturesAtom);
  const { shieldedAmountInFiat, hasShieldedAssets, shieldedQuery } =
    useAmountsInFiat();
  const textContainerClassList = `flex h-full gap-1 items-center justify-center`;
  const requiresNewShieldedSync = useRequiresNewShieldedSync();

  // Hide TotalBalanceCard if shielded fiat amount is 0 but shielded assets exist
  const shouldHideBalanceCard =
    shieldedQuery.isSuccess && hasShieldedAssets && shieldedAmountInFiat.eq(0);

  return (
    <Panel className="relative px-6 border-x border-b border-yellow rounded-t-none h-full">
      <div className="flex justify-between gap-16 mt-4">
        {!shouldHideBalanceCard && (
          <TotalBalanceCard
            balanceInFiat={shieldedAmountInFiat}
            isShielded={true}
            footerButtons={
              <>
                <ActionButton
                  href={routes.transfer}
                  outlineColor="yellow"
                  size="xs"
                  className="w-auto px-4"
                >
                  <span className={clsx(textContainerClassList)}>
                    Shielded Transfer
                  </span>
                </ActionButton>
              </>
            }
          />
        )}
        {shieldingRewardsEnabled && <EstimateShieldingRewardsCard />}
      </div>
      <div className="mt-10">
        <ShieldedAssetTable />
      </div>
      {requiresNewShieldedSync && <MaspSyncCover />}
    </Panel>
  );
};
