import { AccountType } from "@namada/types";
import { shortenAddress } from "@namada/utils";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { namadaTransparentAssetsAtom } from "atoms/balance";
import { chainAssetsMapAtom, chainTokensAtom } from "atoms/chain";
import {
  chainRegistryAtom,
  connectedWalletsAtom,
  getDenomFromIbcTrace,
  searchChainByDenom,
} from "atoms/integrations";
import { tokenPricesFamily } from "atoms/prices/atoms";
import {
  namadaExtensionAttachStatus,
  namadaExtensionConnectionStatus,
} from "atoms/settings";
import { useNamadaKeychain } from "hooks/useNamadaKeychain";
import { wallets } from "integrations";
import { KeplrWalletManager } from "integrations/Keplr";
import { findRegistryByChainId } from "integrations/utils";
import { useAtom, useAtomValue } from "jotai";
import React, { useEffect, useState } from "react";
import { GoChevronDown } from "react-icons/go";
import { IoMdCheckmark } from "react-icons/io";
import { AddressWithAssetAndAmount } from "types";
import NamadaLogo from "../Assets/NamadaLogo.svg";
import { isTransparentAddress } from "./common";
import { SelectToken } from "./SelectToken";
import { SelectWalletModal } from "./SelectWalletModal";
import { TransferArrow } from "./TransferArrow";

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
  return tokenNetworkName !== "namada";
};

