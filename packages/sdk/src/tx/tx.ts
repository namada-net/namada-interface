import { deserialize } from "@dao-xyz/borsh";
import {
  Sdk as SdkWasm,
  TxType,
  deserialize_tx,
  get_inner_tx_hashes,
} from "@namada/shared";
import {
  BondMsgValue,
  BondProps,
  ClaimRewardsMsgValue,
  ClaimRewardsProps,
  EthBridgeTransferMsgValue,
  EthBridgeTransferProps,
  IbcTransferMsgValue,
  IbcTransferProps,
  Message,
  RedelegateMsgValue,
  RedelegateProps,
  RevealPkMsgValue,
  ShieldedTransferMsgValue,
  ShieldedTransferProps,
  ShieldingTransferMsgValue,
  ShieldingTransferProps,
  SignatureMsgValue,
  SupportedTxProps,
  TransferDetailsMsgValue,
  TransparentTransferMsgValue,
  TransparentTransferProps,
  TxDetails,
  TxDetailsMsgValue,
  TxMsgValue,
  TxProps,
  UnbondMsgValue,
  UnbondProps,
  UnshieldingTransferMsgValue,
  UnshieldingTransferProps,
  VoteProposalMsgValue,
  VoteProposalProps,
  WithdrawMsgValue,
  WithdrawProps,
  WrapperTxMsgValue,
  WrapperTxProps,
} from "@namada/types";
import { ResponseSign } from "@zondax/ledger-namada";
import BigNumber from "bignumber.js";
import { WasmHash } from "../rpc";

/**
 * SDK functionality related to transactions
 */
export class Tx {
  /**
   * @param sdk - Instance of Sdk struct from wasm lib
   */
  constructor(protected readonly sdk: SdkWasm) {}

  /**
   * Build Transparent Transfer Tx
   * @async
   * @param wrapperTxProps - properties of the transaction
   * @param transferProps -  properties of the transfer
   * @returns promise that resolves to an TxMsgValue
   */
  async buildTransparentTransfer(
    wrapperTxProps: WrapperTxProps,
    transferProps: TransparentTransferProps
  ): Promise<TxMsgValue> {
    const transferMsg = new Message<TransparentTransferMsgValue>();

    const encodedWrapperArgs = this.encodeTxArgs(wrapperTxProps);
    const encodedTransfer = transferMsg.encode(
      new TransparentTransferMsgValue(transferProps)
    );

    const serializedTx = await this.sdk.build_transparent_transfer(
      encodedTransfer,
      encodedWrapperArgs
    );
    return deserialize(Buffer.from(serializedTx), TxMsgValue);
  }

  /**
   * Build Shielded Transfer Tx
   * @async
   * @param wrapperTxProps - properties of the transaction
   * @param shieldedTransferProps -  properties of the shielded transfer
   * @returns promise that resolves to an TxMsgValue
   */
  async buildShieldedTransfer(
    wrapperTxProps: WrapperTxProps,
    shieldedTransferProps: ShieldedTransferProps
  ): Promise<TxMsgValue> {
    const shieldedTransferMsg = new Message<ShieldedTransferMsgValue>();

    const encodedWrapperArgs = this.encodeTxArgs(wrapperTxProps);
    const encodedTransfer = shieldedTransferMsg.encode(
      new ShieldedTransferMsgValue(shieldedTransferProps)
    );

    const serializedTx = await this.sdk.build_shielded_transfer(
      encodedTransfer,
      encodedWrapperArgs
    );
    return deserialize(Buffer.from(serializedTx), TxMsgValue);
  }

  /**
   * Build Shielding Transfer Tx
   * @async
   * @param wrapperTxProps - properties of the transaction
   * @param shieldingTransferProps -  properties of the shielding transfer
   * @returns promise that resolves to an TxMsgValue
   */
  async buildShieldingTransfer(
    wrapperTxProps: WrapperTxProps,
    shieldingTransferProps: ShieldingTransferProps
  ): Promise<TxMsgValue> {
    const shieldingTransferMsg = new Message<ShieldingTransferMsgValue>();

    const encodedWrapperArgs = this.encodeTxArgs(wrapperTxProps);

    const encodedTransfer = shieldingTransferMsg.encode(
      new ShieldingTransferMsgValue(shieldingTransferProps)
    );

    const serializedTx = await this.sdk.build_shielding_transfer(
      encodedTransfer,
      encodedWrapperArgs
    );
    return deserialize(Buffer.from(serializedTx), TxMsgValue);
  }

