import { ActionButton, Stack, Text } from "@namada/components";
import { CurrentStatus } from "App/Common/CurrentStatus";
import { IconTooltip } from "App/Common/IconTooltip";
import { InlineError } from "App/Common/InlineError";
import { LedgerDeviceTooltip } from "App/Common/LedgerDeviceTooltip";
import { WalletAddress } from "App/Common/WalletAddress";
import { SwapTradeIcon } from "App/Icons/SwapTradeIcon";
import { ledgerStatusDataAtom } from "atoms/ledger";
import { tokenPricesFamily } from "atoms/prices/atoms";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useWalletManager } from "hooks/useWalletManager";
import { KeplrWalletManager } from "integrations/Keplr";
import { getAssetImageUrl } from "integrations/utils";
import invariant from "invariant";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { BsQuestionCircleFill } from "react-icons/bs";
import { toDisplayAmount } from "utils";
import {
  usePerformOsmosisSwapTx,
  useSwapBuyAmount,
  useSwapSellAmount,
} from "./hooks";
import { useSwapReviewValidation } from "./hooks/useSwapReviewValidation";
import { statusMessages, SwapStatus } from "./state";
import {
  swapMinAmountAtom,
  swapQuoteAtom,
  swapSlippageAtom,
  swapStateAtom,
  swapStatusAtom,
} from "./state/atoms";

const keplr = new KeplrWalletManager();
export const SwapReview = (): JSX.Element => {
  const [slippageInput, setSlippageInput] = useState("");
  // Feature state  sanity checks
  const [status, setStatus] = useAtom(swapStatusAtom);
  const { sellAsset, buyAsset } = useAtomValue(swapStateAtom);
  const sellAmount = useSwapSellAmount();
  const buyAmount = useSwapBuyAmount();
  const minAmount = useAtomValue(swapMinAmountAtom);
  const [{ default: slippage, override: slippageOverride }, setSlippage] =
    useAtom(swapSlippageAtom);
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
  invariant(sellAmount, "Swap sell amount is required");
  invariant(buyAmount, "Swap buy amount is required");
  invariant(minAmount, "Minimum amount is required");

  // Global state
  const [ledgerStatus, setLedgerStatusStop] = useAtom(ledgerStatusDataAtom);

  // Derived state
  const ledgerAccountInfo = ledgerStatus && {
    deviceConnected: ledgerStatus.connected,
    errorMessage: ledgerStatus.errorMessage,
  };
  const sellAmountFiat = sellPrice && sellPrice.times(sellAmount);
  const buyPriceImpact =
    buyPrice && buyPrice.times(BigNumber(1).plus(quote.priceImpact));
  const buyAmountFiat = buyPriceImpact && buyPriceImpact.times(buyAmount);
  const receiveAtLeastDenominated = toDisplayAmount(buyAsset, minAmount);

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

  const { walletAddress } = useWalletManager(keplr);

  const { error: _err, performSwap } = usePerformOsmosisSwapTx();
  const onSwap = useCallback(async (): Promise<void> => {
    await performSwap({ localRecoveryAddr: walletAddress });
  }, [walletAddress, performSwap]);

  const validationResult = useSwapReviewValidation({
    walletAddress,
    ledgerAccountInfo,
  });

  const onSlippageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === "" || val.match(/^\d{1}(\.\d{0,1})?$/)) {
        setSlippageInput(val);
      }
    },
    []
  );

  useEffect(() => {
    if (!BigNumber(slippageInput).isNaN()) {
      setSlippage(BigNumber(slippageInput).div(100));
    } else {
      setSlippage(null);
    }
  }, [slippageInput]);

  const isProcessing = ["Building", "AwaitingSignature"].includes(status.t);

  // We stop the ledger status check when the transfer is in progress
  useEffect(() => {
    setLedgerStatusStop(["Building", "AwaitingSignature"].includes(status.t));
  }, [status.t]);

  return (
    <>
      <Stack>
        <div className="relative bg-neutral-800 rounded-lg px-4 py-5 border border-yellow font-light">
          <Text className="mt-0">Review Shielded Swap</Text>
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
                {sellAmount.toString()} {sellAsset.symbol}
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
                {buyAmount.toString()} {buyAsset.symbol}
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
              <div className="self-center">Slippage tolerance</div>
              <div className="relative inline-block">
                <input
                  type="text"
                  placeholder={slippage.times(100).toString()}
                  className={clsx(
                    "peer h-full pl-3 pr-4 w-16 placeholder-yellow-600 text-yellow text-right bg-transparent",
                    "outline-none border border-transparent rounded-sm focus:py-2 focus:pr-7 focus:border-yellow transition-all",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                  onChange={onSlippageChange}
                  value={slippageInput}
                  disabled={isProcessing}
                />
                <span
                  className={clsx(
                    "absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none peer-focus:right-3 transition-all",
                    "peer-disabled:opacity-50",
                    { "text-yellow": !!slippageOverride },
                    { "text-yellow-600": !slippageOverride }
                  )}
                >
                  %
                </span>
              </div>
            </ReviewRow>
            <ReviewRow>
              <div>Receive at least</div>
              <div>
                {receiveAtLeastDenominated
                  .decimalPlaces(6, BigNumber.ROUND_DOWN)
                  .toString()}{" "}
                {buyAsset.symbol}
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
        {["Building", "AwaitingSignature", "Broadcasting"].includes(status.t) ?
          <CurrentStatus
            status={statusMessages[status.t].title}
            explanation={statusMessages[status.t].description}
          />
        : <ActionButton
            outlineColor="yellow"
            backgroundColor="transparent"
            backgroundHoverColor="yellow"
            textColor="yellow"
            textHoverColor="black"
            onClick={() => setStatus(SwapStatus.idle())}
          >
            Back
          </ActionButton>
        }
      </Stack>
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