export const ShieldTransferCard = (): JSX.Element => {
  const transparentAssets = useAtomValue(namadaTransparentAssetsAtom);
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const [connectedWallets, setConnectedWallets] = useAtom(connectedWalletsAtom);
  const extensionAttachStatus = useAtomValue(namadaExtensionAttachStatus);
  const [connectStatus] = useAtom(namadaExtensionConnectionStatus);
  const { connect } = useNamadaKeychain();
  const chainAssetsMap = Object.values(useAtomValue(chainAssetsMapAtom));
  const chainTokens = useAtomValue(chainTokensAtom);
  const chainRegistry = useAtomValue(chainRegistryAtom);
  const transparentAddress = accounts?.find((acc) =>
    isTransparentAddress(acc.address)
  )?.address;

  const transparentAccount = accounts?.find(
    (account) => account.type !== AccountType.ShieldedKeys
  );
  const [amount, setAmount] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMode] = useState("transparent");
  const [selectedToken, setSelectedToken] = useState<
    AddressWithAssetAndAmount | undefined
  >(undefined);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<"namada" | "keplr">(
    "namada"
  );
  const [keplrAddress, setKeplrAddress] = useState<string>("");
  const isKeplrConnected = connectedWallets.keplr || false;
  const tokenPrices = useAtomValue(
    tokenPricesFamily(selectedToken ? [selectedToken.originalAddress] : [])
  );

  // Create a mapping of assets to their network names for IBC token detection
  const assetToNetworkMap = React.useMemo((): Record<string, string> => {
    const map: Record<string, string> = {};
    chainAssetsMap.forEach((asset) => {
      if (asset && asset.name) {
        // Map asset address to network name
        map[asset.address || asset.base] = asset.name;
      }
    });
    return map;
  }, [chainAssetsMap]);

  // Check if selected token is IBC token
  const isSelectedTokenIbc =
    selectedToken ? isIbcToken(selectedToken, assetToNetworkMap) : false;

  useEffect(() => {
    setSelectedToken(Object.values(transparentAssets.data || {})[0]);
  }, [transparentAssets.data]);

  // Get Keplr address when connected or selected token changes
  useEffect(() => {
    const getKeplrAddress = async (): Promise<void> => {
      if (isKeplrConnected && selectedToken && isSelectedTokenIbc) {
        try {
          const keplrWallet = new KeplrWalletManager();
          const keplrInstance = await keplrWallet.get();
          if (!keplrInstance) {
            setKeplrAddress("");
            return;
          }

          // Find the correct chain for this IBC token
          let targetChainId = "cosmoshub-4"; // Default fallback

          // First, try to find the chain using the token's trace if available
          if (chainTokens.data) {
            const chainToken = chainTokens.data.find(
              (chainToken) =>
                chainToken.address === selectedToken.originalAddress
            );

            if (chainToken && "trace" in chainToken) {
              const denom = getDenomFromIbcTrace(chainToken.trace);
              const chain = searchChainByDenom(denom);
              if (chain) {
                const targetChainRegistry = findRegistryByChainId(
                  chainRegistry,
                  chain.chain_id
                );
                if (targetChainRegistry) {
                  targetChainId = chain.chain_id;
                }
              }
            }
          }

          // Get address from the specific chain
          const address = await keplrWallet.getAddress(targetChainId);
          setKeplrAddress(address);
        } catch (error) {
          console.error("Failed to get Keplr address:", error);
          setKeplrAddress("");
        }
      } else {
        setKeplrAddress("");
      }
    };

    getKeplrAddress();
  }, [
    isKeplrConnected,
    selectedToken,
    isSelectedTokenIbc,
    chainTokens.data,
    chainRegistry,
  ]);

  // Calculate dollar value for selected token's total balance
  const dollarValue = React.useMemo(() => {
    if (!selectedToken || !tokenPrices.data) {
      return "$0.00";
    }

    const tokenPrice = tokenPrices.data[selectedToken.originalAddress];
    if (!tokenPrice) {
      return "$0.00";
    }

    const dollarAmount = selectedToken.amount.multipliedBy(tokenPrice);

    return `$${dollarAmount.toFixed(2)}`;
  }, [selectedToken, tokenPrices.data]);

  const handleConnectWallet = (): void => {
    if (!isKeplrConnected) {
      setIsWalletModalOpen(true);
    }
    setIsDropdownOpen(false);
  };

  const handleWalletConnect = async (wallet: { id: string }): Promise<void> => {
    if (wallet.id === "keplr") {
      const keplrWallet = new KeplrWalletManager();
      try {
        await keplrWallet.get();
        setConnectedWallets((obj) => ({ ...obj, [keplrWallet.key]: true }));
      } catch (error) {
        console.error("Failed to connect to Keplr:", error);
      }
    }
    setIsWalletModalOpen(false);
  };

  const handleSelectToken = (token: AddressWithAssetAndAmount): void => {
    setSelectedToken(token);
  };

  const handleDropdownClick = async (callback: () => void): Promise<void> => {
    if (connectStatus !== "connected") {
      if (extensionAttachStatus === "attached") {
        await connect();
      } else {
        window.open("https://namada.net/extension", "_blank");
      }
      return;
    }
    callback();
  };

  const truncateAddress = (address: string): string => {
    if (!address) return "";
    return `${address.slice(0, 10)}...${address.slice(-6)}`;
  };

  return (
    <div className="w-full max-w-[500px] mx-auto pt-10">
      <div className="text-center mb-4 text-yellow-400 text-sm">
        {selectedMode === "shielded" ?
          "Shield assets into Namada's Shieldpool."
        : "Transfer to Namada transparent address"}
      </div>

      <div className="bg-neutral-800 rounded-xl p-4 border hover:border-yellow-400">
        <div className="flex justify-between items-center mb-8">
          {/* Token selector */}
          <button
            onClick={() => handleDropdownClick(() => setIsTokenModalOpen(true))}
            className="flex items-center gap-2 py-2 hover:opacity-90 transition-colors text-white"
          >
            <div className="aspect-square h-8 w-8">
              <img
                src={
                  selectedToken?.asset.logo_URIs?.png ||
                  selectedToken?.asset.logo_URIs?.svg
                }
                alt={selectedToken?.asset.symbol ?? ""}
              />
            </div>
            <span className="text-white text-sm">
              {selectedToken?.asset.symbol ?? "Select Asset"}
            </span>
            <GoChevronDown className="text-sm" />
          </button>

          {/* Shield/Transparent toggle and wallet */}
          <div className="relative">
            <button
              onClick={() =>
                handleDropdownClick(() => setIsDropdownOpen(!isDropdownOpen))
              }
              className="flex items-center gap-2 py-2  transition-colors text-white"
            >
              {selectedWallet === "namada" && (
                <>
                  <span className="text-white text-sm">
                    {transparentAddress ?
                      shortenAddress(transparentAddress, 6)
                    : "Select Network"}
                  </span>
                  <img src={NamadaLogo} alt="Namada Logo" className="w-7 h-7" />
                </>
              )}
              {selectedWallet === "keplr" && isKeplrConnected && (
                <>
                  <span className="text-white text-sm">
                    {isSelectedTokenIbc && keplrAddress ?
                      shortenAddress(keplrAddress, 6)
                    : "Keplr"}
                  </span>
                  <img
                    src={wallets.keplr.iconUrl}
                    alt="Keplr"
                    className="w-7 h-7"
                  />
                </>
              )}
              <GoChevronDown className="text-sm text-white" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-neutral-900 rounded-lg shadow-xl border-2 border-neutral-700 overflow-hidden z-10">
                <div className="border-t border-neutral-700" />

                {/* Wallet options */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      setSelectedWallet("namada");
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 pl-2 mb-2 rounded-sm hover:bg-neutral-700 transition-colors"
                  >
                    <img
                      src={NamadaLogo}
                      alt="Namada Logo"
                      className="w-8 h-8"
                    />
                    <div className="text-left flex-1">
                      <div className="text-white font-medium">
                        {transparentAccount?.alias}
                      </div>
                      <div className="text-neutral-500 text-sm">
                        {truncateAddress(transparentAddress ?? "")}
                      </div>
                    </div>
                    {selectedWallet === "namada" && (
                      <IoMdCheckmark className="text-green-400 text-lg" />
                    )}
                  </button>
                  {isKeplrConnected ?
                    <button
                      onClick={() => {
                        setSelectedWallet("keplr");
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-sm bg-neutral-700 hover:bg-neutral-600 transition-colors"
                    >
                      <img
                        src={wallets.keplr.iconUrl}
                        alt="Keplr"
                        className="w-6 h-6"
                      />
                      <div className="text-left flex-1 pl-1">
                        <div className="text-white font-medium">
                          {wallets.keplr.name}
                        </div>
                        {isSelectedTokenIbc && keplrAddress && (
                          <div className="text-neutral-400 text-sm">
                            {shortenAddress(keplrAddress, 6)}
                          </div>
                        )}
                      </div>
                      {selectedWallet === "keplr" && (
                        <IoMdCheckmark className="text-green-400 text-lg" />
                      )}
                    </button>
                  : <button
                      onClick={handleConnectWallet}
                      className="w-full flex items-center gap-3 p-3 rounded-sm bg-neutral-700 hover:bg-neutral-600 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
                        <span className="text-black text-lg font-bold">+</span>
                      </div>
                      <span className="text-white font-medium pl-1">
                        Connect Keplr
                      </span>
                    </button>
                  }
                  {/* } */}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Amount input */}
        <div className="mb-8">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent text-white text-5xl font-light text-center outline-none placeholder-gray-600 focus:placeholder-transparent"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-neutral-400">{dollarValue}</span>
          <span className="text-neutral-400">
            {`${Boolean(selectedToken?.amount?.toNumber()) ? `Available: ${selectedToken?.amount?.toString()}` : "No Balance"}`}
          </span>
        </div>
      </div>

      {/* Transfer arrow */}
      <div className="flex justify-center my-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center -mt-7 bg-yellow-400`}
        >
          <i className="flex items-center justify-center w-11 mx-auto -my-8 relative z-10">
            <TransferArrow
              color="#FF0"
              // isAnimating={isSubmitting}
            />
          </i>
        </div>
      </div>

      <SelectToken
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onSelect={handleSelectToken}
      />

      {/* Wallet connection modal */}
      {isWalletModalOpen && (
        <SelectWalletModal
          availableWallets={[wallets.keplr]}
          onClose={() => setIsWalletModalOpen(false)}
          onConnect={handleWalletConnect}
        />
      )}
    </div>
  );
};
