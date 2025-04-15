import { BatchTxResultMsgValue, BondMsgValue, ClaimRewardsMsgValue, EthBridgeTransferMsgValue, IbcTransferMsgValue, MaspTxIn, MaspTxOut, RedelegateMsgValue, ShieldedTransferDataMsgValue, ShieldedTransferMsgValue, ShieldingTransferDataMsgValue, ShieldingTransferMsgValue, SignatureMsgValue, SigningDataMsgValue, TransferDetailsMsgValue, TransferMsgValue, TransparentTransferDataMsgValue, TransparentTransferMsgValue, TxMsgValue, TxResponseMsgValue, UnbondMsgValue, UnshieldingTransferDataMsgValue, UnshieldingTransferMsgValue, VoteProposalMsgValue, WithdrawMsgValue, WrapperTxMsgValue } from "./schema";
import { OsmosisSwapMsgValue } from "./schema/osmosisSwap";
import { RevealPkMsgValue } from "./schema/revealPk";
export type BatchTxResultProps = BatchTxResultMsgValue;
export type BondProps = BondMsgValue;
export type EthBridgeTransferProps = EthBridgeTransferMsgValue;
export type IbcTransferProps = IbcTransferMsgValue;
export type RedelegateProps = RedelegateMsgValue;
export type SignatureProps = SignatureMsgValue;
export type ShieldedTransferProps = ShieldedTransferMsgValue;
export type ShieldedTransferDataProps = ShieldedTransferDataMsgValue;
export type ShieldingTransferProps = ShieldingTransferMsgValue;
export type ShieldingTransferDataProps = ShieldingTransferDataMsgValue;
export type UnshieldingTransferDataProps = UnshieldingTransferDataMsgValue;
export type UnshieldingTransferProps = UnshieldingTransferMsgValue;
export type TransferProps = TransferMsgValue;
export type MaspTxInProps = MaspTxIn;
export type MaspTxOutProps = MaspTxOut;
export type TransferDetailsProps = TransferDetailsMsgValue;
export type TransparentTransferProps = TransparentTransferMsgValue;
export type TransparentTransferDataProps = TransparentTransferDataMsgValue;
export type TxProps = TxMsgValue;
export type TxResponseProps = TxResponseMsgValue;
export type SigningDataProps = SigningDataMsgValue;
export type UnbondProps = UnbondMsgValue;
export type VoteProposalProps = VoteProposalMsgValue;
export type ClaimRewardsProps = ClaimRewardsMsgValue;
export type WithdrawProps = WithdrawMsgValue;
export type WrapperTxProps = WrapperTxMsgValue;
export type RevealPkProps = RevealPkMsgValue;
export type OsmosisSwapProps = OsmosisSwapMsgValue;
export type SupportedTxProps = BondProps | UnbondProps | WithdrawProps | RedelegateProps | EthBridgeTransferProps | IbcTransferProps | VoteProposalProps | ClaimRewardsProps | TransferProps | TransferDetailsProps | RevealPkProps | OsmosisSwapProps;
export type CommitmentDetailProps<T extends SupportedTxProps | unknown = unknown> = T & {
    txType: unknown;
    hash: string;
    memo?: string;
    maspTxIn?: MaspTxIn[];
    maspTxOut?: MaspTxOut[];
};
export type TxDetails = WrapperTxProps & {
    commitments: CommitmentDetailProps[];
    wrapperFeePayer: string;
};
export declare enum ResultCode {
    Ok = 0,
    WasmRuntimeError = 1,
    InvalidTx = 2,
    InvalidSig = 3,
    AllocationError = 4,
    ReplayTx = 5,
    InvalidChainId = 6,
    ExpiredTx = 7,
    TxGasLimit = 8,
    FeeError = 9,
    InvalidVoteExtension = 10,
    TooLarge = 11,
    TxNotAllowlisted = 12
}
export declare const ResultCodes: Record<ResultCode, string>;
