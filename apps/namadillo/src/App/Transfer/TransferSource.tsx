import { Asset } from "@chain-registry/types";
import { AmountInput, Tooltip } from "@namada/components";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { wallets } from "integrations";
import { Address } from "types";
import namadaShieldedIcon from "./assets/namada-shielded.svg";
import namadaTransparentIcon from "./assets/namada-transparent.svg";
import { AvailableAmountFooter } from "./AvailableAmountFooter";
import { isShieldedAddress, isTransparentAddress } from "./common";
import { SelectedAsset } from "./SelectedAsset";
import { TokenAmountCard } from "./TokenAmountCard";

export type TransferSourceProps = {
  isLoadingAssets?: boolean;
  isSubmitting?: boolean;
  isShieldingTxn?: boolean;
  asset?: Asset;
  originalAddress?: Address;
  sourceAddress?: string;
  availableAmount?: BigNumber;
  availableAmountMinusFees?: BigNumber;
  amount?: BigNumber;
  selectedTokenType?: "shielded" | "transparent" | "keplr";
  openAssetSelector?: () => void;
  openProviderSelector?: () => void;
  onChangeAmount?: (amount: BigNumber | undefined) => void;
};

const amountMaxDecimalPlaces = (asset?: Asset): number | undefined => {
  if (typeof asset !== "undefined") {
    for (const { denom, exponent } of asset.denom_units) {
      if (denom === asset.display) {
        return exponent;
      }
    }
  }
  return undefined;
};

const getWalletIcon = (
  sourceAddress?: string,
  selectedTokenType?: "shielded" | "transparent" | "keplr"
): string => {
  if (!sourceAddress) return "";

  // Use selected token type if available, otherwise fall back to source address format
  if (selectedTokenType) {
    switch (selectedTokenType) {
      case "shielded":
        return namadaShieldedIcon;
      case "transparent":
        return namadaTransparentIcon;
      case "keplr":
        return wallets.keplr.iconUrl;
      default:
        break;
    }
  }

  // Fallback to original logic if token type not specified
  if (isShieldedAddress(sourceAddress)) {
    return namadaShieldedIcon;
  } else if (isTransparentAddress(sourceAddress)) {
    return namadaTransparentIcon;
  } else {
    return wallets.keplr.iconUrl;
  }
};

export const TransferSource = ({
  isLoadingAssets,
  isSubmitting,
  asset,
  originalAddress,
  availableAmount,
  availableAmountMinusFees,
  amount,
  sourceAddress,
  openAssetSelector,
  onChangeAmount,
}: TransferSourceProps): JSX.Element => {
  const selectedTokenType =
    isTransparentAddress(sourceAddress ?? "") ? "transparent"
    : isShieldedAddress(sourceAddress ?? "") ? "shielded"
    : "keplr";

  return (
    <div className="relative bg-neutral-800 rounded-lg px-4 py-5">
      <header className="relative flex justify-between">
        <SelectedAsset
          asset={asset}
          isLoading={isLoadingAssets}
          isDisabled={isSubmitting}
          onClick={openAssetSelector}
        />
        {sourceAddress && (
          <div className="flex items-center">
            <div className="relative group/tooltip">
              <img
                src={getWalletIcon(sourceAddress, selectedTokenType)}
                alt="Wallet icon"
                className="w-7 h-7"
              />
              <Tooltip position="top" className="z-50">
                {sourceAddress}
              </Tooltip>
            </div>
          </div>
        )}
      </header>

      {!isSubmitting && (
        <div className="grid grid-cols-[max-content_auto] gap-5 mb-3 p-5">
          <AmountInput
            className={clsx(
              "text-center [&_input]:text-center [&_input]:text-3xl [&_input]:bg-transparent",
              "[&_input]:!border-0 [&_input]:px-0"
            )}
            disabled={!asset}
            value={amount}
            onChange={(e) => onChangeAmount?.(e.target.value)}
            placeholder="Amount"
            maxDecimalPlaces={amountMaxDecimalPlaces(asset)}
          />
        </div>
      )}

      {!isSubmitting && asset && availableAmountMinusFees && (
        <footer>
          <AvailableAmountFooter
            availableAmount={availableAmount}
            availableAmountMinusFees={availableAmountMinusFees}
            asset={asset}
            originalAddress={originalAddress}
            onClickMax={() =>
              onChangeAmount && onChangeAmount(availableAmountMinusFees)
            }
          />
        </footer>
      )}

      {isSubmitting && asset && amount && (
        <div className="pt-1.5 pb-3">
          <TokenAmountCard asset={asset} displayAmount={amount} />
        </div>
      )}
    </div>
  );
};
