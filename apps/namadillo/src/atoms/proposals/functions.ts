import {
  ApiV1GovProposalGetStatusEnum as ApiIndexerProposalStatusEnum,
  DefaultApi,
  Proposal as IndexerProposal,
  ProposalStatusEnum as IndexerProposalStatusEnum,
  ProposalTallyTypeEnum as IndexerProposalTallyTypeEnum,
  ProposalTypeEnum as IndexerProposalTypeEnum,
  VotingPower as IndexerVotingPower,
  Pagination,
} from "@namada/indexer-client";
import {
  Account,
  AddRemove,
  PgfActions,
  PgfIbcTarget,
  PgfTarget,
  Proposal,
  ProposalStatus,
  ProposalType,
  ProposalTypeString,
  TallyType,
  UnknownVoteType,
  VoteProposalProps,
  VoteType,
} from "@namada/types";
import { assertNever, mapUndefined } from "@namada/utils";
import BigNumber from "bignumber.js";
import * as E from "fp-ts/Either";
import * as t from "io-ts";
import { TransactionPair, buildTx, signEncodedTx } from "lib/query";
import { GasConfig } from "types";

import { ChainSettings } from "types";
import { getSdkInstance } from "utils/sdk";

const pgfTargetSchema = t.type({
  Internal: t.type({
    target: t.string,
    amount: t.string,
  }),
});
type PgfTargetJson = t.TypeOf<typeof pgfTargetSchema>;

const pgfIbcTargetSchema = t.type({
  Ibc: t.type({
    target: t.string,
    amount: t.string,
    channel_id: t.string,
    port_id: t.string,
  }),
});
type PgfIbcTargetJson = t.TypeOf<typeof pgfIbcTargetSchema>;

const pgfActionsSchema = t.array(
  t.union([
    t.type({
      Continuous: t.union([
        t.type({ Add: t.union([pgfTargetSchema, pgfIbcTargetSchema]) }),
        t.type({
          Remove: t.union([pgfTargetSchema, pgfIbcTargetSchema]),
        }),
      ]),
    }),
    t.type({
      Retro: t.union([pgfTargetSchema, pgfIbcTargetSchema]),
    }),
  ])
);
type PgfActionsJson = t.TypeOf<typeof pgfActionsSchema>;

