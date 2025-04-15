import BigNumber from "bignumber.js";
import { BondProps } from "../types";
export declare class BondMsgValue {
    source: string;
    validator: string;
    amount: BigNumber;
    constructor(data: BondProps);
}
