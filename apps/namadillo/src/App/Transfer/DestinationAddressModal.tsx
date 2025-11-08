import { Input, Stack } from "@namada/components";
import { AccountType } from "@namada/types";
import { shortenAddress } from "@namada/utils";
import { SelectModal } from "App/Common/SelectModal";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { getChainRegistryByChainId } from "atoms/integrations";
import { RecentAddress, recentAddressesAtom } from "atoms/transactions";
import { getAddressLabel } from "atoms/transfer/functions";
import clsx from "clsx";
import { useKeplrAddressForAsset } from "hooks/useKeplrAddressForAsset";
import { wallets } from "integrations";
import { getChainFromAddress, getChainImageUrl } from "integrations/utils";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useState } from "react";
import { Address, Asset } from "types";
import namadaShieldedIcon from "./assets/namada-shielded.svg";
import namadaTransparentIcon from "./assets/namada-transparent.svg";
import { isShieldedAddress, isTransparentAddress } from "./common";

export type ValidationError = {
  type: "invalid-format" | "unsupported-chain" | "empty";
  message: string;
};

export type ValidationResult = {
  isValid: boolean;
  error?: ValidationError;
  addressType?: "transparent" | "shielded" | "ibc";
};

type AddressOption = {
  id: string;
  label: string;
  address: string;
  icon: string;
  type: "transparent" | "shielded" | "ibc" | "keplr";
};

type DestinationAddressModalProps = {
  onClose: () => void;
  onSelectAddress: (address: Address) => void;
  sourceAddress: string;
  sourceAsset?: Asset;
};

