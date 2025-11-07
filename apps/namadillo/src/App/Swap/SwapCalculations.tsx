import { ActionButton, Stack } from "@namada/components";
import { mapUndefined } from "@namada/utils";
import { ConnectProviderButton } from "App/Common/ConnectProviderButton";
import { SelectAssetModal } from "App/Common/SelectAssetModal";
import { SelectWalletModal } from "App/Common/SelectWalletModal";
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
import { useWalletManager } from "hooks/useWalletManager";
import { wallets } from "integrations";
import { KeplrWalletManager } from "integrations/Keplr";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { NamadaAsset } from "types";
import { SwapSource } from "./SwapSource";
import { useSwapSimulation } from "./hooks/useSwapSimulation";
import { useSwapValidation } from "./hooks/useSwapValidation";
import { SwapQuote, SwapState, SwapStatus } from "./state";
import { swapQuoteAtom, swapStateAtom, swapStatusAtom } from "./state/atoms";

const ValidationMessages: Record<string, string> = {
  NoSellAssetSelected: "Select a token to sell",
  NoBuyAssetSelected: "Select a token to buy",
  SwapModeNone: "Enter an amount to swap",
  SellAmountIsZero: "Calculating amount to sell",
  BuyAmountIsZero: "Calculating amount to buy",
  SellAmountExceedsBalance: "Insufficient balance",
  NoWalletConnected: "Connect Keplr Wallet",
  Ok: "Review",
};

const keplr = new KeplrWalletManager();

export const SwapCalculations = (): JSX.Element => {
  // Local state
  const [sellAssetSelectorModalOpen, setSellAssetSelectorModalOpen] =
    useState(false);
  const [buyAssetSelectorModalOpen, setBuyAssetSelectorModalOpen] =
    useState(false);
  const [showConnectToWalletButton, setShowConnectToWalletButton] =
    useState(false);
  const [walletSelectorModalOpen, setWalletSelectorModalOpen] = useState(false);

  // Feature state
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

  useSwapSimulation();

  const { walletAddress, connectToChainId, registry } = useWalletManager(keplr);

  // Derived state
  const { sellAsset, buyAsset } = swapState;
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
    walletAddress,
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
    const update = (s: SwapState): SwapState => {
      if (swapState.mode !== "none") {
        const newMode = swapState.mode === "sell" ? "buy" : "sell";
        return {
          mode: newMode,
          sellAmount: s.buyAmount,
          buyAmount: s.sellAmount,
          sellAmountPerOneBuy: s.sellAmountPerOneBuy,
        };
      }

      return s;
    };

    if (sellAsset && buyAsset) {
      setSwapState((s) => ({
        ...update(s),
        sellAsset: buyAsset,
        buyAsset: sellAsset,
      }));
    }
  }, [sellAsset?.symbol, buyAsset?.symbol, swapState.mode]);

  const onChangeSellSelectedAsset = useCallback(
    (address: string): void => {
      const asset = sortedAssets.find((a) => a.address === address);

      setSwapState((s) => ({
        ...s,
        sellAsset: asset,
        buyAsset: asset?.address === buyAsset?.address ? sellAsset : s.buyAsset,
      }));
    },
    [sortedAssets.length, sellAsset?.symbol, sellAsset?.symbol]
  );

  const onChangeBuySelectedAsset = useCallback(
    (address: string): void => {
      const asset = sortedAssets.find((a) => a.address === address);

      setSwapState((s) => ({
        ...s,
        sellAsset:
          asset?.address === sellAsset?.address ? buyAsset : s.sellAsset,
        buyAsset: asset,
      }));
    },
    [sortedAssets.length, buyAsset?.symbol, sellAsset?.symbol]
  );

  useEffect(() => {
    // This prevents button flash
    const handler = setTimeout(() => {
      setShowConnectToWalletButton(!walletAddress);
    }, 500);

    return () => clearTimeout(handler);
  }, [walletAddress]);

  const onChangeWallet = useCallback((): void => {
    if (registry) {
      connectToChainId(registry.chain.chain_id);
      return;
    }
    connectToChainId("osmosis-1");
  }, []);

  return (
    <>
      <Stack>
        <div className="relative">
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
          {showConnectToWalletButton && (
            <div className="absolute top-4 right-4 h-[30px]">
              <ConnectProviderButton
                onClick={() => {
                  setWalletSelectorModalOpen(true);
                }}
              />
            </div>
          )}
        </div>
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
        />
      )}
      {buyAssetSelectorModalOpen && shieldedAccountAddress && (
        <SelectAssetModal
          onClose={() => setBuyAssetSelectorModalOpen(false)}
          assets={sortedAssets}
          balances={balances}
          onSelect={onChangeBuySelectedAsset}
          walletAddress={shieldedAccountAddress}
        />
      )}
      {walletSelectorModalOpen && (
        <SelectWalletModal
          availableWallets={[wallets.keplr]}
          onClose={() => setWalletSelectorModalOpen(false)}
          onConnect={onChangeWallet}
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
    if (typeof quote !== "undefined") {
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
