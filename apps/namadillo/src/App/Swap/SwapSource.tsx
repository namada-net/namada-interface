import { AmountInput, Text } from "@namada/components";
import { AvailableAmountFooter } from "App/Common/AvailableAmountFooter";
import { SelectedAsset } from "App/Common/SelectedAsset";
import { TokenAmountCard } from "App/Common/TokenAmountCard";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { Asset } from "types";
import { amountMaxDecimalPlaces } from "utils/assets";

export type SwapSourceProps = {
  asset?: Asset;
  isLoadingAssets?: boolean;
  isSubmitting?: boolean;
  openAssetSelector?: () => void;
  amount?: BigNumber;
  availableAmount?: BigNumber;
  availableAmountMinusFees?: BigNumber;
  onChangeAmount?: (amount?: BigNumber) => void;
  label?: string;
};

export const SwapSource = ({
  asset,
  isLoadingAssets,
  openAssetSelector,
  availableAmount,
  availableAmountMinusFees,
  amount,
  onChangeAmount,
  isSubmitting,
  label,
}: SwapSourceProps): JSX.Element => {
  return (
    <div className="relative bg-neutral-800 rounded-lg px-4 py-5 border border-yellow">
      {/** Intro header - Ex: "IBC To Namada" */}
      {label && (
        <Text className="text-neutral-500 font-light mt-0 mb-2">{label}</Text>
      )}

      {/** Asset selector */}
      {!isSubmitting && (
        <div className="grid grid-cols-[max-content_auto] gap-5 mb-3">
          <SelectedAsset
            asset={asset}
            isLoading={isLoadingAssets}
            onClick={openAssetSelector}
          />
          <AmountInput
            className={clsx(
              "text-right [&_input]:text-right [&_input]:text-3xl [&_input]:bg-transparent",
              "[&_input]:!border-0 [&_input]:px-0"
            )}
            disabled={!asset || !onChangeAmount}
            value={amount}
            onChange={(e) => onChangeAmount?.(e.target.value)}
            placeholder="Amount"
            maxDecimalPlaces={amountMaxDecimalPlaces(asset)}
          />
        </div>
      )}

      {/** Available amount footer */}
      {!isSubmitting && asset && availableAmountMinusFees && (
        <footer>
          <AvailableAmountFooter
            availableAmount={availableAmount}
            availableAmountMinusFees={availableAmountMinusFees}
            asset={asset}
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
