import BigNumber from "bignumber.js";
import { IbcTransferProps } from "../types";
import { BparamsMsgValue } from "./bparams";
export declare class IbcTransferMsgValue {
    source: string;
    receiver: string;
    token: string;
    amountInBaseDenom: BigNumber;
    portId: string;
    channelId: string;
    timeoutHeight?: bigint;
    timeoutSecOffset?: bigint;
    memo?: string;
    shieldingData?: Uint8Array;
    gasSpendingKey?: string;
    bparams?: BparamsMsgValue[];
    refundTarget?: string;
    constructor(data: IbcTransferProps);
}
