import { AccountType } from "@namada/types";
import { shortenAddress } from "@namada/utils";
import { routes } from "App/routes";
import { allDefaultAccountsAtom } from "atoms/accounts";
import clsx from "clsx";
import { wallets } from "integrations";
import { useAtomValue } from "jotai";
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
  showAddress?: boolean;
  onClick?: () => void;
  onSelectAddress?: (address: string) => void;
};

export const AddressDropdown = ({
  selectedAddress,
  className = "",
  showAddress = false,
  onClick,
  onSelectAddress,
}: AddressDropdownProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const isShieldingTransaction = routes.maspShield === location.pathname;

  useEffect(() => {
    const addressOptions: AddressOption[] = [];

    if (accounts) {
      const transparentAccount = accounts.find(
        (account) => account.type !== AccountType.ShieldedKeys
      );
      const shieldedAccount = accounts.find(
        (account) => account.type === AccountType.ShieldedKeys
      );
      addressOptions.push({
        id: "keplr",
        label: "Keplr",
        address: "Keplr",
        walletType: "keplr",
        iconUrl: wallets.keplr.iconUrl,
      });
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
      if (shieldedAccount && !isShieldingTransaction) {
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
    setAddressOptions(addressOptions);
  }, [accounts, isShieldingTransaction]);

  // Find the selected option
  const selectedOption = addressOptions.find(
    (option) => option.address === selectedAddress
  );

  const handleToggle = (): void => {
    if (onClick) {
      onClick();
    } else if (addressOptions.length > 1) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelectOption = (option: AddressOption): void => {
    setIsOpen(false);
    if (onSelectAddress) {
      onSelectAddress(option.address);
    }
  };

  if (!selectedAddress || addressOptions.length === 0) return <></>;

  return (
    <div className="relative" data-dropdown-container>
      <div
        role="button"
        className={twMerge(
          clsx(
            "flex justify-between items-center gap-2.5 text-sm text-neutral-500",
            "font-light text-right transition-colors",
            {
              "hover:text-neutral-400": Boolean(onClick),
              "cursor-auto": !onClick,
              "cursor-pointer": Boolean(onClick),
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

        <GoChevronDown
          className={clsx(
            "text-xs text-neutral-400 transition-transform ml-1",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {isOpen && (
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
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
