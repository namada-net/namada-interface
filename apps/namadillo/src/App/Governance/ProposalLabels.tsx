import { InsetLabel, RoundedLabel } from "@namada/components";
import {
  ProposalStatus,
  ProposalType,
  UnknownVoteType,
  VoteType,
} from "@namada/types";
import { assertNever } from "@namada/utils";
import { BsQuestionCircleFill } from "react-icons/bs";
import { GoCheckCircleFill, GoSkipFill, GoXCircleFill } from "react-icons/go";
import { twMerge } from "tailwind-merge";
import { proposalStatusToString, proposalTypeStringToString } from "utils";

export const StatusLabel: React.FC<
  {
    status: ProposalStatus;
  } & React.ComponentProps<typeof RoundedLabel>
> = ({ status, className, ...rest }) => {
  const statusClassName =
    status === "pending" ? "text-upcoming"
    : status === "ongoing" ? "text-intermediate"
    : status === "executedPassed" ? "text-success"
    : status === "executedRejected" ? "text-fail"
    : assertNever(status);

  return (
    <RoundedLabel className={twMerge(className, statusClassName)} {...rest}>
      {proposalStatusToString(status)}
    </RoundedLabel>
  );
};

type VotedLabelProps = {
  vote: VoteType | UnknownVoteType;
} & React.ComponentProps<"div">;

export const VotedLabel: React.FC<VotedLabelProps> = ({
  vote,
  className,
  ...props
}) => {
  const { icon, label, color } =
    vote === "yay" ?
      { icon: <GoCheckCircleFill />, label: "Voted yes", color: "text-yay" }
    : vote === "nay" ?
      { icon: <GoXCircleFill />, label: "Voted no", color: "text-nay" }
    : vote === "abstain" ?
      {
        icon: <GoSkipFill className="rotate-45" />,
        label: "Voted abstain",
        color: "text-abstain",
      }
    : vote === "unknown" ?
      {
        icon: <BsQuestionCircleFill />,
        label: "Vote unknown",
        color: "text-abstain",
      }
    : assertNever(vote);

  return (
    <RoundedLabel
      {...props}
      className={twMerge("flex gap-1 py-1 px-2 items-center", color, className)}
    >
      <div className="grow">{label}</div>
      <i className="inline-flex text-lg">{icon}</i>
    </RoundedLabel>
  );
};

export const TypeLabel: React.FC<
  {
    proposalType: ProposalType;
  } & React.ComponentProps<typeof InsetLabel>
> = ({ proposalType, ...rest }) => (
  <InsetLabel className="text-xs leading-[1.65em]" {...rest}>
    {proposalTypeStringToString(proposalType)}
  </InsetLabel>
);
