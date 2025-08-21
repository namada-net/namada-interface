import {
  ProposalStatus,
  ProposalTypeString,
  UnknownVoteType,
  VoteProposalProps,
  VoteType,
} from "@namada/types";
import { defaultAccountAtom } from "atoms/accounts";
import { indexerApiAtom } from "atoms/api";
import { chainAtom } from "atoms/chain";
import { queryDependentFn } from "atoms/utils";
import { atomWithMutation, atomWithQuery } from "jotai-tanstack-query";
import { atomFamily } from "jotai/utils";
import { TransactionPair } from "lib/query";
import { GasConfig } from "types";
import {
  createVoteProposalTx,
  fetchAllProposals,
  fetchPaginatedProposals,
  fetchProposalById,
  fetchProposalDataById,
  fetchProposalVotes,
  fetchVotedProposalsByAccount,
} from "./functions";

import { Bond as NamadaIndexerBond } from "@namada/indexer-client";
import { shouldUpdateProposalAtom } from "atoms/etc";

export const proposalFamily = atomFamily((id: bigint) =>
  atomWithQuery((get) => {
    const api = get(indexerApiAtom);
    const enablePolling = get(shouldUpdateProposalAtom);

    return {
      // TODO: subscribe to indexer events when it's done
      refetchInterval: enablePolling ? 1000 : false,
      queryKey: ["proposal", id.toString()],
      queryFn: () => fetchProposalById(api, id),
    };
  })
);

export const proposalDataFamily = atomFamily((id: bigint) =>
  atomWithQuery((get) => {
    const api = get(indexerApiAtom);

    return {
      queryKey: ["proposal-data", id.toString()],
      queryFn: () => fetchProposalDataById(api, id),
    };
  })
);

export const proposalVoteFamily = atomFamily((id: bigint) =>
  atomWithQuery<VoteType | UnknownVoteType | null>((get) => {
    const votedProposals = get(votedProposalsAtom);
    const enablePolling = get(shouldUpdateProposalAtom);

    return {
      // TODO: subscribe to indexer events when it's done
      refetchInterval: enablePolling ? 1000 : false,
      queryKey: ["proposal-vote", id.toString()],
      ...queryDependentFn(async () => {
        return (
          votedProposals.data!.find((v) => v.proposalId === id)?.vote ?? null
        );
      }, [votedProposals]),
    };
  })
);

// New atom for fetching all votes for a specific proposal
export const proposalVotesFamily = atomFamily((id: bigint) =>
  atomWithQuery((get) => {
    const api = get(indexerApiAtom);
    const enablePolling = get(shouldUpdateProposalAtom);

    return {
      // TODO: subscribe to indexer events when it's done
      refetchInterval: enablePolling ? 2000 : false, // Slightly slower polling for votes
      queryKey: ["proposal-votes", id.toString()],
      queryFn: () => fetchProposalVotes(api, id),
      // Handle errors gracefully
      retry: (failureCount, error) => {
        // Only retry network errors, not API method not found errors
        if (error?.message?.includes("not a function")) {
          return false;
        }
        return failureCount < 3;
      },
    };
  })
);

export const allProposalsAtom = atomWithQuery((get) => {
  const api = get(indexerApiAtom);
  return {
    queryKey: ["all-proposals"],
    queryFn: () => fetchAllProposals(api),
  };
});

export const paginatedProposalsFamily = atomFamily(
  (options?: {
    page?: number;
    status?: ProposalStatus;
    type?: ProposalTypeString;
    search?: string;
  }) =>
    atomWithQuery((get) => {
      const api = get(indexerApiAtom);

      return {
        queryKey: [
          "paginated-proposals",
          options?.page,
          options?.status,
          options?.type,
          options?.search,
        ],
        queryFn: () =>
          fetchPaginatedProposals(
            api,
            options?.page,
            options?.status,
            options?.type,
            options?.search
          ),
      };
    }),
  (a, b) =>
    // TODO: there might be a better way to do this equality check
    a?.page === b?.page &&
    a?.status === b?.status &&
    a?.type === b?.type &&
    a?.search === b?.search
);

export const votedProposalsAtom = atomWithQuery((get) => {
  const account = get(defaultAccountAtom);
  const api = get(indexerApiAtom);
  const enablePolling = get(shouldUpdateProposalAtom);

  return {
    // TODO: subscribe to indexer events when it's done
    refetchInterval: enablePolling ? 1000 : false,
    queryKey: ["voted-proposals", account.data],
    ...queryDependentFn(async () => {
      if (typeof account.data === "undefined") {
        throw new Error("no account found");
      }
      return await fetchVotedProposalsByAccount(api, account.data);
    }, [account]),
  };
});

export const canVoteAtom = atomFamily((proposalStartEpoch: bigint) =>
  atomWithQuery((get) => {
    const account = get(defaultAccountAtom);
    const api = get(indexerApiAtom);

    return {
      queryKey: ["can-vote", account.data, api],
      enabled: account.isSuccess,
      queryFn: async () => {
        const all_bonds = await api.apiV1PosBondAddressGet(
          account.data!.address,
          undefined,
          Number(proposalStartEpoch)
        );

        return all_bonds.data.results.reduce(
          (acc: boolean, current: NamadaIndexerBond) => {
            return acc || Number(current.startEpoch) <= proposalStartEpoch;
          },
          false
        );
      },
    };
  })
);

type CreateVoteTxArgs = {
  proposalId: bigint;
  vote: VoteType;
  gasConfig: GasConfig;
};

export const createVoteTxAtom = atomWithMutation((get) => {
  const account = get(defaultAccountAtom);
  const chain = get(chainAtom);

  return {
    enabled: account.isSuccess && chain.isSuccess,
    mutationKey: ["voting"],
    mutationFn: async ({
      proposalId,
      vote,
      gasConfig,
    }: CreateVoteTxArgs): Promise<TransactionPair<VoteProposalProps>> => {
      if (typeof account.data === "undefined") {
        throw new Error("no account");
      }
      return createVoteProposalTx(
        proposalId,
        vote,
        account.data,
        gasConfig,
        chain.data!
      );
    },
  };
});
