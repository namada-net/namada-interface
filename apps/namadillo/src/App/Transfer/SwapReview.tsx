import { ActionButton, Stack, Text } from "@namada/components";
import { SwapTradeIcon } from "App/Icons/SwapTradeIcon";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { getAssetImageUrl } from "integrations/utils";
import { NamadaAsset } from "types";
import { toDisplayAmount } from "utils";

type SwapReviewProps = {
  onSubmitSwap: () => Promise<void>;
  sourceAmount: BigNumber;
  targetAmount: BigNumber;
  assetSell: NamadaAsset;
  assetBuy: NamadaAsset;
  tokenPrices: Record<string, BigNumber>;
  priceImpact: BigNumber;
  swapFee: BigNumber;
  slippageTolerance: number;
  receiveAtLeast: BigNumber;
};
export const SwapReview = ({
  onSubmitSwap,
  sourceAmount,
  targetAmount,
  assetSell,
  assetBuy,
  tokenPrices,
  priceImpact,
  swapFee: effectiveFee,
  slippageTolerance,
  receiveAtLeast,
}: SwapReviewProps): JSX.Element => {
  const sourceAmountFiat = tokenPrices[assetSell.address].times(sourceAmount);
  const targetPrice = tokenPrices[assetBuy.address];
  const targetPriceImpact = targetPrice.times(BigNumber(1).plus(priceImpact));
  const targetAmountFiat = targetPriceImpact.times(targetAmount);
  const receiveAtLeastDenominated = toDisplayAmount(assetBuy, receiveAtLeast);

  // TODO:  reused
  const swapFee = effectiveFee
    ?.times(100)
    .decimalPlaces(2, BigNumber.ROUND_HALF_UP);
  const fiatFee = targetPrice
    ?.times(targetPriceImpact)
    .times(effectiveFee || 0)
    .decimalPlaces(3);
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
              alt={`${assetSell.name} image`}
              src={getAssetImageUrl(assetSell)}
            />
          </span>
          <Stack gap={0} className="justify-center grow">
            <Text className="text-sm my-0">Sell</Text>
            <Text className="text-lg my-0">
              {sourceAmount.toString()} {assetSell.symbol}
            </Text>
          </Stack>
          <Text className="my-0 mb-2 self-end">
            ${sourceAmountFiat.decimalPlaces(2).toString()}
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
              alt={`${assetBuy.name} image`}
              src={getAssetImageUrl(assetBuy)}
            />
          </span>
          <Stack gap={0} className="justify-center grow">
            <Text className="text-sm my-0">Buy</Text>
            <Text className="text-lg my-0">
              {targetAmount.toString()} {assetBuy.symbol}
            </Text>
          </Stack>
          <Text className="my-0 mb-2 self-end">
            ${targetAmountFiat.decimalPlaces(2).toString()}
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
            <div>{slippageTolerance * 100}%</div>
          </Stack>
          <Stack
            direction="horizontal"
            className="justify-between text-neutral-300 text-sm"
          >
            <div>Receive at least</div>
            <div>
              {receiveAtLeastDenominated.toString()} {assetBuy.symbol}
            </div>
          </Stack>
        </Stack>
      </div>

      <ActionButton
        outlineColor="yellow"
        backgroundColor="yellow"
        backgroundHoverColor="transparent"
        textColor="black"
        textHoverColor="yellow"
        onClick={onSubmitSwap}
      >
        Swap
      </ActionButton>
    </Stack>
  );
};
