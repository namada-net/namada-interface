import { MaxMaspTxAmountProps } from "../types";
export declare class MaxMaspTxAmountMsgValue {
    maxNotes: number;
    source: string;
    target: string;
    token: string;
    feeToken: string;
    amount: string;
    feeAmount: string;
    constructor(data: MaxMaspTxAmountProps);
}
