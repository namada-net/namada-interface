import { SigningDataProps, TxProps } from "../types";
import { WrapperTxMsgValue } from "./wrapperTx";
export declare class SigningDataMsgValue {
    owner?: string;
    publicKeys: string[];
    threshold: number;
    accountPublicKeysMap?: Uint8Array;
    feePayer: string;
    shieldedHash?: Uint8Array;
    masp?: Uint8Array;
    constructor(data: SigningDataProps);
}
export declare class TxMsgValue {
    args: WrapperTxMsgValue;
    hash: string;
    bytes: Uint8Array;
    signingData: SigningDataMsgValue[];
    constructor(data: TxProps);
}
