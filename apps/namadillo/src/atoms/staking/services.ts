import { DefaultApi, Reward } from "@namada/indexer-client";
import {
  BondProps,
  ClaimRewardsProps,
  RedelegateProps,
  TxProps,
  UnbondProps,
  WithdrawProps,
  WrapperTxProps,
} from "@namada/sdk-multicore";
import { Account } from "@namada/types";
import { queryClient } from "App/Common/QueryProvider";
import { EncodedTxData, buildTx } from "lib/query";
import { Address, AddressBalance, ChainSettings, GasConfig } from "types";
import { getSdkInstance } from "utils/sdk";

export const fetchClaimableRewards = async (
  api: DefaultApi,
  address: Address
): Promise<Reward[]> => {
  const response = await api.apiV1PosRewardAddressGet(address);
  return response.data;
};

export const createBondTx = async (
  chain: ChainSettings,
  account: Account,
  bondProps: BondProps[],
  gasConfig: GasConfig
): Promise<EncodedTxData<BondProps> | undefined> => {
  const sdk = await getSdkInstance();
  return await buildTx(
    sdk,
    account,
    gasConfig,
    chain,
    bondProps,
    sdk.tx.buildBond
  );
};

export const createUnbondTx = async (
  chain: ChainSettings,
  account: Account,
  unbondProps: UnbondProps[],
  gasConfig: GasConfig
): Promise<EncodedTxData<UnbondProps>> => {
  const sdk = await getSdkInstance();
  return await buildTx(
    sdk,
    account,
    gasConfig,
    chain,
    unbondProps,
    sdk.tx.buildUnbond
  );
};

export const createReDelegateTx = async (
  chain: ChainSettings,
  account: Account,
  redelegateProps: RedelegateProps[],
  gasConfig: GasConfig
): Promise<EncodedTxData<RedelegateProps>> => {
  const sdk = await getSdkInstance();
  return await buildTx(
    sdk,
    account,
    gasConfig,
    chain,
    redelegateProps,
    sdk.tx.buildRedelegate
  );
};

export const createWithdrawTx = async (
  chain: ChainSettings,
  account: Account,
  withdrawProps: WithdrawProps[],
  gasConfig: GasConfig
): Promise<EncodedTxData<WithdrawProps>> => {
  const sdk = await getSdkInstance();
  return await buildTx(
    sdk,
    account,
    gasConfig,
    chain,
    withdrawProps,
    sdk.tx.buildWithdraw
  );
};

export const createClaimTx = async (
  chain: ChainSettings,
  account: Account,
  params: ClaimRewardsProps[],
  gasConfig: GasConfig
): Promise<EncodedTxData<ClaimRewardsProps>> => {
  const sdk = await getSdkInstance();
  return await buildTx(
    sdk,
    account,
    gasConfig,
    chain,
    params,
    sdk.tx.buildClaimRewards
  );
};

export const createClaimAndStakeTx = async (
  chain: ChainSettings,
  account: Account,
  params: ClaimRewardsProps[],
  claimableRewardsByValidator: AddressBalance,
  gasConfig: GasConfig
): Promise<EncodedTxData<ClaimRewardsProps>> => {
  const sdk = await getSdkInstance();

  // BuildTx wrapper to handle different commitment types
  const buildClaimRewardsAndStake = async (
    wrapperTxProps: WrapperTxProps,
    props: ClaimRewardsProps | BondProps
  ): Promise<TxProps> => {
    if ("amount" in props) {
      // We have to force it in case: current balance < rewards to claim
      // This will still log the error msg in the terminal, unfortunately we can't do much about it
      wrapperTxProps.force = true;
      return sdk.tx.buildBond(wrapperTxProps, props as BondProps);
    } else {
      return sdk.tx.buildClaimRewards(
        wrapperTxProps,
        props as ClaimRewardsProps
      );
    }
  };

  // Adding bonding commitments after the claiming ones. Order is strictly
  // important in this case
  const claimAndStakingParams: (ClaimRewardsProps | BondProps)[] =
    Array.from(params);

  params.forEach((claimParam) => {
    const { validator, source } = claimParam;
    if (claimableRewardsByValidator.hasOwnProperty(validator)) {
      claimAndStakingParams.push({
        amount: claimableRewardsByValidator[validator],
        source,
        validator,
      } as BondProps);
    }
  });

  return await buildTx(
    sdk,
    account,
    gasConfig,
    chain,
    claimAndStakingParams,
    buildClaimRewardsAndStake
  );
};

export const clearClaimRewards = (accountAddress: string): void => {
  const emptyClaimRewards = {};
  queryClient.setQueryData(
    ["claim-rewards", accountAddress],
    () => emptyClaimRewards
  );
};

export const simulateShieldedRewards = async (
  chainId: string,
  token: string,
  amount: string = "0"
): Promise<string> => {
  const sdk = await getSdkInstance();
  return await sdk.rpc.simulateShieldedRewards(chainId, token, amount);
};
