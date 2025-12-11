import {
  DefaultApi,
  GasEstimate,
  GasPriceTableInner,
} from "@namada/indexer-client";
import { FrontendSusFeeProps } from "@namada/sdk-multicore";
import { assertNever } from "@namada/utils";
import { FrontendFee } from "types";
import { TxKind } from "types/txKind";

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
): Promise<GasPriceTableInner[]> => {
  return (await api.apiV1GasPriceGet()).data;
};

export const frontendSusMsgFromConfig = (
  frontendFee: FrontendFee,
  token: string,
  whichTarget: "shielded" | "transparent"
): FrontendSusFeeProps => {
  const { percentage, shieldedTarget, transparentTarget } =
    frontendFee[token] || frontendFee["*"];

  const target =
    whichTarget === "shielded" ? shieldedTarget
    : whichTarget === "transparent" ? transparentTarget
    : assertNever(whichTarget);

  const frontendSusFee = {
    percentage: percentage,
    target,
  };

  return frontendSusFee;
};
