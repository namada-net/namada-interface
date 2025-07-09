import { AccountType } from "@namada/types";
import { shortenAddress } from "@namada/utils";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { connectedWalletsAtom } from "atoms/integrations";
import clsx from "clsx";
import { wallets } from "integrations";
import { KeplrWalletManager } from "integrations/Keplr";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { GoChevronDown } from "react-icons/go";
import { twMerge } from "tailwind-merge";
import namadaShieldedIcon from "./assets/namada-shielded.svg";
import namadaTransparentIcon from "./assets/namada-transparent.svg";

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
  className?: string;
  isShieldingTxn?: boolean;
  onClick?: () => void;
  onSelectAddress?: (address: string) => void;
};

const keplr = new KeplrWalletManager();

export const AddressDropdown = ({
  isShieldingTxn,
  selectedAddress,
  className = "",
  onClick,
  onSelectAddress,
}: AddressDropdownProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [keplrAddress, setKeplrAddress] = useState<string | null>(null);
  const [isConnectingKeplr, setIsConnectingKeplr] = useState(false);
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const [connectedWallets, setConnectedWallets] = useAtom(connectedWalletsAtom);

  // Get Keplr address if connected
  useEffect(() => {
    const getKeplrAddress = async (): Promise<void> => {
      if (connectedWallets.keplr) {
        try {
          const keplrInstance = await keplr.get();
          if (keplrInstance) {
            // Use cosmoshub as default chain for address display
            const address = await keplr.getAddress("cosmoshub-4");
            setKeplrAddress(address);
          }
        } catch (error) {
          console.error("Failed to get Keplr address:", error);
        }
      } else {
        setKeplrAddress(null);
      }
    };

    getKeplrAddress();
  }, [connectedWallets.keplr]);

  // Build available address options
  const addressOptions: AddressOption[] = [];

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

    if (shieldedAccount && !isShieldingTxn) {
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

  // Add Keplr account if connected
  if (connectedWallets.keplr && keplrAddress) {
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

      // Enable Keplr for cosmoshub (commonly supported)
      await keplrInstance.enable("cosmoshub-4");

      // Update connected wallets state
      setConnectedWallets((obj) => ({ ...obj, [keplr.key]: true }));

      // Get and set the Keplr address
      const address = await keplr.getAddress("cosmoshub-4");
      setKeplrAddress(address);

      // Automatically select the Keplr address if no address is currently selected
      if (!selectedAddress && onSelectAddress) {
        onSelectAddress(address);
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
        <img
          src={selectedOption?.iconUrl || namadaTransparentIcon}
          alt={(selectedOption?.walletType || "Namada") + " Logo"}
          className="w-7 select-none"
        />
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
              {addressOptions.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    className={clsx(
                      "w-full px-4 py-3 text-left flex items-center gap-3",
                      "hover:bg-neutral-700 transition-colors",
                      "text-sm text-white",
                      option.address === selectedAddress && "bg-neutral-700"
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
              ))}

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
