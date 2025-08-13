import BigNumber from "bignumber.js";
import { TokenCurrency } from "./TokenCurrency";

type TransactionFeeProps = {
  displayAmount: BigNumber;
  symbol: string;
};

export const TransactionFee = ({
  displayAmount,
  symbol,
}: TransactionFeeProps): JSX.Element => {
  return (
    <div className="flex w-full gap-2">
      <span className="text-sm mt-[3px] ml-1 underline leading-none text-neutral-300">
        Transaction Fee
      </span>
      <TokenCurrency
        symbol={symbol}
        amount={displayAmount}
        className="text-sm font-medium"
      />
    </div>
  );
};
