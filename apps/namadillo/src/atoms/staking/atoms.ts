import { Reward } from "@namada/indexer-client";
import {
  BondProps,
  ClaimRewardsProps,
  RedelegateProps,
  UnbondProps,
  WithdrawProps,
} from "@namada/sdk-multicore";
import { defaultAccountAtom } from "atoms/accounts";
import { indexerApiAtom } from "atoms/api";
import { chainAtom, chainParametersAtom } from "atoms/chain";
import { queryDependentFn } from "atoms/utils";
import { myValidatorsAtom } from "atoms/validators";
import BigNumber from "bignumber.js";
import { atomWithMutation, atomWithQuery } from "jotai-tanstack-query";
import { AddressBalance, BuildTxAtomParams, StakingTotals } from "types";
import { namadaAsset, toDisplayAmount } from "utils";
import { toStakingTotal } from "./functions";
import {
  createBondTx,
  createClaimAndStakeTx,
  createClaimTx,
  createReDelegateTx,
  createUnbondTx,
  createWithdrawTx,
  fetchClaimableRewards,
} from "./services";

export const getStakingTotalAtom = atomWithQuery<StakingTotals>((get) => {
  const myValidators = get(myValidatorsAtom);
  return {
    queryKey: ["staking-totals", myValidators.dataUpdatedAt],
    ...queryDependentFn(
      async (): Promise<StakingTotals> =>
        toStakingTotal(myValidators.data || []),
      [myValidators]
    ),
  };
});

export const createBondTxAtom = atomWithMutation((get) => {
  const chain = get(chainAtom);
  return {
    mutationKey: ["create-bonding-tx"],
    enabled: chain.isSuccess,
    mutationFn: async ({
      params,
      gasConfig,
      account,
    }: BuildTxAtomParams<BondProps>) =>
      createBondTx(chain.data!, account, params, gasConfig),
  };
});

export const createUnbondTxAtom = atomWithMutation((get) => {
  const chain = get(chainAtom);
  return {
    mutationKey: ["create-unbonding-tx"],
    enabled: chain.isSuccess,
    mutationFn: async ({
      params,
      gasConfig,
      account,
    }: BuildTxAtomParams<UnbondProps>) =>
      createUnbondTx(chain.data!, account, params, gasConfig),
  };
});

export const createReDelegateTxAtom = atomWithMutation((get) => {
  const chain = get(chainAtom);
  return {
    mutationKey: ["create-redelegate-tx"],
    enabled: chain.isSuccess,
    mutationFn: async ({
      params,
      gasConfig,
      account,
    }: BuildTxAtomParams<RedelegateProps>) =>
      createReDelegateTx(chain.data!, account, params, gasConfig),
  };
});

export const createWithdrawTxAtom = atomWithMutation((get) => {
  const chain = get(chainAtom);
  return {
    mutationKey: ["create-withdraw-tx"],
    enabled: chain.isSuccess,
    mutationFn: async ({
      params,
      gasConfig,
      account,
    }: BuildTxAtomParams<WithdrawProps>) =>
      createWithdrawTx(chain.data!, account, params, gasConfig),
  };
});

export const claimableRewardsAtom = atomWithQuery<AddressBalance>((get) => {
  const account = get(defaultAccountAtom);
  const chainParameters = get(chainParametersAtom);
  const api = get(indexerApiAtom);
  return {
    queryKey: ["claim-rewards", account.data?.address],
    refetchInterval: 60 * 1000,
    ...queryDependentFn(async () => {
      const rewards = await fetchClaimableRewards(api, account.data!.address);
      return rewards.reduce(
        (prev: AddressBalance, current: Reward): AddressBalance => {
          if (!current.validator) return prev;
          return {
            ...prev,
            [current.validator?.address]: toDisplayAmount(
              namadaAsset(),
              BigNumber(current.minDenomAmount || 0)
            ),
          };
        },
        {}
      );
    }, [account, chainParameters]),
  };
});

export const claimRewardsAtom = atomWithMutation((get) => {
  const chain = get(chainAtom);
  return {
    mutationKey: ["create-claim-tx"],
    enabled: chain.isSuccess,
    mutationFn: async ({
      params,
      gasConfig,
      account,
    }: BuildTxAtomParams<ClaimRewardsProps>) => {
      return createClaimTx(chain.data!, account, params, gasConfig);
    },
  };
});

export const claimAndStakeRewardsAtom = atomWithMutation((get) => {
  const chain = get(chainAtom);
  const claimableRewards = get(claimableRewardsAtom);
  return {
    mutationKey: ["create-claim-and-stake-tx"],
    enabled: chain.isSuccess && claimableRewards.isSuccess,
    mutationFn: async ({
      params,
      gasConfig,
      account,
    }: BuildTxAtomParams<ClaimRewardsProps>) => {
      return createClaimAndStakeTx(
        chain.data!,
        account,
        params,
        claimableRewards.data!,
        gasConfig
      );
    },
  };
});
