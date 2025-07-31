import { Keplr, Window as KeplrWindow, Key } from "@keplr-wallet/types";
import { AccountType } from "@namada/types";
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
import { useLocation } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import namadaShieldedIcon from "./assets/namada-shielded.svg";
import namadaTransparentIcon from "./assets/namada-transparent.svg";
import { isIbcAddress, isNamadaAddress } from "./common";

type AddressOption = {
  id: string;
  label: string;
  address: string;
  alias: string;
  walletType: "namada" | "keplr";
  accountType?: AccountType;
  iconUrl: string;
};

type AddressListProps = {
  selectedAddress?: string;
  destinationAddress?: string;
  className?: string;
  onSelectAddress?: (address: string) => void;
};

const keplr = new KeplrWalletManager();

export const AddressDropdown = ({
  selectedAddress,
  destinationAddress,
  className = "",
  onSelectAddress,
}: AddressListProps): JSX.Element => {
  const [keplrAddress, setKeplrAddress] = useState<string | null>(null);
  const [keplrAlias, setKeplrAlias] = useState<string | null>(null);
  const [isConnectingKeplr, setIsConnectingKeplr] = useState(false);
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const [connectedWallets, setConnectedWallets] = useAtom(connectedWalletsAtom);

  // Helper function to fetch Keplr address for the appropriate chain
  const fetchKeplrAddressForChain = async (
    keplrInstance: Keplr
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
      const key: Key = await keplrInstance.getKey(chainId);
      setKeplrAddress(key.bech32Address);
      setKeplrAlias(key.name);
    }
  };

  // Fetch Keplr address when connected - use the correct chain based on selectedAddress
  useEffect(() => {
    const fetchKeplrAddress = async (): Promise<void> => {
      if (connectedWallets.keplr) {
        try {
          // Only get Keplr instance if it's already available, don't trigger connection
          const keplrInstance = (window as KeplrWindow).keplr;
          if (keplrInstance) {
            await fetchKeplrAddressForChain(keplrInstance);
          }
        } catch (error) {
          console.error("Failed to fetch Keplr address:", error);
          setKeplrAddress(null);
          setKeplrAlias(null);
        }
      } else {
        setKeplrAddress(null);
        setKeplrAlias(null);
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
        alias: transparentAccount.alias,
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
        alias: shieldedAccount.alias,
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
      alias: keplrAlias || "Keplr",
      address: keplrAddress,
      walletType: "keplr",
      iconUrl: wallets.keplr.iconUrl,
    });
  }

  const handleSelectOption = (option: AddressOption): void => {
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
    } catch (error) {
      console.error("Failed to connect to Keplr:", error);
    } finally {
      setIsConnectingKeplr(false);
    }
  };

  if (addressOptions.length === 0 && connectedWallets.keplr) return <></>;

  return (
    <div className={twMerge("space-y-1", className)}>
      {/* Address Options List */}
      {addressOptions.map((option) => {
        const shielded = option.id === "namada-shielded";
        const keplr = option.id === "keplr";
        const isShieldingTxn = location.pathname === routes.maspShield;
        const isIbcDestination = isIbcAddress(destinationAddress ?? "");
        const disabled =
          (shielded && isShieldingTxn) || (keplr && isIbcDestination);
        const isSelected = option.address === selectedAddress;
        if (disabled) return null;
        return (
          <button
            key={option.id}
            type="button"
            className={clsx(
              "w-full p-2 text-left flex items-center gap-3",
              "transition-all duration-200",
              {
                "opacity-40 cursor-not-allowed": disabled,
              }
            )}
            onClick={() => handleSelectOption(option)}
          >
            <div className="flex-shrink-0">
              <img
                src={option.iconUrl}
                alt={option.label}
                className="w-6 h-6"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={clsx(
                  "text-sm truncate",
                  isSelected ?
                    "text-yellow-300 font-medium"
                  : "text-neutral-300"
                )}
              >
                {option.alias ?? "Keplr"}
              </div>
            </div>
          </button>
        );
      })}

      {/* Connect Wallet button if Keplr is not connected */}
      {!connectedWallets.keplr && (
        <button
          type="button"
          className={clsx(
            "w-full p-2 text-left flex items-center gap-3",
            "transition-all duration-200",
            "text-sm font-medium text-neutral-300",
            isConnectingKeplr && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleConnectKeplr}
          disabled={isConnectingKeplr}
        >
          <img
            src={wallets.keplr.iconUrl}
            alt="Keplr"
            className="w-6 h-6 flex-shrink-0 opacity-70"
          />
          <div className="flex-1">
            {isConnectingKeplr ? "Connecting..." : "Connect Wallet"}
          </div>
        </button>
      )}
    </div>
  );
};
