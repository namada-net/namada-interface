import { ActionButton, Stack, Text } from "@namada/components";
import { ConnectProviderButton } from "App/Common/ConnectProviderButton";
import { CurrentStatus } from "App/Common/CurrentStatus";
import { IconTooltip } from "App/Common/IconTooltip";
import { InlineError } from "App/Common/InlineError";
import { LedgerDeviceTooltip } from "App/Common/LedgerDeviceTooltip";
import { SelectWalletModal } from "App/Common/SelectWalletModal";
import { WalletAddress } from "App/Common/WalletAddress";
import { SwapTradeIcon } from "App/Icons/SwapTradeIcon";
import { ledgerStatusDataAtom } from "atoms/ledger";
import { tokenPricesFamily } from "atoms/prices/atoms";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useWalletManager } from "hooks/useWalletManager";
import { wallets } from "integrations";
import { KeplrWalletManager } from "integrations/Keplr";
import { getAssetImageUrl } from "integrations/utils";
import invariant from "invariant";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { BsQuestionCircleFill } from "react-icons/bs";
import { toDisplayAmount } from "utils";
import { usePerformOsmosisSwapTx } from "./hooks/usePerformOsmosisSwapTx";
import { useSwapReviewValidation } from "./hooks/useSwapReviewValidation";
import { statusMessages, SwapStatus } from "./state";
import { swapQuoteAtom, swapStateAtom, swapStatusAtom } from "./state/atoms";
import { SLIPPAGE } from "./state/functions";

