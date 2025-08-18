import { Sdk } from "@namada/sdk-multicore";
import { initSdk } from "@namada/sdk-multicore/inline";
import { nativeTokenAddressAtom } from "atoms/chain";
import { maspIndexerUrlAtom, rpcUrlAtom } from "atoms/settings";
import { getDefaultStore } from "jotai";

const initializeSdk = async (): Promise<Sdk> => {
  const store = getDefaultStore();
  const rpcUrl = store.get(rpcUrlAtom);
  const maspIndexerUrl = store.get(maspIndexerUrlAtom);
  const nativeToken = store.get(nativeTokenAddressAtom);

  if (!nativeToken.isSuccess) {
    throw "Native token not loaded";
  }

  const sdk = await initSdk({
    rpcUrl,
    token: nativeToken.data,
    maspIndexerUrl: maspIndexerUrl || undefined,
    dbName: "",
  });
  return sdk;
};

// Global instance of initialized SDK
let sdkInstance: Promise<Sdk>;

// Helper to access SDK instance
export const getSdkInstance = async (): Promise<Sdk> => {
  if (!sdkInstance) {
    sdkInstance = initializeSdk();
  }
  return sdkInstance;
};
