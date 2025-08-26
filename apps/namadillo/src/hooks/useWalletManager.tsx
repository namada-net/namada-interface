import {
  connectedWalletsAtom,
  getAvailableChains,
  getChainRegistryByChainId,
  selectedIBCChainAtom,
} from "atoms/integrations";
import { KeplrWalletManager } from "integrations/Keplr";
import { WalletConnector } from "integrations/types";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { ChainRegistryEntry } from "types";

type UseWalletOutput = {
  registry?: ChainRegistryEntry;
  chainId?: string;
  walletAddress?: string;
  connectAllKeplrChains: () => Promise<void>;
  connectToChainId: (chainId: string) => Promise<void>;
  setWalletAddress: (walletAddress: string) => void;
  loadWalletAddress: (chainId: string) => Promise<string>;
};

const keplr = new KeplrWalletManager();

export const useWalletManager = (wallet: WalletConnector): UseWalletOutput => {
  const [walletAddress, setWalletAddress] = useState<string | undefined>();
  const [chainId, setChainId] = useAtom(selectedIBCChainAtom);
  const [connectedWallets, setConnectedWallets] = useAtom(connectedWalletsAtom);
  const [registry, setRegistry] = useState<ChainRegistryEntry>();

  const walletKey = wallet.key;
  const isConnected = connectedWallets[walletKey];

  useEffect(() => {
    (async () => {
      if (isConnected && chainId) {
        await connectToChainId(chainId);
      } else {
        setWalletAddress(undefined);
        setRegistry(undefined);
      }
    })();
  }, [isConnected, walletKey, chainId]);

  const connectAllKeplrChains = async (): Promise<void> => {
    const keplrInstance = await keplr.get();

    if (!keplrInstance) {
      // Keplr is not installed, redirect to download page
      keplr.install();
      return;
    }

    // Get all available chains
    const availableChains = getAvailableChains();

    // Enable Keplr for all supported chains
    const enablePromises = availableChains.map(async (chain) => {
      try {
        await keplrInstance.enable(chain.chain_id);
        return { chainId: chain.chain_id, success: true };
      } catch (error) {
        console.warn(`Failed to enable chain ${chain.chain_id}:`, error);
        return { chainId: chain.chain_id, success: false, error };
      }
    });

    await Promise.allSettled(enablePromises);

    // Update connected wallets state
    setConnectedWallets((obj) => ({ ...obj, [keplr.key]: true }));
  };

  const connectToChainId = async (chainId: string): Promise<void> => {
    const registry = getChainRegistryByChainId(chainId);
    if (!registry) {
      throw "Unknown registry. Tried to search for " + chainId;
    }

    await wallet.connect(registry);
    await loadWalletAddress(chainId);
    setChainId(registry.chain.chain_id);
    setRegistry(registry);
    setConnectedWallets((obj) => ({ ...obj, [walletKey]: true }));
  };

  const loadWalletAddress = async (chainId: string): Promise<string> => {
    const address = await wallet.getAddress(chainId);
    setWalletAddress(address);
    return address;
  };

  return {
    registry,
    chainId,
    walletAddress,
    connectAllKeplrChains,
    connectToChainId,
    loadWalletAddress,
    setWalletAddress,
  };
};
