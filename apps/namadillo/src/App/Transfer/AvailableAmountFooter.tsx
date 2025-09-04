import { ActionButton } from "@namada/components";
import { TokenCurrency } from "App/Common/TokenCurrency";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { Asset } from "types";

type AvailableAmountFooterProps = {
  availableAmount?: BigNumber;
  maxAmount?: BigNumber;
  availableAmountMinusFees?: BigNumber;
  asset?: Asset;
  onClickMax?: () => void;
};

export const AvailableAmountFooter = ({
  availableAmount,
  maxAmount,
  availableAmountMinusFees,
  asset,
  onClickMax,
}: AvailableAmountFooterProps): JSX.Element => {
  if (availableAmountMinusFees === undefined || !asset) {
    return <></>;
  }

  const isInsufficientBalance = availableAmountMinusFees.eq(0);

  return (
    <div
      className={clsx(
        "flex justify-between items-center text-sm text-neutral-500 font-light"
      )}
    >
      <div>
        <div>
          Available:{" "}
          <TokenCurrency
            amount={availableAmountMinusFees}
            symbol={asset.symbol}
          />
        </div>
        {maxAmount && (
          <div>
            Max: <TokenCurrency amount={maxAmount} symbol={asset.symbol} />
          </div>
        )}
        {isInsufficientBalance && (
          <div className="text-fail">
            <div>Insufficient balance to cover the fee</div>
            {availableAmount && (
              <div>
                Balance:{" "}
                <TokenCurrency amount={availableAmount} symbol={asset.symbol} />
              </div>
            )}
          </div>
        )}
      </div>
      <span>
        {onClickMax && (
          <ActionButton
            type="button"
            size="xs"
            disabled={isInsufficientBalance}
            onClick={onClickMax}
            outlineColor="neutral"
            className="text-neutral-500 text-xs py-0 px-3 disabled:text-neutral-700"
            backgroundHoverColor="white"
            backgroundColor="transparent"
          >
            Max
          </ActionButton>
        )}
      </span>
    </div>
  );
};
