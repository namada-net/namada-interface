import { Sdk as SdkWasm } from "../../../wasm/src";
import { BondProps, ClaimRewardsProps, EthBridgeTransferProps, IbcTransferProps, OsmosisSwapProps, RedelegateProps, ShieldedTransferProps, ShieldingTransferProps, TransparentTransferProps, TxDetails, TxMsgValue, TxProps, UnbondProps, UnshieldingTransferProps, VoteProposalProps, WithdrawProps, WrapperTxProps } from "../types";
import { ResponseSign } from "@zondax/ledger-namada";
import BigNumber from "bignumber.js";
/**
 * SDK functionality related to transactions
 */
export declare class Tx {
    protected readonly sdk: SdkWasm;
    /**
     * @param sdk - Instance of Sdk struct from wasm lib
     */
    constructor(sdk: SdkWasm);
    /**
     * Build Transparent Transfer Tx
     * @async
     * @param wrapperTxProps - properties of the transaction
     * @param transferProps -  properties of the transfer
     * @returns promise that resolves to an TxMsgValue
     */
    buildTransparentTransfer(wrapperTxProps: WrapperTxProps, transferProps: TransparentTransferProps): Promise<TxMsgValue>;
    /**
     * Build Shielded Transfer Tx
     * @async
     * @param wrapperTxProps - properties of the transaction
     * @param shieldedTransferProps -  properties of the shielded transfer
     * @returns promise that resolves to an TxMsgValue
     */
    buildShieldedTransfer(wrapperTxProps: WrapperTxProps, shieldedTransferProps: ShieldedTransferProps): Promise<TxMsgValue>;
    /**
     * Build Shielding Transfer Tx
     * @async
     * @param wrapperTxProps - properties of the transaction
     * @param shieldingTransferProps -  properties of the shielding transfer
     * @returns promise that resolves to an TxMsgValue
     */
    buildShieldingTransfer(wrapperTxProps: WrapperTxProps, shieldingTransferProps: ShieldingTransferProps): Promise<TxMsgValue>;
    /**
     * Build Unshielding Transfer Tx
     * @async
     * @param wrapperTxProps - properties of the transaction
     * @param unshieldingTransferProps -  properties of the unshielding transfer
     * @returns promise that resolves to an TxMsgValue
     */
    buildUnshieldingTransfer(wrapperTxProps: WrapperTxProps, unshieldingTransferProps: UnshieldingTransferProps): Promise<TxMsgValue>;
    /**
     * Build RevealPK Tx
     * @async
     * @param wrapperTxProps - properties of the transaction
     * @returns promise that resolves to an TxMsgValue
     */
    buildRevealPk(wrapperTxProps: WrapperTxProps): Promise<TxMsgValue>;
    /**
     * Build Bond Tx
     * @async
     * @param wrapperTxProps - properties of the transaction
     * @param bondProps -  properties of the bond tx
     * @returns promise that resolves to an TxMsgValue
     */
    buildBond(wrapperTxProps: WrapperTxProps, bondProps: BondProps): Promise<TxMsgValue>;
    /**
     * Build Unbond Tx
     * @async
     * @param wrapperTxProps - properties of the transaction
     * @param unbondProps - properties of the unbond tx
     * @returns promise that resolves to an TxMsgValue
     */
    buildUnbond(wrapperTxProps: WrapperTxProps, unbondProps: UnbondProps): Promise<TxMsgValue>;
    /**
     * Build Withdraw Tx
     * @async
     * @param wrapperTxProps - properties of the transaction
     * @param withdrawProps - properties of the withdraw tx
     * @returns promise that resolves to an TxMsgValue
     */
    buildWithdraw(wrapperTxProps: WrapperTxProps, withdrawProps: WithdrawProps): Promise<TxMsgValue>;
    /**
     * Build Redelegate Tx
     * @async
     * @param wrapperTxProps - properties of the transaction
     * @param redelegateProps -  properties of the redelegate tx
     * @returns promise that resolves to an TxMsgValue
     */
    buildRedelegate(wrapperTxProps: WrapperTxProps, redelegateProps: RedelegateProps): Promise<TxMsgValue>;
    /**
     * Build Ibc Transfer Tx
     * `ibcTransferProps.amountInBaseDenom` is the amount in the **base** denom
     * e.g. the value of 1 NAM should be BigNumber(1_000_000), not BigNumber(1).
     * @async
     * @param wrapperTxProps - properties of the transaction
     * @param ibcTransferProps - properties of the ibc transfer tx
     * @returns promise that resolves to an TxMsgValue
     */
    buildIbcTransfer(wrapperTxProps: WrapperTxProps, ibcTransferProps: IbcTransferProps): Promise<TxMsgValue>;
    /**
     * Build Ethereum Bridge Transfer Tx
     * @async
     * @param wrapperTxProps - properties of the transaction
     * @param ethBridgeTransferProps - properties of the eth bridge transfer tx
     * @returns promise that resolves to an TxMsgValue
     */
    buildEthBridgeTransfer(wrapperTxProps: WrapperTxProps, ethBridgeTransferProps: EthBridgeTransferProps): Promise<TxMsgValue>;
    /**
     * Build Vote Proposal Tx
     * @async
     * @param wrapperTxProps - properties of the transaction
     * @param voteProposalProps - properties of the vote proposal tx
     * @returns promise that resolves to an TxMsgValue
     */
    buildVoteProposal(wrapperTxProps: WrapperTxProps, voteProposalProps: VoteProposalProps): Promise<TxMsgValue>;
    /**
     * Build Claim Rewards Tx
     * @async
     * @param wrapperTxProps - properties of the transaction
     * @param claimRewardsProps - properties of the claim rewards tx
     * @returns promise that resolves to an TxMsgValue
     */
    buildClaimRewards(wrapperTxProps: WrapperTxProps, claimRewardsProps: ClaimRewardsProps): Promise<TxMsgValue>;
    /**
     * Build a batched transaction
     * @param txs - array of TxProp
     * @returns a serialized TxMsgValue type
     */
    buildBatch(txs: TxProps[]): TxProps;
    /**
     * Append signature for transactions signed by Ledger Hardware Wallet
     * @param txBytes - bytes of the transaction
     * @param signingData - signing data
     * @param signatures - masp signature
     * @returns transaction bytes with signature appended
     */
    appendMaspSignatures(txBytes: Uint8Array, signingData: Uint8Array[], signatures: Uint8Array[]): Uint8Array;
    /**
     * Append signature for transactions signed by Ledger Hardware Wallet
     * @param txBytes - Serialized transaction
     * @param ledgerSignatureResponse - Serialized signature as returned from Ledger
     * @returns - Serialized Tx bytes with signature appended
     */
    appendSignature(txBytes: Uint8Array, ledgerSignatureResponse: ResponseSign): Uint8Array;
    /**
     * Helper to encode Tx args given TxProps
     * @param wrapperTxProps - properties of the transaction
     * @returns Serialized WrapperTxMsgValue
     */
    encodeTxArgs(wrapperTxProps: WrapperTxProps): Uint8Array;
    /**
     * Method to retrieve JSON strings for all commitments of a Tx
     * @param txBytes - Bytes of a transaction
     * @param checksums - Record of paths mapped to their respective hashes
     * @returns a TxDetails object
     */
    deserialize(txBytes: Uint8Array, checksums: Record<string, string>): TxDetails;
    /**
     * Generate the memo needed for performing an IBC transfer to a Namada shielded
     * address.
     * @async
     * @param target - the Namada shielded address to send tokens to
     * @param token - the token to transfer
     * @param amount - the amount to transfer
     * @param channelId - the IBC channel ID on the Namada side
     * @returns promise that resolves to the shielding memo
     */
    generateIbcShieldingMemo(target: string, token: string, amount: BigNumber, channelId: string): Promise<string>;
    /**
     * Build Osmosis Swap Tx
     * `osmosisSwapProps.transfer.amountInBaseDenom` is the amount in the **base** denom
     * e.g. the value of 1 NAM should be BigNumber(1_000_000), not BigNumber(1).
     * @async
     * @param wrapperTxProps - properties of the transaction
     * @param osmosisSwapProps - properties of the osmosis swap tx
     * @returns promise that resolves to an TxMsgValue
     */
    buildOsmosisSwap(wrapperTxProps: WrapperTxProps, osmosisSwapProps: OsmosisSwapProps): Promise<TxMsgValue>;
    /**
     * Return the inner tx hashes from the provided tx bytes
     * @param bytes - Uint8Array
     * @returns array of tuple of [inner Tx hashes, utf8 bytes memo]
     */
    getInnerTxMeta(bytes: Uint8Array): [string, number[] | null][];
}
