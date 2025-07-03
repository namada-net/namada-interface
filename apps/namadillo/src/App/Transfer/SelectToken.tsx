import { Chain } from "@chain-registry/types";
import namadaChain from "@namada/chain-registry/namada/chain.json";
import { Modal, Stack } from "@namada/components";
import { AccountType } from "@namada/types";
import { shortenAddress } from "@namada/utils";
import { ModalTransition } from "App/Common/ModalTransition";
import { Search } from "App/Common/Search";
import { routes } from "App/routes";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { namadaTransparentAssetsAtom } from "atoms/balance";
import { chainAssetsMapAtom, chainTokensAtom } from "atoms/chain";
import {
  availableChainsAtom,
  chainRegistryAtom,
  connectedWalletsAtom,
  getDenomFromIbcTrace,
  searchChainByDenom,
} from "atoms/integrations";
import { wallets } from "integrations";
import { KeplrWalletManager } from "integrations/Keplr";
import { findRegistryByChainId } from "integrations/utils";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { IoArrowBack, IoClose } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import { AddressWithAssetAndAmount } from "types";
import { capitalize } from "utils/etc";
import namadaTransparentSvg from "./assets/namada-transparent.svg";
import { WalletCard } from "./WalletCard";

type Network = {
  name: string | undefined;
  icon?: string;
};

type SelectTokenProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: ((address: string | undefined) => void) | undefined;
};

// Helper function to check if a token is an IBC token
const isIbcToken = (
  token: AddressWithAssetAndAmount,
  assetToNetworkMap: Record<string, string>
): boolean => {
  // Check if originalAddress starts with 'ibc/'
  if (token.originalAddress.startsWith("ibc/")) {
    return true;
  }

  // Check if the token's network is not Namada
  const tokenNetworkName =
    assetToNetworkMap[token.originalAddress] || token.asset.name;
  return tokenNetworkName !== "Namada" && tokenNetworkName !== "namada";
};

