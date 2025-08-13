import { Panel } from "@namada/components";
import { NavigationFooter } from "App/AccountOverview/NavigationFooter";
import { ConnectPanel } from "App/Common/ConnectPanel";
import { useUserHasAccount } from "hooks/useIsAuthenticated";
import { Outlet } from "react-router-dom";

export const ShieldLayout = (): JSX.Element => {
  const userHasAccount = useUserHasAccount();

  if (!userHasAccount) {
    return <ConnectPanel actionText="To Shield" />;
  }

  const renderOutletContent = (): JSX.Element => (
    <Panel className="">
      <Outlet />
    </Panel>
  );

  return (
    <Panel className="min-h-full flex items-center justify-center flex-col">
      <div className="flex flex-col flex-1">{renderOutletContent()}</div>
      <NavigationFooter className="flex-none h-16 mt-10" />
    </Panel>
  );
};
