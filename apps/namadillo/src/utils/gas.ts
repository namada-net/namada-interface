import { isTransparentAddress } from "App/Transfer/common";
import BigNumber from "bignumber.js";
import namadaAssets from "chain-registry/mainnet/namada/assets";
import { Address, Asset, GasConfig, GasConfigToDisplay } from "types";
import { isNamadaAsset, toDisplayAmount } from "utils";
import { unknownAsset } from "./assets";

export const calculateGasFee = (gasConfig: GasConfig): BigNumber => {
  return BigNumber(gasConfig.gasPriceInMinDenom).multipliedBy(
    gasConfig.gasLimit
  );
};

// TODO: we should probably split this into two functions:
// - for displaying the gas fee for ibc deposits
// - for displaying the gas fee for transactions on Namada chain
export const getDisplayGasFee = (
  gasConfig: GasConfig,
  chainAssetsMap: Record<Address, Asset>
): GasConfigToDisplay => {
  const { gasToken } = gasConfig;
  let asset: Asset;

  if (isTransparentAddress(gasToken)) {
    // The gasConfig token might be the address of the token on Namada chain
    asset = chainAssetsMap[gasToken] ?? unknownAsset(gasToken);
  } else {
    // However, if the gasConfig contains a token used by Keplr, it could be the asset
    // denomination unit, like "uosmo"
    asset =
      namadaAssets.assets.find((a) =>
        a.denom_units.some((d) =>
          d.aliases?.some((alias) => alias === gasToken)
        )
      ) ?? unknownAsset(gasToken);
  }

  const totalDisplayAmount = calculateGasFee(gasConfig);
  return {
    totalDisplayAmount:
      isNamadaAsset(asset) ? totalDisplayAmount : (
        toDisplayAmount(asset, totalDisplayAmount).decimalPlaces(6)
      ),
    asset,
  };
};