// TODO: this function is way too big
const decodeProposalType = (
  indexerProposalType: IndexerProposalTypeEnum,
  data: string | undefined
): ProposalType => {
  switch (indexerProposalType) {
    case IndexerProposalTypeEnum.Default:
      return {
        type: "default",
      };
    case IndexerProposalTypeEnum.DefaultWithWasm:
      if (typeof data === "undefined") {
        throw new Error("data was undefined for default_with_wasm proposal");
      }
      return {
        type: "default_with_wasm",
        data,
      };
    case IndexerProposalTypeEnum.PgfSteward:
      if (typeof data === "undefined") {
        throw new Error("data was undefined for pgf_steward proposal");
      }

      const addRemoveSchema = t.array(
        t.union([t.type({ Add: t.string }), t.type({ Remove: t.string })])
      );

      const addRemoveDecoded = addRemoveSchema.decode(JSON.parse(data));

      if (E.isLeft(addRemoveDecoded)) {
        throw new Error("pgf_steward data is not valid");
      }

      const addRemove = addRemoveDecoded.right.reduce<AddRemove>(
        (acc, curr) => {
          if ("Add" in curr) {
            if ("add" in acc) {
              throw new Error(
                "found multiple add addresses in PgfSteward proposal"
              );
            }
            return { ...acc, add: curr.Add };
          } else {
            return { ...acc, remove: [...acc.remove, curr.Remove] };
          }
        },
        { remove: [] }
      );

      return { type: "pgf_steward", data: addRemove };

    case IndexerProposalTypeEnum.PgfFunding:
      if (typeof data === "undefined") {
        throw new Error("data was undefined for pgf_payment proposal");
      }

      const pgfActionsDecoded = pgfActionsSchema.decode(JSON.parse(data));

      if (E.isLeft(pgfActionsDecoded)) {
        throw new Error("pgf_payment data is not valid");
      }

      const toIbcTarget = ({
        target,
        amount,
        channel_id,
        port_id,
      }: PgfIbcTargetJson["Ibc"]): PgfIbcTarget => ({
        ibc: {
          target,
          amount: BigNumber(amount),
          channelId: channel_id,
          portId: port_id,
        },
      });

      const toInternalTarget = ({
        target,
        amount,
      }: PgfTargetJson["Internal"]): PgfTarget => ({
        internal: { target, amount: BigNumber(amount) },
      });

      const toTarget = (
        target: PgfTargetJson | PgfIbcTargetJson
      ): PgfTarget | PgfIbcTarget => {
        if ("Internal" in target) {
          return toInternalTarget(target.Internal);
        } else if ("Ibc" in target) {
          return toIbcTarget(target.Ibc);
        } else {
          return assertNever(target);
        }
      };

      const mapJson = (value: PgfActionsJson): PgfActions => {
        const data: PgfActions = {
          continuous: { add: [], remove: [] },
          retro: [],
        };

        value.forEach((val) => {
          if ("Continuous" in val) {
            const continuous = val.Continuous;
            if ("Add" in continuous) {
              data.continuous.add.push(toTarget(continuous.Add));
            } else {
              data.continuous.remove.push(toTarget(continuous.Remove));
            }
          } else if ("Retro" in val) {
            data.retro.push(toTarget(val.Retro));
          }
        });

        return data;
      };

      return { type: "pgf_payment", data: mapJson(pgfActionsDecoded.right) };
    default:
      throw new Error(
        `unknown proposal type string, got ${indexerProposalType}`
      );
  }
};

const toTally = (tallyType: IndexerProposalTallyTypeEnum): TallyType => {
  switch (tallyType) {
    case IndexerProposalTallyTypeEnum.TwoFifths:
      return "two-fifths";
    case IndexerProposalTallyTypeEnum.OneHalfOverOneThird:
      return "one-half-over-one-third";
    case IndexerProposalTallyTypeEnum.LessOneHalfOverOneThirdNay:
      return "less-one-half-over-one-third-nay";
    default:
      throw new Error(`unknown tally type string, got ${tallyType}`);
  }
};

const toProposal = (
  proposal: IndexerProposal,
  votingPower: IndexerVotingPower
): Proposal => {
  const ContentSchema = t.record(t.string, t.union([t.string, t.undefined]));

  let content: Record<string, string | undefined> = {};
  try {
    const parsedContent = JSON.parse(proposal.content);
    const contentDecoded = ContentSchema.decode(parsedContent);

    if (E.isLeft(contentDecoded)) {
      console.warn("Invalid proposal content format, using fallback", contentDecoded.left);
      content = { title: "Invalid Content", description: proposal.content };
    } else {
      content = contentDecoded.right;
    }
  } catch (error) {
    console.warn("Failed to parse proposal content, using fallback", error);
    content = { title: "Parse Error", description: proposal.content };
  }

  return {
    id: BigInt(proposal.id),
    author: proposal.author,
    content,
    startEpoch: BigInt(proposal.startEpoch),
    endEpoch: BigInt(proposal.endEpoch),
    activationEpoch: BigInt(proposal.activationEpoch),
    startTime: BigInt(proposal.startTime),
    endTime: BigInt(proposal.endTime),
    activationTime: BigInt(proposal.activationTime),
    currentTime: BigInt(proposal.currentTime),
    proposalType: decodeProposalType(proposal.type, proposal.data),
    tallyType: toTally(proposal.tallyType),
    status: fromIndexerStatus(proposal.status),
    totalVotingPower: BigNumber(votingPower.totalVotingPower),
    yay: BigNumber(proposal.yayVotes || "0"),
    nay: BigNumber(proposal.nayVotes || "0"),
    abstain: BigNumber(proposal.abstainVotes || "0"),
  };
};

