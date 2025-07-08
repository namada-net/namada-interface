import { Router } from "@remix-run/router";
import { applicationFeaturesAtom } from "atoms/settings";
import { useAtomValue } from "jotai";
import {
  Route,
  Routes,
  ScrollRestoration,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
} from "react-router-dom";
import { AccountOverview } from "./AccountOverview";
import { App } from "./App";
import { BugReport } from "./Common/BugReport";
import { NotFound } from "./Common/NotFound";
import { RouteErrorBoundary } from "./Common/RouteErrorBoundary";
import { ShieldAssetsModal } from "./Common/ShieldAssetsModal";
import { GovernanceOverview } from "./Governance/GovernanceOverview";
import { ProposalAndVote } from "./Governance/ProposalAndVote";
import { SubmitVote } from "./Governance/SubmitVote";
import { ViewJson } from "./Governance/ViewJson";
import { IbcLayout } from "./Ibc/IbcLayout";
import { IbcShieldAll } from "./Ibc/IbcShieldAll";
import { IbcTransfer } from "./Ibc/IbcTransfer";
import { IbcTransfersLayout } from "./Ibc/IbcTransfersLayout";
import { IbcWithdraw } from "./Ibc/IbcWithdraw";
import { MaspLayout } from "./Masp/MaspLayout";
import { MaspShield } from "./Masp/MaspShield";
import { MaspUnshield } from "./Masp/MaspUnshield";
import { NamadaTransfer } from "./NamadaTransfer/NamadaTransfer";
import { routes } from "./routes";
import { Advanced } from "./Settings/Advanced";
import { EnableFeatures } from "./Settings/EnableFeatures";
import { SettingsLedger } from "./Settings/SettingsLedger";
import { SettingsMain } from "./Settings/SettingsMain";
import { SettingsMASP } from "./Settings/SettingsMASP";
import { SettingsPanel } from "./Settings/SettingsPanel";
import { SettingsSignArbitrary } from "./Settings/SettingsSignArbitrary";
import { SignMessages } from "./SignMessages/SignMessages";
import IncrementBonding from "./Staking/IncrementBonding";
import { ReDelegate } from "./Staking/ReDelegate";
import { StakingOverview } from "./Staking/StakingOverview";
import { StakingRewards } from "./Staking/StakingRewards";
import { StakingWithdrawModal } from "./Staking/StakingWithdrawModal";
import { Unstake } from "./Staking/Unstake";
import { SwitchAccountPanel } from "./SwitchAccount/SwitchAccountPanel";
import { TransactionDetails } from "./Transactions/TransactionDetails";
import { TransactionHistory } from "./Transactions/TransactionHistory";
import { ReceiveCard } from "./Transfer";
import { TransferLayout } from "./Transfer/TransferLayout";

export const MainRoutes = (): JSX.Element => {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location };
  const features = useAtomValue(applicationFeaturesAtom);

  // Avoid animation being fired twice when navigating inside settings modal routes
  const settingsAnimationKey =
    location.pathname.indexOf(routes.settings) > -1 ?
      "settings-modal"
    : location.pathname;

  return (
    <>
      <Routes location={state?.backgroundLocation || location}>
        <Route
          path={routes.root}
          element={<App />}
          errorElement={<RouteErrorBoundary />}
        >
          {/* Home */}
          <Route index element={<AccountOverview />} />

          {/* Staking */}
          <Route path={routes.staking} element={<StakingOverview />} />
          <Route
            path={routes.stakingBondingIncrement}
            element={<IncrementBonding />}
          />
          <Route path={routes.stakingBondingUnstake} element={<Unstake />} />
          <Route
            path={routes.stakingBondingRedelegate}
            element={<ReDelegate />}
          />

          {/* Receive */}
          <Route path={routes.receive} element={<ReceiveCard />} />

          {/* Governance */}
          <Route path={routes.governance} element={<GovernanceOverview />} />
          <Route
            path={routes.governanceProposal}
            element={<ProposalAndVote />}
          />
          <Route path={routes.governanceSubmitVote} element={<SubmitVote />} />
          <Route path={routes.governanceJson} element={<ViewJson />} />

          {/* Masp */}
          {features.maspEnabled && (
            <Route element={<MaspLayout />}>
              <Route path={routes.shield} element={<MaspShield />} />
              <Route path={routes.unshield} element={<MaspUnshield />} />
            </Route>
          )}

          {/* Ibc Transfers */}
          {features.ibcTransfersEnabled && (
            <Route element={<IbcTransfersLayout />}>
              <Route path={routes.ibc} element={<IbcTransfer />} />
              <Route path={routes.ibcWithdraw} element={<IbcWithdraw />} />
            </Route>
          )}

          {features.ibcTransfersEnabled && (
            <Route element={<IbcLayout />}>
              <Route path={routes.ibcShieldAll} element={<IbcShieldAll />} />
            </Route>
          )}

          {/* Transfer */}
          {(features.maspEnabled || features.namTransfersEnabled) && (
            <Route element={<TransferLayout />}>
              <Route path={routes.transfer} element={<NamadaTransfer />} />
            </Route>
          )}

          {/* Transaction History */}
          {(features.namTransfersEnabled || features.ibcTransfersEnabled) && (
            <Route>
              <Route path={routes.history} element={<TransactionHistory />} />
              <Route
                path={routes.transaction}
                element={<TransactionDetails />}
              />
            </Route>
          )}

          {/* Other */}
          <Route path={routes.bugReport} element={<BugReport />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      {/* Modals */}
      <Routes location={location} key={settingsAnimationKey}>
        <Route errorElement={<RouteErrorBoundary />}>
          {/* Settings */}
          <Route element={<SettingsPanel />}>
            <Route path={routes.settings} element={<SettingsMain />} />
            <Route path={routes.settingsAdvanced} element={<Advanced />} />
            <Route
              path={routes.settingsSignArbitrary}
              element={<SettingsSignArbitrary />}
            />
            <Route path={routes.settingsMASP} element={<SettingsMASP />} />
            <Route path={routes.settingsLedger} element={<SettingsLedger />} />
            <Route
              path={routes.settingsFeatures}
              element={<EnableFeatures />}
            />
          </Route>

          {/* Other Modals */}
          <Route path={routes.switchAccount} element={<SwitchAccountPanel />} />
          <Route path={routes.signMessages} element={<SignMessages />} />
          <Route path={routes.shieldAssets} element={<ShieldAssetsModal />} />
          <Route
            path={routes.stakingClaimRewards}
            element={<StakingRewards />}
          />
          <Route
            path={routes.stakingWithdrawal}
            element={<StakingWithdrawModal />}
          />
        </Route>
      </Routes>
      <ScrollRestoration />
    </>
  );
};

export const getRouter = (): Router => {
  return createBrowserRouter(
    createRoutesFromElements(<Route path="/*" element={<MainRoutes />} />)
  );
};
