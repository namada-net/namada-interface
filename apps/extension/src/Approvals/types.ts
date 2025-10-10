import * as t from "io-ts";
import { Message } from "router";

export enum TopLevelRoute {
  Default = "/",

  // Connection approval
  ApproveConnection = "/approve-connection",
  ApproveDisconnection = "/approve-disconnection",

  // Update default account approval
  ApproveUpdateDefaultAccount = "/approve-update-default-account",

  // Sign Tx approval
  ApproveSignTx = "/approve-sign-tx",
  ApproveSignTxDetails = "/approve-sign-tx-details",
  ConfirmSignTx = "/confirm-sign-tx",
  ConfirmLedgerTx = "/confirm-ledger-tx",

  // Sign arbitrary approval
  ApproveSignArbitrary = "/approve-sign-arbitrary",
  ApproveSignArbitraryDetails = "/approve-sign-arbitrary-details",
  ConfirmSignArbitrary = "/confirm-sign-arbitrary",
}

export type ApproveMsg = new (
  msgId: string,
  password: string
) => unknown & Message<void>;

export type TransferType =
  | "Transparent"
  | "Shielding"
  | "Shielded"
  | "Unshielding"
  | "IbcUnshieldTransfer"
  | "Unknown";

export enum Status {
  Completed,
  Pending,
  Failed,
}

const NamadaOsmosisSwap = t.type({
  overflow_receiver: t.string,
  shielded_amount: t.string,
  shielding_data: t.string,
});

const FinalMemoNamada = t.type({
  osmosis_swap: NamadaOsmosisSwap,
});

const FinalMemo = t.type({
  namada: FinalMemoNamada,
});

const OnFailedDelivery = t.type({
  local_recovery_addr: t.string,
});

const RouteItem = t.type({
  pool_id: t.string,
  token_out_denom: t.string,
});

const Slippage = t.type({
  min_output_amount: t.string,
});

const OsmosisSwapMsg = t.type({
  final_memo: FinalMemo,
  on_failed_delivery: OnFailedDelivery,
  output_denom: t.string,
  receiver: t.string,
  route: t.array(RouteItem),
  slippage: Slippage,
});

const Msg = t.type({
  osmosis_swap: OsmosisSwapMsg,
});

const Wasm = t.type({
  contract: t.string,
  msg: Msg,
});

export const OsmosisSwapMemo = t.type({
  wasm: Wasm,
});

export type NamadaOsmosisSwap = t.TypeOf<typeof NamadaOsmosisSwap>;
export type FinalMemoNamada = t.TypeOf<typeof FinalMemoNamada>;
export type FinalMemo = t.TypeOf<typeof FinalMemo>;
export type OnFailedDelivery = t.TypeOf<typeof OnFailedDelivery>;
export type RouteItem = t.TypeOf<typeof RouteItem>;
export type Slippage = t.TypeOf<typeof Slippage>;
export type OsmosisSwapMsg = t.TypeOf<typeof OsmosisSwapMsg>;
export type Msg = t.TypeOf<typeof Msg>;
export type Wasm = t.TypeOf<typeof Wasm>;
export type OsmosisSwapMemo = t.TypeOf<typeof OsmosisSwapMemo>;
