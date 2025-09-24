import { ActionButton, Stack } from "@namada/components";
import { mapUndefined } from "@namada/utils";
import { SwapArrowsIcon } from "App/Icons/SwapArrowsIcon";
import { namadaRegistryChainAssetsMapAtom } from "atoms/integrations";
import { SwapResponseOk } from "atoms/swaps";
import BigNumber from "bignumber.js";
import { TransactionFeeProps } from "hooks";
import { wallets } from "integrations";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { GoChevronDown } from "react-icons/go";
import { Address, NamadaAsset, NamadaAssetWithAmount } from "types";
import { getDisplayGasFee } from "utils/gas";
import { SelectAssetModal } from "./SelectAssetModal";
import { SwapSource } from "./SwapSource";

export type SwapModuleProps = {
  assets: NamadaAsset[];
  assetsWithBalance?: Record<string, NamadaAssetWithAmount>;
  isSubmitting?: boolean;
  feeProps?: TransactionFeeProps;
  walletAddress?: string;
  quote?: SwapResponseOk & { minAmount: BigNumber };
  tokenPrices?: Record<string, BigNumber>;
  // TODO: change name
  unitPrice?: BigNumber;
  onSwapArrowsClick?: () => void;
  source: {
    amount?: BigNumber;
    selectedAssetAddress?: string;
    onChangeAmount?: (amount: BigNumber | undefined) => void;
    onChangeSellSelectedAsset?: (address: Address | undefined) => void;
  };
  target: {
    amount?: BigNumber;
    selectedAssetAddress?: string;
    onChangeAmount?: (amount: BigNumber | undefined) => void;
    onChangeBuySelectedAsset?: (address: Address | undefined) => void;
  };
};

export const SwapModule = ({
  assets,
  assetsWithBalance,
  walletAddress,
  isSubmitting,
  feeProps,
  quote,
  source,
  target,
  tokenPrices,
  unitPrice,
  onSwapArrowsClick,
}: SwapModuleProps): JSX.Element => {
  const selectedAsset = mapUndefined(
    (address) => assets.find((a) => a.address === address),
    source.selectedAssetAddress
  );
  const sortedAssets = assets.sort((a, b) => {
    if (assetsWithBalance?.[a.address] && !assetsWithBalance?.[b.address])
      return -1;
    if (!assetsWithBalance?.[a.address] && assetsWithBalance?.[b.address])
      return 1;
    return 0;
  });

  const balances = Object.entries(assetsWithBalance || {}).reduce(
    (acc, [key, value]) => {
      const price = tokenPrices?.[key];

      // TODO: sucks
      const fiatAmount = price ? value.amount.multipliedBy(price) : undefined;
      if (fiatAmount) {
        acc[key] = [value.amount, fiatAmount];
      } else {
        acc[key] = [value.amount];
      }

      return acc;
    },
    {} as Record<string, [BigNumber, BigNumber?]>
  );
  const availableAmount = mapUndefined(
    (address) => assetsWithBalance?.[address]?.amount,
    source.selectedAssetAddress
  );

  const selectedTargetAsset = mapUndefined(
    (address) => assets.find((a) => a.address === address),
    target.selectedAssetAddress
  );

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
    const { selectedAssetAddress } = source;

    if (
      typeof selectedAssetAddress === "undefined" ||
      typeof availableAmount === "undefined"
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
  }, [source.selectedAssetAddress, availableAmount, displayGasFee]);
  // TODO: end reuse

  const validationResult = useMemo(() => {
    if (!selectedAsset) {
      return "NoSellAssetSelected";
    } else if (!selectedTargetAsset) {
      return "NoBuyAssetSelected";
    } else if (!source.amount || source.amount.isZero()) {
      return "SellAmountIsZero";
    } else if (!target.amount || target.amount.isZero()) {
      return "BuyAmountIsZero";
    }
    if (
      !availableAmountMinusFees ||
      (source.amount &&
        availableAmountMinusFees &&
        source.amount.gt(availableAmountMinusFees))
    ) {
      return "SellAmountExceedsBalance";
    } else {
      return "Ok";
    }
  }, [
    selectedAsset?.address,
    selectedTargetAsset?.address,
    source.amount,
    target.amount,
  ]);

  return (
    <>
      <section className="max-w-[480px] mx-auto" role="widget">
        <Stack>
          <SwapSource
            asset={selectedAsset}
            isLoadingAssets={false}
            openAssetSelector={
              source.onChangeSellSelectedAsset && !isSubmitting ?
                () => setSellAssetSelectorModalOpen(true)
              : undefined
            }
            availableAmount={availableAmount}
            availableAmountMinusFees={availableAmountMinusFees}
            amount={source.amount}
            onChangeAmount={source.onChangeAmount}
            isSubmitting={false}
            label="Sell"
          />
          <i
            className="flex items-center justify-center w-13 mx-auto relative z-10 -my-8 cursor-pointer"
            onClick={onSwapArrowsClick}
          >
            <SwapArrowsIcon color={"#FF0"} />
          </i>
          <SwapSource
            asset={selectedTargetAsset}
            isLoadingAssets={false}
            openAssetSelector={
              target.onChangeBuySelectedAsset && !isSubmitting ?
                () => setBuyAssetSelectorModalOpen(true)
              : undefined
            }
            // TODO: this is done to not show the amount ig the source amount is empty
            amount={source.amount && target.amount}
            onChangeAmount={target.onChangeAmount}
            isSubmitting={false}
            label="Buy"
          />
          {quote &&
            unitPrice &&
            selectedAsset &&
            selectedTargetAsset &&
            tokenPrices && (
              <Sth
                amount={target.amount}
                unitPrice={unitPrice}
                selectedAsset={selectedAsset}
                selectedTargetAsset={selectedTargetAsset}
                tokenPrice={tokenPrices[selectedTargetAsset.address]}
                effectiveFee={BigNumber(quote.effective_fee)}
              />
            )}

          <ActionButton
            outlineColor="yellow"
            backgroundColor="yellow"
            backgroundHoverColor="transparent"
            textColor="black"
            textHoverColor="yellow"
            disabled={isSubmitting || validationResult !== "Ok"}
          >
            {ValidationMessages[validationResult]}
          </ActionButton>
          <p className="self-center">Powered by Osmosis</p>
        </Stack>

        {sellAssetSelectorModalOpen &&
          source.onChangeSellSelectedAsset &&
          walletAddress && (
            <SelectAssetModal
              onClose={() => setSellAssetSelectorModalOpen(false)}
              assets={sortedAssets}
              balances={balances}
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
              assets={sortedAssets}
              balances={balances}
              onSelect={target.onChangeBuySelectedAsset}
              walletAddress={walletAddress}
              wallet={wallets.namada}
            />
          )}
      </section>
    </>
  );
};

