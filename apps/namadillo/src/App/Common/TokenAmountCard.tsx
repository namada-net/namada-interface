import { TokenCurrency } from "App/Common/TokenCurrency";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { getAssetImageUrl } from "integrations/utils";
import { Asset } from "types";

type TokenAmountCardProps = {
  asset: Asset;
  displayAmount: BigNumber;
  isShielded?: boolean;
};

export const TokenAmountCard = ({
  asset,
  displayAmount,
}: TokenAmountCardProps): JSX.Element => {
  return (
    <div
      className="flex flex-col items-center gap-2.5 animate-fade-in"
      data-animation="token-amount-card"
    >
      <i>
        <img
          src={getAssetImageUrl(asset)}
          alt={asset.name}
          className={clsx(
            "w-15 aspect-square object-cover object-center rounded-full"
          )}
        />
      </i>
      <TokenCurrency
        amount={displayAmount}
        symbol={asset.symbol}
        className="text-xl"
        data-animation="token-amount-card-text"
      />
    </div>
  );
};
