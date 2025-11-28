import BigNumber from "bignumber.js";
import clsx from "clsx";
import { TokenCurrency } from "./TokenCurrency";

type TransactionFeeProps = {
  displayAmount: BigNumber;
  symbol: string;
  compact?: boolean;
  isLoading?: boolean;
};

export const TransactionFee = ({
  displayAmount,
  symbol,
  compact = false,
  isLoading = false,
}: TransactionFeeProps): JSX.Element => {
  return (
    <div className="flex w-full gap-2">
      <span
        className={clsx(
          "text-sm mt-[3px] ml-1 leading-none text-neutral-300",
          { underline: !compact },
          { "text-neutral-400": compact }
        )}
      >
        {compact ? "Fee:" : "Transaction Fee"}
      </span>
      {isLoading ?
        <div
          className={clsx(
            "w-20 h-5 bg-neutral-700 rounded-sm",
            "animate-pulse"
          )}
        />
      : <TokenCurrency
          symbol={symbol}
          amount={displayAmount}
          className={clsx("text-sm font-medium", {
            "animate-pulse": isLoading,
          })}
        />
      }
    </div>
  );
};
