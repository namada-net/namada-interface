import BigNumber from "bignumber.js";

export const proposalStatuses = [
  "pending",
  "ongoing",
  "executedRejected",
  "executedPassed",
] as const;

export type ProposalStatus = (typeof proposalStatuses)[number];

export const isProposalStatus = (str: string): str is ProposalStatus =>
  proposalStatuses.includes(str as ProposalStatus);

export type ProposalWithData = {
  proposal: Proposal;
  encodedData?: EncodedProposalData;
  decodedData: ProposalData;
};

export type Proposal = {
  id: bigint;
  author: string;
  content: { [key: string]: string | undefined };
  startEpoch: bigint;
  endEpoch: bigint;
  activationEpoch: bigint;
  startTime: bigint;
  endTime: bigint;
  activationTime: bigint;
  currentTime: bigint;
  proposalType: ProposalType;
  tallyType: TallyType;
  status: ProposalStatus;
  totalVotingPower: BigNumber;
} & {
  [VT in VoteType]: BigNumber;
};

export type AddRemove = {
  add?: string;
  remove: string[];
};

export type PgfTarget = {
  internal: {
    amount: BigNumber;
    target: string;
  };
};

export type PgfIbcTarget = {
  ibc: {
    amount: BigNumber;
    target: string;
    channelId: string;
    portId: string;
  };
};

export type PgfActions = {
  continuous: {
    add: (PgfTarget | PgfIbcTarget)[];
    remove: (PgfTarget | PgfIbcTarget)[];
  };
  retro: (PgfTarget | PgfIbcTarget)[];
};

export type Default = { type: "default" };
export type DefaultWithWasm = { type: "default_with_wasm"; data: string };
export type PgfSteward = { type: "pgf_steward"; data: AddRemove };
export type PgfPayment = { type: "pgf_payment"; data: PgfActions };
export type ProposalType =
  | "default"
  | "default_with_wasm"
  | "pgf_steward"
  | "pgf_payment";
export type ProposalData = Default | DefaultWithWasm | PgfSteward | PgfPayment;
export type EncodedProposalData = {
  data?: string;
  hash?: string;
  type: ProposalType;
};

export const voteTypes = ["yay", "nay", "abstain"] as const;
export type VoteType = (typeof voteTypes)[number];
export type UnknownVoteType = "unknown";

export const isVoteType = (str: string): str is VoteType =>
  voteTypes.includes(str as VoteType);

export type Votes = Record<VoteType, BigNumber>;

type VoteCommonProperties = {
  address: string;
  voteType: VoteType;
};

export type ValidatorVote = {
  isValidator: true;
  votingPower: BigNumber;
} & VoteCommonProperties;

export const isValidatorVote = (vote: Vote): vote is ValidatorVote =>
  vote.isValidator;

export type DelegatorVote = {
  isValidator: false;
  votingPower: [string, BigNumber][];
} & VoteCommonProperties;

export const isDelegatorVote = (vote: Vote): vote is DelegatorVote =>
  !vote.isValidator;

export type Vote = DelegatorVote | ValidatorVote;

export const tallyTypes = [
  "two-fifths",
  "one-half-over-one-third",
  "less-one-half-over-one-third-nay",
] as const;

export type TallyType = (typeof tallyTypes)[number];

export const isTallyType = (tallyType: string): tallyType is TallyType =>
  tallyTypes.includes(tallyType as TallyType);
