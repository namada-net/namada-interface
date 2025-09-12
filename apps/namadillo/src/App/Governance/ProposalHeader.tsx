import { fromHex } from "@cosmjs/encoding";
import {
  ActionButton,
  ProgressBar as ProgressBarComponent,
  Stack,
} from "@namada/components";
import {
  EncodedProposalData,
  Proposal,
  UnknownVoteType,
  VoteType,
} from "@namada/types";
import { routes } from "App/routes";
import {
  canVoteAtom,
  proposalDataFamily,
  proposalFamily,
  proposalVoteFamily,
} from "atoms/proposals";
import clsx from "clsx";
import { useUserHasAccount } from "hooks/useIsAuthenticated";
import { useAtomValue } from "jotai";
import { AtomWithQueryResult } from "jotai-tanstack-query";
import { FaChevronLeft } from "react-icons/fa";
import { SiWebassembly } from "react-icons/si";
import { VscJson } from "react-icons/vsc";
import { generatePath, Link, useNavigate } from "react-router-dom";
import { proposalIdToString } from "utils";
import {
  secondsToDateTimeString,
  secondsToFullDateTimeString,
  secondsToTimeRemainingString,
} from "utils/dates";
import {
  StatusLabel as StatusLabelComponent,
  TypeLabel as TypeLabelComponent,
  VotedLabel as VotedLabelComponent,
} from "./ProposalLabels";

export const ProposalHeader: React.FC<{
  proposalId: bigint;
}> = ({ proposalId }) => {
  const proposal = useAtomValue(proposalFamily(proposalId));
  const proposalData = useAtomValue(proposalDataFamily(proposalId));
  const vote = useAtomValue(proposalVoteFamily(proposalId));

  return (
    <>
      <div className="flex mb-5">
        <div className="w-full">
          <Breadcrumbs proposalId={proposalId} />
          <BackButton />
          <Stack gap={2.5} className="mt-4">
            <TypeLabel proposal={proposal} />
            <Title proposal={proposal} proposalId={proposalId} />
          </Stack>
        </div>
        <Stack gap={2}>
          <JsonButton proposalId={proposalId} />
          <WasmButton proposal={proposal} proposalData={proposalData} />
        </Stack>
      </div>
      <hr className="border-neutral-900 w-full mb-4" />
      <div className="flex gap-2 mb-4">
        <StatusLabel proposal={proposal} />
        <VotedLabel vote={vote} />
      </div>
      <div className="flex gap-10 bg-neutral-900 mb-9 px-5 py-3 -mx-3 rounded-md">
        <Progress proposal={proposal} />
        <VoteButton proposal={proposal} vote={vote} proposalId={proposalId} />
      </div>
    </>
  );
};

const Title: React.FC<{
  proposal: AtomWithQueryResult<Proposal>;
  proposalId: bigint;
}> = ({ proposal, proposalId }) => (
  <div className="text-xl">
    {proposalIdToString(proposalId)}{" "}
    {proposal.status === "pending" || proposal.status === "error" ? null : (
      proposal.data.content.title
    )}
  </div>
);

const Breadcrumbs: React.FC<{ proposalId: bigint }> = ({ proposalId }) => (
  <div className="text-sm text-neutral-500">
    <Link className="transition-colors hover:text-white" to={routes.governance}>
      Governance
    </Link>{" "}
    /&nbsp;
    <Link
      className="transition-colors hover:text-white"
      to={generatePath(routes.governanceProposal, {
        proposalId: proposalId.toString(),
      })}
    >
      Proposal {proposalIdToString(proposalId)}
    </Link>
  </div>
);

const BackButton: React.FC = () => (
  <Link
    to={routes.governance}
    className={clsx(
      "inline-flex items-center text-xs gap-1",
      "text-neutral-200 bg-neutral-900 my-2 px-2 py-0.5 rounded-sm",
      "hover:text-yellow"
    )}
  >
    <i className="text-[0.8em]">
      <FaChevronLeft />
    </i>{" "}
    Back
  </Link>
);

const TypeLabel: React.FC<{
  proposal: AtomWithQueryResult<Proposal>;
}> = ({ proposal }) =>
  proposal.status === "pending" || proposal.status === "error" ?
    null
  : <TypeLabelComponent proposalType={proposal.data.proposalType} />;

const JsonButton: React.FC<{
  proposalId: bigint;
}> = ({ proposalId }) => {
  return (
    <ActionButton
      className="px-3 py-2"
      size="xs"
      outlineColor="white"
      href={generatePath(routes.governanceJson, {
        proposalId: proposalId.toString(),
      })}
    >
      <span className="flex text-xs justify-between gap-2">
        <VscJson />
        JSON
      </span>
    </ActionButton>
  );
};

const WasmButton: React.FC<{
  proposal: AtomWithQueryResult<Proposal>;
  proposalData: AtomWithQueryResult<EncodedProposalData>;
}> = ({ proposal, proposalData }) => {
  const { disabled, href, filename } = (() => {
    if (proposal.status === "success" && proposalData.status === "success") {
      const wasmCode =
        proposalData.data.type === "default_with_wasm" ?
          fromHex(proposalData.data.data!)
        : undefined;

      if (typeof wasmCode !== "undefined") {
        const href = URL.createObjectURL(
          new Blob([wasmCode], { type: "application/octet-stream" })
        );

        const filename = `proposal-${proposal.data.id.toString()}.wasm`;

        return {
          disabled: false,
          href,
          filename,
        };
      }
    }

    return {
      disabled: true,
      href: undefined,
      filename: undefined,
    };
  })();

  return (
    <ActionButton
      className="px-3 py-2"
      outlineColor="white"
      size="xs"
      disabled={disabled}
      download={filename}
      href={href}
    >
      <span className="flex text-xs items-center justify-between gap-2">
        <SiWebassembly />
        WASM
      </span>
    </ActionButton>
  );
};

