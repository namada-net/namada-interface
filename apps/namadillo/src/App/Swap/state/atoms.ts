//
// Atoms for state shared across osmosis swap feature
// If any of those are used outside of the swap feature, consider moving them up to a more global atoms file
//
import {
  getChainRegistryByChainId,
  namadaRegistryChainAssetsMapAtom,
} from "atoms/integrations";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomWithStorage } from "jotai/utils";
import { SwapStorage } from "types";
import { toBaseAmount } from "utils";
import { fetchQuote } from "./functions";
import { SwapState, SwapStatus } from "./types";

export const swapStorageAtom = atomWithStorage<SwapStorage>(
  "namadillo:swap",
  {
    assetSymbolBuy: undefined,
    assetSymbolSell: undefined,
  },
  undefined,
  { getOnInit: true }
);

export const sellAssetAtom = atom(
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

export const buyAssetAtom = atom(
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

export const swapStateAtom = atom<SwapState>({
  mode: "none",
});

export const swapStatusAtom = atom<SwapStatus>(SwapStatus.Idle);

export const swapQuoteAtom = atomWithQuery((get) => {
  const swapStorage = get(swapStorageAtom);
  const swapState = get(swapStateAtom);
  const chainAssetsMapAtom = get(namadaRegistryChainAssetsMapAtom);

  const namadaAssets =
    chainAssetsMapAtom.isSuccess ? Object.values(chainAssetsMapAtom.data) : [];

  const sellAsset = namadaAssets.find(
    (asset) => asset.symbol === swapStorage.assetSymbolSell
  );
  const buyAsset = namadaAssets.find(
    (asset) => asset.symbol === swapStorage.assetSymbolBuy
  );

  // TODO: osmosis-1 should be dynamic
  const osmosisAssets =
    getChainRegistryByChainId("osmosis-1")?.assets.assets || [];

  //We only want to refetch when sellAmount changes when selling, and buyAmount when buying
  const sellKey = swapState.mode === "sell" ? swapState.sellAmount : "sell";
  const buyKey = swapState.mode === "buy" ? swapState.buyAmount : "buy";

  return {
    enabled: Boolean(sellAsset && buyAsset),
    queryKey: ["swapQuote", sellKey, buyKey],
    queryFn: async () => {
      console.log(
        "swapState",
        swapState.sellAmount?.toString(),
        swapState.buyAmount?.toString()
      );
      // Sanity checks
      invariant(sellAsset, "Sell asset not found");
      invariant(buyAsset, "Buy asset not found");

      const fromOsmosis = osmosisAssets.find(
        (assets) => assets.symbol === sellAsset.symbol
      );
      const toOsmosis = osmosisAssets.find(
        (assets) => assets.symbol === buyAsset.symbol
      );

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

      const params: Record<string, string> =
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
