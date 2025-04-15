import { OsmosisSwapProps } from "../types";
import { IbcTransferMsgValue } from "./ibcTransfer";
declare abstract class SlippageMsgValue {
}
export declare class MinOutputAmount extends SlippageMsgValue {
    0: string;
    constructor(data: MinOutputAmount);
}
export declare const isMinOutputAmount: (data: SlippageMsgValue) => data is MinOutputAmount;
export declare class Twap extends SlippageMsgValue {
    slippagePercentage: string;
    windowSeconds: bigint;
    constructor(data: SlippageMsgValue);
}
export declare const isTwap: (data: SlippageMsgValue) => data is Twap;
export declare class OsmosisPoolHop {
    poolId: string;
    tokenOutDenom: string;
    constructor(data: OsmosisPoolHop);
}
export declare class OsmosisSwapMsgValue {
    transfer: IbcTransferMsgValue;
    outputDenom: string;
    recipient: string;
    overflow: string;
    slippage: SlippageMsgValue;
    localRecoveryAddr: string;
    route?: OsmosisPoolHop[];
    osmosisRestRpc: string;
    constructor(data: OsmosisSwapProps);
}
export {};
