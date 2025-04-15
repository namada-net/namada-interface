import { BatchTxResultProps } from "../types";
export declare class BatchTxResultMsgValue {
    hash: string;
    isApplied: string;
    error?: string;
    constructor(data: BatchTxResultProps);
}
