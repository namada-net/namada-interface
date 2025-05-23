import { Panel } from "@namada/components";
import { NavigationFooter } from "App/AccountOverview/NavigationFooter";
import { TotalStakeBanner } from "App/AccountOverview/TotalStakeBanner";
import { ConnectBanner } from "App/Common/ConnectBanner";
import { PageWithSidebar } from "App/Common/PageWithSidebar";
import { Sidebar } from "App/Layout/Sidebar";
import { ValidatorDiversification } from "App/Sidebars/ValidatorDiversification";
import { YourStakingDistribution } from "App/Sidebars/YourStakingDistribution";
import { myValidatorsAtom } from "atoms/validators";
import { useUserHasAccount } from "hooks/useIsAuthenticated";
import { useAtomValue } from "jotai";
import { AllValidatorsTable } from "./AllValidatorsTable";
import { MyValidatorsTable } from "./MyValidatorsTable";
import { UnbondedTable } from "./UnbondedTable";
import { UnbondingAmountsTable } from "./UnbondingAmountsTable";
import { WithdrawalButton } from "./WithdrawalButton";

export const StakingOverview = (): JSX.Element => {
  const userHasAccount = useUserHasAccount();
  const myValidators = useAtomValue(myValidatorsAtom);
  const hasStaking = myValidators.data?.some((v) => v.stakedAmount?.gt(0));
  const hasUnbonded = myValidators.data?.some((v) => v.unbondedAmount?.gt(0));
  const hasWithdrawableAmounts = myValidators.data?.some((v) =>
    v.withdrawableAmount?.gt(0)
  );

  return (
    <PageWithSidebar>
      <div className="flex flex-col flex-1 gap-2">
        {!userHasAccount && <ConnectBanner actionText="To stake" />}
        {userHasAccount && <TotalStakeBanner />}
        {hasStaking && (
          <Panel title="My Validators">
            <MyValidatorsTable />
          </Panel>
        )}

        {hasWithdrawableAmounts && (
          <Panel title="Unbonded">
            <div className="flex justify-end -mt-15">
              <WithdrawalButton disabled={false} />
            </div>
            <UnbondedTable />
          </Panel>
        )}
        {hasUnbonded && (
          <Panel title="Unbonding" className="relative">
            <UnbondingAmountsTable />
          </Panel>
        )}
        <Panel
          className="relative pb-6 overflow-hidden flex-1"
          title="All Validators"
        >
          <AllValidatorsTable />
        </Panel>
        <NavigationFooter className="flex-none h-16" />
      </div>
      <Sidebar>
        {hasStaking && myValidators.isSuccess && (
          <Panel className="w-full @container">
            <YourStakingDistribution myValidators={myValidators.data!} />
          </Panel>
        )}
        <Panel>
          <ValidatorDiversification />
        </Panel>
      </Sidebar>
    </PageWithSidebar>
  );
};