export const fetchProposalById = async (
  api: DefaultApi,
  id: bigint
): Promise<Proposal> => {
  // Updated API endpoint for individual proposal fetching
  const proposalPromise = api.apiV1GovProposalIdGet(Number(id));
  const totalVotingPowerPromise = api.apiV1PosVotingPowerGet();
  const [proposalResponse, votingPowerResponse] = await Promise.all([
    proposalPromise,
    totalVotingPowerPromise,
  ]);

  return toProposal(proposalResponse.data, votingPowerResponse.data);
};

export const fetchProposalDataById = async (
  api: DefaultApi,
  id: bigint
): Promise<string> => {
  // Updated API endpoint for proposal data fetching
  const proposalDataPromise = await api.apiV1GovProposalIdDataGet(
    Number(id)
  );

  // TODO: fix after fixing swagger return type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return proposalDataPromise.data as any as string;
};

const fromIndexerStatus = (
  indexerProposalStatus: IndexerProposalStatusEnum
): ProposalStatus => {
  switch (indexerProposalStatus) {
    case IndexerProposalStatusEnum.Pending:
      return "pending";
    case IndexerProposalStatusEnum.Voting:
      return "ongoing";
    case IndexerProposalStatusEnum.ExecutedRejected:
    case IndexerProposalStatusEnum.Rejected:
      return "executedRejected";
    case IndexerProposalStatusEnum.Passed:
    case IndexerProposalStatusEnum.ExecutedPassed:
      return "executedPassed";
    default:
      return assertNever(indexerProposalStatus);
  }
};

const toIndexerStatus = (
  proposalStatus: ProposalStatus
): ApiIndexerProposalStatusEnum => {
  switch (proposalStatus) {
    case "pending":
      return ApiIndexerProposalStatusEnum.Pending;
    case "ongoing":
      return ApiIndexerProposalStatusEnum.VotingPeriod;
    case "executedRejected":
      return ApiIndexerProposalStatusEnum.ExecutedRejected;
    case "executedPassed":
      return ApiIndexerProposalStatusEnum.ExecutedPassed;
    default:
      return assertNever(proposalStatus);
  }
};

const toIndexerProposalType = (
  proposalType: ProposalTypeString
): IndexerProposalTypeEnum => {
  switch (proposalType) {
    case "default":
      return IndexerProposalTypeEnum.Default;
    case "default_with_wasm":
      return IndexerProposalTypeEnum.DefaultWithWasm;
    case "pgf_steward":
      return IndexerProposalTypeEnum.PgfSteward;
    case "pgf_payment":
      return IndexerProposalTypeEnum.PgfFunding;
    default:
      return assertNever(proposalType);
  }
};

