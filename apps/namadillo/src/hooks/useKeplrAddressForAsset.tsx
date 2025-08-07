import { getChainRegistryByChainName } from "atoms/integrations";
import { KeplrWalletManager } from "integrations/Keplr";
import { useEffect, useState } from "react";
import { Asset } from "types";

export const useKeplrAddressForAsset = (sourceAsset?: Asset): string | null => {
  const [keplrAddress, setKeplrAddress] = useState<string | null>(null);

  useEffect(() => {
    const getKeplrAddressForAsset = async (
      sourceAsset?: Asset
    ): Promise<string | null> => {
      if (!sourceAsset) return null;

      const keplr = new KeplrWalletManager();
      const keplrInstance = await keplr.get();

      if (!keplrInstance) return null;

      // Determine chain name from asset
      const chainName =
        sourceAsset.base === "unam" ?
          "osmosis"
        : sourceAsset.traces?.[0]?.counterparty?.chain_name;

      if (!chainName) return null;

      // Get chain ID and fetch address
      const chainRegistry = getChainRegistryByChainName(chainName);
      const chainId = chainRegistry?.chain.chain_id;

      if (!chainId) return null;

      try {
        const key = await keplrInstance.getKey(chainId);
        return key.bech32Address;
      } catch (error) {
        console.error("Failed to get Keplr address:", error);
        return null;
      }
    };

    const fetchKeplrAddress = async (): Promise<void> => {
      const address = await getKeplrAddressForAsset(sourceAsset);
      setKeplrAddress(address);
    };

    fetchKeplrAddress();
  }, [sourceAsset]);

  return keplrAddress;
};
