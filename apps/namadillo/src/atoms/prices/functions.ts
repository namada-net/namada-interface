import { getIbcAssetByNamadaAsset } from "atoms/integrations";
import BigNumber from "bignumber.js";
import * as osmosisAssets from "chain-registry/mainnet/osmosis";
import { Address, BaseDenom, NamadaAsset } from "types";
import { fetchCoinPrices } from "./services";

export const fetchTokenPrices = async (
  tokenAddressToFetch: Address[],
  namadaAssetsMap: Record<Address, NamadaAsset>
): Promise<Record<Address, BigNumber>> => {
  const baseMap: Record<BaseDenom, Address[]> = {};
  tokenAddressToFetch.forEach((address) => {
    const token = namadaAssetsMap[address];
    const osmosisRegistryAssets = osmosisAssets.assets.assets;
    if (token) {
      // searching only on osmosis because these are the assets supported by fetchCoinPrices
      const asset = getIbcAssetByNamadaAsset(token, osmosisRegistryAssets);
      if (asset) {
        if (baseMap[asset.base]) {
          baseMap[asset.base].push(address);
        } else {
          baseMap[asset.base] = [address];
        }
      }
    }
  });
  const baseList = Object.keys(baseMap);
  const apiResponse = await fetchCoinPrices(baseList);

  const tokenPrices: Record<string, BigNumber> = {};
  Object.entries(apiResponse).forEach(([base, value]) => {
    const dollar = Object.values(value)[0];
    if (dollar) {
      baseMap[base].forEach((address) => {
        tokenPrices[address] = new BigNumber(dollar);
      });
    }
  });
  return tokenPrices;
};