type SthProps = {
  amount?: BigNumber;
  unitPrice: BigNumber;
  selectedAsset: NamadaAsset;
  selectedTargetAsset: NamadaAsset;
  tokenPrice: BigNumber;
  effectiveFee: BigNumber;
};

const Sth = ({
  amount,
  unitPrice,
  selectedAsset,
  selectedTargetAsset,
  tokenPrice,
  effectiveFee,
}: SthProps): JSX.Element => {
  //TODO: We have to take price impact into consideration most likely
  const valFiat = unitPrice.times(tokenPrice);
  const [showDetails, setShowDetails] = useState(false);
  const swapFee = effectiveFee
    ?.times(100)
    .decimalPlaces(2, BigNumber.ROUND_HALF_UP);
  const fiatFee = amount
    ?.times(tokenPrice)
    .times(effectiveFee || 0)
    .decimalPlaces(3);
  const fiatFeeDisplay =
    !fiatFee ? "#"
    : fiatFee.lt(0.01) ? "<$0.01"
    : `~$${fiatFee.toString()}`;

  return (
    <Stack className="text-sm">
      <Stack
        className="justify-between text-neutral-400"
        direction="horizontal"
      >
        <div className="underline">
          1 {selectedAsset.symbol} ≈ {unitPrice.toFixed(6)}{" "}
          {selectedTargetAsset.symbol} (${valFiat.toFixed(6)})
        </div>
        <Stack
          className="items-center cursor-pointer"
          direction="horizontal"
          gap={1}
          onClick={() => setShowDetails(!showDetails)}
        >
          Show details{" "}
          {!showDetails ?
            <GoChevronDown />
          : <GoChevronDown className="rotate-180" />}
        </Stack>
      </Stack>
      {showDetails && (
        <Stack
          direction="horizontal"
          className="justify-between text-neutral-400"
        >
          <p>Swap Fee</p>
          <p>
            {fiatFeeDisplay} ({swapFee.toString()}%)
          </p>
        </Stack>
      )}
    </Stack>
  );
};

const ValidationMessages: Record<string, string> = {
  NoSellAssetSelected: "Select a token to sell",
  NoBuyAssetSelected: "Select a token to buy",
  SellAmountIsZero: "Enter an amount to sell",
  BuyAmountIsZero: "Enter an amount to buy",
  SellAmountExceedsBalance: "Insufficient balance",
  Ok: "Review",
};
