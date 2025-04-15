import BigNumber from "bignumber.js";
import { RedelegateProps } from "../types";
export declare class RedelegateMsgValue {
    owner: string;
    sourceValidator: string;
    destinationValidator: string;
    amount: BigNumber;
    constructor(data: RedelegateProps);
}
