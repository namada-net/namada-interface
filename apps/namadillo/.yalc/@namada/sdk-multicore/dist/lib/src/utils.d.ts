import { Bip44Path, Zip32Path } from "./types";
/**
 * Return a properly formatted BIP-044 path array
 * @param coinType - SLIP-044 Coin designation
 * @param path - path object
 * @returns BIP-044 path array
 */
export declare const makeBip44PathArray: (coinType: number, path: Bip44Path) => Uint32Array;
/**
 * Return a properly formatted BIP-044 path
 * @param coinType - SLIP-044 Coin designation
 * @param bip44Path - path object
 * @param [fullPath] - boolean to determine whether to show full path or just path components
 * @returns BIP-044 path
 */
export declare const makeBip44Path: (coinType: number, bip44Path: Bip44Path, fullPath?: boolean) => string;
/**
 * Return a properly formatted Sapling path (Zip32)
 * @param coinType - SLIP-044 Coin designation
 * @param zip32Path - zip32 path object
 * @param [fullPath] - boolean to determine whether to show full path or just path components
 * @returns Sapling path
 */
export declare const makeSaplingPath: (coinType: number, zip32Path: Zip32Path, fullPath?: boolean) => string;
/**
 * Return a properly formatted Sapling path array (Zip32)
 * @param coinType - SLIP-044 Coin designation
 * @param account - numbered from index 0 in sequentially increasing manner. Defined as in BIP 44
 * @param [index] - optional index for additional keys under account. Defined as in BIP 44
 * @returns Sapling path array
 */
export declare const makeSaplingPathArray: (coinType: number, account: number, index?: number) => Uint32Array;
