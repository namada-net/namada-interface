/* eslint-disable @typescript-eslint/no-unused-vars */
import { field, option, vec } from "@dao-xyz/borsh";
import { WrapperTxMsgValue } from "./wrapperTx";

export class MaspTxIn {
  @field({ type: "string" })
  token!: string;

  @field({ type: "string" })
  value!: string;

  @field({ type: "string" })
  owner!: string;

  constructor(data: MaspTxIn) {
    Object.assign(this, data);
  }
}

export class MaspTxOut {
  @field({ type: "string" })
  token!: string;

  @field({ type: "string" })
  value!: string;

  @field({ type: "string" })
  address!: string;

  constructor(data: MaspTxOut) {
    Object.assign(this, data);
  }
}

export class MaspTxConv {
  @field({ type: "string" })
  token!: string;

  @field({ type: "string" })
  value!: string;

  constructor(data: MaspTxConv) {
    Object.assign(this, data);
  }
}

export class CommitmentMsgValue {
  @field({ type: "u8" })
  txType!: number;

  @field({ type: "string" })
  hash!: string;

  @field({ type: "string" })
  txCodeId!: string;

  @field({ type: vec("u8") })
  data!: Uint8Array;

  @field({ type: option("string") })
  memo?: string;

  @field({ type: option(vec(MaspTxIn)) })
  maspTxIn?: MaspTxIn[];

  @field({ type: option(vec(MaspTxOut)) })
  maspTxOut?: MaspTxOut[];

  @field({ type: option(vec(MaspTxConv)) })
  maspTxConv?: MaspTxConv[];

  constructor(data: CommitmentMsgValue) {
    const maspTxIn =
      data.maspTxIn ?
        data.maspTxIn.map((txIn) => new MaspTxIn(txIn))
      : undefined;
    const maspTxOut =
      data.maspTxOut ?
        data.maspTxOut.map((txOut) => new MaspTxOut(txOut))
      : undefined;
    const maspTxConv =
      data.maspTxConv ?
        data.maspTxConv.map((txConv) => new MaspTxConv(txConv))
      : undefined;

    Object.assign(this, {
      ...data,
      maspTxIn,
      maspTxOut,
      maspTxConv,
    });
  }
}

export class TxDetailsMsgValue {
  @field({ type: WrapperTxMsgValue })
  wrapperTx!: WrapperTxMsgValue;

  @field({ type: vec(CommitmentMsgValue) })
  commitments!: CommitmentMsgValue[];
}
