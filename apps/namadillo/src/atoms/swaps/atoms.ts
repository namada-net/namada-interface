import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { SwapStorage } from "types";

export const swapStorageAtom = atomWithStorage<SwapStorage>(
  "namadillo:swap",
  {
    assetSymbolBuy: undefined,
    assetSymbolSell: undefined,
  },
  undefined,
  { getOnInit: true }
);

export const setSwapStorageBuyAssetAtom = atom(
  null,
  (_get, set, assetSymbolBuy: string | undefined) => {
    set(swapStorageAtom, (prev) => ({
      ...prev,
      assetSymbolBuy,
    }));
  }
);

export const setSwapStorageSellAssetAtom = atom(
  null,
  (_get, set, assetSymbolSell: string | undefined) => {
    set(swapStorageAtom, (prev) => ({
      ...prev,
      assetSymbolSell,
    }));
  }
);
