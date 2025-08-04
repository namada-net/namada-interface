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
