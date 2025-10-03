import { ActionButton, Stack } from "@namada/components";
import { AccountType } from "@namada/types";
import { mapUndefined } from "@namada/utils";
import { SelectAssetModal } from "App/Common/SelectAssetModal";
import { TransactionFeeButton } from "App/Common/TransactionFeeButton";
import { SwapArrowsIcon } from "App/Icons/SwapArrowsIcon";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { namadaShieldedAssetsAtom } from "atoms/balance";
import { namadaRegistryChainAssetsMapAtom } from "atoms/integrations";
import { tokenPricesFamily } from "atoms/prices/atoms";
import BigNumber from "bignumber.js";
import { TransactionFeeProps, useTransactionFee } from "hooks";
import { wallets } from "integrations";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { NamadaAsset } from "types";
import { getDisplayGasFee } from "utils/gas";
import { SwapSource } from "./SwapSource";
import { SwapStatus } from "./state";
import {
  buyAssetAtom,
  sellAssetAtom,
  swapQuoteAtom,
  swapStateAtom,
  swapStatusAtom,
} from "./state/atoms";

export const SwapCalculations = (): JSX.Element => {
  // Local state
  const [sellAssetSelectorModalOpen, setSellAssetSelectorModalOpen] =
    useState(false);
  const [buyAssetSelectorModalOpen, setBuyAssetSelectorModalOpen] =
    useState(false);

  // Feature state
  const [sellAsset, setSellAsset] = useAtom(sellAssetAtom);
  const [buyAsset, setBuyAsset] = useAtom(buyAssetAtom);
  const [swapState, setSwapState] = useAtom(swapStateAtom);
  const { data: quote } = useAtomValue(swapQuoteAtom);
  const [status, setStatus] = useAtom(swapStatusAtom);

  // Global state
  const { data: chainAssetsMap } = useAtomValue(
    namadaRegistryChainAssetsMapAtom
  );
  const assets = chainAssetsMap ? Object.values(chainAssetsMap) : [];
  const { data: assetsWithBalance } = useAtomValue(namadaShieldedAssetsAtom);
  const feeProps = useTransactionFee(["IbcTransfer"]);
  const { data: tokenPrices } = useAtomValue(
    tokenPricesFamily(assets.map((a) => a.address))
  );
  const defaultAccounts = useAtomValue(allDefaultAccountsAtom);

  // Derived state
  const availableAmount = mapUndefined(
    (address) => assetsWithBalance?.[address]?.amount,
    sellAsset?.address
  );
  const availableAmountMinusFees = useMemo(() => {
    if (
      !availableAmount ||
      // Don't subtract if the gas token is different than the selected asset:
      feeProps.gasConfig.gasToken !== sellAsset?.address
    ) {
      return availableAmount;
    }
    const displayGasFee = getDisplayGasFee(
      feeProps.gasConfig,
      chainAssetsMap || {}
    );

    const amountMinusFees = availableAmount
      .minus(displayGasFee.totalDisplayAmount)
      .decimalPlaces(6);

    return BigNumber.max(amountMinusFees, 0);
  }, [sellAsset?.address, availableAmount?.toString()]);

  const shieldedAccountAddress = defaultAccounts.data?.find(
    (account) => account.type === AccountType.ShieldedKeys
  )?.address;

  const validationResult = useMemo(() => {
    if (!sellAsset) {
      return "NoSellAssetSelected";
    } else if (!buyAsset) {
      return "NoBuyAssetSelected";
    } else if (!swapState.sellAmount || swapState.sellAmount.isZero()) {
      return "SellAmountIsZero";
    } else if (!swapState.buyAmount || swapState.buyAmount.isZero()) {
      return "BuyAmountIsZero";
    }
    if (
      !availableAmountMinusFees ||
      (swapState.sellAmount &&
        availableAmountMinusFees &&
        swapState.sellAmount.gt(availableAmountMinusFees))
    ) {
      return "SellAmountExceedsBalance";
    } else {
      return "Ok";
    }
  }, [
    sellAsset?.address,
    buyAsset?.address,
    swapState.sellAmount,
    swapState.buyAmount,
  ]);

  // We want assets with balance to be on top of the list
  const sortedAssets = assets.sort((assetA, assetB) => {
    const assetWithBalanceA = assetsWithBalance?.[assetA.address];
    const assetWithBalanceB = assetsWithBalance?.[assetB.address];

    return (
      assetWithBalanceA && !assetWithBalanceB ? -1
      : !assetWithBalanceA && assetWithBalanceB ? 1
      : 0
    );
  });

  const balances = Object.entries(assetsWithBalance || {}).reduce(
    (acc, [key, { amount }]) => {
      const price = tokenPrices?.[key];
      const fiatAmount = price && amount.multipliedBy(price);
      const val: [BigNumber, BigNumber?] =
        fiatAmount ? [amount, fiatAmount] : [amount];
      acc[key] = val;

      return acc;
    },
    {} as Record<string, [BigNumber, BigNumber?]>
  );

  // TODO: use callback
  const onChangeSellAmount = (a: BigNumber | undefined): void => {
    if (a) {
      setSwapState((s) => ({
        ...s,
        mode: "sell",
        sellAmount: a,
      }));
    } else {
      setSwapState((s) => ({
        mode: "none",
        unitPrice: s.unitPrice,
      }));
    }
  };

  const onChangeBuyAmount = (a: BigNumber | undefined): void => {
    if (a) {
      setSwapState((s) => ({
        ...s,
        mode: "buy",
        buyAmount: a,
      }));
    } else {
      setSwapState((s) => ({
        mode: "none",
        unitPrice: s.unitPrice,
      }));
    }
  };

  const onSwapArrowsClick = (): void => {
    if (sellAsset && buyAsset) {
      setSellAsset(buyAsset.symbol);
      setBuyAsset(sellAsset.symbol);

      const newMode = swapState.mode === "sell" ? "buy" : "sell";
      setSwapState((s) => ({
        mode: newMode,
        sellAmount: swapState.buyAmount,
        buyAmount: swapState.sellAmount,
        unitPrice: s.unitPrice,
      }));
    }
  };

  const onChangeBuySelectedAsset = (address: string): void => {
    const asset = assets.find((a) => a.address === address);
    if (asset?.address === sellAsset?.address) {
      setSellAsset(buyAsset?.symbol);
    }
    setBuyAsset(asset?.symbol);
  };

  const onChangeSellSelectedAsset = (address: string): void => {
    const asset = assets.find((a) => a.address === address);
    if (asset?.address === buyAsset?.address) {
      setBuyAsset(sellAsset?.symbol);
    }
    setSellAsset(asset?.symbol);
  };

  return (
    <>
      <Stack>
        <SwapSource
          asset={sellAsset}
          isLoadingAssets={false}
          openAssetSelector={() => setSellAssetSelectorModalOpen(true)}
          availableAmount={availableAmount}
          availableAmountMinusFees={availableAmountMinusFees}
          amount={swapState.sellAmount}
          onChangeAmount={onChangeSellAmount}
          isSubmitting={false}
          label="Sell"
        />
        <i
          className="flex items-center justify-center w-13 mx-auto relative z-10 -my-8 cursor-pointer hover:rotate-180 transition-transform"
          onClick={onSwapArrowsClick}
        >
          <SwapArrowsIcon color={"#FF0"} />
        </i>
        <SwapSource
          asset={buyAsset}
          isLoadingAssets={false}
          openAssetSelector={() => setBuyAssetSelectorModalOpen(true)}
          // To not show  buy amount if sell amount is empty
          amount={swapState.sellAmount && swapState.buyAmount}
          onChangeAmount={onChangeBuyAmount}
          isSubmitting={false}
          label="Buy"
        />
        {quote &&
          feeProps &&
          swapState.unitPrice &&
          sellAsset &&
          buyAsset &&
          tokenPrices && (
            <SwapCalculationsFooter
              feeProps={feeProps}
              unitPrice={swapState.unitPrice}
              selectedAsset={sellAsset}
              selectedTargetAsset={buyAsset}
              tokenPrice={tokenPrices[buyAsset.address]}
              effectiveFee={BigNumber(quote.effectiveFee)}
            />
          )}

        <ActionButton
          outlineColor="yellow"
          backgroundColor="yellow"
          backgroundHoverColor="transparent"
          textColor="black"
          textHoverColor="yellow"
          disabled={validationResult !== "Ok"}
          onClick={() => setStatus(SwapStatus.Review)}
        >
          {ValidationMessages[validationResult]}
        </ActionButton>
      </Stack>

      {sellAssetSelectorModalOpen && shieldedAccountAddress && (
        <SelectAssetModal
          onClose={() => setSellAssetSelectorModalOpen(false)}
          assets={sortedAssets}
          balances={balances}
          onSelect={onChangeSellSelectedAsset}
          walletAddress={shieldedAccountAddress}
          wallet={wallets.namada}
        />
      )}
      {buyAssetSelectorModalOpen && shieldedAccountAddress && (
        <SelectAssetModal
          onClose={() => setBuyAssetSelectorModalOpen(false)}
          assets={sortedAssets}
          balances={balances}
          onSelect={onChangeBuySelectedAsset}
          walletAddress={shieldedAccountAddress}
          wallet={wallets.namada}
        />
      )}
    </>
  );
};

type SwapCalculationsFooterProps = {
  feeProps: TransactionFeeProps;
  unitPrice: BigNumber;
  selectedAsset: NamadaAsset;
  selectedTargetAsset: NamadaAsset;
  tokenPrice: BigNumber;
  effectiveFee: BigNumber;
};

const SwapCalculationsFooter = ({
  feeProps,
  unitPrice,
  selectedAsset,
  selectedTargetAsset,
  tokenPrice,
}: SwapCalculationsFooterProps): JSX.Element => {
  //TODO: We have to take price impact into consideration most likely
  const valFiat = unitPrice.times(tokenPrice);

  return (
    <Stack className="text-sm">
      <Stack
        className="justify-between items-center text-neutral-400"
        direction="horizontal"
      >
        <div className="underline">
          1 {selectedAsset.symbol} ≈ {unitPrice.toFixed(6)}{" "}
          {selectedTargetAsset.symbol} (${valFiat.toFixed(6)})
        </div>
        <TransactionFeeButton
          compact={true}
          feeProps={feeProps}
          isShieldedTransfer={true}
        />
      </Stack>
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
