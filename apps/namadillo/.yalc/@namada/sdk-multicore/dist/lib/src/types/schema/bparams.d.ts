export declare class BparamsSpendMsgValue {
    rcv: Uint8Array;
    alpha: Uint8Array;
    constructor(data: BparamsSpendMsgValue);
}
export declare class BparamsOutputMsgValue {
    rcv: Uint8Array;
    rcm: Uint8Array;
    constructor(data: BparamsOutputMsgValue);
}
export declare class BparamsConvertMsgValue {
    rcv: Uint8Array;
    constructor(data: BparamsConvertMsgValue);
}
export declare class BparamsMsgValue {
    spend: BparamsSpendMsgValue;
    output: BparamsOutputMsgValue;
    convert: BparamsConvertMsgValue;
    constructor(data: BparamsMsgValue);
}
