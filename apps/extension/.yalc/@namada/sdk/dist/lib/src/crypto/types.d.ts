import { Argon2Params as Argon2ParamsWasm, VecU8Pointer } from "../../../wasm/src";
export declare const Argon2Config: {
    m_cost: number;
    t_cost: number;
    p_cost: number;
};
type KdfParams = {
    salt: string;
};
export type Argon2Params = KdfParams & {
    m_cost: number;
    t_cost: number;
    p_cost: number;
    salt: string;
};
export type EncryptionParams = {
    params: Argon2ParamsWasm;
    key: VecU8Pointer;
    salt: string;
    iv: Uint8Array;
};
export declare enum KdfType {
    Argon2 = "argon2",
    Scrypt = "scrypt"
}
export type CryptoRecord<T = Argon2Params> = {
    cipher: {
        type: "aes-256-gcm";
        iv: Uint8Array;
        text: Uint8Array;
    };
    kdf: {
        type: KdfType;
        params: T;
    };
};
export {};
