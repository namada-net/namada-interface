export type SwapResponseOk = {
  amount_in: {
    denom: string;
    amount: string;
  };
  amount_out: string;
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
export type SwapResponseError = {
  message: string;
};

export type SwapResponse = SwapResponseOk | SwapResponseError;
