import { ActionButton, Stack, Text } from "@namada/components";
import { CurrentStatus } from "App/Common/CurrentStatus";
import { InlineError } from "App/Common/InlineError";
import { SwapTradeIcon } from "App/Icons/SwapTradeIcon";
import { getChainRegistryByChainName } from "atoms/integrations";
import { tokenPricesFamily } from "atoms/prices/atoms";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { KeplrWalletManager } from "integrations/Keplr";
import { getAssetImageUrl } from "integrations/utils";
import invariant from "invariant";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { ChainRegistryEntry } from "types";
import { toDisplayAmount } from "utils";
import { usePerformOsmosisSwapTx } from "./hooks/usePerformOsmosisSwapTx";
import { statusMessages, SwapStatus } from "./state";
import {
  buyAssetAtom,
  sellAssetAtom,
  swapQuoteAtom,
  swapStateAtom,
  swapStatusAtom,
} from "./state/atoms";
import { SLIPPAGE } from "./state/functions";

const keplr = new KeplrWalletManager();
export const SwapReview = (): JSX.Element => {
  const [keplrRecoveryAddr, setKeplrRecoveryAddr] = useState<string>();
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

  //TODO:  Should take housefire into consideration
  useEffect(() => {
    const registry = getChainRegistryByChainName("osmosis");
    const fn = async (registry: ChainRegistryEntry): Promise<void> => {
      await keplr.connect(registry);
      const addr = await keplr.getAddress(registry.chain.chain_id);
      setKeplrRecoveryAddr(addr);
    };

    if (registry) {
      fn(registry);
    }
  }, []);

  const { error: _err, performSwap } = usePerformOsmosisSwapTx();

  const onSwap = useCallback(async (): Promise<void> => {
    await performSwap({ localRecoveryAddr: keplrRecoveryAddr });
  }, [keplrRecoveryAddr]);

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
      {status.t === "Error" && <InlineError errorMessage={status.message} />}
      {!["Building", "AwaitingSignature", "Broadcasting"].includes(
        status.t
      ) && (
        <ActionButton
          outlineColor="yellow"
          backgroundColor="yellow"
          backgroundHoverColor="transparent"
          textColor="black"
          textHoverColor="yellow"
          onClick={onSwap}
        >
          Swap
        </ActionButton>
      )}
      {["Building", "AwaitingSignature", "Broadcasting"].includes(status.t) && (
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
  );
};
