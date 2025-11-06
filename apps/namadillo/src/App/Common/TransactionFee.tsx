import BigNumber from "bignumber.js";
import clsx from "clsx";
import { TokenCurrency } from "./TokenCurrency";

type TransactionFeeProps = {
  displayAmount: BigNumber;
  symbol: string;
  compact?: boolean;
};

export const TransactionFee = ({
  displayAmount,
  symbol,
  compact = false,
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
      <TokenCurrency
        symbol={symbol}
        amount={displayAmount}
        className="text-sm font-medium"
      />
    </div>
  );
};
