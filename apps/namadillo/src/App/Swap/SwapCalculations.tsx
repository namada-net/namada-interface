import { ActionButton, Stack } from "@namada/components";
import { mapUndefined } from "@namada/utils";
import { SelectAssetModal } from "App/Common/SelectAssetModal";
import { TransactionFeeButton } from "App/Common/TransactionFeeButton";
import { SwapArrowsIcon } from "App/Icons/SwapArrowsIcon";
import { defaultShieldedAccountAtom } from "atoms/accounts";
import {
  namadaAssetsSortedAtom,
  namadaShieldedAssetsAtom,
} from "atoms/balance";
import { tokenPricesFamily } from "atoms/prices/atoms";
import BigNumber from "bignumber.js";
import { TransactionFeeProps, useTransactionFee } from "hooks";
import { useAvailableAmountMinusFees } from "hooks/useAvailableAmountMinusFee";
import { wallets } from "integrations";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { NamadaAsset } from "types";
import { SwapSource } from "./SwapSource";
import { useSwapSimulation } from "./hooks/useSwapSimulation";
import { useSwapValidation } from "./hooks/useSwapValidation";
import { SwapQuote, SwapStatus } from "./state";
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
  const setStatus = useSetAtom(swapStatusAtom);

  // Global state
  const sortedAssets = useAtomValue(namadaAssetsSortedAtom);
  const { data: assetsWithBalance } = useAtomValue(namadaShieldedAssetsAtom);
  const { data: tokenPrices } = useAtomValue(
    tokenPricesFamily(sortedAssets.map((a) => a.address))
  );
  const feeProps = useTransactionFee(["IbcTransfer"]);
  const shieldedAccountAddress = useAtomValue(
    defaultShieldedAccountAtom
  )?.address;

  useSwapSimulation({
    swapState,
    setSwapState,
    quote,
    buyAsset,
    sellAsset,
  });

  // Derived state
  const availableAmount = mapUndefined(
    (address) => assetsWithBalance?.[address]?.amount,
    sellAsset?.address
  );
  const availableAmountMinusFees = useAvailableAmountMinusFees(
    feeProps.gasConfig,
    sellAsset?.address,
    availableAmount
  );
  const validationResult = useSwapValidation({
    swapState,
    sellAsset,
    buyAsset,
    availableAmountMinusFees,
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

  // Handlers
  const onChangeSellAmount = useCallback((a: BigNumber | undefined): void => {
    if (a) {
      setSwapState((s) => ({
        ...s,
        mode: "sell",
        sellAmount: a,
      }));
    } else {
      setSwapState((s) => ({
        mode: "none",
        sellAmountPerOneBuy: s.sellAmountPerOneBuy,
      }));
    }
  }, []);

  const onChangeBuyAmount = useCallback((a: BigNumber | undefined): void => {
    if (a) {
      setSwapState((s) => ({
        ...s,
        mode: "buy",
        buyAmount: a,
      }));
    } else {
      setSwapState((s) => ({
        mode: "none",
        sellAmountPerOneBuy: s.sellAmountPerOneBuy,
      }));
    }
  }, []);

  const onSwapArrowsClick = useCallback((): void => {
    if (sellAsset && buyAsset) {
      setSellAsset(buyAsset.symbol);
      setBuyAsset(sellAsset.symbol);

      if (swapState.mode !== "none") {
        const newMode = swapState.mode === "sell" ? "buy" : "sell";
        setSwapState((s) => ({
          mode: newMode,
          sellAmount: s.buyAmount,
          buyAmount: s.sellAmount,
          sellAmountPerOneBuy: s.sellAmountPerOneBuy,
        }));
      }
    }
  }, [sellAsset?.symbol, buyAsset?.symbol, swapState.mode]);

  const onChangeBuySelectedAsset = useCallback(
    (address: string): void => {
      const asset = sortedAssets.find((a) => a.address === address);
      if (asset?.address === sellAsset?.address) {
        setSellAsset(buyAsset?.symbol);
      }
      setBuyAsset(asset?.symbol);
    },
    [sortedAssets.length]
  );

  const onChangeSellSelectedAsset = useCallback(
    (address: string): void => {
      const asset = sortedAssets.find((a) => a.address === address);
      if (asset?.address === buyAsset?.address) {
        setBuyAsset(sellAsset?.symbol);
      }
      setSellAsset(asset?.symbol);
    },
    [sortedAssets.length]
  );

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
          className="flex items-center justify-center w-13 mx-auto relative z-10 -my-8 cursor-pointer duration-300 hover:rotate-180 transition-transform ease-in-out"
          onClick={onSwapArrowsClick}
        >
          <SwapArrowsIcon color={"#FF0"} />
        </i>
        <SwapSource
          asset={buyAsset}
          isLoadingAssets={false}
          openAssetSelector={() => setBuyAssetSelectorModalOpen(true)}
          // To not show buy amount if sell amount is empty
          amount={swapState.sellAmount && swapState.buyAmount}
          onChangeAmount={onChangeBuyAmount}
          isSubmitting={false}
          label="Buy"
        />
        {feeProps &&
          swapState.sellAmountPerOneBuy &&
          sellAsset &&
          buyAsset &&
          tokenPrices && (
            <SwapCalculationsFooter
              feeProps={feeProps}
              sellAmountPerOneBuy={swapState.sellAmountPerOneBuy}
              selectedAsset={sellAsset}
              selectedTargetAsset={buyAsset}
              tokenPrice={tokenPrices[buyAsset.address]}
              quote={quote}
            />
          )}

        <ActionButton
          outlineColor="yellow"
          backgroundColor="yellow"
          backgroundHoverColor="transparent"
          textColor="black"
          textHoverColor="yellow"
          disabled={validationResult !== "Ok"}
          onClick={() => setStatus(SwapStatus.review())}
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
  sellAmountPerOneBuy: BigNumber;
  selectedAsset: NamadaAsset;
  selectedTargetAsset: NamadaAsset;
  tokenPrice: BigNumber;
  quote?: SwapQuote;
};

const SwapCalculationsFooter = ({
  feeProps,
  sellAmountPerOneBuy,
  selectedAsset,
  selectedTargetAsset,
  tokenPrice,
  quote,
}: SwapCalculationsFooterProps): JSX.Element => {
  // Quote cache, prevents blinking when quote is temporarily undefined
  const lastValidQuoteRef = useRef<typeof quote>();
  useEffect(() => {
    if (quote !== undefined) {
      lastValidQuoteRef.current = quote;
    }
  }, [quote]);

  const quoteToUse = quote ?? lastValidQuoteRef.current;
  if (!quoteToUse) {
    return <></>;
  }

  const { priceImpact } = quoteToUse;
  const price = tokenPrice.times(BigNumber(1).plus(priceImpact));
  const valFiat = sellAmountPerOneBuy.times(price);

  return (
    <Stack className="text-sm">
      <Stack
        className="justify-between items-center text-neutral-400"
        direction="horizontal"
      >
        <div className="underline">
          1 {selectedAsset.symbol} ≈ {sellAmountPerOneBuy.toFixed(6)}{" "}
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
