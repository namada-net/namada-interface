import BigNumber from "bignumber.js";
import { SwapQuote } from "./types";

type SwapResponseCommonOk = {
  route: Array<{
    pools: Array<{
      id: number;
      type: number;
      spread_factor: string;
      token_out_denom: string;
      taker_fee: string;
    }>;
    "has-cw-pool": boolean;
    out_amount: string;
    in_amount: string;
  }>;
  effective_fee: string;
  price_impact: string;
  in_base_out_quote_spot_price: string;
};

type SwapResponseSellOk = SwapResponseCommonOk & {
  amount_in: {
    denom: string;
    amount: string;
  };
  amount_out: string;
};
type SwapResponseBuyOk = SwapResponseCommonOk & {
  amount_in: string;
  amount_out: {
    denom: string;
    amount: string;
  };
};

type SwapResponseOk = SwapResponseSellOk | SwapResponseBuyOk;

type SwapResponseError = {
  message: string;
};

const isSwapResponseOk = (
  response: SwapResponseOk | SwapResponseError
): response is SwapResponseOk => {
  return (response as SwapResponseOk).route !== undefined;
};

const isSwapResponseSellOk = (
  response: SwapResponseOk | SwapResponseError
): response is SwapResponseSellOk => {
  return typeof (response as SwapResponseSellOk).amount_out === "string";
};

export const SLIPPAGE = 0.001;

export type FetchQuoteParams =
  | {
      tokenIn: string;
      tokenOutDenom: string;
    }
  | {
      tokenOut: string;
      tokenInDenom: string;
    };

export const fetchQuote = async (
  params: FetchQuoteParams
): Promise<SwapQuote> => {
  const quote = await fetch(
    "https://sqs.osmosis.zone/router/quote?" +
      new URLSearchParams({
        ...params,
        humanDenoms: "false",
      }).toString()
  );
  const data: SwapResponseOk | SwapResponseError = await quote.json();
  if (isSwapResponseOk(data)) {
    const amount = BigNumber(
      isSwapResponseSellOk(data) ? data.amount_out : data.amount_in
    );
    const amountIn = BigNumber(
      isSwapResponseSellOk(data) ? data.amount_in.amount : data.amount_in
    );
    const amountOut = BigNumber(
      isSwapResponseSellOk(data) ? data.amount_out : data.amount_out.amount
    );

    return {
      amountIn,
      amountOut,
      amount,
      priceImpact: BigNumber(data.price_impact),
      effectiveFee: BigNumber(data.effective_fee),
      routes: data.route.map((hop) => ({
        pools: hop.pools.map((pool) => ({
          poolId: String(pool.id),
          tokenOutDenom: pool.token_out_denom,
        })),
      })),
    };
  } else {
    throw new Error(data.message);
  }
};
