import {
  BondProps,
  ClaimRewardsProps,
  RedelegateProps,
  TxProps,
  UnbondProps,
  VoteProposalProps,
  WithdrawProps,
} from "@namada/types";
import { TransferTransactionData } from "types";
import { TxKind } from "types/txKind";

export type TransactionEventsClasses = Partial<TxKind>;
export type TransactionEventTypes = TxKind | TxKind[];
export type TransactionEventsStatus =
  | "Pending"
  | "Error"
  | "Success"
  | "PartialSuccess";

export type TransactionEvent =
  `${TransactionEventsClasses}.${TransactionEventsStatus}`;

export type TransactionEventHandlers = {
  onError?: TransactionEvent;
  onSuccess?: TransactionEvent;
  onPending?: TransactionEvent;
};

export interface EventData<T> extends CustomEvent {
  detail: {
    tx: TxProps[];
    data: T[];
    // If event is for PartialSuccess, use the following:
    successData?: T[];
    failedData?: { value: T; error?: string }[];
    error?: Error;
  };
}

declare global {
  interface WindowEventMap {
    "Bond.Success": EventData<BondProps>;
    "Bond.PartialSuccess": EventData<BondProps>;
    "Bond.Error": EventData<BondProps>;
    "Unbond.Success": EventData<UnbondProps>;
    "Unbond.PartialSuccess": EventData<UnbondProps>;
    "Unbond.Error": EventData<UnbondProps>;
    "Redelegate.Success": EventData<RedelegateProps>;
    "Redelegate.PartialSuccess": EventData<RedelegateProps>;
    "Redelegate.Error": EventData<RedelegateProps>;
    "Withdraw.Success": EventData<WithdrawProps>;
    "Withdraw.Error": EventData<WithdrawProps>;
    "ClaimRewards.Success": EventData<ClaimRewardsProps>;
    "ClaimRewards.PartialSuccess": EventData<ClaimRewardsProps>;
    "ClaimRewards.Error": EventData<ClaimRewardsProps>;
    "VoteProposal.Success": EventData<VoteProposalProps>;
    "VoteProposal.Error": EventData<VoteProposalProps>;
    "TransparentTransfer.Success": CustomEvent<TransferTransactionData>;
    "TransparentTransfer.Error": CustomEvent<TransferTransactionData>;
    "ShieldedTransfer.Success": CustomEvent<TransferTransactionData>;
    "ShieldedTransfer.Error": CustomEvent<TransferTransactionData>;
    "ShieldingTransfer.Success": CustomEvent<TransferTransactionData>;
    "ShieldingTransfer.Error": CustomEvent<TransferTransactionData>;
    "UnshieldingTransfer.Success": CustomEvent<TransferTransactionData>;
    "UnshieldingTransfer.Error": CustomEvent<TransferTransactionData>;
    "IbcTransfer.Success": CustomEvent<TransferTransactionData>;
    "IbcTransfer.Error": CustomEvent<TransferTransactionData>;
    "IbcWithdraw.Success": CustomEvent<TransferTransactionData>;
    "IbcWithdraw.Error": CustomEvent<TransferTransactionData>;
    "ShieldedIbcWithdraw.Success": CustomEvent<TransferTransactionData>;
    "ShieldedIbcWithdraw.Error": CustomEvent<TransferTransactionData>;
  }
}
