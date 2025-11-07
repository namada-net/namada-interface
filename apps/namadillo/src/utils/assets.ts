import { IbcToken, NativeToken } from "@namada/indexer-client";
import { shortenAddress } from "@namada/utils";
import { Address, Asset, AssetWithAmount } from "types";

export const unknownAsset = (denom: string): Asset => ({
  type_asset: "unknown",
  denom_units: [{ denom, exponent: 0 }],
  base: denom,
  name: denom,
  display: denom,
  symbol: shortenAddress(denom, 4, 4),
});

// TODO upgrade this function to be as smart as possible
// please refer to `tnamAddressToDenomTrace` and how we could combine both
export const findAssetByToken = (
  token: NativeToken | IbcToken,
  assets: Asset[]
): Asset | undefined => {
  // first, search by the address
  const asset = assets.find((a) => a.address === token.address);
  if (asset) {
    return asset;
  }

  // then, search by trace
  if ("trace" in token) {
    const traceDenom = token.trace.split("/").at(-1);
    if (traceDenom) {
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        if (
          asset.base === traceDenom ||
          asset.denom_units.find(
            (u) => u.denom === traceDenom || u.aliases?.includes(traceDenom)
          )
        ) {
          return asset;
        }
      }
    }
  }
  return undefined;
};

export const filterAvailableAssetsWithBalance = (
  availableAssets?: Record<Address, AssetWithAmount>
): Record<Address, AssetWithAmount> => {
  if (!availableAssets) return {};
  return Object.keys(availableAssets).reduce((previous, current) => {
    if (availableAssets![current].amount.gt(0)) {
      return { ...previous, [current]: availableAssets![current] };
    }
    return previous;
  }, {});
};

export const amountMaxDecimalPlaces = (asset?: Asset): number | undefined => {
  if (typeof asset !== "undefined") {
    for (const { denom, exponent } of asset.denom_units) {
      if (denom === asset.display) {
        return exponent;
      }
    }
  }
};
