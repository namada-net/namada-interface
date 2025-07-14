import { Input, Stack } from "@namada/components";
import { AccountType } from "@namada/types";
import { shortenAddress } from "@namada/utils";
import { SelectModal } from "App/Common/SelectModal";
import { allDefaultAccountsAtom } from "atoms/accounts";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { Address } from "types";
import namadaTransparentIcon from "./assets/namada-transparent.svg";

type AddressOption = {
  id: string;
  label: string;
  address: string;
  icon: string;
  type: "transparent" | "shielded" | "keplr";
};

type DestinationAddressModalProps = {
  onClose: () => void;
  onSelectAddress: (address: Address) => void;
  selectedAddress?: string;
  isShieldedTx?: boolean;
};

export const DestinationAddressModal = ({
  onClose,
  onSelectAddress,
}: DestinationAddressModalProps): JSX.Element => {
  const [customAddress, setCustomAddress] = useState("");
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);

  const transparentAccount = accounts?.find(
    (account) => account.type !== AccountType.ShieldedKeys
  );
  const shieldedAccount = accounts?.find(
    (account) => account.type === AccountType.ShieldedKeys
  );

  const addressOptions: AddressOption[] = [];
  if (accounts) {
    const transparentAccount = accounts.find(
      (account) => account.type !== AccountType.ShieldedKeys
    );

    if (transparentAccount) {
      addressOptions.push({
        id: "transparent",
        label: "Transparent Address",
        address: transparentAccount.address,
        icon: namadaTransparentIcon,
        type: "transparent",
      });
    }
  }

  const handleAddressClick = (address: string): void => {
    onSelectAddress(address);
    onClose();
  };

  const handleCustomAddressSubmit = (): void => {
    if (customAddress.trim()) {
      onSelectAddress(customAddress.trim());
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      handleCustomAddressSubmit();
    }
  };

  return (
    <SelectModal
      title="Destination address"
      onClose={onClose}
      className="max-w-[500px] bg-neutral-800"
    >
      <Stack gap={6}>
        <div>
          <Input
            label=""
            placeholder="Paste destination address"
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-sm border-neutral-500"
          />
        </div>
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
                      {option.type === "keplr" && "Keplr"}
                    </span>
                  </div>
                </button>
              ))}
            </Stack>
          </div>
        )}
      </Stack>
    </SelectModal>
  );
};
