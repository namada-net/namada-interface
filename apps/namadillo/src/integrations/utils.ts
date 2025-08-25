import { Chain } from "@chain-registry/types";
import { FeeToken } from "@chain-registry/types/chain.schema";
import { Bech32Config, ChainInfo, Currency } from "@keplr-wallet/types";
import namadaChain from "@namada/chain-registry/namada/chain.json";
import tokenImage from "App/Common/assets/token.svg";
import { isShieldedAddress, isTransparentAddress } from "App/Transfer/common";
import {
  getChainRegistryByChainName,
  getRestApiAddressByIndex,
  getRpcByIndex,
} from "atoms/integrations";
import BigNumber from "bignumber.js";
import { chains } from "chain-registry";

import {
  Asset,
  AssetWithAmount,
  ChainId,
  ChainRegistryEntry,
  GasConfig,
} from "types";

type GasPriceStep = {
  low: number;
  average: number;
  high: number;
};

type GasPriceByDenom = Record<string, GasPriceStep>;

type CurrencyWithGasPriceStep = Currency & {
  gasPriceStep?: GasPriceStep;
};

export const findRegistryByChainId = (
  knownChains: Record<ChainId, ChainRegistryEntry>,
  chainId: string
): ChainRegistryEntry | undefined => {
  if (chainId in knownChains) {
    return knownChains[chainId];
  }
  return undefined;
};

export const getChainFromAddress = (address: string): Chain | undefined => {
  if (isShieldedAddress(address) || isTransparentAddress(address)) {
    return chains.find((chain) => chain.chain_name === "namada") as Chain;
  } else {
    // Connect to IBC chain and then return the registered chain
    const chain = chains.find(
      (chain) => chain.bech32_prefix && address.startsWith(chain.bech32_prefix)
    );
    return chain as Chain | undefined;
  }
};

const getSvgOrPng = (image?: {
  svg?: string;
  png?: string;
}): string | undefined => {
  return image?.svg || image?.png;
};

// Helper function to get chain from token
export const getChainFromAsset = (
  token: AssetWithAmount
): Chain | undefined => {
  // For NAM token, we want to show Osmosis chain logo since it's bridged there
  if (token.asset.base === "unam") {
    return getChainRegistryByChainName("osmosis")?.chain;
  }

  // For other tokens, get chain from traces
  const chainName = token.asset.traces?.[0]?.counterparty?.chain_name;
  if (chainName) {
    return getChainRegistryByChainName(chainName)?.chain;
  }

  // Fallback to namada chain if no traces
  return namadaChain as unknown as Chain;
};

export const getChainImageUrl = (chain?: Chain): string => {
  if (!chain) return tokenImage;
  return (
    getSvgOrPng(chain.images?.find((i) => i.theme?.circle)) ||
    getSvgOrPng(chain.images?.[0]) ||
    getSvgOrPng(chain.logo_URIs) ||
    tokenImage
  );
};

export const getAssetImageUrl = (asset?: Asset): string => {
  if (!asset) return tokenImage;
  return getSvgOrPng(asset.logo_URIs) || tokenImage;
};

export const getIbcGasConfig = (
  feeToken: FeeToken,
  gasLimit: number = 222_000
): GasConfig | undefined => {
  const gasPriceInBaseDenom =
    feeToken.average_gas_price ??
    feeToken.low_gas_price ??
    feeToken.fixed_min_gas_price ??
    feeToken.high_gas_price ??
    feeToken.gas_costs?.ibc_transfer ??
    feeToken.gas_costs?.cosmos_send ??
    0;

  return {
    gasPriceInMinDenom: BigNumber(gasPriceInBaseDenom),
    gasLimit: BigNumber(gasLimit),
    gasToken: feeToken.denom,
  };
};

export const assetsToKeplrCurrencies = (assets: Asset[]): Currency[] => {
  return assets.map((asset) => ({
    coinDenom: asset.symbol,
    coinMinimalDenom: asset.base,
    coinDecimals: asset.denom_units.filter(
      (denomUnit: { denom: string }) => denomUnit.denom === asset.display
    )[0]?.exponent,
    coinGeckoId: asset.coingecko_id || undefined,
    coinImageUrl: getAssetImageUrl(asset),
  }));
};

const mapGasPriceByDenom = ({ fees }: Chain): GasPriceByDenom =>
  fees?.fee_tokens?.reduce(
    (acc, { denom, low_gas_price, average_gas_price, high_gas_price }) => ({
      ...acc,
      [denom]: {
        low: low_gas_price ?? 0.01,
        average: average_gas_price ?? 0.025,
        high: high_gas_price ?? 0.04,
      },
    }),
    {} as GasPriceByDenom
  ) || {};

const generateBech32Config = (prefix: string): Bech32Config => {
  return {
    bech32PrefixAccAddr: prefix,
    bech32PrefixAccPub: `${prefix}pub`,
    bech32PrefixValAddr: `${prefix}valoper`,
    bech32PrefixValPub: `${prefix}valoperpub`,
    bech32PrefixConsAddr: `${prefix}valcons`,
    bech32PrefixConsPub: `${prefix}valconspub`,
  };
};

const getRelevantCurrencies = (
  currencies: Currency[],
  denoms: string[]
): Currency[] =>
  currencies.filter(({ coinMinimalDenom }) =>
    denoms.includes(coinMinimalDenom)
  );

const enhanceCurrencyWithGas = (
  gasPriceSteps: GasPriceByDenom,
  currency: Currency
): CurrencyWithGasPriceStep => {
  const gasPriceStep = gasPriceSteps[currency.coinMinimalDenom];
  return gasPriceStep ? { ...currency, gasPriceStep } : currency;
};

// Based on https://github.com/cosmology-tech/chain-registry/tree/main/v2/packages/keplr
// Following the structure described in https://docs.keplr.app/api/suggest-chain.html
export const basicConvertToKeplrChain = (
  chain: Chain,
  assets: Asset[]
): ChainInfo => {
  const currencies = assetsToKeplrCurrencies(assets);
  const gasPriceSteps = mapGasPriceByDenom(chain);

  const feeTokens = chain.fees?.fee_tokens.map(({ denom }) => denom) || [];

  const stakingTokens =
    chain.staking?.staking_tokens.map(({ denom }) => denom) || [];

  const stakeCurrency =
    currencies.find(({ coinDenom }) => stakingTokens.includes(coinDenom)) ||
    currencies[0];

  const feeCurrencies = getRelevantCurrencies(currencies, feeTokens).map(
    (currency) => enhanceCurrencyWithGas(gasPriceSteps, currency)
  );

  const defaultFeeCurrencies = [stakeCurrency].map((currency) =>
    enhanceCurrencyWithGas(gasPriceSteps, currency)
  );

  const rpc = getRpcByIndex(chain, 0);
  const rest = getRestApiAddressByIndex(chain, 0);

  return {
    chainId: chain.chain_id,
    chainName: chain.chain_name,
    rpc: rpc.address,
    rest,
    // TODO:
    bip44: { coinType: chain.slip44! },
    // TODO:
    bech32Config: generateBech32Config(chain.bech32_prefix!),
    currencies,
    stakeCurrency,
    feeCurrencies: feeCurrencies.length ? feeCurrencies : defaultFeeCurrencies,
  };
};
