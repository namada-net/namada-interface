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
