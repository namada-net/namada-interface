/* eslint-disable @typescript-eslint/no-unused-vars */
import { field, option, vec } from "@dao-xyz/borsh";
import BigNumber from "bignumber.js";
import {
  ShieldedTransferDataProps,
  ShieldedTransferProps,
  ShieldingTransferDataProps,
  ShieldingTransferProps,
  TransparentTransferDataProps,
  TransparentTransferProps,
  UnshieldingTransferDataProps,
  UnshieldingTransferProps,
} from "../types";
import {
  BparamsConvertMsgValue,
  BparamsMsgValue,
  BparamsOutputMsgValue,
  BparamsSpendMsgValue,
} from "./bparams";
import { BigNumberSerializer } from "./utils";

/**
 * Transparent Transfer schemas
 */
export class TransparentTransferDataMsgValue {
  @field({ type: "string" })
  source!: string;

  @field({ type: "string" })
  target!: string;

  @field({ type: "string" })
  token!: string;

  @field(BigNumberSerializer)
  amount!: BigNumber;

  constructor(data: TransparentTransferDataProps) {
    Object.assign(this, data);
  }
}

export class TransparentTransferMsgValue {
  @field({ type: vec(TransparentTransferDataMsgValue) })
  data!: TransparentTransferDataMsgValue[];

  constructor({ data }: TransparentTransferProps) {
    Object.assign(this, {
      data: data.map(
        (transferProps) => new TransparentTransferDataMsgValue(transferProps)
      ),
    });
  }
}

/**
 * Shielded Transfer schemas
 */
export class ShieldedTransferDataMsgValue {
  @field({ type: "string" })
  source!: string;

  @field({ type: "string" })
  target!: string;

  @field({ type: "string" })
  token!: string;

  @field(BigNumberSerializer)
  amount!: BigNumber;

  constructor(data: ShieldedTransferDataProps) {
    Object.assign(this, data);
  }
}

export class ShieldedTransferMsgValue {
  @field({ type: vec(ShieldedTransferDataMsgValue) })
  data!: ShieldedTransferDataMsgValue[];

  @field({ type: option("string") })
  gasSpendingKey?: string;

  @field({ type: option(vec(BparamsMsgValue)) })
  bparams?: BparamsMsgValue[];

  constructor({ data, gasSpendingKey, bparams }: ShieldedTransferProps) {
    Object.assign(this, {
      data: data.map(
        (shieldedTransferDataProps) =>
          new ShieldedTransferDataMsgValue(shieldedTransferDataProps)
      ),
      gasSpendingKey,

      bparams: bparams?.map((bparam) => {
        return new BparamsMsgValue({
          spend: new BparamsSpendMsgValue(bparam.spend),
          output: new BparamsOutputMsgValue(bparam.output),
          convert: new BparamsConvertMsgValue(bparam.convert),
        });
      }),
    });
  }
}

/**
 * Shielding Transfer schemas
 */
export class ShieldingTransferDataMsgValue {
  @field({ type: "string" })
  source!: string;

  @field({ type: "string" })
  token!: string;

  @field(BigNumberSerializer)
  amount!: BigNumber;

  constructor(data: ShieldingTransferDataProps) {
    Object.assign(this, data);
  }
}

export class ShieldingTransferMsgValue {
  @field({ type: "string" })
  target!: string;

  @field({ type: vec(ShieldingTransferDataMsgValue) })
  data!: ShieldingTransferDataMsgValue[];

  @field({ type: option(vec(BparamsMsgValue)) })
  bparams?: BparamsMsgValue[];

  constructor({ data, target }: ShieldingTransferProps) {
    Object.assign(this, {
      target,
      data: data.map(
        (shieldingTransferDataProps) =>
          new ShieldingTransferDataMsgValue(shieldingTransferDataProps)
      ),
    });
  }
}

/**
 * Unshielding Transfer schemas
 */
export class UnshieldingTransferDataMsgValue {
  @field({ type: "string" })
  target!: string;

  @field({ type: "string" })
  token!: string;

  @field(BigNumberSerializer)
  amount!: BigNumber;

  constructor(data: UnshieldingTransferDataProps) {
    Object.assign(this, data);
  }
}

export class UnshieldingTransferMsgValue {
  @field({ type: "string" })
  source!: string;

  @field({ type: vec(UnshieldingTransferDataMsgValue) })
  data!: UnshieldingTransferDataMsgValue[];

  @field({ type: option("string") })
  gasSpendingKey?: string;

  @field({ type: option(vec(BparamsMsgValue)) })
  bparams?: BparamsMsgValue[];

  @field({ type: option("bool") })
  skipFeeCheck?: boolean;

  constructor({
    source,
    data,
    gasSpendingKey,
    bparams,
    skipFeeCheck,
  }: UnshieldingTransferProps) {
    Object.assign(this, {
      source,
      data: data.map(
        (unshieldingTransferDataProps) =>
          new UnshieldingTransferDataMsgValue(unshieldingTransferDataProps)
      ),
      gasSpendingKey,
      bparams: bparams?.map((bparam) => {
        return new BparamsMsgValue({
          spend: new BparamsSpendMsgValue(bparam.spend),
          output: new BparamsOutputMsgValue(bparam.output),
          convert: new BparamsConvertMsgValue(bparam.convert),
        });
      }),
      skipFeeCheck,
    });
  }
}

/**
 * General Transfer schema used for displaying details
 */
export class TransferDataMsgValue {
  @field({ type: "string" })
  owner!: string;

  @field({ type: "string" })
  token!: string;

  @field(BigNumberSerializer)
  amount!: BigNumber;
}

/**
 * Used only for serializing transfers during build
 */
export class TransferMsgValue {
  @field({ type: vec(TransferDataMsgValue) })
  sources!: TransferDataMsgValue[];

  @field({ type: vec(TransferDataMsgValue) })
  targets!: TransferDataMsgValue[];

  @field({ type: option(vec("u8")) })
  shieldedSectionHash?: Uint8Array;
}

/**
 * When deserializing for Transfer Details, return version with
 * shieldedSectionHash encoded as hex instead of Uint8Array
 */
export class TransferDetailsMsgValue {
  @field({ type: vec(TransferDataMsgValue) })
  sources!: TransferDataMsgValue[];

  @field({ type: vec(TransferDataMsgValue) })
  targets!: TransferDataMsgValue[];

  @field({ type: option("string") })
  shieldedSectionHash?: string;
}
