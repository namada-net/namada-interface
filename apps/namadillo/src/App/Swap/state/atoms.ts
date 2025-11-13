//
// Atoms for state shared across osmosis swap feature
// If any of those are used outside of the swap feature, consider moving them up to a more global atoms file
//
import {
  getChainRegistryByChainId,
  getCorrespondingIbcAsset,
  namadaRegistryChainAssetsMapAtom,
} from "atoms/integrations";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { atom, Setter } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomWithStorage } from "jotai/utils";
import debounce from "lodash.debounce";
import { SwapStorage } from "types";
import { toBaseAmount } from "utils";
import { fetchQuote, SLIPPAGE } from "./functions";
import type { SwapState, SwapStatusType } from "./types";
import { SwapStatus } from "./types";

const swapStorageAtom = atomWithStorage<SwapStorage>(
  "namadillo:swap",
  {},
  undefined,
  { getOnInit: true }
);

const sellAssetAtom = atom(
  (get) => {
    const swapStorage = get(swapStorageAtom);
    const chainAssetsMapAtom = get(namadaRegistryChainAssetsMapAtom);

    const namadaAssets =
      chainAssetsMapAtom.isSuccess ?
        Object.values(chainAssetsMapAtom.data)
      : [];

    return namadaAssets.find(
      (asset) => asset.symbol === swapStorage.assetSymbolSell
    );
  },
  (_get, set, assetSymbolSell: string | undefined) => {
    set(swapStorageAtom, (prev) => ({
      ...prev,
      assetSymbolSell,
    }));
  }
);

const buyAssetAtom = atom(
  (get) => {
    const swapStorage = get(swapStorageAtom);
    const chainAssetsMapAtom = get(namadaRegistryChainAssetsMapAtom);

    const namadaAssets =
      chainAssetsMapAtom.isSuccess ?
        Object.values(chainAssetsMapAtom.data)
      : [];

    return namadaAssets.find(
      (asset) => asset.symbol === swapStorage.assetSymbolBuy
    );
  },
  (_get, set, assetSymbolBuy: string | undefined) => {
    set(swapStorageAtom, (prev) => ({
      ...prev,
      assetSymbolBuy,
    }));
  }
);

const defaultSwapState: SwapState = { mode: "none" };
const baseSwapStateAtom = atom<SwapState>(defaultSwapState);

export const internalSwapStateAtom = atom(
  (get) => {
    const sellAsset = get(sellAssetAtom);
    const buyAsset = get(buyAssetAtom);
    const baseState = get(baseSwapStateAtom);

    return {
      ...baseState,
      sellAsset: baseState.sellAsset || sellAsset,
      buyAsset: baseState.buyAsset || buyAsset,
    };
  },
  (get, set, update: SwapState | ((prev: SwapState) => SwapState)) => {
    set(baseSwapStateAtom, update);
    const { sellAsset, buyAsset } = get(internalSwapStateAtom);

    set(sellAssetAtom, sellAsset?.symbol);
    set(buyAssetAtom, buyAsset?.symbol);
  }
);

// We use debounced version of the swap state for fetching quotes to avoid excessive requests
const debouncedSwapStateAtom = atom<SwapState>(defaultSwapState);

const internalDebouncedSwapStateAtom = atom((get) => {
  const sellAsset = get(sellAssetAtom);
  const buyAsset = get(buyAssetAtom);
  const baseState = get(debouncedSwapStateAtom);

  return {
    ...baseState,
    sellAsset: baseState.sellAsset || sellAsset,
    buyAsset: baseState.buyAsset || buyAsset,
  };
});

const debouncedSet = debounce((set: Setter, value: SwapState) => {
  set(debouncedSwapStateAtom, value);
}, 300);

export const swapStateAtom = atom(
  (get) => get(internalSwapStateAtom),
  (get, set, update: SwapState | ((prev: SwapState) => SwapState)) => {
    set(internalSwapStateAtom, update);
    const val = get(internalSwapStateAtom);
    debouncedSet(set, val);
  }
);

export const setInternalSwapStateAtom = atom(
  null,
  (_get, set, update: SwapState | ((prev: SwapState) => SwapState)) => {
    set(internalSwapStateAtom, update);
  }
);

export const swapStatusAtom = atom<SwapStatusType>(SwapStatus.idle());

export const swapQuoteAtom = atomWithQuery((get) => {
  const swapState = get(internalDebouncedSwapStateAtom);
  const swapStatus = get(swapStatusAtom);
  const { sellAsset, buyAsset } = swapState;

  // TODO: this should be configurable once we support osmosis testnet
  const osmosisAssets =
    getChainRegistryByChainId("osmosis-1")?.assets.assets || [];

  //We only want to refetch when sellAmount changes when selling, and buyAmount when buying
  const sellKey =
    swapState.mode === "sell" ?
      `${swapState.sellAmount}-${swapState.sellAsset?.symbol}-${swapState.buyAsset?.symbol}`
    : "sell";
  const buyKey =
    swapState.mode === "buy" ?
      `${swapState.buyAmount}-${swapState.buyAsset?.symbol}-${swapState.sellAsset?.symbol}`
    : "buy";

  // We do not want to refetch during the actual swap process,
  // to not confuse the user with changing quotes
  const refetchOnStatus = ["Idle", "Review"].includes(swapStatus.t);

  return {
    enabled: Boolean(sellAsset && buyAsset),
    // We are refetching every 5 seconds to keep the quote up to date,
    // in case someone keeps the swap screen open for a long time
    refetchInterval: refetchOnStatus && 5000,
    queryKey: ["swapQuote", sellKey, buyKey],
    queryFn: async () => {
      // Sanity checks
      invariant(sellAsset, "Sell asset not found");
      invariant(buyAsset, "Buy asset not found");

      const fromOsmosis = getCorrespondingIbcAsset(sellAsset, osmosisAssets);
      const toOsmosis = getCorrespondingIbcAsset(buyAsset, osmosisAssets);

      invariant(fromOsmosis, "From asset is not found in Osmosis assets");
      invariant(toOsmosis, "To asset is not found in Osmosis assets");

      // If amount is empty, we still want to get a quote for 1 unit of the asset
      const baseAmount =
        swapState.mode === "sell" ?
          toBaseAmount(sellAsset, swapState.sellAmount!)
        : swapState.mode === "buy" ?
          toBaseAmount(buyAsset, swapState.buyAmount!)
        : toBaseAmount(buyAsset, BigNumber(1));

      const simulateSell =
        swapState.mode === "sell" || swapState.mode === "none";

      const params =
        simulateSell ?
          {
            tokenIn: `${baseAmount}${fromOsmosis.base}`,
            tokenOutDenom: toOsmosis.base,
          }
        : {
            tokenOut: `${baseAmount}${toOsmosis.base}`,
            tokenInDenom: fromOsmosis.base,
          };

      return await fetchQuote(params);
    },
  };
});

const internalSwapSlippageAtom = atom<{
  default: BigNumber;
  override: BigNumber | null;
}>({ default: BigNumber(SLIPPAGE), override: null });

export const swapSlippageAtom = atom(
  (get) => get(internalSwapSlippageAtom),
  (_get, set, slippage: BigNumber | null) => {
    set(internalSwapSlippageAtom, (s) => ({
      ...s,
      override: slippage,
    }));
  }
);

export const swapMinAmountAtom = atom<BigNumber | undefined>((get) => {
  const quote = get(swapQuoteAtom).data;
  const slippage = get(swapSlippageAtom);
  const slippageValue = slippage.override || slippage.default;

  if (!quote) return;
  return quote.amount.times(BigNumber(1).minus(slippageValue));
});
