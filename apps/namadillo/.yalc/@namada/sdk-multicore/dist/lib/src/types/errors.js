import { ResultCodes } from "./types";
/**
 * Custom error for Broadcast Tx
 */
export class BroadcastTxError extends Error {
    /**
     * @param message - string
     * @returns BroadcastTxError
     */
    constructor(message) {
        super(message);
        this.name = "BroadcastTxError";
    }
    /**
     * @returns string
     */
    toString() {
        try {
            const { code } = this.toProps();
            const message = ResultCodes[code];
            return message;
            // eslint-disable-next-line
        }
        catch (_) {
            // If not able to be parsed as JSON, return
            // original error message
            return this.message;
        }
    }
    /**
     * @returns TxResponseProps
     */
    toProps() {
        try {
            const props = JSON.parse(this.message);
            return props;
        }
        catch (e) {
            throw new Error(`${e}`);
        }
    }
}
