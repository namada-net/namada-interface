import { TxResponseProps } from "./types";
/**
 * Custom error for Broadcast Tx
 */
export declare class BroadcastTxError extends Error {
    /**
     * @param message - string
     * @returns BroadcastTxError
     */
    constructor(message: string);
    /**
     * @returns string
     */
    toString(): string;
    /**
     * @returns TxResponseProps
     */
    toProps(): TxResponseProps;
}
