import BigNumber from "bignumber.js";
import { UnbondProps } from "../types";
export declare class UnbondMsgValue {
    source: string;
    validator: string;
    amount: BigNumber;
    constructor(data: UnbondProps);
}
