import { integrations } from "@namada/integrations";
import { SelectModal } from "App/Common/SelectModal";
import { WalletProvider } from "types";
import { WalletCard } from "./WalletCard";

type SelectWalletModalProps = {
  onClose: () => void;
  availableWallets?: WalletProvider[];
  onConnect: (wallet: WalletProvider) => void;
};

export const SelectWalletModal = ({
  onClose,
  onConnect,
  availableWallets,
}: SelectWalletModalProps): JSX.Element => {
  const isConnected = (_wallet: WalletProvider): boolean => {
    return false;
  };

  const isInstalled = (wallet: WalletProvider): boolean => {
    if (wallet.id in integrations) {
      return integrations[wallet.id].detect();
    }
    return false;
  };

  return (
    <SelectModal title="Source" onClose={onClose} className="max-w-[400px]">
      <ul>
        {availableWallets &&
          availableWallets
            .filter((wallet) => wallet.id !== "namada")
            .map((wallet: WalletProvider, index) => (
              <li key={index} className="text-sm">
                <WalletCard
                  connected={isConnected(wallet)}
                  installed={isInstalled(wallet)}
                  wallet={wallet}
                  onConnect={() => {
                    onConnect(wallet);
                    onClose();
                  }}
                />
              </li>
            ))}
      </ul>
    </SelectModal>
  );
};