export const SelectToken = ({
  isOpen,
  onClose,
  onSelect,
}: SelectTokenProps): JSX.Element | null => {
  const [filter, setFilter] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [isConnectingKeplr, setIsConnectingKeplr] = useState(false);
  const [showConnectWalletView, setShowConnectWalletView] = useState(false);
  const [pendingToken, setPendingToken] =
    useState<AddressWithAssetAndAmount | null>(null);
  const transparentAssets = useAtomValue(namadaTransparentAssetsAtom);
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const chainTokens = useAtomValue(chainTokensAtom);
  const chainRegistry = useAtomValue(chainRegistryAtom);
  const [connectedWallets, setConnectedWallets] = useAtom(connectedWalletsAtom);
  const location = useLocation();
  const navigate = useNavigate();
  const chainAssetsMap = Object.values(useAtomValue(chainAssetsMapAtom));
  const ibcChains = useAtomValue(availableChainsAtom);
  const allChains = [...ibcChains, namadaChain as unknown as Chain];

  const allNetworks: Network[] = useMemo(() => {
    return allChains
      .filter((chain) => chain.network_type !== "testnet")
      .map((chainAsset) => {
        return {
          name:
            chainAsset?.chain_name ?
              chainAsset.chain_name.charAt(0).toUpperCase() +
              chainAsset.chain_name.slice(1)
            : "",
          icon: chainAsset?.logo_URIs?.svg,
          chainId: chainAsset?.chain_id,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [chainAssetsMap]);

  // Create a mapping of assets to their network names for better filtering
  const assetToNetworkMap = useMemo(() => {
    const map: Record<string, string> = {};
    chainAssetsMap.forEach((asset) => {
      if (asset && asset.name) {
        // Map asset address to network name
        map[asset.address || asset.base] = asset.name;
      }
    });
    return map;
  }, [chainAssetsMap]);

  // Your tokens
  const tokens = useMemo(() => {
    const result: AddressWithAssetAndAmount[] = [];
    if (transparentAssets.data) {
      Object.values(transparentAssets.data).forEach(
        (item: AddressWithAssetAndAmount) => {
          if (item.asset && item.originalAddress) {
            result.push(item);
          }
        }
      );
    }

    return result;
  }, [transparentAssets.data]);

  const filteredTokens = useMemo(() => {
    return tokens
      .filter((token) => {
        // Filter by search term
        const matchesSearch =
          token.asset.name.toLowerCase().includes(filter.toLowerCase()) ||
          token.asset.symbol.toLowerCase().includes(filter.toLowerCase());

        // Filter by selected network (if any)
        const tokenNetworkName =
          assetToNetworkMap[token.originalAddress] || token.asset.name;
        const matchesNetwork =
          selectedNetwork === null || tokenNetworkName === selectedNetwork;

        return matchesSearch && matchesNetwork;
      })
      .sort((a, b) => Number(b.amount) - Number(a.amount));
  }, [tokens, filter, selectedNetwork, assetToNetworkMap]);

  const hasDefaultAccount = !!accounts?.length;
  const transparentAccount = accounts?.find(
    (account) => account.type !== AccountType.ShieldedKeys
  );
  const accountAddress = transparentAccount?.address;

  const handleConnectWallet = (): void => {
    navigate(routes.switchAccount, {
      state: { backgroundLocation: location },
    });
  };

  const handleNetworkSelect = (networkName: string): void => {
    setSelectedNetwork(selectedNetwork === networkName ? null : networkName);
  };

  const handleKeplrConnection = async (): Promise<boolean> => {
    try {
      setIsConnectingKeplr(true);
      const keplrWallet = new KeplrWalletManager();
      const keplrInstance = await keplrWallet.get();

      if (!keplrInstance) {
        // Keplr is not installed, redirect to download page
        keplrWallet.install();
        return false;
      }

      // Try to enable Keplr for a default chain (cosmoshub is commonly supported)
      const defaultChainRegistry = findRegistryByChainId(
        chainRegistry,
        "cosmoshub-4"
      );

      if (defaultChainRegistry) {
        await keplrWallet.connect(defaultChainRegistry);
        setConnectedWallets((obj) => ({ ...obj, [keplrWallet.key]: true }));
        return true;
      } else {
        console.warn("Could not find default chain for Keplr connection");
        return false;
      }
    } catch (error) {
      console.error("Failed to connect to Keplr:", error);
      return false;
    } finally {
      setIsConnectingKeplr(false);
    }
  };

  const handleTokenSelect = async (
    token: AddressWithAssetAndAmount
  ): Promise<void> => {
    try {
      // Check if this is an IBC token and if we need to connect to Keplr
      if (isIbcToken(token, assetToNetworkMap)) {
        // Check if Keplr is already connected
        if (!connectedWallets.keplr) {
          // Store the pending token and show connect wallet view
          setPendingToken(token);
          setShowConnectWalletView(true);
          return;
        }

        setIsConnectingKeplr(true);

        try {
          const keplrWallet = new KeplrWalletManager();

          // Find the correct chain for this IBC token
          let targetChainRegistry = null;

          // First, try to find the chain using the token's trace if available
          if (chainTokens.data) {
            const chainToken = chainTokens.data.find(
              (chainToken) => chainToken.address === token.originalAddress
            );

            if (chainToken && "trace" in chainToken) {
              const denom = getDenomFromIbcTrace(chainToken.trace);
              const chain = searchChainByDenom(denom);
              if (chain) {
                targetChainRegistry = findRegistryByChainId(
                  chainRegistry,
                  chain.chain_id
                );
              }
            }
          }

          if (targetChainRegistry) {
            // Connect to the specific chain
            await keplrWallet.connect(targetChainRegistry);
          } else {
            console.warn(
              "Could not determine target chain for IBC token, but Keplr is available"
            );
          }
        } catch (error) {
          console.error("Failed to connect to Keplr:", error);
          // Continue with token selection even if Keplr connection fails
        } finally {
          setIsConnectingKeplr(false);
        }
      }

      // Proceed with token selection
      onSelect?.(token.originalAddress);
      onClose();
    } catch (error) {
      console.error("Error in token selection:", error);
      setIsConnectingKeplr(false);
      // Still allow token selection to proceed
      onSelect?.(token.originalAddress);
      onClose();
    }
  };

  const handleKeplrConnect = async (): Promise<void> => {
    const connected = await handleKeplrConnection();
    if (connected && pendingToken) {
      // Hide connect wallet view and proceed with token selection
      setShowConnectWalletView(false);
      // Proceed with the pending token
      handleTokenSelect(pendingToken);
      setPendingToken(null);
      handleCloseModal();
    }
  };

  const handleBackToTokens = (): void => {
    setShowConnectWalletView(false);
    setPendingToken(null);
  };

  const handleCloseModal = (): void => {
    setShowConnectWalletView(false);
    setPendingToken(null);
    onClose();
  };

  const isKeplrInstalled = (): boolean => {
    return Boolean((window as unknown as { keplr?: unknown }).keplr);
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal onClose={handleCloseModal} className="py-20">
        <ModalTransition>
          <div
            className={`flex rounded-xl border border-neutral-700 overflow-hidden ${
              showConnectWalletView ? "h-[180px] w-[500px]" : "h-[500px]"
            }`}
          >
            {!showConnectWalletView ?
              <>
                {/* Left panel */}
                <div className="w-[300px] bg-neutral-900 p-6 flex flex-col overflow-auto">
                  <h5 className="text-neutral-500 text-sm mb-0">
                    Your account
                  </h5>
                  {hasDefaultAccount ?
                    <div className="flex items-center gap-3 mb-2 p-3">
                      <img
                        src={namadaTransparentSvg}
                        alt="namada"
                        className="w-7 h-7"
                      />

                      <div className="text-neutral-500">
                        {shortenAddress(accountAddress || "", 10)}
                      </div>
                    </div>
                  : <button
                      onClick={handleConnectWallet}
                      className="mb-8 p-3 border border-yellow text-yellow rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                      Connect
                    </button>
                  }

                  <h2 className="text-neutral-500 text-sm mb-4">Networks</h2>
                  <Stack
                    as="ul"
                    gap={2}
                    className="flex-1 overflow-auto dark-scrollbar"
                  >
                    <li>
                      <button
                        onClick={() => setSelectedNetwork(null)}
                        className={`flex items-center gap-3 p-2 w-full rounded-lg transition-colors ${
                          selectedNetwork === null ?
                            "bg-yellow/20 border border-yellow"
                          : "hover:bg-neutral-800"
                        }`}
                      >
                        <div className="w-8 h-8 overflow-hidden rounded-full bg-neutral-800 flex items-center justify-center">
                          <span className="text-white">All</span>
                        </div>
                        <span
                          className={
                            selectedNetwork === null ? "text-yellow" : (
                              "text-white"
                            )
                          }
                        >
                          All Networks
                        </span>
                      </button>
                    </li>
                    {allNetworks.map((network) => (
                      <li key={network.name}>
                        <button
                          onClick={() =>
                            handleNetworkSelect(network.name || "")
                          }
                          className={`flex items-center gap-3 p-2 w-full rounded-lg transition-colors ${
                            selectedNetwork === network.name ?
                              "bg-yellow/20 border border-yellow"
                            : "hover:bg-neutral-800"
                          }`}
                        >
                          <div className="w-8 h-8 overflow-hidden rounded-full bg-neutral-800 flex items-center justify-center">
                            {network.icon ?
                              <img
                                src={network.icon}
                                alt={network.name}
                                className="w-6 h-6"
                              />
                            : <span className="text-white">
                                {network.name?.charAt(0)}
                              </span>
                            }
                          </div>
                          <span
                            className={
                              selectedNetwork === network.name ?
                                "text-yellow"
                              : "text-white"
                            }
                          >
                            {network.name}
                          </span>
                        </button>
                      </li>
                    ))}
                  </Stack>
                </div>

                {/* Right panel - Token Selection */}
                <div className="bg-black w-[500px] p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-white text-xl font-medium">
                      Select Token
                    </h2>
                    <button
                      onClick={onClose}
                      className="text-white hover:text-yellow"
                    >
                      <IoClose size={24} />
                    </button>
                  </div>

                  <div className="mb-6">
                    <Search
                      placeholder="Insert token name or symbol"
                      onChange={setFilter}
                    />
                  </div>

                  <div className="mb-6">
                    <div className="h-[400px] overflow-auto dark-scrollbar">
                      <Stack as="ul" gap={2} className="pb-15">
                        {filteredTokens.length > 0 ?
                          filteredTokens.map((token) => (
                            <li key={token.originalAddress}>
                              <button
                                onClick={() => handleTokenSelect(token)}
                                disabled={isConnectingKeplr}
                                className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                                    {(
                                      token.asset.logo_URIs?.png ||
                                      token.asset.logo_URIs?.svg
                                    ) ?
                                      <img
                                        src={
                                          token.asset.logo_URIs?.png ||
                                          token.asset.logo_URIs?.svg
                                        }
                                        alt={token.asset.symbol}
                                        className="w-10 h-10"
                                      />
                                    : <span className="text-white text-lg">
                                        {token.asset.symbol.charAt(0)}
                                      </span>
                                    }
                                  </div>
                                  <div className="flex flex-col items-start">
                                    <span className="text-white font-medium">
                                      {token.asset.symbol}
                                    </span>
                                    {isIbcToken(token, assetToNetworkMap) && (
                                      <span className="text-xs text-neutral-400">
                                        {capitalize(
                                          token.asset.traces?.[0]?.counterparty
                                            .chain_name ?? ""
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-white">
                                    {token.amount.toString()}
                                  </div>
                                  <div className="text-neutral-400 text-sm">
                                    {`$${token.amount.toFixed(2)}`}
                                  </div>
                                </div>
                              </button>
                            </li>
                          ))
                        : <p className="text-neutral-400">No tokens found</p>}
                      </Stack>
                    </div>
                  </div>

                  {isConnectingKeplr && (
                    <div className="text-center text-yellow text-sm">
                      {connectedWallets.keplr ?
                        "Connecting to specific chain..."
                      : "Connecting to Keplr..."}
                    </div>
                  )}
                </div>
              </>
            : /* Connect Wallet View */
              <div className="w-full bg-black p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={handleBackToTokens}
                    className="text-white hover:text-yellow flex items-center gap-2"
                  >
                    <IoArrowBack size={20} />
                  </button>
                  <h2 className="text-white text-xl font-medium">
                    Connect wallet
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-white hover:text-yellow"
                  >
                    <IoClose size={24} />
                  </button>
                </div>

                <div className="flex-1 flex">
                  <div className="w-full">
                    <WalletCard
                      wallet={wallets.keplr}
                      installed={isKeplrInstalled()}
                      connected={false}
                      onConnect={handleKeplrConnect}
                    />
                  </div>
                </div>
              </div>
            }
          </div>
        </ModalTransition>
      </Modal>
    </>
  );
};
