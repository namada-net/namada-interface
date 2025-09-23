import { Stack } from "@namada/components";
import { InactiveChannelWarning } from "App/Common/InactiveChannelWarning";
import { AssetImage } from "App/Transfer/AssetImage";
import BigNumber from "bignumber.js";
import { ReactNode } from "react";
import { Address, Asset } from "types";
import { FiatCurrency } from "./FiatCurrency";

export const TokenCard = ({
  address,
  asset,
  balance,
  disabled,
}: {
  address: Address;
  asset: Asset;
  balance?: [BigNumber, BigNumber?];
  disabled?: ReactNode;
}): JSX.Element => {
  const [amount, fiatAmount] = balance || [];

  return (
    <div className="flex items-center gap-4" title={address}>
      <div className="aspect-square w-10 h-10">
        <AssetImage asset={asset} />
      </div>
      <div className="text-base leading-none grow">
        <Stack direction="horizontal" className="justify-between items-center">
          <div>{asset.symbol}</div>
          <Stack gap={1} className="items-end">
            {amount && <div>{amount.toFixed()}</div>}
            {fiatAmount && (
              <FiatCurrency
                className="text-neutral-600 text-sm"
                amount={fiatAmount}
              />
            )}
          </Stack>
        </Stack>
        <InactiveChannelWarning address={address} />
        {disabled && (
          <div className="text-red-500 text-xs">disabled until phase 5</div>
        )}
      </div>
    </div>
  );
};
