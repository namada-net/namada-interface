import { ActionButton, Stack, Text } from "@namada/components";
import { CurrentStatus } from "App/Common/CurrentStatus";
import { SwapTradeIcon } from "App/Icons/SwapTradeIcon";
import { tokenPricesFamily } from "atoms/prices/atoms";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { getAssetImageUrl } from "integrations/utils";
import invariant from "invariant";
import { useAtom, useAtomValue } from "jotai";
import { toDisplayAmount } from "utils";
import { statusMessages, SwapStatus } from "./state";
import {
  buyAssetAtom,
  sellAssetAtom,
  swapQuoteAtom,
  swapStateAtom,
  swapStatusAtom,
} from "./state/atoms";
import { SLIPPAGE } from "./state/functions";

export const SwapReview = (): JSX.Element => {
  // Feature state and sanity checks
  const [status, setStatus] = useAtom(swapStatusAtom);
  const swapState = useAtomValue(swapStateAtom);
  const { data: quote } = useAtomValue(swapQuoteAtom);

  const sellAsset = useAtomValue(sellAssetAtom);
  invariant(sellAsset, "Sell asset is required");

  const buyAsset = useAtomValue(buyAssetAtom);
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

  const sellAmountFiat = sellPrice && sellPrice.times(swapState.sellAmount);
  const buyPriceImpact =
    buyPrice && buyPrice.times(BigNumber(1).plus(quote.priceImpact));
  const buyAmountFiat =
    buyPriceImpact && buyPriceImpact.times(swapState.buyAmount);
  const receiveAtLeastDenominated = toDisplayAmount(buyAsset, quote.minAmount);

  // TODO: sucks, move prices to the swapState
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

  return (
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
          <Stack
            direction="horizontal"
            className="justify-between text-neutral-300 text-sm"
          >
            <div>Swap Fee</div>
            <p>
              {fiatFeeDisplay} ({swapFee.toString()}%)
            </p>
          </Stack>
          <Stack
            direction="horizontal"
            className="justify-between text-neutral-300 text-sm"
          >
            <div>Slippage tolerance</div>
            <div>{SLIPPAGE * 100}%</div>
          </Stack>
          <Stack
            direction="horizontal"
            className="justify-between text-neutral-300 text-sm"
          >
            <div>Receive at least</div>
            <div>
              {receiveAtLeastDenominated.toString()} {buyAsset.symbol}
            </div>
          </Stack>
        </Stack>
      </div>

      {![
        SwapStatus.Building,
        SwapStatus.AwaitingSignature,
        SwapStatus.Broadcasting,
      ].includes(status) && (
        <ActionButton
          outlineColor="yellow"
          backgroundColor="yellow"
          backgroundHoverColor="transparent"
          textColor="black"
          textHoverColor="yellow"
          onClick={() => {}}
        >
          Swap
        </ActionButton>
      )}
      {[
        SwapStatus.Building,
        SwapStatus.AwaitingSignature,
        SwapStatus.Broadcasting,
      ].includes(status) && (
        <CurrentStatus
          status={statusMessages[status].title}
          explanation={statusMessages[status].description}
        />
      )}
      {![
        SwapStatus.Building,
        SwapStatus.AwaitingSignature,
        SwapStatus.Broadcasting,
      ].includes(status) && (
        <ActionButton
          outlineColor="yellow"
          backgroundColor="transparent"
          backgroundHoverColor="yellow"
          textColor="yellow"
          textHoverColor="black"
          onClick={() => setStatus(SwapStatus.Idle)}
        >
          Back
        </ActionButton>
      )}
    </Stack>
  );
};