  /**
   * Build Unshielding Transfer Tx
   * @async
   * @param wrapperTxProps - properties of the transaction
   * @param unshieldingTransferProps -  properties of the unshielding transfer
   * @returns promise that resolves to an TxMsgValue
   */
  async buildUnshieldingTransfer(
    wrapperTxProps: WrapperTxProps,
    unshieldingTransferProps: UnshieldingTransferProps
  ): Promise<TxMsgValue> {
    const shieldingTransferMsg = new Message<UnshieldingTransferMsgValue>();

    const encodedWrapperArgs = this.encodeTxArgs(wrapperTxProps);
    const encodedTransfer = shieldingTransferMsg.encode(
      new UnshieldingTransferMsgValue(unshieldingTransferProps)
    );

    const serializedTx = await this.sdk.build_unshielding_transfer(
      encodedTransfer,
      encodedWrapperArgs,
      unshieldingTransferProps.skipFeeCheck || false
    );
    return deserialize(Buffer.from(serializedTx), TxMsgValue);
  }

  /**
   * Build RevealPK Tx
   * @async
   * @param wrapperTxProps - properties of the transaction
   * @returns promise that resolves to an TxMsgValue
   */
  async buildRevealPk(wrapperTxProps: WrapperTxProps): Promise<TxMsgValue> {
    const encodedWrapperArgs = this.encodeTxArgs(wrapperTxProps);
    const serializedTx = await this.sdk.build_reveal_pk(encodedWrapperArgs);
    return deserialize(Buffer.from(serializedTx), TxMsgValue);
  }

  /**
   * Build Bond Tx
   * @async
   * @param wrapperTxProps - properties of the transaction
   * @param bondProps -  properties of the bond tx
   * @returns promise that resolves to an TxMsgValue
   */
  async buildBond(
    wrapperTxProps: WrapperTxProps,
    bondProps: BondProps
  ): Promise<TxMsgValue> {
    const bondMsg = new Message<BondMsgValue>();
    const encodedWrapperArgs = this.encodeTxArgs(wrapperTxProps);
    const encodedBond = bondMsg.encode(new BondMsgValue(bondProps));
    const serializedTx = await this.sdk.build_bond(
      encodedBond,
      encodedWrapperArgs
    );
    return deserialize(Buffer.from(serializedTx), TxMsgValue);
  }

  /**
   * Build Unbond Tx
   * @async
   * @param wrapperTxProps - properties of the transaction
   * @param unbondProps - properties of the unbond tx
   * @returns promise that resolves to an TxMsgValue
   */
  async buildUnbond(
    wrapperTxProps: WrapperTxProps,
    unbondProps: UnbondProps
  ): Promise<TxMsgValue> {
    const unbondMsg = new Message<UnbondMsgValue>();
    const encodedWrapperArgs = this.encodeTxArgs(wrapperTxProps);
    const encodedUnbond = unbondMsg.encode(new UnbondMsgValue(unbondProps));

    const serializedTx = await this.sdk.build_unbond(
      encodedUnbond,
      encodedWrapperArgs
    );
    return deserialize(Buffer.from(serializedTx), TxMsgValue);
  }

  /**
   * Build Withdraw Tx
   * @async
   * @param wrapperTxProps - properties of the transaction
   * @param withdrawProps - properties of the withdraw tx
   * @returns promise that resolves to an TxMsgValue
   */
  async buildWithdraw(
    wrapperTxProps: WrapperTxProps,
    withdrawProps: WithdrawProps
  ): Promise<TxMsgValue> {
    const bondMsg = new Message<WithdrawProps>();
    const encodedWrapperArgs = this.encodeTxArgs(wrapperTxProps);
    const encodedWithdraw = bondMsg.encode(new WithdrawMsgValue(withdrawProps));
    const serializedTx = await this.sdk.build_withdraw(
      encodedWithdraw,
      encodedWrapperArgs
    );
    return deserialize(Buffer.from(serializedTx), TxMsgValue);
  }

  /**
   * Build Redelegate Tx
   * @async
   * @param wrapperTxProps - properties of the transaction
   * @param redelegateProps -  properties of the redelegate tx
   * @returns promise that resolves to an TxMsgValue
   */
  async buildRedelegate(
    wrapperTxProps: WrapperTxProps,
    redelegateProps: RedelegateProps
  ): Promise<TxMsgValue> {
    const redelegateMsg = new Message<RedelegateMsgValue>();
    const encodedWrapperArgs = this.encodeTxArgs(wrapperTxProps);
    const encodedRedelegate = redelegateMsg.encode(
      new RedelegateMsgValue(redelegateProps)
    );
    const serializedTx = await this.sdk.build_redelegate(
      encodedRedelegate,
      encodedWrapperArgs
    );
    return deserialize(Buffer.from(serializedTx), TxMsgValue);
  }