export const fetchAllProposals = async (
  api: DefaultApi
): Promise<Proposal[]> => {
  try {
    // Updated API endpoint for fetching all proposals
    const proposalsPromise = api.apiV1GovProposalAllGet();
    const totalVotingPowerPromise = api.apiV1PosVotingPowerGet();

    const [proposalResponse, votingPowerResponse] = await Promise.all([
      proposalsPromise,
      totalVotingPowerPromise,
    ]);

    if (!proposalResponse.data || !Array.isArray(proposalResponse.data)) {
      console.warn("Invalid proposals response format", proposalResponse);
      return [];
    }

    return proposalResponse.data.map((proposal) =>
      toProposal(proposal, votingPowerResponse.data)
    );
  } catch (error) {
    console.error("Failed to fetch all proposals:", error);
    throw new Error(`Failed to fetch proposals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const fetchPaginatedProposals = async (
  api: DefaultApi,
  page?: number,
  status?: ProposalStatus,
  proposalType?: ProposalTypeString,
  search?: string
): Promise<{ proposals: Proposal[]; pagination: Pagination }> => {
  try {
    // Updated API endpoint for paginated proposal fetching
    const proposalsPromise = api.apiV1GovProposalGet(
      mapUndefined((p) => p + 1, page), // indexer uses 1 as first page, not 0
      mapUndefined(toIndexerStatus, status),
      mapUndefined(toIndexerProposalType, proposalType),
      search,
      undefined
    );

    const totalVotingPowerPromise = api.apiV1PosVotingPowerGet();
    const [proposalResponse, votingPowerResponse] = await Promise.all([
      proposalsPromise,
      totalVotingPowerPromise,
    ]);

    if (!proposalResponse.data || !proposalResponse.data.results || !Array.isArray(proposalResponse.data.results)) {
      console.warn("Invalid paginated proposals response format", proposalResponse);
      return {
        proposals: [],
        pagination: { page: "1" },
      };
    }

    const proposals = proposalResponse.data.results.map((proposal) =>
      toProposal(proposal, votingPowerResponse.data)
    );

    return {
      proposals,
      pagination: proposalResponse.data.pagination || { page: "1" },
    };
  } catch (error) {
    console.error("Failed to fetch paginated proposals:", error);
    throw new Error(`Failed to fetch paginated proposals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const fetchVotedProposalsByAccount = async (
  api: DefaultApi,
  account: Account
): Promise<{ proposalId: bigint; vote: VoteType | UnknownVoteType }[]> => {
  try {
    // Updated API endpoint for fetching votes by account
    const response = await api.apiV1GovVoterAddressVotesGet(account.address);

    if (!response.data || !Array.isArray(response.data)) {
      console.warn("Invalid voted proposals response format", response);
      return [];
    }

    return response.data.map(({ proposalId, vote }) => ({
      proposalId: BigInt(proposalId),
      vote,
    }));
  } catch (error) {
    console.error("Failed to fetch voted proposals for account:", account.address, error);
    // Return empty array instead of throwing to prevent UI breaks
    return [];
  }
};

// New function to fetch all votes for a specific proposal
export const fetchProposalVotes = async (
  api: DefaultApi,
  proposalId: bigint
): Promise<{
  proposalId: bigint;
  votes: Array<{
    address: string;
    vote: VoteType | UnknownVoteType;
    votingPower?: bigint;
  }>;
}> => {
  try {
    // Try the new endpoint pattern first
    const response = await api.apiV1GovProposalIdVotesGet?.(Number(proposalId));
    if (response?.data && Array.isArray(response.data)) {
      return {
        proposalId,
        votes: response.data.map((voteData: Record<string, unknown>) => ({
          address: (voteData.address as string) || "",
          vote: (voteData.vote as VoteType | UnknownVoteType) || "unknown",
          votingPower: voteData.votingPower ? BigInt(voteData.votingPower as string | number) : undefined,
        })),
      };
    }
  } catch (error) {
    console.warn("New proposal votes endpoint not available, falling back to old method:", error);
  }

  // Fallback to empty votes array if the new endpoint doesn't exist
  return {
    proposalId,
    votes: [],
  };
};

export const createVoteProposalTx = async (
  proposalId: bigint,
  vote: VoteType,
  account: Account,
  gasConfig: GasConfig,
  chain: ChainSettings
): Promise<TransactionPair<VoteProposalProps>> => {
  try {
    const sdk = await getSdkInstance();
    const voteProposalProps = {
      signer: account.address,
      proposalId,
      vote,
    };
    const encodedTx = await buildTx(
      sdk,
      account,
      gasConfig,
      chain,
      [voteProposalProps],
      sdk.tx.buildVoteProposal
    );
    return await signEncodedTx(encodedTx, account.address);
  } catch (err) {
    console.error(err);
    throw err;
  }
};
