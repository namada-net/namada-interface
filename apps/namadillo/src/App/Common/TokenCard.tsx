import { Stack } from "@namada/components";
import { InactiveChannelWarning } from "App/Common/InactiveChannelWarning";
import { AssetImage } from "App/Transfer/AssetImage";
import BigNumber from "bignumber.js";
import { ReactNode } from "react";
import { Address, Asset } from "types";

export const TokenCard = ({
  address,
  asset,
  balance,
  disabled,
}: {
  address: Address;
  asset: Asset;
  balance?: BigNumber;
  disabled?: ReactNode;
}): JSX.Element => {
  return (
    <div className="flex items-center gap-4" title={address}>
      <div className="aspect-square w-10 h-10">
        <AssetImage asset={asset} />
      </div>
      <div className="text-base leading-none grow">
        <Stack direction="horizontal" className="justify-between">
          <div>{asset.symbol}</div>
          {balance && <div>{balance.toFixed()}</div>}
        </Stack>
        <InactiveChannelWarning address={address} />
        {disabled && (
          <div className="text-red-500 text-xs">disabled until phase 5</div>
        )}
      </div>
    </div>
  );
};
