import {
  DefaultApi,
  VotingPower as IndexerVotingPower,
  MergedBond,
  Unbond,
  VotingPower,
} from "@namada/indexer-client";
import { Account } from "@namada/types";
import { ChainParameters, Validator } from "types";
import { toValidator } from "./functions";

export const fetchVotingPower = async (
  api: DefaultApi
): Promise<VotingPower> => {
  const response = await api.apiV1PosVotingPowerGet();
  return response.data;
};

export const fetchAllValidators = async (
  api: DefaultApi,
  chainParameters: ChainParameters,
  votingPower: IndexerVotingPower
): Promise<Validator[]> => {
  const nominalApr = chainParameters.apr;
  const validatorsResponse = await api.apiV1PosValidatorAllGet();
  const validators = validatorsResponse.data;
  return validators.map((v) =>
    toValidator(v, votingPower, chainParameters.unbondingPeriod, nominalApr)
  );
};

export const fetchMyBondedAmounts = async (
  api: DefaultApi,
  account: Account
): Promise<MergedBond[]> => {
  const bondsResponse = await api.apiV1PosMergedBondsAddressGet(
    account.address
  );
  return bondsResponse.data.results;
};

export const fetchMyUnbondedAmounts = async (
  api: DefaultApi,
  account: Account
): Promise<Unbond[]> => {
  const unbondsResponse = await api.apiV1PosMergedUnbondsAddressGet(
    account.address
  );
  return unbondsResponse.data.results;
};