export const DestinationAddressModal = ({
  sourceAsset,
  sourceAddress,
  onClose,
  onSelectAddress,
}: DestinationAddressModalProps): JSX.Element => {
  const [customAddress, setCustomAddress] = useState("");
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const [recentAddresses, setRecentAddresses] = useAtom(recentAddressesAtom);
  const keplrAddress = useKeplrAddressForAsset(sourceAsset);

  const transparentAccount = accounts?.find(
    (account) => account.type !== AccountType.ShieldedKeys
  );
  const shieldedAccount = accounts?.find(
    (account) => account.type === AccountType.ShieldedKeys
  );

  // Dont display an address if it matches the source address
  const isSourceAddressMatch = (address: string): boolean =>
    address === sourceAddress;

  // Build your addresses options
  const addressOptions: AddressOption[] = [];
  if (accounts) {
    const transparentAccount = accounts.find(
      (account) => account.type !== AccountType.ShieldedKeys
    );

    if (
      transparentAccount &&
      !isSourceAddressMatch(transparentAccount.address)
    ) {
      addressOptions.push({
        id: "transparent",
        label: "Transparent Address",
        address: transparentAccount.address,
        icon: namadaTransparentIcon,
        type: "transparent",
      });
    }
    if (shieldedAccount && !isSourceAddressMatch(shieldedAccount.address)) {
      addressOptions.push({
        id: "shielded",
        label: "Shielded Address",
        address: shieldedAccount.address,
        icon: namadaShieldedIcon,
        type: "shielded",
      });
    }
  }
  if (keplrAddress)
    addressOptions.push({
      id: "keplr",
      label: "Keplr Address",
      address: keplrAddress ?? "",
      icon:
        !keplrAddress ?
          wallets.keplr.iconUrl
        : getChainImageUrl(getChainFromAddress(keplrAddress ?? "")),
      type: "keplr",
    });
  const addressOptionsAddresses = addressOptions.map((addr) => addr.address);

  // Build recent addresses options
  const recentAddressOptions: AddressOption[] = recentAddresses
    .filter((addresses) => !addressOptionsAddresses.includes(addresses.address))
    .map((recent) => ({
      id: `recent-${recent.address}`,
      label: recent.label || getAddressLabel(recent.address, recent.type),
      address: recent.address,
      icon:
        recent.type === "shielded" ? namadaShieldedIcon
        : recent.type === "transparent" ? namadaTransparentIcon
        : getChainImageUrl(getChainFromAddress(recent.address ?? "")), // fallback for IBC
      type: recent.type,
    }));

  const validateAddress = (address: string): ValidationResult => {
    // Check if address is empty
    if (!address.trim()) {
      return {
        isValid: false,
        error: {
          type: "empty",
          message: "Address cannot be empty",
        },
      };
    }

    const trimmedAddress = address.trim();

    // Check for Namada transparent address
    if (isTransparentAddress(trimmedAddress)) {
      return {
        isValid: true,
        addressType: "transparent",
      };
    }

    // Check for Namada shielded address
    if (isShieldedAddress(trimmedAddress)) {
      return {
        isValid: true,
        addressType: "shielded",
      };
    }

    // Check for IBC address
    const chain = getChainFromAddress(trimmedAddress);
    if (chain) {
      // Check if the chain is supported by using the registry function
      const registry = getChainRegistryByChainId(chain.chain_id);

      if (registry) {
        return {
          isValid: true,
          addressType: "ibc",
        };
      } else {
        return {
          isValid: false,
          error: {
            type: "unsupported-chain",
            message: `Chain ${chain.pretty_name || chain.chain_name} is not supported`,
          },
        };
      }
    }

    // If we reach here, the address format is invalid
    return {
      isValid: false,
      error: {
        type: "invalid-format",
        message:
          "Invalid address format. Please enter a valid Namada or IBC address",
      },
    };
  };

  const addToRecentAddresses = (
    recentAddresses: RecentAddress[],
    address: Address,
    type: "transparent" | "shielded" | "ibc",
    label?: string
  ): RecentAddress[] => {
    // Remove existing entry if it exists
    const filtered = recentAddresses.filter(
      (recent) => recent.address !== address
    );

    // Add new entry at the beginning
    const newEntry: RecentAddress = {
      address,
      type,
      label,
      timestamp: Date.now(),
    };

    // Keep only the last 10 recent addresses
    return [newEntry, ...filtered].slice(0, 10);
  };

  const handleAddressClick = (address: string): void => {
    onSelectAddress(address);
    onClose();
  };

  const handleCustomAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value;
    setCustomAddress(value);

    // Validate the address as user types
    if (value.trim()) {
      const result = validateAddress(value);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  };

  const handleCustomAddressSubmit = (): void => {
    const trimmedAddress = customAddress.trim();
    if (!trimmedAddress) return;

    const result = validateAddress(trimmedAddress);
    setValidationResult(result);

    if (result.isValid && result.addressType) {
      // Add to recent addresses
      const label = getAddressLabel(trimmedAddress, result.addressType);
      const updatedRecents = addToRecentAddresses(
        recentAddresses,
        trimmedAddress,
        result.addressType,
        label
      );
      setRecentAddresses(updatedRecents);

      // Select the address
      onSelectAddress(trimmedAddress);
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      handleCustomAddressSubmit();
    }
  };

  // Determine input styling based on validation
  const getInputClassName = useCallback((): string => {
    if (validationResult?.isValid) {
      return "text-sm border-green-500 focus:border-green-500";
    }
    if (validationResult?.error) {
      return "text-sm border-red-500 focus:border-red-500";
    }

    return "text-sm border-neutral-500";
  }, [customAddress]);

  return (
    <SelectModal
      title="Destination address"
      onClose={onClose}
      className="px-4 max-w-[500px] bg-neutral-800 h-[80vh] min-h-[400px] flex flex-col"
    >
      <div className="flex flex-col gap-6 h-full overflow-hidden">
        <div className="flex-shrink-0">
          <Input
            label=""
            placeholder="Paste destination address"
            value={customAddress}
            onChange={handleCustomAddressChange}
            onKeyPress={handleKeyPress}
            className={getInputClassName()}
          />
          {validationResult?.error && (
            <div className="mt-2 text-sm text-red-400">
              {validationResult.error.message}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6">
            {addressOptions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-3">
                  Your addresses
                </h3>
                <Stack gap={2}>
                  {addressOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleAddressClick(option.address)}
                      className={clsx(
                        "flex items-center justify-between w-full p-3 rounded-sm text-left transition-colors",
                        "bg-neutral-900 hover:border-yellow border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={option.icon}
                          alt={option.label}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {shortenAddress(option.address, 8, 8)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-neutral-500">
                          {option.type === "transparent" &&
                            transparentAccount?.alias}
                          {option.type === "shielded" && shieldedAccount?.alias}
                          {option.type === "ibc" && "IBC"}
                          {option.type === "keplr" && "Keplr"}
                        </span>
                      </div>
                    </button>
                  ))}
                </Stack>
              </div>
            )}

            {recentAddressOptions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-3">
                  Recent addresses
                </h3>
                <Stack gap={2}>
                  {recentAddressOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleAddressClick(option.address)}
                      className={clsx(
                        "flex items-center justify-between w-full p-3 rounded-sm text-left transition-colors",
                        "bg-neutral-900 hover:border-yellow border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={option.icon}
                          alt={option.label}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {shortenAddress(option.address, 8, 8)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </Stack>
              </div>
            )}
          </div>
        </div>
      </div>
    </SelectModal>
  );
};
