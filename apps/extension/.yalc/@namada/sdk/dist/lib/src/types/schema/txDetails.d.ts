import { WrapperTxMsgValue } from "./wrapperTx";
export declare class MaspTxIn {
    token: string;
    value: string;
    owner: string;
    constructor(data: MaspTxIn);
}
export declare class MaspTxOut {
    token: string;
    value: string;
    address: string;
    constructor(data: MaspTxOut);
}
export declare class MaspTxConv {
    token: string;
    value: string;
    constructor(data: MaspTxConv);
}
export declare class CommitmentMsgValue {
    txType: number;
    hash: string;
    txCodeId: string;
    data: Uint8Array;
    memo?: string;
    maspTxIn?: MaspTxIn[];
    maspTxOut?: MaspTxOut[];
    maspTxConv?: MaspTxConv[][];
    constructor(data: CommitmentMsgValue);
}
export declare class TxDetailsMsgValue {
    wrapperTx: WrapperTxMsgValue;
    commitments: CommitmentMsgValue[];
}
