/* eslint-disable @typescript-eslint/no-unused-vars */
import { field, option, variant, vec } from "@dao-xyz/borsh";
import { OsmosisSwapProps } from "../types";
import { IbcTransferMsgValue } from "./ibcTransfer";

abstract class SlippageMsgValue {}

@variant(0)
export class MinOutputAmount extends SlippageMsgValue {
  // 0 to follow rust convention, the amount is in the **base** denom
  @field({ type: "string" })
  public 0!: string;

  constructor(data: MinOutputAmount) {
    super();
    Object.assign(this, data);
  }
}
export const isMinOutputAmount = (
  data: SlippageMsgValue
): data is MinOutputAmount => {
  return typeof (data as MinOutputAmount)[0] === "string";
};

@variant(1)
export class Twap extends SlippageMsgValue {
  @field({ type: "string" })
  public slippagePercentage!: string;

  @field({ type: "u64" })
  public windowSeconds!: bigint;

  constructor(data: SlippageMsgValue) {
    super();
    Object.assign(this, data);
  }
}

export const isTwap = (data: SlippageMsgValue): data is Twap => {
  return (
    typeof (data as Twap).slippagePercentage === "string" &&
    typeof (data as Twap).windowSeconds === "bigint"
  );
};

export class OsmosisPoolHop {
  @field({ type: "string" })
  poolId!: string;

  @field({ type: "string" })
  tokenOutDenom!: string;

  constructor(data: OsmosisPoolHop) {
    Object.assign(this, data);
  }
}

export class OsmosisSwapMsgValue {
  @field({ type: IbcTransferMsgValue })
  transfer!: IbcTransferMsgValue;

  @field({ type: "string" })
  outputDenom!: string;

  @field({ type: "string" })
  recipient!: string;

  @field({ type: "string" })
  overflow!: string;

  @field({ type: SlippageMsgValue })
  slippage!: SlippageMsgValue;

  @field({ type: "string" })
  localRecoveryAddr!: string;

  @field({ type: option(vec(OsmosisPoolHop)) })
  route?: OsmosisPoolHop[];

  @field({ type: "string" })
  osmosisRestRpc!: string;

  constructor(data: OsmosisSwapProps) {
    let slippage;
    if (isMinOutputAmount(data.slippage)) {
      slippage = new MinOutputAmount(data.slippage);
    } else if (isTwap(data.slippage)) {
      slippage = new Twap(data.slippage);
    } else {
      throw new Error("Invalid slippage type");
    }

    Object.assign(this, {
      ...data,
      transfer: new IbcTransferMsgValue(data.transfer),
      slippage,
      route: data.route?.map((hop) => {
        return new OsmosisPoolHop(hop);
      }),
    });
  }
}
