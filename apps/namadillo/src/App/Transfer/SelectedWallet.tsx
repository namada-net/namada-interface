import { WalletAddress } from "App/Common/WalletAddress";
import clsx from "clsx";
import { wallets } from "integrations";
import { twMerge } from "tailwind-merge";
import { isNamadaAddress } from "./common";

type SelectedWalletProps = {
  address?: string;
  className?: string;
  onClick?: () => void;
  displayFullAddress?: boolean;
  displayTooltip?: boolean;
};

export const SelectedWallet = ({
  onClick,
  address,
  className = "",
  displayFullAddress = false,
  displayTooltip = true,
}: SelectedWalletProps): JSX.Element => {
  if (!address) return <></>;

  const wallet =
    isNamadaAddress(address || "") ? wallets.namada : wallets.keplr;
  return (
    <div
      role="button"
      className={twMerge(
        clsx(
          "flex justify-between items-center gap-2.5 text-sm text-neutral-500",
          "font-light text-right transition-colors",
          {
            "hover:text-neutral-400": Boolean(onClick),
            "cursor-auto": !onClick,
          },
          className
        )
      )}
      onClick={onClick}
    >
      <img
        src={wallet.iconUrl}
        alt={wallet.name + " Logo"}
        className="w-6 select-none"
      />
      {address && (
        <WalletAddress
          address={address}
          displayTooltip={displayTooltip}
          displayFullAddress={displayFullAddress}
        />
      )}
    </div>
  );
};
