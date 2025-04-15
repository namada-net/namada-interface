import Transport from "@ledgerhq/hw-transport";
import { Query as QueryWasm, Sdk as SdkWasm } from "../../wasm/src";
import { Crypto } from "./crypto";
import { Keys } from "./keys";
import { Ledger } from "./ledger";
import { Masp } from "./masp";
import { Mnemonic } from "./mnemonic";
import { Rpc } from "./rpc";
import { Signing } from "./signing";
import { Tx } from "./tx";
export { ProgressBarNames, SdkEvents } from "../../wasm/src";
/**
 * API for interacting with Namada SDK
 */
export declare class Sdk {
    protected sdk: SdkWasm;
    protected query: QueryWasm;
    readonly memory: WebAssembly.Memory;
    readonly url: string;
    readonly nativeToken: string;
    static readonly version = "0.20.8";
    /**
     * @param sdk - Instance of Sdk struct from wasm lib
     * @param query - Instance of Query struct from wasm lib
     * @param memory - Memory accessor for wasm lib
     * @param url - RPC url
     * @param nativeToken - Address of chain's native token
     */
    constructor(sdk: SdkWasm, query: QueryWasm, memory: WebAssembly.Memory, url: string, nativeToken: string);
    /**
     * Re-initialize wasm instances and return this instance
     * @param url - RPC url
     * @param [nativeToken] - Address of chain's native token
     * @returns this instance of Sdk
     */
    updateNetwork(url: string, nativeToken?: string): Sdk;
    /**
     * Return initialized Rpc class
     * @returns Namada RPC client
     */
    getRpc(): Rpc;
    /**
     * Return initialized Tx class
     * @returns Tx-related functionality
     */
    getTx(): Tx;
    /**
     * Return initialized Mnemonic class
     * @returns mnemonic-related functionality
     */
    getMnemonic(): Mnemonic;
    /**
     * Return initialized Keys class
     * @returns key-related functionality
     */
    getKeys(): Keys;
    /**
     * Return initialized Signing class
     * @returns Non-Tx signing functionality
     */
    getSigning(): Signing;
    /**
     * Return initialized Masp class
     * @returns Masp utilities for handling params
     */
    getMasp(): Masp;
    /**
     * Return initialized Crypto class
     * @returns Utilities for encrypting and decrypting data
     */
    getCrypto(): Crypto;
    /**
     * Intialize Ledger class for use with NamadaApp
     * @async
     * @param [transport] - Will default to USB transport if not specified
     * @returns Class for interacting with NamadaApp for Ledger Hardware Wallets
     */
    initLedger(transport?: Transport): Promise<Ledger>;
    /**
     * Define rpc getter to use with destructuring assignment
     * @returns rpc client
     */
    get rpc(): Rpc;
    /**
     * Define tx getter to use with destructuring assignment
     * @returns tx-related functionality
     */
    get tx(): Tx;
    /**
     * Define mnemonic getter to use with destructuring assignment
     * @returns mnemonic-related functionality
     */
    get mnemonic(): Mnemonic;
    /**
     * Define keys getter to use with destructuring assignment
     * @returns key-related functionality
     */
    get keys(): Keys;
    /**
     * Define signing getter to use with destructuring assignment
     * @returns Non-Tx signing functionality
     */
    get signing(): Signing;
    /**
     * Define signing getter to use with destructuring assignment
     * @returns Masp utilities for handling params
     */
    get masp(): Masp;
    /**
     * Define crypto getter to use with destructuring assignment
     * @returns Utilities for encrypting and decrypting data
     */
    get crypto(): Crypto;
}