  /**
   * Build Ibc Transfer Tx
   * `ibcTransferProps.amountInBaseDenom` is the amount in the **base** denom
   * e.g. the value of 1 NAM should be BigNumber(1_000_000), not BigNumber(1).
   * @async
   * @param wrapperTxProps - properties of the transaction
   * @param ibcTransferProps - properties of the ibc transfer tx
   * @returns promise that resolves to an TxMsgValue
   */
  async buildIbcTransfer(
    wrapperTxProps: WrapperTxProps,
    ibcTransferProps: IbcTransferProps
  ): Promise<TxMsgValue> {
    const ibcTransferMsg = new Message<IbcTransferProps>();
    const encodedWrapperArgs = this.encodeTxArgs(wrapperTxProps);
    const encodedIbcTransfer = ibcTransferMsg.encode(
      new IbcTransferMsgValue(ibcTransferProps)
    );
    const serializedTx = await this.sdk.build_ibc_transfer(
      encodedIbcTransfer,
      encodedWrapperArgs
    );
    return deserialize(Buffer.from(serializedTx), TxMsgValue);
  }

  /**
   * Build Ethereum Bridge Transfer Tx
   * @async
   * @param wrapperTxProps - properties of the transaction
   * @param ethBridgeTransferProps - properties of the eth bridge transfer tx
   * @returns promise that resolves to an TxMsgValue
   */
  async buildEthBridgeTransfer(
    wrapperTxProps: WrapperTxProps,
    ethBridgeTransferProps: EthBridgeTransferProps
  ): Promise<TxMsgValue> {
    const ethBridgeTransferMsg = new Message<EthBridgeTransferProps>();
    const encodedWrapperArgs = this.encodeTxArgs(wrapperTxProps);
    const encodedEthBridgeTransfer = ethBridgeTransferMsg.encode(
      new EthBridgeTransferMsgValue(ethBridgeTransferProps)
    );
    const serializedTx = await this.sdk.build_eth_bridge_transfer(
      encodedEthBridgeTransfer,
      encodedWrapperArgs
    );
    return deserialize(Buffer.from(serializedTx), TxMsgValue);
  }

  /**
   * Build Vote Proposal Tx
   * @async
   * @param wrapperTxProps - properties of the transaction
   * @param voteProposalProps - properties of the vote proposal tx
   * @returns promise that resolves to an TxMsgValue
   */
  async buildVoteProposal(
    wrapperTxProps: WrapperTxProps,
    voteProposalProps: VoteProposalProps
  ): Promise<TxMsgValue> {
    const voteProposalMsg = new Message<VoteProposalProps>();
    const encodedWrapperArgs = this.encodeTxArgs(wrapperTxProps);
    const encodedVoteProposal = voteProposalMsg.encode(
      new VoteProposalMsgValue(voteProposalProps)
    );

    const serializedTx = await this.sdk.build_vote_proposal(
      encodedVoteProposal,
      encodedWrapperArgs
    );
    return deserialize(Buffer.from(serializedTx), TxMsgValue);
  }

  /**
   * Build Claim Rewards Tx
   * @async
   * @param wrapperTxProps - properties of the transaction
   * @param claimRewardsProps - properties of the claim rewards tx
   * @returns promise that resolves to an TxMsgValue
   */
  async buildClaimRewards(
    wrapperTxProps: WrapperTxProps,
    claimRewardsProps: ClaimRewardsProps
  ): Promise<TxMsgValue> {
    const claimRewardsMsg = new Message<ClaimRewardsProps>();
    const encodedWrapperArgs = this.encodeTxArgs(wrapperTxProps);
    const encodedClaimRewards = claimRewardsMsg.encode(
      new ClaimRewardsMsgValue(claimRewardsProps)
    );
    const serializedTx = await this.sdk.build_claim_rewards(
      encodedClaimRewards,
      encodedWrapperArgs
    );
    return deserialize(Buffer.from(serializedTx), TxMsgValue);
  }

  /**
   * Build a batched transaction
   * @param txs - array of TxProp
   * @returns a serialized TxMsgValue type
   */
  buildBatch(txs: TxProps[]): TxProps {
    const encodedTxs = txs.map((txProps) => {
      const txMsgValue = new TxMsgValue(txProps);
      const msg = new Message<TxMsgValue>();
      return msg.encode(txMsgValue);
    });

    const batch = SdkWasm.build_batch(encodedTxs.map((tx) => [...tx]));
    return deserialize(Buffer.from(batch), TxMsgValue);
  }

  /**
   * Append signature for transactions signed by Ledger Hardware Wallet
   * @param txBytes - bytes of the transaction
   * @param signingData - signing data
   * @param signatures - masp signature
   * @returns transaction bytes with signature appended
   */
  appendMaspSignatures(
    txBytes: Uint8Array,
    signingData: Uint8Array[],
    signatures: Uint8Array[]
  ): Uint8Array {
    return this.sdk.sign_masp_ledger(txBytes, signingData, signatures);
  }

