import {
  DefaultApi,
  IbcToken,
  ModelParameters,
  NativeToken,
} from "@namada/indexer-client";
import { getDenomFromIbcTrace } from "atoms/integrations";
import BigNumber from "bignumber.js";
import { MaspAssetRewards, NamadaAsset } from "types";
import { unknownAsset } from "utils/assets";
import { getSdkInstance } from "utils/sdk";

export const fetchRpcUrlFromIndexer = async (
  api: DefaultApi
): Promise<string> => {
  const rpcUrl = await api.apiV1ChainRpcUrlGet();
  return rpcUrl.data.url;
};

// TODO: We need the response type of this call updated in the indexer client
type TempChainParams = ModelParameters & {
  checksums: {
    current: Record<string, string>;
    fallback: Record<string, string>;
  };
};
export const fetchChainParameters = async (
  api: DefaultApi
): Promise<TempChainParams> => {
  const parametersResponse = await api.apiV1ChainParametersGet();
  return parametersResponse.data as TempChainParams;
};

export const fetchChainTokens = async (
  api: DefaultApi
): Promise<(NativeToken | IbcToken)[]> => {
  return (await api.apiV1ChainTokenGet()).data;
};

export const clearShieldedContext = async (chainId: string): Promise<void> => {
  const sdk = await getSdkInstance();
  await sdk.getMasp().clearShieldedContext(chainId);
};

export const fetchMaspRewards = async (
  assets: NamadaAsset[]
): Promise<MaspAssetRewards[]> => {
  const sdk = await getSdkInstance();
  const rewards = await sdk.rpc.globalShieldedRewardForTokens();
  const existingRewards: MaspAssetRewards[] = rewards
    .filter((r) => r.maxRewardRate > 0)
    .map((r) => {
      const asset =
        assets.find((asset) => asset.address === r.address) ??
        unknownAsset(getDenomFromIbcTrace(r.name));
      return {
        asset,
        address: r.address,
        kdGain: new BigNumber(r.kdGain),
        kpGain: new BigNumber(r.kpGain),
        lockedAmountTarget: new BigNumber(r.lockedAmountTarget),
        maxRewardRate: new BigNumber(r.maxRewardRate),
      };
    });
  return existingRewards;
};

export const fetchBlockHeightByTimestamp = async (
  api: DefaultApi,
  timestamp: number
): Promise<number> => {
  const timestampInSeconds = Math.floor(timestamp / 1000);
  const response = await api.apiV1BlockTimestampValueGet(timestampInSeconds);

  return Number(response.data.height);
};

export const fetchBlockTimestampByHeight = async (
  api: DefaultApi,
  height: number
): Promise<number> => {
  const response = await api.apiV1BlockHeightValueGet(height);
  return Number(response.data.timestamp);
};
