import { namadaRegistryChainAssetsMapAtom } from "atoms/integrations";
import { queryDependentFn } from "atoms/utils";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomFamily } from "jotai/utils";
import isEqual from "lodash.isequal";
import { Address } from "types";
import { fetchTokenPrices } from "./functions";

export const tokenPricesFamily = atomFamily(
  (addresses: Address[]) =>
    atomWithQuery((get) => {
      const chainAssetsMap = get(namadaRegistryChainAssetsMapAtom);

      return {
        queryKey: ["token-prices", addresses, chainAssetsMap.data],
        ...queryDependentFn(async () => {
          invariant(chainAssetsMap.data, "No chain assets");
          // TODO: for some reason, the first fetch often returns all zeros, so we loop until we get a non-zero result
          const checkAllZero = (
            prices: Record<Address, BigNumber>
          ): boolean => {
            return Object.values(prices).every((price) => price.isZero());
          };
          const fetch = fetchTokenPrices.bind(
            null,
            addresses,
            chainAssetsMap.data
          );

          let result = await fetch();
          let allZero = checkAllZero(result);
          while (allZero) {
            await new Promise((resolve) => setTimeout(resolve, 10));
            result = await fetch();
            allZero = checkAllZero(result);
          }
          return result;
        }, [chainAssetsMap]),
      };
    }),
  isEqual
);
