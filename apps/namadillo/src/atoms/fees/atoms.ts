import {
  ApiV1ChainTokenGet200ResponseInner,
  GasEstimate,
} from "@namada/indexer-client";
import { defaultAccountAtom } from "atoms/accounts";
import { indexerApiAtom } from "atoms/api";
import { namadaRegistryChainAssetsMapAtom } from "atoms/integrations";
import { defaultServerConfigAtom } from "atoms/settings";
import { queryDependentFn } from "atoms/utils";
import BigNumber from "bignumber.js";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as R from "fp-ts/Record";
import invariant from "invariant";
import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";
import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomFamily } from "jotai/utils";
import { isPublicKeyRevealed } from "lib/query";
import isEqual from "lodash.isequal";
import { TxKind } from "types/txKind";
import { isNamadaAsset, toDisplayAmount } from "utils";
import { fetchGasEstimate, fetchTokensGasPrice } from "./services";

export type GasPriceTableItem = {
  token: ApiV1ChainTokenGet200ResponseInner;
  gasPrice: BigNumber;
  gasPriceInMinDenom: BigNumber;
};

export type GasPriceTable = GasPriceTableItem[];

export const gasEstimateFamily = atomFamily(
  (txKinds: TxKind[]) =>
    atomWithQuery<GasEstimate>((get) => {
      const api = get(indexerApiAtom);
      return {
        queryKey: ["gas-limit", txKinds],
        queryFn: async () => {
          if (!txKinds.length) {
            return {
              min: 0,
              max: 0,
              avg: 0,
              totalEstimates: 0,
            };
          }

          const gasEstimate = await fetchGasEstimate(api, txKinds);
          const precision = Math.max(
            0,
            Math.min(1, gasEstimate.totalEstimates / 1000)
          );
          return {
            min: Math.ceil(gasEstimate.min * 1.1 - precision * 0.1),
            avg: Math.ceil(gasEstimate.avg * 1.25 - precision * 0.25),
            max: Math.ceil(gasEstimate.max * 1.5 - precision * 0.5),
            totalEstimates: gasEstimate.totalEstimates,
          };
        },
      };
    }),
  isEqual
);

export const gasPriceTableAtom = atomWithQuery<GasPriceTable>((get) => {
  const api = get(indexerApiAtom);
  const chainAssetsMap = get(namadaRegistryChainAssetsMapAtom);

  return {
    queryKey: ["gas-price-table", chainAssetsMap.data],
    ...queryDependentFn(async () => {
      invariant(chainAssetsMap.data, "No chain settings");

      const response = await fetchTokensGasPrice(api);
      return (
        response
          // filter only tokens that exists on the chain
          .filter(({ token }) => Boolean(chainAssetsMap.data[token.address]))
          .map(({ token, minDenomAmount }) => {
            const asset = chainAssetsMap.data[token.address];
            const baseAmount = BigNumber(minDenomAmount);
            return {
              token,
              gasPrice:
                asset && isNamadaAsset(asset) ?
                  toDisplayAmount(asset, baseAmount)
                : baseAmount,
              gasPriceInMinDenom: baseAmount,
            };
          })
      );
    }, [chainAssetsMap]),
  };
});

export const isPublicKeyRevealedAtom = atomWithQuery<boolean>((get) => {
  const defaultAccount = get(defaultAccountAtom);
  const accountAddress = defaultAccount.data?.address;
  return {
    queryKey: ["default-gas-config", accountAddress],
    ...queryDependentFn(async () => {
      return accountAddress ? await isPublicKeyRevealed(accountAddress) : false;
    }, [defaultAccount]),
  };
});

const FrontendFeeSchema = t.union([
  t.undefined,
  t.record(
    t.string,
    t.type({
      transparent_target: t.string,
      shielded_target: t.string,
      percentage: t.number,
    })
  ),
]);

export const frontendFeeAtom = atom((get) => {
  const maybeFrontendFee = get(defaultServerConfigAtom).data?.frontend_fee;
  const eitherFrontendFee = FrontendFeeSchema.decode(maybeFrontendFee);
  if (E.isLeft(eitherFrontendFee)) {
    console.warn(
      "Invalid frontend fee schema: ",
      PathReporter.report(eitherFrontendFee).join("\n")
    );
    return {};
  }
  // TODO: validate if targets are valid addresses

  return pipe(
    O.fromNullable(eitherFrontendFee.right),
    O.fold(
      () => ({}),
      (fees) => fees
    ),
    R.map((fee) => ({
      transparentTarget: fee.transparent_target,
      shieldedTarget: fee.shielded_target,
      percentage: BigNumber(fee.percentage),
    }))
  );
});
