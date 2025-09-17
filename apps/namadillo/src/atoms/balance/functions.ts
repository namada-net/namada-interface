import { Balance } from "@namada/indexer-client";
import BigNumber from "bignumber.js";
import {
  Address,
  NamadaAsset,
  NamadaAssetWithAmount,
  TokenBalance,
} from "types";
import { isNamadaAsset, toDisplayAmount } from "utils";

export const getTotalDollar = (list?: TokenBalance[]): BigNumber =>
  (list ?? []).reduce(
    (sum, { dollar }) => (dollar ? sum.plus(dollar) : sum),
    new BigNumber(0)
  );

export const getTotalNam = (list?: TokenBalance[]): BigNumber =>
  list?.find((i) => isNamadaAsset(i.asset))?.amount ?? new BigNumber(0);

// Type to handle both balance data structures
type BalanceItem = Balance | { tokenAddress: string; minDenomAmount: string };

export const mapNamadaAddressesToAssets = ({
  balances,
  assets,
}: {
  balances: BalanceItem[];
  assets: NamadaAsset[];
}): Record<Address, NamadaAssetWithAmount> => {
  const map: Record<Address, NamadaAssetWithAmount> = {};
  balances.forEach((item) => {
    // Handle both data structures temporarily:
    // 1. {token: {address: '...'}, minDenomAmount: '...'}
    // 2. {tokenAddress: '...', minDenomAmount: '...'}
    let tokenAddress: string | undefined;

    if ("token" in item && item.token?.address) {
      tokenAddress = item.token.address;
    } else if ("tokenAddress" in item) {
      tokenAddress = item.tokenAddress;
    }

    if (!tokenAddress) {
      return;
    }

    const asset = assets.find((asset) => asset.address === tokenAddress);

    if (asset) {
      map[tokenAddress] = {
        amount: toDisplayAmount(asset, BigNumber(item.minDenomAmount)),
        asset,
      };
    }
  });

  return map;
};

export const mapNamadaAssetsToTokenBalances = (
  assets: Record<Address, NamadaAssetWithAmount>,
  tokenPrices: Record<string, BigNumber>
): TokenBalance[] => {
  return Object.entries(assets).map(([address, assetEntry]) => {
    const { asset, amount } = assetEntry;
    const tokenPrice = tokenPrices[address];
    const dollar = tokenPrice ? amount.multipliedBy(tokenPrice) : undefined;

    return {
      address,
      asset,
      amount,
      dollar,
    };
  });
};
