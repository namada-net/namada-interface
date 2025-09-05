import { Panel, SkeletonLoading } from "@namada/components";
import { NavigationFooter } from "App/AccountOverview/NavigationFooter";
import { ConnectBanner } from "App/Common/ConnectBanner";
import { PageWithSidebar } from "App/Common/PageWithSidebar";
import { Sidebar } from "App/Layout/Sidebar";
import { allProposalsAtom, votedProposalsAtom } from "atoms/proposals";
import {
  atomsAreFetching,
  atomsAreLoaded,
  useNotifyOnAtomError,
} from "atoms/utils";
import { useUserHasAccount } from "hooks/useIsAuthenticated";
import { useAtomValue } from "jotai";
import { AllProposalsTable } from "./AllProposalsTable";
import { LearnAboutGovernance } from "./LearnAboutGovernance";
import { LiveGovernanceProposals } from "./LiveGovernanceProposals";
import { ProposalListPanel } from "./ProposalListPanel";
import { ProposalsSummary } from "./ProposalsSummary";
import { UpcomingProposals } from "./UpcomingProposals";

export const GovernanceOverview: React.FC = () => {
  const allProposals = useAtomValue(allProposalsAtom);
  const votedProposals = useAtomValue(votedProposalsAtom);
  const userHasAccount = useUserHasAccount();

  // TODO: is there a better way than this to show that votedProposalIdsAtom
  // is dependent on isConnected?
  const extensionAtoms = userHasAccount ? [votedProposals] : [];
  const activeAtoms = [allProposals, ...extensionAtoms];

  const liveProposals =
    allProposals.data?.proposals?.filter(
      (proposal) => proposal.status === "ongoing"
    ) || [];

  const upcomingProposals =
    allProposals.data?.proposals?.filter(
      (proposal) => proposal.status === "pending"
    ) || [];

  useNotifyOnAtomError(activeAtoms, [
    allProposals.isError,
    votedProposals.isError,
  ]);

  return (
    <PageWithSidebar>
      <div className="flex flex-col gap-2">
        {!userHasAccount && <ConnectBanner actionText="To vote" />}
        <ProposalListPanel
          title="Live Proposals"
          errorText="Unable to load live governance proposals"
          emptyText="There are no live proposals"
          isEmpty={liveProposals.length === 0}
          atoms={activeAtoms}
        >
          <LiveGovernanceProposals
            proposals={liveProposals}
            votedProposals={votedProposals.data || []}
          />
        </ProposalListPanel>
        <ProposalListPanel
          title="Upcoming Proposals"
          errorText="Unable to load upcoming proposals"
          emptyText="There are no upcoming proposals"
          isEmpty={upcomingProposals.length === 0}
          atoms={[allProposals]}
        >
          <UpcomingProposals proposals={upcomingProposals} />
        </ProposalListPanel>
        <ProposalListPanel
          className="flex-1"
          title="All Proposals"
          errorText="Unable to load the list of proposals"
          atoms={[]}
        >
          <AllProposalsTable
            votedProposalIds={(votedProposals.data || []).map(
              (v) => v.proposalId
            )}
          />
        </ProposalListPanel>
        <NavigationFooter className="flex-none h-16" />
      </div>
      <Sidebar>
        <Panel>
          {atomsAreFetching(allProposals) && (
            <SkeletonLoading height="150px" width="100%" />
          )}
          {atomsAreLoaded(allProposals) && (
            <ProposalsSummary
              allProposals={allProposals.data?.proposals || []}
            />
          )}
        </Panel>
        <LearnAboutGovernance />
      </Sidebar>
    </PageWithSidebar>
  );
};
