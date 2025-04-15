import { Bip44Path, Zip32Path } from "../types";
/**
 * Address and public key type
 */
export type Address = {
    address: string;
    publicKey: string;
};
/**
 * Public and private keypair with address
 */
export type TransparentKeys = {
    privateKey: string;
} & Address;
/**
 * Shielded keys and address
 */
export type ShieldedKeys = {
    address: string;
    diversifierIndex: number;
    viewingKey: string;
    spendingKey: string;
    pseudoExtendedKey: string;
};
/**
 * Result of generating next payment address
 */
export type GeneratedPaymentAddress = {
    address: string;
    diversifierIndex: number;
};
export declare const DEFAULT_BIP44_PATH: Bip44Path;
export declare const MODIFIED_ZIP32_PATH: Bip44Path;
export declare const DEFAULT_ZIP32_PATH: Zip32Path;
