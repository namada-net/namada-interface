import {
  connectedWalletsAtom,
  getChainRegistryByChainId,
  selectedIBCChainAtom,
} from "atoms/integrations";
import { WalletConnector } from "integrations/types";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { ChainRegistryEntry } from "types";

type UseWalletOutput = {
  registry?: ChainRegistryEntry;
  chainId?: string;
  walletAddress?: string;
  connectToChainId: (chainId: string) => Promise<void>;
  setWalletAddress: (walletAddress: string) => void;
  loadWalletAddress: (chainId: string) => Promise<string>;
  setConnectedWallets: (connectedWallets: Record<string, boolean>) => void;
};

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
    connectToChainId,
    loadWalletAddress,
    setWalletAddress,
    setConnectedWallets,
  };
};
