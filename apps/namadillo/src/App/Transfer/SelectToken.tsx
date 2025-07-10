import { Chain } from "@chain-registry/types";
import namadaChain from "@namada/chain-registry/namada/chain.json";
import { Modal, Stack } from "@namada/components";
import { ModalTransition } from "App/Common/ModalTransition";
import { Search } from "App/Common/Search";
import {
  namadaShieldedAssetsAtom,
  namadaTransparentAssetsAtom,
} from "atoms/balance";
import { chainTokensAtom } from "atoms/chain";
import {
  connectedWalletsAtom,
  getAvailableChains,
  getChainRegistryByChainName,
  namadaRegistryChainAssetsMapAtom,
} from "atoms/integrations";
import BigNumber from "bignumber.js";
import { wallets } from "integrations";
import { KeplrWalletManager } from "integrations/Keplr";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { IoArrowBack, IoClose } from "react-icons/io5";
import { AssetWithAmount } from "types";
import { capitalize } from "utils/etc";
import { AddressDropdown } from "./AddressDropdown";
import { isNamadaAddress, isShieldedAddress } from "./common";
import { WalletCard } from "./WalletCard";

type Network = {
  name: string | undefined;
  icon?: string;
  chainId?: string;
};

type SelectTokenProps = {
  setSourceAddress: (address: string) => void;
  sourceAddress: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: ((address: string | undefined) => void) | undefined;
};

// Helper function to check if a token is an IBC token
const isIbcToken = (
  token: AssetWithAmount,
  assetToNetworkMap: Record<string, string>
): boolean => {
  // TODO: this should be cleaned up b/c not all just have ibc
  if (token.asset.address?.startsWith("ibc/")) {
    return true;
  }

  // Check if the token's network is not Namada
  const tokenNetworkName =
    assetToNetworkMap[token.asset.address || ""] || token.asset.name;
  return tokenNetworkName !== "Namada" && tokenNetworkName !== "namada";
};

