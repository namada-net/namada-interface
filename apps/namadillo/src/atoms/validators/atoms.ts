import { defaultAccountAtom } from "atoms/accounts";
import { indexerApiAtom } from "atoms/api";
import { chainParametersAtom } from "atoms/chain";
import { shouldUpdateBalanceAtom } from "atoms/etc";
import { queryDependentFn } from "atoms/utils";
import { atomWithQuery } from "jotai-tanstack-query";
import { MyValidator, Validator } from "types";
import { toMyValidators } from "./functions";
import {
  fetchAllValidators,
  fetchMyBondedAmounts,
  fetchMyUnbondedAmounts,
  fetchVotingPower,
} from "./services";

const votingPowerAtom = atomWithQuery((get) => {
  const api = get(indexerApiAtom);
  return {
    queryKey: ["voting-power"],
    queryFn: () => fetchVotingPower(api),
  };
});

export const allValidatorsAtom = atomWithQuery((get) => {
  const chainParameters = get(chainParametersAtom);
  const votingPower = get(votingPowerAtom);
  const api = get(indexerApiAtom);
  return {
    queryKey: ["all-validators"],
    ...queryDependentFn(async (): Promise<Validator[]> => {
      return fetchAllValidators(api, chainParameters.data!, votingPower.data!);
    }, [chainParameters, votingPower]),
  };
});

export const myValidatorsAtom = atomWithQuery((get) => {
  const account = get(defaultAccountAtom);
  const chainParameters = get(chainParametersAtom);
  const votingPower = get(votingPowerAtom);
  const api = get(indexerApiAtom);

  // TODO: Refactor after this event subscription is enabled in the indexer
  const enablePolling = get(shouldUpdateBalanceAtom);
  return {
    queryKey: ["my-validators", account.data?.address],
    refetchInterval: enablePolling ? 1000 : false,
    ...queryDependentFn(async (): Promise<MyValidator[]> => {
      const bondedAmountsQuery = fetchMyBondedAmounts(api, account.data!);
      const unbondedAmountsQuery = fetchMyUnbondedAmounts(api, account.data!);
      const [unbondedAmounts, bondedAmounts] = await Promise.all([
        unbondedAmountsQuery,
        bondedAmountsQuery,
      ]);
      return toMyValidators(
        bondedAmounts,
        unbondedAmounts,
        votingPower.data!,
        chainParameters.data!.unbondingPeriod,
        chainParameters.data!.apr
      );
    }, [account, chainParameters, votingPower]),
  };
});