const keplr = new KeplrWalletManager();
export const SwapReview = (): JSX.Element => {
  // Local state
  const [walletSelectorModalOpen, setWalletSelectorModalOpen] = useState(false);
  const [showConnectToWalletButton, setShowConnectToWalletButton] =
    useState(false);

  // Feature state  sanity checks
  const [status, setStatus] = useAtom(swapStatusAtom);
  const swapState = useAtomValue(swapStateAtom);
  const { sellAsset, buyAsset } = swapState;
  const { data: quote } = useAtomValue(swapQuoteAtom);

  invariant(sellAsset, "Sell asset is required");
  invariant(buyAsset, "Buy asset is required");

  const sellPrice = useAtomValue(tokenPricesFamily([sellAsset.address])).data?.[
    sellAsset.address
  ];
  const buyPrice = useAtomValue(tokenPricesFamily([buyAsset.address])).data?.[
    buyAsset.address
  ];

  invariant(quote, "Quote is required");
  invariant(swapState.sellAmount, "Swap state is required");
  invariant(swapState.buyAmount, "Swap state is required");

  // Global state
  const [ledgerStatus, setLedgerStatusStop] = useAtom(ledgerStatusDataAtom);

  // Derived state
  const ledgerAccountInfo = ledgerStatus && {
    deviceConnected: ledgerStatus.connected,
    errorMessage: ledgerStatus.errorMessage,
  };
  const sellAmountFiat = sellPrice && sellPrice.times(swapState.sellAmount);
  const buyPriceImpact =
    buyPrice && buyPrice.times(BigNumber(1).plus(quote.priceImpact));
  const buyAmountFiat =
    buyPriceImpact && buyPriceImpact.times(swapState.buyAmount);
  const receiveAtLeastDenominated = toDisplayAmount(buyAsset, quote.minAmount);

  const swapFee = quote.effectiveFee
    .times(100)
    .decimalPlaces(2, BigNumber.ROUND_HALF_UP);
  const fiatFee =
    buyPriceImpact &&
    buyPrice.times(buyPriceImpact).times(quote.effectiveFee).decimalPlaces(3);
  const fiatFeeDisplay =
    !fiatFee ? "#"
    : fiatFee.lt(0.01) ? "<$0.01"
    : `~$${fiatFee.toString()}`;

  const { walletAddress, connectToChainId, registry } = useWalletManager(keplr);
  useEffect(() => {
    // Because of the current bug with connectedWallets, this prevents button flash
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

  const { error: _err, performSwap } = usePerformOsmosisSwapTx();
  const onSwap = useCallback(async (): Promise<void> => {
    await performSwap({ localRecoveryAddr: walletAddress });
  }, [walletAddress]);

  const validationResult = useSwapReviewValidation({
    walletAddress,
    ledgerAccountInfo,
  });

  // We stop the ledger status check when the transfer is in progress
  setLedgerStatusStop(["Building", "AwaitingSignature"].includes(status.t));

  return (
    <>
      <Stack>
        <div className="relative bg-neutral-800 rounded-lg px-4 py-5 border border-yellow font-light">
          <Stack direction="horizontal" className="justify-between">
            <Text className="mt-0">Review Shielded Swap</Text>
            {showConnectToWalletButton && (
              <div className="h-[30px]">
                <ConnectProviderButton
                  onClick={() => {
                    setWalletSelectorModalOpen(true);
                  }}
                />
              </div>
            )}
          </Stack>
          <Stack direction="horizontal">
            <span>
              <img
                className={clsx(
                  "w-15 aspect-square object-cover select-none",
                  "object-center bg-neutral-800 rounded-full"
                )}
                alt={`${sellAsset.name} image`}
                src={getAssetImageUrl(sellAsset)}
              />
            </span>
            <Stack gap={0} className="justify-center grow">
              <Text className="text-sm my-0">Sell</Text>
              <Text className="text-lg my-0">
                {swapState.sellAmount.toString()} {sellAsset.symbol}
              </Text>
            </Stack>
            <Text className="my-0 mb-2 self-end">
              ${sellAmountFiat && sellAmountFiat.decimalPlaces(2).toString()}
            </Text>
          </Stack>
          <i className="flex w-15 justify-center my-4">
            <SwapTradeIcon color={"#FF0"} />
          </i>
          <Stack direction="horizontal">
            <span>
              <img
                className={clsx(
                  "w-15 aspect-square object-cover select-none",
                  "object-center bg-neutral-800 rounded-full"
                )}
                alt={`${buyAsset.name} image`}
                src={getAssetImageUrl(buyAsset)}
              />
            </span>
            <Stack gap={0} className="justify-center grow">
              <Text className="text-sm my-0">Buy</Text>
              <Text className="text-lg my-0">
                {swapState.buyAmount.toString()} {buyAsset.symbol}
              </Text>
            </Stack>
            <Text className="my-0 mb-2 self-end">
              ${buyAmountFiat && buyAmountFiat.decimalPlaces(2).toString()}
            </Text>
          </Stack>
          <hr className="my-5 mx-2 border-white opacity-[5%]" />
          <Stack gap={3}>
            <ReviewRow>
              <div>Swap Fee</div>
              <p>
                {fiatFeeDisplay} ({swapFee.toString()}%)
              </p>
            </ReviewRow>
            <ReviewRow>
              <div>Slippage tolerance</div>
              <div>{SLIPPAGE * 100}%</div>
            </ReviewRow>
            <ReviewRow>
              <div>Receive at least</div>
              <div>
                {receiveAtLeastDenominated.toString()} {buyAsset.symbol}
              </div>
            </ReviewRow>
            {walletAddress && (
              <ReviewRow>
                <Stack
                  direction="horizontal"
                  className="relative items-center"
                  gap={2}
                >
                  Local recovery address
                  <IconTooltip
                    className=""
                    icon={
                      <BsQuestionCircleFill className="w-4 h-4 text-yellow" />
                    }
                    text={
                      <span>
                        This is the address where your assets will land in case
                        something goes wrong on the destination chain.
                      </span>
                    }
                  />
                </Stack>
                <WalletAddress address={walletAddress} displayTooltip={true} />
              </ReviewRow>
            )}
          </Stack>
        </div>
        {status.t === "Error" && <InlineError errorMessage={status.message} />}
        {!["Building", "AwaitingSignature", "Broadcasting"].includes(
          status.t
        ) && (
          <div className="relative">
            <ActionButton
              outlineColor="yellow"
              backgroundColor="yellow"
              backgroundHoverColor="transparent"
              textColor="black"
              textHoverColor="yellow"
              disabled={validationResult !== "Ok"}
              onClick={onSwap}
            >
              {ValidationMessages[validationResult]}
            </ActionButton>

            {validationResult === "LedgerDeviceNotConnected" && (
              <LedgerDeviceTooltip />
            )}
          </div>
        )}
        {["Building", "AwaitingSignature", "Broadcasting"].includes(
          status.t
        ) && (
          <CurrentStatus
            status={statusMessages[status.t].title}
            explanation={statusMessages[status.t].description}
          />
        )}
        {!["Building", "AwaitingSignature", "Broadcasting"].includes(
          status.t
        ) && (
          <ActionButton
            outlineColor="yellow"
            backgroundColor="transparent"
            backgroundHoverColor="yellow"
            textColor="yellow"
            textHoverColor="black"
            onClick={() => setStatus(SwapStatus.idle())}
          >
            Back
          </ActionButton>
        )}
      </Stack>
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

const ReviewRow = ({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element => {
  return (
    <Stack
      direction="horizontal"
      className="justify-between text-neutral-300 text-sm"
    >
      {children}
    </Stack>
  );
};

const ValidationMessages: Record<string, string> = {
  NoWalletConnected: "Connect Keplr Wallet",
  LedgerDeviceNotConnected: "Connect your ledger and open the Namada App",
  Ok: "Swap",
};