export const SelectToken = ({
  sourceAddress,
  setSourceAddress,
  isOpen,
  onClose,
  onSelect,
}: SelectTokenProps): JSX.Element | null => {
  const transparentAssets = useAtomValue(namadaTransparentAssetsAtom);
  const shieldedAssets = useAtomValue(namadaShieldedAssetsAtom);
  const chainTokens = useAtomValue(chainTokensAtom);
  const [connectedWallets] = useAtom(connectedWalletsAtom);
  const chainAssets = useAtomValue(namadaRegistryChainAssetsMapAtom);
  const chainAssetsMap = Object.values(chainAssets.data ?? {});
  const ibcChains = useMemo(getAvailableChains, []);
  const allChains = [...ibcChains, namadaChain as unknown as Chain];

  const isShielded = isShieldedAddress(sourceAddress);
  const [filter, setFilter] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [isConnectingKeplr, setIsConnectingKeplr] = useState(false);
  const [showConnectWalletView, setShowConnectWalletView] = useState(false);
  const [pendingToken, setPendingToken] = useState<AssetWithAmount | null>(
    null
  );

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
    const result: AssetWithAmount[] = [];

    // Check if current address is a Keplr address (not shielded or transparent Namada)
    const isKeplrAddress = !isNamadaAddress(sourceAddress);

    if (isKeplrAddress) {
      // For Keplr addresses, show all available chain assets but without amounts unless connected
      chainAssetsMap.forEach((asset) => {
        if (asset && asset.address && asset.name) {
          result.push({
            asset: {
              type_asset: asset.type_asset,
              address: asset.address,
              name: asset.name,
              symbol: asset.symbol || asset.name,
              logo_URIs: asset.logo_URIs,
              traces: asset.traces,
              denom_units: asset.denom_units,
              base: asset.base,
              display: asset.display,
            },
            amount: BigNumber(0),
          });
        }
      });
    } else {
      // For Namada addresses, use the appropriate assets atom
      const assets = isShielded ? shieldedAssets.data : transparentAssets.data;
      Object.values(assets ?? {}).forEach((item) => {
        if (item.asset && item.asset.address) {
          result.push(item);
        }
      });
    }

    return result;
  }, [
    sourceAddress,
    transparentAssets.data,
    shieldedAssets.data,
    chainAssetsMap,
    connectedWallets.keplr,
    isShielded,
  ]);

  const filteredTokens = useMemo(() => {
    return tokens
      .filter((token) => {
        // Filter by search term
        const matchesSearch =
          token.asset.name.toLowerCase().includes(filter.toLowerCase()) ||
          token.asset.symbol.toLowerCase().includes(filter.toLowerCase());

        // Filter by selected network (if any)
        const tokenNetworkName =
          assetToNetworkMap[token.asset.address || ""] || token.asset.name;
        const matchesNetwork =
          selectedNetwork === null || tokenNetworkName === selectedNetwork;

        return matchesSearch && matchesNetwork;
      })
      .sort((a, b) => Number(b.amount) - Number(a.amount));
  }, [tokens, filter, selectedNetwork, assetToNetworkMap]);

  const handleNetworkSelect = (networkName: string): void => {
    setSelectedNetwork(selectedNetwork === networkName ? null : networkName);
  };

  const handleAddressChange = (address: string): void => {
    setSourceAddress(address); // Reset network filter when address changes
    setSelectedNetwork(null);
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
      // TODO: we need to make to where the token clicked is connected to here
      return true;
    } catch (error) {
      console.error("Failed to connect to Keplr:", error);
      return false;
    } finally {
      setIsConnectingKeplr(false);
    }
  };

  const handleTokenSelect = async (token: AssetWithAmount): Promise<void> => {
    try {
      // Check if current address is Keplr and if we need to connect to specific chain for this token
      const isKeplrAddress = !isNamadaAddress(sourceAddress);

      if (isKeplrAddress || isIbcToken(token, assetToNetworkMap)) {
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

          // Find the correct chain for this token
          let targetChainRegistry = null;

          // First, try to find the chain using the token's trace if available
          if (chainTokens.data) {
            const chainToken = chainTokens.data.find(
              (chainToken) => chainToken.address === token.asset.address
            );

            if (chainToken && "trace" in chainToken) {
              const chainName =
                token.asset.traces?.[0]?.counterparty?.chain_name;

              if (chainName) {
                targetChainRegistry = getChainRegistryByChainName(chainName);
              }
            }
          }

          if (targetChainRegistry) {
            // Connect to the specific chain
            await keplrWallet.connect(targetChainRegistry);
          } else {
            console.warn(
              "Could not determine target chain for token, but Keplr is available"
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
      onSelect?.(token.asset.address);
      onClose();
    } catch (error) {
      console.error("Error in token selection:", error);
      setIsConnectingKeplr(false);
      // Still allow token selection to proceed
      onSelect?.(token.asset.address);
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
                  <div className="mb-4">
                    <AddressDropdown
                      selectedAddress={sourceAddress}
                      onSelectAddress={handleAddressChange}
                      showAddress={true}
                    />
                  </div>

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
                          filteredTokens.map((token) => {
                            const isKeplrAddress =
                              !isShieldedAddress(sourceAddress) &&
                              !sourceAddress.startsWith("tnam");
                            const showAmount =
                              !isKeplrAddress || connectedWallets.keplr;

                            return (
                              <li key={token.asset.address}>
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
                                            token.asset.traces?.[0]
                                              ?.counterparty.chain_name ?? ""
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {showAmount ?
                                      <>
                                        <div className="text-white">
                                          {token.amount.toString()}
                                        </div>
                                        <div className="text-neutral-400 text-sm">
                                          {`$${token.amount.toFixed(2)}`}
                                        </div>
                                      </>
                                    : <div className="text-neutral-400 text-sm">
                                        Connect wallet
                                      </div>
                                    }
                                  </div>
                                </button>
                              </li>
                            );
                          })
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
