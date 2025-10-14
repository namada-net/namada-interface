import {
  DefaultApi,
  GasEstimate,
  GasPriceTableInner,
} from "@namada/indexer-client";
import { TxKind } from "types/txKind";

// Type for the actual API response where token is now just an address string
export type GasPriceResponse = {
  token: string;
  minDenomAmount: string;
};

export const fetchGasEstimate = async (
  api: DefaultApi,
  txKinds: TxKind[]
): Promise<GasEstimate> => {
  const counter = (kind: TxKind): number | undefined =>
    txKinds.filter((i) => i === kind).length || undefined;

  const params = [
    counter("Bond"),
    counter("ClaimRewards"),
    counter("Unbond"),
    counter("TransparentTransfer"),
    counter("ShieldedTransfer"),
    counter("ShieldingTransfer"),
    counter("UnshieldingTransfer"),
    counter("VoteProposal"),
    counter("IbcTransfer"),
    counter("Withdraw"),
    counter("RevealPk"),
    counter("Redelegate"),
  ];

  // fetch from the estimate endpoint
  try {
    return (await api.apiV1GasEstimateGet(...params)).data;
  } catch (e) {
    console.error("Failed to fetch gas estimate from indexer", e);
  }

  // otherwise, returns a generic default value
  return {
    min: 50000,
    avg: 50000,
    max: 50000,
    totalEstimates: 0,
  };
};

export const fetchTokensGasPrice = async (
  api: DefaultApi
): Promise<GasPriceResponse[]> => {
  const response = await api.apiV1GasPriceGet();
  // Transform the API response to extract the token address string
  return response.data.map((item: GasPriceTableInner) => ({
    token: item.token,
    minDenomAmount: item.minDenomAmount,
  }));
};
