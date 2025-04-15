import { SignatureProps } from "../types";
export declare class SignatureMsgValue {
    pubkey: Uint8Array;
    rawIndices: Uint8Array;
    rawSignature: Uint8Array;
    wrapperIndices: Uint8Array;
    wrapperSignature: Uint8Array;
    constructor(data: SignatureProps);
}
