import { Panel } from "@namada/components";

import { PageWithSidebar } from "App/Common/PageWithSidebar";
import { JoinDiscord } from "App/Sidebars/JoinDiscord";
import { useProposalIdParam } from "hooks";
import { ProposalDescription } from "./ProposalDescription";
import { ProposalHeader } from "./ProposalHeader";
import { ProposalStatusSummary } from "./ProposalStatusSummary";
import { VoteInfoCards } from "./VoteInfoCards";

export const ProposalAndVote: React.FC = () => {
  const proposalId = useProposalIdParam();

  return proposalId === null ? null : (
      <WithProposalId proposalId={proposalId} />
    );
};

const WithProposalId: React.FC<{ proposalId: bigint }> = ({ proposalId }) => (
  <PageWithSidebar>
    <div className="flex flex-col gap-2">
      <Panel className="px-3">
        <div className="px-12">
          <ProposalHeader proposalId={proposalId} />
        </div>
      </Panel>
      <Panel title="Description">
        <ProposalDescription proposalId={proposalId} />
      </Panel>
      <Panel className="py-6 px-7">
        <VoteInfoCards proposalId={proposalId} />
      </Panel>
      {/* TODO: show this once the component text is finalized
      <Panel className="py-6">
        <VoteHelpText />
      </Panel>
     */}
    </div>
    <aside className="flex flex-col gap-2">
      <Panel className="@container" title="Proposal Status">
        <ProposalStatusSummary proposalId={proposalId} />
      </Panel>
      <JoinDiscord />
    </aside>
  </PageWithSidebar>
);
