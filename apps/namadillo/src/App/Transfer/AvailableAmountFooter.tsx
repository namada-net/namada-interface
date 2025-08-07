import { Asset } from "@chain-registry/types";
import { FiatCurrency } from "App/Common/FiatCurrency";
import { TokenCurrency } from "App/Common/TokenCurrency";
import { tokenPricesFamily } from "atoms/prices/atoms";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { Address } from "types";

type AvailableAmountFooterProps = {
  availableAmount?: BigNumber;
  availableAmountMinusFees?: BigNumber;
  asset?: Asset;
  originalAddress?: Address;
  onClickMax?: () => void;
};

export const AvailableAmountFooter = ({
  availableAmount,
  availableAmountMinusFees,
  asset,
  onClickMax,
}: AvailableAmountFooterProps): JSX.Element => {
  const tokenPrices = useAtomValue(
    tokenPricesFamily(asset?.address ? [asset.address] : [])
  );

  if (availableAmountMinusFees === undefined || !asset) {
    return <></>;
  }

  const isInsufficientBalance = availableAmountMinusFees.eq(0);
  // Calculate dollar value for available amount
  const availableDollarAmount =
    asset?.address && tokenPrices.data?.[asset.address] ?
      availableAmountMinusFees.multipliedBy(tokenPrices.data[asset.address])
    : undefined;

  return (
    <div
      className={clsx(
        "flex justify-between items-center text-sm text-neutral-500 font-light w-full"
      )}
    >
      <div className="flex w-full justify-between">
        <div className="cursor-pointer" onClick={onClickMax}>
          Available:{" "}
          <TokenCurrency
            amount={availableAmountMinusFees}
            symbol={asset.symbol}
          />
          {isInsufficientBalance && (
            <div className="text-fail">
              <div>Insufficient balance to cover the fee</div>
              {availableAmount && (
                <div className="flex flex-col">
                  <div>
                    Balance:{" "}
                    <TokenCurrency
                      amount={availableAmount}
                      symbol={asset.symbol}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {availableDollarAmount && (
          <FiatCurrency amount={availableDollarAmount} className="text-sm" />
        )}
      </div>
    </div>
  );
};
