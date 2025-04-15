import { TxType } from "./sdk/sdk";
export type SupportedTx = Extract<TxType, TxType.Bond | TxType.Unbond | TxType.Transfer | TxType.IBCTransfer | TxType.EthBridgeTransfer | TxType.Withdraw | TxType.VoteProposal | TxType.Redelegate>;
export type TxLabel = "Bond" | "Unbond" | "Transfer" | "IBC Transfer" | "Add to Eth Bridge Pool" | "Withdraw" | "RevealPK" | "Vote Proposal" | "Claim Rewards" | "Redelegate" | "Batch";
export declare const TxTypeLabel: Record<TxType, TxLabel>;
type TransferToEthereumKind = "Erc20" | "Nut";
export type TransferToEthereum = {
    kind: TransferToEthereumKind;
    asset: string;
    recipient: string;
    sender: string;
    amount: string;
};
export {};
