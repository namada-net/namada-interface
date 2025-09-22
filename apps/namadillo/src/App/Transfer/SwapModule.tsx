import { Stack } from "@namada/components";
import { mapUndefined } from "@namada/utils";
import { namadaRegistryChainAssetsMapAtom } from "atoms/integrations";
import BigNumber from "bignumber.js";
import { TransactionFeeProps } from "hooks";
import { wallets } from "integrations";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { Address, Asset } from "types";
import { getDisplayGasFee } from "utils/gas";
import { SelectAssetModal } from "./SelectAssetModal";
import { SwapSource } from "./SwapSource";

export type SwapModuleProps = {
  isSubmitting?: boolean;
  feeProps?: TransactionFeeProps;
  walletAddress?: string;
  source: {
    availableAssets?: Record<string, { asset: Asset }>;
    amount?: BigNumber;
    availableAmount?: BigNumber;
    selectedAssetAddress?: string;
    onChangeAmount?: (amount: BigNumber | undefined) => void;
    onChangeSellSelectedAsset?: (address: Address | undefined) => void;
  };
  target: {
    availableAssets?: Record<string, { asset: Asset }>;
    amount?: BigNumber;
    selectedAssetAddress?: string;
    onChangeAmount?: (amount: BigNumber | undefined) => void;
    onChangeBuySelectedAsset?: (address: Address | undefined) => void;
  };
};

export const SwapModule = ({
  walletAddress,
  isSubmitting,
  feeProps,
  source,
  target,
}: SwapModuleProps): JSX.Element => {
  const selectedAsset = mapUndefined(
    (address) => source.availableAssets?.[address],
    source.selectedAssetAddress
  );
  const selectedTargetAsset = mapUndefined(
    (address) => target.availableAssets?.[address],
    target.selectedAssetAddress
  );
  const assets =
    //TODO:
    source.availableAssets ?
      Object.values(source.availableAssets).map((aa) => aa.asset)
    : [];

  // TODO: maybe we can unify the two modals into one
  const [sellAssetSelectorModalOpen, setSellAssetSelectorModalOpen] =
    useState(false);
  const [buyAssetSelectorModalOpen, setBuyAssetSelectorModalOpen] =
    useState(false);

  // TODO: reuse
  const chainAssetsMap = useAtomValue(namadaRegistryChainAssetsMapAtom);
  const gasConfig = feeProps?.gasConfig;
  const displayGasFee = useMemo(() => {
    return gasConfig ?
        getDisplayGasFee(gasConfig, chainAssetsMap.data || {})
      : undefined;
  }, [gasConfig]);

  const availableAmountMinusFees = useMemo(() => {
    const { selectedAssetAddress, availableAmount } = source;

    if (
      typeof selectedAssetAddress === "undefined" ||
      typeof availableAmount === "undefined" ||
      typeof source.availableAssets === "undefined"
    ) {
      return undefined;
    }

    if (
      !displayGasFee?.totalDisplayAmount ||
      // Don't subtract if the gas token is different than the selected asset:
      gasConfig?.gasToken !== selectedAssetAddress
    ) {
      return availableAmount;
    }

    const amountMinusFees = availableAmount
      .minus(displayGasFee.totalDisplayAmount)
      .decimalPlaces(6);

    return BigNumber.max(amountMinusFees, 0);
  }, [source.selectedAssetAddress, source.availableAmount, displayGasFee]);
  // TODO: end reuse

  return (
    <>
      <section className="max-w-[480px] mx-auto" role="widget">
        <Stack>
          <SwapSource
            asset={selectedAsset?.asset}
            isLoadingAssets={false}
            openAssetSelector={
              source.onChangeSellSelectedAsset && !isSubmitting ?
                () => setSellAssetSelectorModalOpen(true)
              : undefined
            }
            availableAmount={source.availableAmount}
            availableAmountMinusFees={availableAmountMinusFees}
            amount={source.amount}
            onChangeAmount={source.onChangeAmount}
            isSubmitting={false}
            label="Sell"
          />

          <SwapSource
            asset={selectedTargetAsset?.asset}
            isLoadingAssets={false}
            openAssetSelector={
              target.onChangeBuySelectedAsset && !isSubmitting ?
                () => setBuyAssetSelectorModalOpen(true)
              : undefined
            }
            amount={target.amount}
            isSubmitting={false}
            label="Buy"
          />
        </Stack>

        {sellAssetSelectorModalOpen &&
          source.onChangeSellSelectedAsset &&
          walletAddress && (
            <SelectAssetModal
              onClose={() => setSellAssetSelectorModalOpen(false)}
              assets={assets}
              onSelect={source.onChangeSellSelectedAsset}
              walletAddress={walletAddress}
              wallet={wallets.namada}
            />
          )}
        {buyAssetSelectorModalOpen &&
          target.onChangeBuySelectedAsset &&
          walletAddress && (
            <SelectAssetModal
              onClose={() => setBuyAssetSelectorModalOpen(false)}
              assets={assets}
              onSelect={target.onChangeBuySelectedAsset}
              walletAddress={walletAddress}
              wallet={wallets.namada}
            />
          )}
      </section>
    </>
  );
};
