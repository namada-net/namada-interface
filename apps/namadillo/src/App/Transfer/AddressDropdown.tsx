import { AccountType } from "@namada/types";
import { shortenAddress } from "@namada/utils";
import { routes } from "App/routes";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { connectedWalletsAtom } from "atoms/integrations";
import { getAvailableChains } from "atoms/integrations/functions";
import clsx from "clsx";
import { wallets } from "integrations";
import { KeplrWalletManager } from "integrations/Keplr";
import { getChainFromAddress } from "integrations/utils";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { GoChevronDown } from "react-icons/go";
import { useLocation } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import namadaShieldedIcon from "./assets/namada-shielded.svg";
import namadaTransparentIcon from "./assets/namada-transparent.svg";
import { isNamadaAddress, isShieldedAddress } from "./common";

type AddressOption = {
  id: string;
  label: string;
  address: string;
  walletType: "namada" | "keplr";
  accountType?: AccountType;
  iconUrl: string;
};

type AddressDropdownProps = {
  selectedAddress?: string;
  destinationAddress?: string;
  className?: string;
  showAddress?: boolean;
  onClick?: () => void;
  onSelectAddress?: (address: string) => void;
};

const keplr = new KeplrWalletManager();

export const AddressDropdown = ({
  selectedAddress,
  destinationAddress,
  className = "",
  showAddress = false,
  onClick,
  onSelectAddress,
}: AddressDropdownProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [keplrAddress, setKeplrAddress] = useState<string | null>(null);
  const [isConnectingKeplr, setIsConnectingKeplr] = useState(false);
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const [connectedWallets, setConnectedWallets] = useAtom(connectedWalletsAtom);

  // Helper function to fetch Keplr address for the appropriate chain
  const fetchKeplrAddressForChain = async (
    keplrInstance: any
  ): Promise<void> => {
    let chainId: string | undefined;

    // If we have a selectedAddress and it's not a Namada address,
    // determine the chain from that address
    if (selectedAddress && !isNamadaAddress(selectedAddress)) {
      const chain = getChainFromAddress(selectedAddress);
      chainId = chain?.chain_id;
    }

    // Fallback to first available chain if we couldn't determine from selectedAddress
    if (!chainId) {
      const availableChains = getAvailableChains();
      if (availableChains.length > 0) {
        chainId = availableChains[0].chain_id;
      }
    }

    if (chainId) {
      const key = await keplrInstance.getKey(chainId);
      setKeplrAddress(key.bech32Address);
    }
  };

  // Fetch Keplr address when connected - use the correct chain based on selectedAddress
  useEffect(() => {
    const fetchKeplrAddress = async (): Promise<void> => {
      if (connectedWallets.keplr) {
        try {
          const keplrInstance = await keplr.get();
          if (keplrInstance) {
            await fetchKeplrAddressForChain(keplrInstance);
          }
        } catch (error) {
          console.error("Failed to fetch Keplr address:", error);
          setKeplrAddress(null);
        }
      } else {
        setKeplrAddress(null);
      }
    };

    fetchKeplrAddress();
  }, [connectedWallets.keplr, selectedAddress]);

  // Build available address options
  const addressOptions: AddressOption[] = [];
  const location = useLocation();

  // Add Namada accounts
  if (accounts) {
    const transparentAccount = accounts.find(
      (account) => account.type !== AccountType.ShieldedKeys
    );
    const shieldedAccount = accounts.find(
      (account) => account.type === AccountType.ShieldedKeys
    );

    if (transparentAccount) {
      addressOptions.push({
        id: "namada-transparent",
        label: "Namada Transparent",
        address: transparentAccount.address,
        walletType: "namada",
        accountType: transparentAccount.type,
        iconUrl: namadaTransparentIcon,
      });
    }

    if (shieldedAccount) {
      addressOptions.push({
        id: "namada-shielded",
        label: "Namada Shielded",
        address: shieldedAccount.address,
        walletType: "namada",
        accountType: shieldedAccount.type,
        iconUrl: namadaShieldedIcon,
      });
    }
  }

  // Add Keplr option only if we have a connected address
  if (keplrAddress) {
    addressOptions.push({
      id: "keplr",
      label: "Keplr",
      address: keplrAddress,
      walletType: "keplr",
      iconUrl: wallets.keplr.iconUrl,
    });
  }

  // Find the selected option
  const selectedOption = addressOptions.find(
    (option) => option.address === selectedAddress
  );

  const handleToggle = (): void => {
    if (onClick) {
      onClick();
    } else if (addressOptions.length > 1 || !connectedWallets.keplr) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelectOption = (option: AddressOption): void => {
    setIsOpen(false);
    if (onSelectAddress) {
      onSelectAddress(option.address);
    }
  };

  const handleConnectKeplr = async (): Promise<void> => {
    try {
      setIsConnectingKeplr(true);
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

      // Fetch the Keplr address for the correct chain after successful connection
      try {
        await fetchKeplrAddressForChain(keplrInstance);
      } catch (error) {
        console.error("Failed to fetch Keplr address after connection:", error);
      }

      setIsOpen(false);
    } catch (error) {
      console.error("Failed to connect to Keplr:", error);
    } finally {
      setIsConnectingKeplr(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Element;
      if (!target.closest("[data-dropdown-container]")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!selectedAddress || addressOptions.length === 0) return <></>;

  const shouldShowDropdown =
    addressOptions.length > 1 || !connectedWallets.keplr;

  return (
    <div className="relative" data-dropdown-container>
      <div
        role="button"
        className={twMerge(
          clsx(
            "flex justify-between items-center gap-2.5 text-sm text-neutral-500",
            "font-light text-right transition-colors",
            {
              "hover:text-neutral-400": Boolean(onClick) || shouldShowDropdown,
              "cursor-auto": !onClick && !shouldShowDropdown,
              "cursor-pointer": Boolean(onClick) || shouldShowDropdown,
            },
            className
          )
        )}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2.5 mt-2">
          <img
            src={selectedOption?.iconUrl || namadaTransparentIcon}
            alt={(selectedOption?.walletType || "Namada") + " Logo"}
            className="w-7 select-none"
          />
          {showAddress && selectedOption && (
            <div className="text-xs text-neutral-400">
              {shortenAddress(selectedOption.address, 10, 10)}
            </div>
          )}
        </div>
        {shouldShowDropdown && (
          <GoChevronDown
            className={clsx(
              "text-xs text-neutral-400 transition-transform ml-1",
              isOpen && "rotate-180"
            )}
          />
        )}
      </div>

      {isOpen && shouldShowDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-full mt-1 z-20 bg-neutral-800 rounded-md border border-neutral-700 shadow-lg min-w-[240px]">
            <ul className="py-1">
              {addressOptions.map((option) => {
                const keplr = option.id === "keplr";
                const transparent = option.id === "namada-transparent";
                const shielded = option.id === "namada-shielded";
                const isShieldedTransfer =
                  location.pathname !== routes.maspShield &&
                  isShieldedAddress(destinationAddress ?? "");
                const isShieldingTxn = location.pathname === routes.maspShield;

                const disabled =
                  (keplr && isShieldedTransfer) ||
                  (transparent && isShieldedTransfer) ||
                  (shielded && isShieldingTxn);
                return (
                  <li key={option.id}>
                    <button
                      disabled={disabled}
                      type="button"
                      className={clsx(
                        "w-full px-4 py-3 text-left flex items-center gap-3",
                        "hover:bg-neutral-700 transition-colors",
                        "text-sm text-white",
                        option.address === selectedAddress && "bg-neutral-700",
                        disabled && "opacity-30 cursor-not-allowed"
                      )}
                      onClick={() => handleSelectOption(option)}
                    >
                      <img
                        src={option.iconUrl}
                        alt={option.label}
                        className="w-6 h-6 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white">
                          {option.label}
                        </div>
                        <div className="text-xs text-neutral-400 truncate">
                          {shortenAddress(option.address, 10, 10)}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}

              {/* Connect Wallet button if Keplr is not connected */}
              {!connectedWallets.keplr && (
                <li className="border-t border-neutral-700 mt-1 pt-1">
                  <button
                    type="button"
                    className={clsx(
                      "w-full px-4 py-3 text-left flex items-center gap-3",
                      "hover:bg-neutral-700 transition-colors",
                      "text-sm  font-medium",
                      isConnectingKeplr && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={handleConnectKeplr}
                    disabled={isConnectingKeplr}
                  >
                    <img
                      src={wallets.keplr.iconUrl}
                      alt="Keplr"
                      className="w-5 h-5 flex-shrink-0"
                    />
                    <div className="flex-1 ml-1">
                      {isConnectingKeplr ? "Connecting..." : "Connect Wallet"}
                    </div>
                  </button>
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
