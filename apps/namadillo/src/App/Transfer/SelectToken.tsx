import { Chain } from "@chain-registry/types";
import namadaChain from "@namada/chain-registry/namada/chain.json";
import { Modal, Stack } from "@namada/components";
import { ModalTransition } from "App/Common/ModalTransition";
import { Search } from "App/Common/Search";
import {
  allKeplrAssetsBalanceAtom,
  connectedWalletsAtom,
  getAvailableChains,
  getChainRegistryByChainName,
  namadaRegistryChainAssetsMapAtom,
} from "atoms/integrations";
import { tokenPricesFamily } from "atoms/prices/atoms";
import clsx from "clsx";
import { useWalletManager } from "hooks/useWalletManager";
import { KeplrWalletManager } from "integrations/Keplr";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import { AssetWithAmount } from "types";
import { AddressDropdown } from "./AddressDropdown";
import { isNamadaAddress } from "./common";

type SelectTokenProps = {
  setSourceAddress: (address: string) => void;
  sourceAddress: string;
  destinationAddress: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: ((selectedAsset: AssetWithAmount) => void) | undefined;
  keplrWalletManager?: KeplrWalletManager | undefined;
  assetsWithAmounts: AssetWithAmount[];
};

export const SelectToken = ({
  sourceAddress,
  destinationAddress,
  setSourceAddress,
  isOpen,
  onClose,
  onSelect,
  assetsWithAmounts,
  keplrWalletManager,
}: SelectTokenProps): JSX.Element | null => {
  const [filter, setFilter] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [isConnectingKeplr, setIsConnectingKeplr] = useState(false);
  const [connectedWallets, setConnectedWallets] = useAtom(connectedWalletsAtom);
  const chainAssets = useAtomValue(namadaRegistryChainAssetsMapAtom);
  const chainAssetsMap = Object.values(chainAssets.data ?? {});
  const ibcChains = useMemo(getAvailableChains, []);
  const allChains = [...ibcChains, namadaChain as unknown as Chain];

  // Create KeplrWalletManager instance and use with useWalletManager hook
  const keplrWallet = keplrWalletManager ?? new KeplrWalletManager();
  const { connectToChainId } = useWalletManager(keplrWallet);

  // Get balances for connected chains
  const keplrBalances = useAtomValue(allKeplrAssetsBalanceAtom);
  const allNetworks: Chain[] = useMemo(() => {
    return allChains
      .filter((chain) => chain.network_type !== "testnet")
      .sort((a, b) => a.chain_name.localeCompare(b.chain_name));
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

  // Get token prices for USD calculation
  const tokenAddresses = assetsWithAmounts
    .map((assetWithAmount) => assetWithAmount.asset.address)
    .filter((address): address is string => Boolean(address));

  const tokenPrices = useAtomValue(tokenPricesFamily(tokenAddresses));

  const filteredTokens = useMemo(() => {
    return assetsWithAmounts
      .filter((assetWithAmount) => {
        // Filter by search term
        const matchesSearch =
          assetWithAmount.asset.name
            .toLowerCase()
            .includes(filter.toLowerCase()) ||
          assetWithAmount.asset.symbol
            .toLowerCase()
            .includes(filter.toLowerCase());

        // Filter by selected network (if any)
        const tokenNetworkName =
          assetToNetworkMap[assetWithAmount.asset.address || ""] ||
          assetWithAmount.asset.name;
        const matchesNetwork =
          selectedNetwork === null || tokenNetworkName === selectedNetwork;

        return matchesSearch && matchesNetwork;
      })
      .sort((a, b) => Number(b.amount) - Number(a.amount));
  }, [assetsWithAmounts, filter, selectedNetwork, assetToNetworkMap]);

  const handleNetworkSelect = (networkName: string): void => {
    setSelectedNetwork(selectedNetwork === networkName ? null : networkName);
  };

  const handleAddressChange = (address: string): void => {
    setSourceAddress(address); // Only update local state
    setSelectedNetwork(null); // Reset network filter when address changes
  };

  const handleClose = (): void => {
    onClose();
  };

  const handleTokenSelect = async (token: AssetWithAmount): Promise<void> => {
    // Check if current address is Keplr and if we need to connect to specific chain for this token
    const isIbcOrKeplrToken = !isNamadaAddress(sourceAddress);

    try {
      if (isIbcOrKeplrToken) {
        setIsConnectingKeplr(true);

        try {
          const keplrInstance = await keplrWallet.get();
          // Keplr is not installed, redirect to download page
          if (!keplrInstance) {
            keplrWallet.install();
            return;
          }

          const chainName =
            token.asset.base === "unam" ?
              "osmosis"
            : token.asset.traces?.[0]?.counterparty?.chain_name;
          const targetChainRegistry = getChainRegistryByChainName(chainName!);
          const chainId = targetChainRegistry?.chain.chain_id as string;
          await connectToChainId(chainId);

          // Update connected wallets state only after successful connection
          setConnectedWallets((obj: Record<string, boolean>) => ({
            ...obj,
            [keplrWallet.key]: true,
          }));
          const key = await keplrInstance.getKey(chainId);
          setSourceAddress(key.bech32Address);
        } catch (error) {
          console.error(
            "Failed to connect to Keplr for token:",
            token.asset.symbol,
            error
          );
          // Continue with token selection even if Keplr connection fails
        } finally {
          setIsConnectingKeplr(false);
        }
      }

      onSelect?.(token);
      onClose();
    } catch (error) {
      console.error("Error in token selection:", error);
      setIsConnectingKeplr(false);
      onSelect?.(token);
      onClose();
    }
  };
  if (!isOpen) return null;

  return (
    <>
      <Modal onClose={handleClose} className="py-20">
        <ModalTransition>
          <div className="flex rounded-xl border border-neutral-700 overflow-hidden h-[500px]">
            {/* Left panel */}
            <div className="w-[300px] bg-neutral-900 p-6 flex flex-col overflow-auto">
              <h5 className="text-neutral-500 text-sm mb-0">Your account</h5>
              <div className="mb-4">
                <AddressDropdown
                  destinationAddress={destinationAddress}
                  selectedAddress={sourceAddress}
                  onSelectAddress={handleAddressChange}
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
                        selectedNetwork === null ? "text-yellow" : "text-white"
                      }
                    >
                      All Networks
                    </span>
                  </button>
                </li>
                {allNetworks.map((network) => (
                  <li key={network.chain_name}>
                    <button
                      onClick={() =>
                        handleNetworkSelect(network.chain_name || "")
                      }
                      className={`flex items-center gap-3 p-2 w-full rounded-lg transition-colors ${
                        selectedNetwork === network.chain_name ?
                          "bg-yellow/20 border border-yellow"
                        : "hover:bg-neutral-800"
                      }`}
                    >
                      <div className="w-8 h-8 overflow-hidden rounded-full bg-neutral-800 flex items-center justify-center">
                        {network.logo_URIs?.svg ?
                          <img
                            src={network.logo_URIs?.svg}
                            alt={network.chain_name}
                            className="w-6 h-6"
                          />
                        : <span className="text-white">
                            {network.chain_name?.charAt(0)}
                          </span>
                        }
                      </div>
                      <span
                        className={clsx(
                          selectedNetwork === network.chain_name ?
                            "text-yellow"
                          : "text-white",
                          "capitalize"
                        )}
                      >
                        {network.chain_name}
                      </span>
                    </button>
                  </li>
                ))}
              </Stack>
            </div>

            {/* Right panel - Token Selection */}
            <div className="bg-black w-[500px] p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-white text-xl font-medium">Select Token</h2>
                <button
                  onClick={handleClose}
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
                        const isKeplrAddress = !isNamadaAddress(sourceAddress);

                        // For Keplr addresses, only show amounts if we have balance data and it's > 0
                        // For Namada addresses, show amounts if > 0
                        const showAmount =
                          isKeplrAddress ?
                            token.amount.gt(0) && connectedWallets.keplr
                          : token.amount.gt(0);
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
                                  {token.asset.traces?.[0]?.counterparty
                                    .chain_name && (
                                    <span className="text-xs capitalize text-neutral-400">
                                      {token.asset.traces?.[0]?.counterparty
                                        .chain_name ?? ""}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                {showAmount && (
                                  <>
                                    <div className="text-white">
                                      {token.amount.toString()}
                                    </div>
                                    <div className="text-neutral-400 text-sm">
                                      {(() => {
                                        const tokenPrice =
                                          token.asset.address ?
                                            tokenPrices.data?.[
                                              token.asset.address
                                            ]
                                          : undefined;
                                        if (tokenPrice) {
                                          const usdValue =
                                            token.amount.multipliedBy(
                                              tokenPrice
                                            );
                                          return `$${usdValue.toFixed(2)}`;
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  </>
                                )}
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
                  Connecting to Keplr...
                </div>
              )}
            </div>
          </div>
        </ModalTransition>
      </Modal>
    </>
  );
};
