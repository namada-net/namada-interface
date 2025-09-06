import { Balance } from "@namada/indexer-client";
import BigNumber from "bignumber.js";
import {
  Address,
  NamadaAsset,
  NamadaAssetWithAmount,
  TokenBalance,
} from "types";
import { isNamadaAsset, toDisplayAmount } from "utils";

// Interface for shielded balance data structure (stored locally)
export interface ShieldedBalance {
  address: Address;
  minDenomAmount: string;
}

// Type for balances that can be either from API (Balance) or local storage (ShieldedBalance)
export type BalanceInput = Balance | ShieldedBalance;

export const getTotalDollar = (list?: TokenBalance[]): BigNumber =>
  (list ?? []).reduce(
    (sum, { dollar }) => (dollar ? sum.plus(dollar) : sum),
    new BigNumber(0)
  );

export const getTotalNam = (list?: TokenBalance[]): BigNumber =>
  list?.find((i) => isNamadaAsset(i.asset))?.amount ?? new BigNumber(0);

// Helper function to extract token address from either Balance or ShieldedBalance
const getTokenAddress = (balance: BalanceInput): Address => {
  // Check if it's a Balance (has token property) or ShieldedBalance (has address property)
  if ("token" in balance) {
    // It's a Balance from the API
    return balance.token.address || "";
  } else {
    // It's a ShieldedBalance from local storage
    return balance.address;
  }
};

export const mapNamadaAddressesToAssets = ({
  balances,
  assets,
}: {
  balances: BalanceInput[];
  assets: NamadaAsset[];
}): Record<Address, NamadaAssetWithAmount> => {
  const map: Record<Address, NamadaAssetWithAmount> = {};
  balances.forEach((item) => {
    const tokenAddress = getTokenAddress(item);
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
