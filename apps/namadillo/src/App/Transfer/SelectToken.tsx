import { Chain } from "@chain-registry/types";
import { Modal, Stack } from "@namada/components";
import { ModalTransition } from "App/Common/ModalTransition";
import { Search } from "App/Common/Search";
import {
  allChainsAtom,
  connectedWalletsAtom,
  getChainRegistryByChainName,
  namadaRegistryChainAssetsMapAtom,
  SUPPORTED_ASSETS_MAP,
} from "atoms/integrations";
import { tokenPricesFamily } from "atoms/prices/atoms";
import clsx from "clsx";
import { useWalletManager } from "hooks/useWalletManager";
import { KeplrWalletManager } from "integrations/Keplr";
import invariant from "invariant";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import { AssetWithAmountAndChain } from "types";
import { AddressDropdown } from "./AddressDropdown";
import { ChainBadge } from "./ChainBadge";
import { isNamadaAddress } from "./common";

type SelectTokenProps = {
  setSourceAddress: (address?: string) => void;
  sourceAddress: string;
  destinationAddress: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect:
    | ((
        selectedAsset: AssetWithAmountAndChain,
        newSourceAddress?: string
      ) => void)
    | undefined;
  keplrWalletManager?: KeplrWalletManager;
  assetsWithAmounts: AssetWithAmountAndChain[];
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
  const [_, setConnectedWallets] = useAtom(connectedWalletsAtom);
  const chainAssets = useAtomValue(namadaRegistryChainAssetsMapAtom);
  const chainAssetsMap = Object.values(chainAssets.data ?? {});
  const allChains = useAtomValue(allChainsAtom);

  // Create KeplrWalletManager instance and use with useWalletManager hook
  const keplrWallet = keplrWalletManager ?? new KeplrWalletManager();
  const { connectToChainId } = useWalletManager(keplrWallet);

  // Get balances for connected chains
  const allNetworks: Chain[] = useMemo(() => {
    return (allChains.data ?? [])
      .filter(
        (chain) =>
          chain.network_type !== "testnet" && chain.chain_name !== "namada"
      )
      .sort((a, b) => a.chain_name.localeCompare(b.chain_name));
  }, [allChains.data]);

  // Create a mapping of assets to their network names for better filtering
  const assetToNetworkMap = useMemo(() => {
    const map: Record<string, string> = {};
    chainAssetsMap.forEach((asset) => {
      if (asset && asset.name) {
        // Map asset address to network name
        map[asset.address || asset.base] = asset.display;
      }
    });
    return map;
  }, [chainAssetsMap]);

  // Get token prices for USD calculation
  const tokenAddresses = assetsWithAmounts
    .map((assetWithAmount) => assetWithAmount.asset.address ?? "")
    .filter((address) => !!address);

  const tokenPrices = useAtomValue(tokenPricesFamily(tokenAddresses));

  const filteredTokens = useMemo(() => {
    return assetsWithAmounts
      .filter((assetWithAmount) => {
        if (assetWithAmount.amount.eq(0)) return false;

        // Filter by search term
        const matchesSearch =
          !!filter &&
          assetWithAmount.asset.name
            .toLowerCase()
            .includes(filter.toLowerCase());

        const matchesNetwork =
          selectedNetwork ===
          assetWithAmount.asset.traces?.[0]?.counterparty?.chain_name;
        return !selectedNetwork ? true : matchesSearch || matchesNetwork;
      })
      .sort((a, b) => Number(b.amount) - Number(a.amount));
  }, [assetsWithAmounts, filter, selectedNetwork, assetToNetworkMap]);

  const handleNetworkSelect = (networkName: string): void => {
    setSelectedNetwork(selectedNetwork === networkName ? null : networkName);
  };

  const handleWalletAddressChange = (address: string): void => {
    setSourceAddress(address); // Only update local state
    setSelectedNetwork(null); // Reset network filter when address changes
  };

  const handleClose = (): void => {
    onClose();
  };

  const handleTokenSelect = useCallback(
    async (token: AssetWithAmountAndChain): Promise<void> => {
      // Check if current address is Keplr and if we need to connect to specific chain for this token
      const isIbcOrKeplrToken = !isNamadaAddress(sourceAddress);
      const destinationIsIbcOrKeplrToken = !isNamadaAddress(destinationAddress);
      // only used for IBC tokens
      let newSourceAddress: string | undefined;
      try {
        if (isIbcOrKeplrToken) {
          setIsConnectingKeplr(true);

          try {
            const keplrInstance = await keplrWallet.get();
            // Keplr is not installed, redirect to download page
            if (!keplrInstance) return keplrWallet.install();
            const targetChainRegistry = getChainRegistryByChainName(
              token.chainName
            );
            invariant(targetChainRegistry, "Target chain registry not found");
            const chainId = targetChainRegistry.chain.chain_id;
            await connectToChainId(chainId);
            // Update connected wallets state only after successful connection
            setConnectedWallets((obj: Record<string, boolean>) => ({
              ...obj,
              [keplrWallet.key]: true,
            }));
            const key = await keplrInstance.getKey(chainId);
            newSourceAddress = key.bech32Address;
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
        } else if (destinationIsIbcOrKeplrToken) {
          // Because IbcWithdraw uses registry from KeplrWalletManager, we need to connect to
          // the source chain of the selected asset. Otherwise channels may not be correct as
          // ibcChannelsFamily relies on connected registry.
          const chainName = [...SUPPORTED_ASSETS_MAP.entries()].find(
            ([_, assetSymbols]) => {
              return assetSymbols.includes(token.asset.symbol);
            }
          )?.[0];
          invariant(chainName, "Chain name not found for selected asset");
          const registry = getChainRegistryByChainName(chainName);
          invariant(registry, "Chain registry not found for counterparty");
          await connectToChainId(registry.chain.chain_id);
        }

        onSelect?.(token, newSourceAddress);
        onClose();
      } catch (error) {
        console.error("Error in token selection:", error);
        setIsConnectingKeplr(false);
        onSelect?.(token, newSourceAddress);
        onClose();
      }
    },
    [sourceAddress]
  );

  const getOverlayChainLogo = (
    token: AssetWithAmountAndChain
  ): JSX.Element | null => {
    const chain = getChainRegistryByChainName(token.chainName)?.chain;
    const isNamada = token.chainName === "namada";

    if (isNamada) return null;
    return (
      <ChainBadge
        chain={chain}
        className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border border-neutral-600"
      />
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal onClose={handleClose} className="py-20">
        <ModalTransition>
          <div className="flex rounded-xl border border-neutral-700 overflow-hidden h-[500px]">
            {/* Left panel */}
            <div className="w-[275px] bg-neutral-900 py-5 pl-5 pr-2 flex flex-col overflow-auto">
              <AddressDropdown
                destinationAddress={destinationAddress}
                selectedAddress={sourceAddress}
                onSelectAddress={handleWalletAddressChange}
              />
              <h2 className="text-neutral-500 text-sm mb-1">From A to Z</h2>
              <Stack
                as="ul"
                gap={1}
                className="flex-1 overflow-auto dark-scrollbar"
              >
                <li>
                  <button
                    onClick={() => setSelectedNetwork(null)}
                    className={`flex items-center gap-3 p-2 w-full rounded-sm transition-colors ${
                      selectedNetwork === null ?
                        "bg-white/5 border border-white/20"
                      : "hover:bg-neutral-800"
                    }`}
                  >
                    <div className="w-7 h-7 overflow-hidden rounded-lg bg-neutral-800 flex items-center justify-center">
                      <span className="text-white">All</span>
                    </div>
                    <span className="text-white">All Networks</span>
                  </button>
                </li>
                {allNetworks.map((network) => (
                  <li key={network.chain_name}>
                    <button
                      onClick={() =>
                        handleNetworkSelect(network.chain_name.toLowerCase())
                      }
                      className={`flex items-center gap-3 p-2 w-full rounded-sm transition-colors ${
                        selectedNetwork === network.chain_name ?
                          "bg-white/5 border border-white/20"
                        : "hover:bg-neutral-800"
                      }`}
                    >
                      <ChainBadge chain={network} />
                      <span
                        className={clsx("capitalize font-normal text-white")}
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
                    <span className={clsx("text-white text-sm")}>
                      Your Tokens
                    </span>
                    {filteredTokens.length > 0 ?
                      filteredTokens.map((token) => {
                        const tokenPrice =
                          token.asset.address ?
                            tokenPrices.data?.[token.asset.address]
                          : undefined;
                        return (
                          <li key={token.asset.address}>
                            <button
                              onClick={() => handleTokenSelect(token)}
                              disabled={isConnectingKeplr}
                              className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 flex items-center justify-center">
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
                                  {/* Small chain logo overlay */}
                                  {getOverlayChainLogo(token)}
                                </div>
                                <div className="flex flex-col items-start">
                                  <span className="text-white font-medium">
                                    {token.asset.symbol}
                                  </span>
                                  <span className="text-xs capitalize text-neutral-400">
                                    {token.chainName ?? ""}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-white">
                                  {token.amount.toString()}
                                </div>
                                <div className="text-neutral-400 text-sm">
                                  {tokenPrice &&
                                    `$${token.amount.multipliedBy(tokenPrice).toFixed(2)}`}
                                </div>
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
