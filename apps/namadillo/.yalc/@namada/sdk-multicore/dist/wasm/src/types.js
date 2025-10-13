import { TxType } from "./sdk/sdk";
export const TxTypeLabel = {
    [TxType.Bond]: "Bond",
    [TxType.Unbond]: "Unbond",
    [TxType.Withdraw]: "Withdraw",
    [TxType.Transfer]: "Transfer",
    [TxType.IBCTransfer]: "IBC Transfer",
    [TxType.EthBridgeTransfer]: "Add to Eth Bridge Pool",
    [TxType.RevealPK]: "RevealPK",
    [TxType.VoteProposal]: "Vote Proposal",
    [TxType.ClaimRewards]: "Claim Rewards",
    [TxType.Redelegate]: "Redelegate",
    [TxType.Batch]: "Batch",
};
