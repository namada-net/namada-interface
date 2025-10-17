import BigNumber from "bignumber.js";
import { ShieldedTransferDataProps, ShieldedTransferProps, ShieldingTransferDataProps, ShieldingTransferProps, TransparentTransferDataProps, TransparentTransferProps, UnshieldingTransferDataProps, UnshieldingTransferProps } from "../types";
import { BparamsMsgValue } from "./bparams";
/**
 * Transparent Transfer schemas
 */
export declare class TransparentTransferDataMsgValue {
    source: string;
    target: string;
    token: string;
    amount: BigNumber;
    constructor(data: TransparentTransferDataProps);
}
export declare class TransparentTransferMsgValue {
    data: TransparentTransferDataMsgValue[];
    constructor({ data }: TransparentTransferProps);
}
/**
 * Shielded Transfer schemas
 */
export declare class ShieldedTransferDataMsgValue {
    source: string;
    target: string;
    token: string;
    amount: BigNumber;
    constructor(data: ShieldedTransferDataProps);
}
export declare class ShieldedTransferMsgValue {
    data: ShieldedTransferDataMsgValue[];
    gasSpendingKey?: string;
    bparams?: BparamsMsgValue[];
    skipFeeCheck?: boolean;
    constructor({ data, gasSpendingKey, bparams, skipFeeCheck, }: ShieldedTransferProps);
}
/**
 * Shielding Transfer schemas
 */
export declare class ShieldingTransferDataMsgValue {
    source: string;
    token: string;
    amount: BigNumber;
    constructor(data: ShieldingTransferDataProps);
}
export declare class ShieldingTransferMsgValue {
    target: string;
    data: ShieldingTransferDataMsgValue[];
    bparams?: BparamsMsgValue[];
    constructor({ data, target }: ShieldingTransferProps);
}
/**
 * Unshielding Transfer schemas
 */
export declare class UnshieldingTransferDataMsgValue {
    target: string;
    token: string;
    amount: BigNumber;
    constructor(data: UnshieldingTransferDataProps);
}
export declare class UnshieldingTransferMsgValue {
    source: string;
    data: UnshieldingTransferDataMsgValue[];
    gasSpendingKey?: string;
    bparams?: BparamsMsgValue[];
    skipFeeCheck?: boolean;
    constructor({ source, data, gasSpendingKey, bparams, skipFeeCheck, }: UnshieldingTransferProps);
}
/**
 * General Transfer schema used for displaying details
 */
export declare class TransferDataMsgValue {
    owner: string;
    token: string;
    amount: BigNumber;
}
/**
 * Used only for serializing transfers during build
 */
export declare class TransferMsgValue {
    sources: TransferDataMsgValue[];
    targets: TransferDataMsgValue[];
    shieldedSectionHash?: Uint8Array;
}
/**
 * When deserializing for Transfer Details, return version with
 * shieldedSectionHash encoded as hex instead of Uint8Array
 */
export declare class TransferDetailsMsgValue {
    sources: TransferDataMsgValue[];
    targets: TransferDataMsgValue[];
    shieldedSectionHash?: string;
}
