export * from "./batchTxResult";
export * from "./bond";
export * from "./bparams";
export * from "./claimRewards";
export * from "./ethBridgeTransfer";
export * from "./ibcTransfer";
export * from "./osmosisSwap";
export * from "./redelegate";
export * from "./revealPk";
export * from "./signature";
export * from "./transfer";
export * from "./tx";
export * from "./txDetails";
export * from "./txResponse";
export * from "./unbond";
export * from "./utils";
export * from "./voteProposal";
export * from "./withdraw";
export * from "./wrapperTx";

import { BatchTxResultMsgValue } from "./batchTxResult";
import { BondMsgValue } from "./bond";
import { ClaimRewardsMsgValue } from "./claimRewards";
import { EthBridgeTransferMsgValue } from "./ethBridgeTransfer";
import { IbcTransferMsgValue } from "./ibcTransfer";
import { OsmosisSwapMsgValue } from "./osmosisSwap";
import { RedelegateMsgValue } from "./redelegate";
import { RevealPkMsgValue } from "./revealPk";
import { SignatureMsgValue } from "./signature";
import {
  ShieldedTransferDataMsgValue,
  ShieldedTransferMsgValue,
  ShieldingTransferDataMsgValue,
  ShieldingTransferMsgValue,
  TransferDataMsgValue,
  TransferDetailsMsgValue,
  TransferMsgValue,
  TransparentTransferDataMsgValue,
  TransparentTransferMsgValue,
  UnshieldingTransferDataMsgValue,
  UnshieldingTransferMsgValue,
} from "./transfer";
import { SigningDataMsgValue, TxMsgValue } from "./tx";
import { CommitmentMsgValue, TxDetailsMsgValue } from "./txDetails";
import { TxResponseMsgValue } from "./txResponse";
import { UnbondMsgValue } from "./unbond";
import { VoteProposalMsgValue } from "./voteProposal";
import { WithdrawMsgValue } from "./withdraw";
import { WrapperTxMsgValue } from "./wrapperTx";

export type Schema =
  | BatchTxResultMsgValue
  | EthBridgeTransferMsgValue
  | IbcTransferMsgValue
  | OsmosisSwapMsgValue
  | SignatureMsgValue
  | BondMsgValue
  | UnbondMsgValue
  | VoteProposalMsgValue
  | ClaimRewardsMsgValue
  | WithdrawMsgValue
  | ShieldedTransferMsgValue
  | ShieldedTransferDataMsgValue
  | ShieldingTransferMsgValue
  | ShieldingTransferDataMsgValue
  | SigningDataMsgValue
  | TransferMsgValue
  | TransferDetailsMsgValue
  | TransferDataMsgValue
  | TransparentTransferMsgValue
  | TransparentTransferDataMsgValue
  | TxMsgValue
  | TxResponseMsgValue
  | UnshieldingTransferDataMsgValue
  | UnshieldingTransferMsgValue
  | WrapperTxMsgValue
  | RedelegateMsgValue
  | CommitmentMsgValue
  | TxDetailsMsgValue
  | RevealPkMsgValue;