  /**
   * Append signature for transactions signed by Ledger Hardware Wallet
   * @param txBytes - Serialized transaction
   * @param ledgerSignatureResponse - Serialized signature as returned from Ledger
   * @returns - Serialized Tx bytes with signature appended
   */
  appendSignature(
    txBytes: Uint8Array,
    ledgerSignatureResponse: ResponseSign
  ): Uint8Array {
    const { signature } = ledgerSignatureResponse;
    if (!signature) {
      throw new Error("Signature was not returned from Ledger!");
    }

    const {
      rawPubkey,
      raw_indices,
      raw_signature,
      wrapper_indices,
      wrapper_signature,
    } = signature;

    // Construct props from ledgerSignature
    /* eslint-disable */
    const props = {
      pubkey: new Uint8Array((rawPubkey as any).data),
      rawIndices: new Uint8Array((raw_indices as any).data),
      rawSignature: new Uint8Array((raw_signature as any).data),
      wrapperIndices: new Uint8Array((wrapper_indices as any).data),
      wrapperSignature: new Uint8Array((wrapper_signature as any).data),
    };
    /* eslint-enable */

    // Serialize signature
    const value = new SignatureMsgValue(props);
    const msg = new Message<SignatureMsgValue>();
    const encodedSignature = msg.encode(value);

    return this.sdk.append_signature(txBytes, encodedSignature);
  }

  /**
   * Helper to encode Tx args given TxProps
   * @param wrapperTxProps - properties of the transaction
   * @returns Serialized WrapperTxMsgValue
   */
  encodeTxArgs(wrapperTxProps: WrapperTxProps): Uint8Array {
    const wrapperTxMsgValue = new WrapperTxMsgValue(wrapperTxProps);
    const msg = new Message<WrapperTxMsgValue>();
    return msg.encode(wrapperTxMsgValue);
  }

  /**
   * Method to retrieve JSON strings for all commitments of a Tx
   * @param txBytes - Bytes of a transaction
   * @param checksums - Record of paths mapped to their respective hashes
   * @returns a TxDetails object
   */
  deserialize(
    txBytes: Uint8Array,
    checksums: Record<string, string>
  ): TxDetails {
    const wasmHashes: WasmHash[] = [];
    for (const path in checksums) {
      wasmHashes.push({
        path,
        hash: checksums[path],
      });
    }
    const tx = deserialize_tx(txBytes, wasmHashes);
    const { wrapperTx, commitments } = deserialize(tx, TxDetailsMsgValue);

    const getProps = (txType: TxType, data: Uint8Array): SupportedTxProps => {
      switch (txType) {
        case TxType.Bond:
          return deserialize(data, BondMsgValue);
        case TxType.Unbond:
          return deserialize(data, UnbondMsgValue);
        case TxType.Withdraw:
          return deserialize(data, WithdrawMsgValue);
        case TxType.Redelegate:
          return deserialize(data, RedelegateMsgValue);
        case TxType.VoteProposal:
          return deserialize(data, VoteProposalMsgValue);
        case TxType.ClaimRewards:
          return deserialize(data, ClaimRewardsMsgValue);
        case TxType.Transfer:
          return deserialize(data, TransferDetailsMsgValue);
        case TxType.RevealPK:
          return deserialize(data, RevealPkMsgValue);
        case TxType.IBCTransfer:
          return deserialize(data, IbcTransferMsgValue);
        default:
          throw "Unsupported Tx type!";
      }
    };

    return {
      ...wrapperTx,
      // Wrapper fee payer is always defined at this point
      wrapperFeePayer: wrapperTx.wrapperFeePayer!,
      commitments: commitments.map(
        ({ txType, hash, txCodeId, data, memo, maspTxIn, maspTxOut }) => ({
          txType: txType as TxType,
          hash,
          txCodeId,
          memo,
          maspTxIn,
          maspTxOut,
          ...getProps(txType, data),
        })
      ),
    };
  }

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
  generateIbcShieldingMemo(
    target: string,
    token: string,
    amount: BigNumber,
    channelId: string
  ): Promise<string> {
    return this.sdk.generate_ibc_shielding_memo(
      target,
      token,
      amount.toString(),
      channelId
    );
  }

  /**
   * Return the inner tx hashes from the provided tx bytes
   * @param bytes - Uint8Array
   * @returns array of inner Tx hashes
   */
  getInnerTxHashes(bytes: Uint8Array): [string, number[] | null][] {
    return get_inner_tx_hashes(bytes);
  }
}
