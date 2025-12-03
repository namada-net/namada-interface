import { Stack } from "@namada/components";
import { Search } from "App/Common/Search";
import { SelectModal } from "App/Common/SelectModal";
import { TokenCard } from "App/Common/TokenCard";
import { ConnectedWalletInfo } from "App/Transfer/ConnectedWalletInfo";
import { nativeTokenAddressAtom } from "atoms/chain/atoms";
import { applicationFeaturesAtom } from "atoms/settings/atoms";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Address, Asset, NamadaAsset } from "types";

type DisplayAmount = BigNumber;
type FiatAmount = BigNumber;
type SelectWalletModalProps = {
  onClose: () => void;
  onSelect: (address: Address) => void;
  assets: Asset[];
  walletAddress: string;
  ibcTransfer?: "deposit" | "withdraw";
  balances?: Record<Address, [DisplayAmount, FiatAmount?]>;
};

export const SwapSelectAssetModal = ({
  onClose,
  onSelect,
  assets,
  walletAddress,
  ibcTransfer,
  balances,
}: SelectWalletModalProps): JSX.Element => {
  const { namTransfersEnabled } = useAtomValue(applicationFeaturesAtom);
  const nativeTokenAddress = useAtomValue(nativeTokenAddressAtom).data;

  const [filter, setFilter] = useState("");

  const { assetsWithBalance, assetsWithoutBalance } = useMemo(() => {
    const filtered = assets
      .filter(
        (asset) =>
          asset.name.toLowerCase().indexOf(filter.toLowerCase()) >= 0 ||
          asset.symbol.toLowerCase().indexOf(filter.toLowerCase()) >= 0
      )
      // We temporarily hide stride and um assets until we support them fully
      .filter(
        (asset) =>
          !asset.traces?.find(
            (trace) =>
              trace.type === "ibc" &&
              ["stride", "penumbra"].includes(trace.counterparty.chain_name)
          )
      );

    const withBalance: Asset[] = [];
    const withoutBalance: Asset[] = [];

    filtered.forEach((asset) => {
      const tokenAddress =
        ibcTransfer === "deposit" ? asset.base : (asset as NamadaAsset).address;

      const balance = balances?.[tokenAddress];
      const hasBalance = balance && balance[0].gt(0);

      if (hasBalance) {
        withBalance.push(asset);
      } else {
        withoutBalance.push(asset);
      }
    });

    return {
      assetsWithBalance: withBalance,
      assetsWithoutBalance: withoutBalance,
    };
  }, [assets, filter, balances, ibcTransfer]);

  const renderAssetItem = (asset: Asset): JSX.Element => {
    // Fpr IbcTransfer(Deposits), we consider base denom as a token address.
    const tokenAddress =
      ibcTransfer === "deposit" ? asset.base : (asset as NamadaAsset).address;

    const disabled =
      !namTransfersEnabled && asset.address === nativeTokenAddress;

    return (
      <li key={asset.base} className="text-sm">
        <button
          onClick={() => {
            onSelect(tokenAddress);
            onClose();
          }}
          className={twMerge(
            clsx(
              "text-left px-4 py-2.5",
              "w-full rounded-sm border border-transparent",
              "hover:border-neutral-400 transition-colors duration-150",
              { "pointer-events-none opacity-50": disabled }
            )
          )}
          disabled={disabled}
        >
          <TokenCard
            asset={asset}
            address={tokenAddress}
            disabled={disabled}
            balance={balances?.[tokenAddress]}
          />
        </button>
      </li>
    );
  };

  const hasAnyAssets =
    assetsWithBalance.length > 0 || assetsWithoutBalance.length > 0;

  return (
    <SelectModal title="Select Asset" onClose={onClose}>
      <ConnectedWalletInfo walletAddress={walletAddress} />
      <div className="my-4">
        <Search placeholder="Search asset" onChange={setFilter} />
      </div>
      <div className="max-h-[400px] overflow-auto dark-scrollbar pb-4 mr-[-0.5rem]">
        {assetsWithBalance.length > 0 && (
          <>
            <h3 className="text-xs font-medium text-neutral-500 px-4 py-2 uppercase tracking-wide">
              Your tokens
            </h3>
            <Stack as="ul" gap={0}>
              {assetsWithBalance.map(renderAssetItem)}
            </Stack>
          </>
        )}

        {assetsWithoutBalance.length > 0 && (
          <>
            <h3 className="text-xs font-medium text-neutral-500 px-4 py-2 mt-4 uppercase tracking-wide">
              All tokens
            </h3>
            <Stack as="ul" gap={0}>
              {assetsWithoutBalance.map(renderAssetItem)}
            </Stack>
          </>
        )}

        {!hasAnyAssets && (
          <p className="py-2 px-4 font-light">There are no available assets</p>
        )}
      </div>
    </SelectModal>
  );
};