const StatusLabel: React.FC<{
  proposal: AtomWithQueryResult<Proposal>;
}> = ({ proposal }) => {
  return proposal.status === "success" ?
      <StatusLabelComponent
        status={proposal.data.status}
        className="text-xs min-w-42"
      />
    : null;
};

const Progress: React.FC<{
  proposal: AtomWithQueryResult<Proposal>;
}> = ({ proposal }) => {
  return (
    <div className="w-full grid grid-cols-2 text-xs">
      <span>Progress</span>
      <TimeRemaining proposalQuery={proposal} />
      <div className="col-span-2 mt-3 mb-2">
        <ProgressBar proposal={proposal} />
      </div>
      <ProgressStartEnd
        proposal={proposal}
        timeKey="startTime"
        className="col-start-1"
      />
      <ProgressStartEnd
        proposal={proposal}
        timeKey="endTime"
        className="text-right"
      />
    </div>
  );
};

const TimeRemaining: React.FC<{
  proposalQuery: AtomWithQueryResult<Proposal>;
}> = ({ proposalQuery }) => {
  const text = (() => {
    if (proposalQuery.status === "success") {
      const proposal = proposalQuery.data;

      if (proposal.status === "ongoing") {
        const timeRemaining = secondsToTimeRemainingString(
          proposal.currentTime,
          proposal.endTime
        );
        return timeRemaining ? `${timeRemaining} remaining` : "";
      }
    }

    return "";
  })();

  return <span className="text-right">{text}</span>;
};

const ProgressStartEnd: React.FC<{
  proposal: AtomWithQueryResult<Proposal>;
  timeKey: "startTime" | "endTime";
  className: string;
}> = ({ proposal, timeKey, className }) => (
  <div className={className}>
    {proposal.status === "pending" || proposal.status === "error" ?
      "..."
    : <div
        className="leading-tight"
        title={secondsToFullDateTimeString(proposal.data[timeKey])}
      >
        {secondsToDateTimeString(proposal.data[timeKey])}
        <div className="text-xs text-neutral-500">
          Epoch&nbsp;
          {proposal.data[
            timeKey === "startTime" ? "startEpoch" : "endEpoch"
          ].toString()}
        </div>
      </div>
    }
  </div>
);

const ProgressBar: React.FC<{
  proposal: AtomWithQueryResult<Proposal>;
}> = ({ proposal }) => {
  const { value, total } = (() => {
    const loadingData = {
      value: 0,
      total: 0,
    };

    if (proposal.status === "pending" || proposal.status === "error") {
      return loadingData;
    }

    const { endTime, startTime } = proposal.data;
    const currentTime = BigInt(Math.round(Date.now() / 1000));

    const totalProgress = endTime - startTime;
    const currentProgress = currentTime - startTime;

    return {
      value: currentProgress,
      total: totalProgress,
    };
  })();

  return (
    <ProgressBarComponent
      value={{ value, color: "#11DFDF" }}
      total={{ value: total, color: "#3A3A3A" }}
    />
  );
};

const VoteButton: React.FC<{
  proposal: AtomWithQueryResult<Proposal>;
  vote: AtomWithQueryResult<VoteType | UnknownVoteType | null>;
  proposalId: bigint;
}> = ({ proposal, vote, proposalId }) => {
  const navigate = useNavigate();
  const userHasAccount = useUserHasAccount();
  const canVote = useAtomValue(
    canVoteAtom(proposal.data?.startEpoch || BigInt(-1))
  );

  if (!userHasAccount) {
    return null;
  }

  const { disabled, onClick, text } = (() => {
    if (!proposal.isSuccess || !vote.isSuccess) {
      return {
        disabled: true,
        onClick: undefined,
        text: "Vote",
      };
    } else {
      const { status } = proposal.data;

      const disabled = !userHasAccount || !canVote.data || status !== "ongoing";

      const voted = vote.data !== null;
      const text = voted ? "Edit Vote" : "Vote";

      return {
        disabled,
        onClick: () =>
          navigate(
            generatePath(routes.governanceSubmitVote, {
              proposalId: proposalId.toString(),
            })
          ),
        text,
      };
    }
  })();

  return (
    <div className="w-32 flex items-center justify-center">
      <ActionButton
        size="sm"
        className="py-2 px-4"
        backgroundColor="white"
        disabled={disabled}
        onClick={onClick}
      >
        {text}
      </ActionButton>
    </div>
  );
};

const VotedLabel: React.FC<{
  vote: AtomWithQueryResult<VoteType | UnknownVoteType | null>;
}> = ({ vote }) => {
  if (vote.isSuccess && vote.data !== null) {
    return (
      <VotedLabelComponent vote={vote.data} className="text-xs min-w-22" />
    );
  } else {
    return null;
  }
};
