import { namadaRegistryChainAssetsMapAtom } from "atoms/integrations";
import { queryDependentFn } from "atoms/utils";
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
          return fetchTokenPrices(addresses, chainAssetsMap.data);
        }, [chainAssetsMap]),
      };
    }),
  isEqual
);
