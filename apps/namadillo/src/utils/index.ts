import { DenomUnit } from "@chain-registry/types";
import { TxProps } from "@namada/sdk-multicore";
import {
  BroadcastTxError,
  ProposalStatus,
  ProposalTypeString,
  ResultCode,
} from "@namada/types";
import { getNamadaChainAssetsMap } from "atoms/integrations/functions";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { useEffect, useRef } from "react";
import { Asset } from "types";

export const proposalStatusToString = (status: ProposalStatus): string => {
  const statusText: Record<ProposalStatus, string> = {
    pending: "Upcoming",
    ongoing: "Ongoing",
    executedRejected: "Rejected",
    executedPassed: "Passed",
  };

  return statusText[status];
};

export const proposalTypeStringToString = (
  type: ProposalTypeString
): string => {
  const typeText: Record<ProposalTypeString, string> = {
    default: "Default",
    default_with_wasm: "Default with Wasm",
    pgf_steward: "PGF Steward",
    pgf_payment: "PGF Payment",
  };

  return typeText[type];
};

export const epochToString = (epoch: bigint): string =>
  `Epoch ${epoch.toString()}`;

export const proposalIdToString = (proposalId: bigint): string =>
  `#${proposalId.toString()}`;

export const useTransactionEventListener = <T extends keyof WindowEventMap>(
  event: T | T[],
  handler: (event: WindowEventMap[T]) => void
): void => {
  // `handlerRef` is useful to avoid recreating the listener every time
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const callback: typeof handler = (event) => handlerRef.current(event);
    if (Array.isArray(event)) {
      event.forEach((e) => window.addEventListener(e, callback));
    } else {
      window.addEventListener(event, callback);
    }
    return () => {
      if (Array.isArray(event)) {
        event.forEach((e) => window.removeEventListener(e, callback));
      } else {
        window.removeEventListener(event, callback);
      }
    };
  }, [event]);
};

export const sumBigNumberArray = (numbers: BigNumber[]): BigNumber => {
  if (numbers.length === 0) return new BigNumber(0);
  return BigNumber.sum(...numbers);
};

const findDisplayUnit = (asset: Asset): DenomUnit | undefined => {
  const { display, denom_units } = asset;
  return denom_units.find((unit) => unit.denom === display);
};

export const namadaAsset = (): Asset => {
  // This works for both housefire and mainnet because the native asset is the same
  const namadaAssets = Object.values(getNamadaChainAssetsMap(false));
  const nativeAsset = namadaAssets.find((asset) => asset.base === "unam");
  invariant(nativeAsset, "Namada native asset not found");

  return nativeAsset;
};

export const isNamadaAsset = (asset?: Asset): boolean =>
  asset?.symbol === namadaAsset().symbol;

export const toDisplayAmount = (
  asset: Asset,
  baseAmount: BigNumber
): BigNumber => {
  const displayUnit = findDisplayUnit(asset);
  if (!displayUnit) {
    return baseAmount;
  }

  return baseAmount.shiftedBy(-displayUnit.exponent);
};

export const toBaseAmount = (
  asset: Asset,
  displayAmount: BigNumber
): BigNumber => {
  const displayUnit = findDisplayUnit(asset);
  if (!displayUnit) {
    return displayAmount;
  }
  return displayAmount.shiftedBy(displayUnit.exponent);
};

export const toGasMsg = (gasLimit: BigNumber): string => {
  return `Please raise the Gas Amount above the previously provided ${gasLimit} in the fee options for your transaction.`;
};

/**
 * Returns formatted error message based on tx props and error code
 */
export const toErrorDetail = (
  tx: TxProps[],
  error: BroadcastTxError
): string => {
  try {
    const { code, info } = error.toProps();
    const { args } = tx[0];
    // TODO: Over time we may expand this to format errors for more result codes
    switch (code) {
      case ResultCode.TxGasLimit:
        return `${error.toString()}.\n${toGasMsg(args.gasLimit)}`;
      case ResultCode.WasmRuntimeError:
        // We can only check error type by reading the error message
        return `${error.toString()}.\n${textToErrorDetail(info, tx[0])}`;
      case ResultCode.FeeError:
        return `${error.toString()}.\n${textToErrorDetail(info, tx[0])}`;

      default:
        return error.toString() + ` ${info}`;
    }
  } catch (_e) {
    return `${error.toString()}`;
  }
};

export const textToErrorDetail = (text: string, tx: TxProps): string => {
  const { args } = tx;

  if (text.includes("Gas error:")) {
    return toGasMsg(args.gasLimit);
  } else {
    return text;
  }
};
