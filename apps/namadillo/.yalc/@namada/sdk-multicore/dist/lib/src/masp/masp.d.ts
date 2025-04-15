import { Sdk as SdkWasm } from "../../../wasm/src";
import { NotesAndConversions } from "./types";
/**
 * Class representing utilities related to MASP
 */
export declare class Masp {
    protected readonly sdk: SdkWasm;
    /**
     * @param sdk - Instance of Sdk struct from wasm lib
     */
    constructor(sdk: SdkWasm);
    /**
     * Get spend notes descriptor map
     * @async
     * @param tx - tx bytes
     * @param shieldedHash - bytes of the shielded hash
     * @returns - Promise resolving to an array of numbers representing the descriptor map
     */
    getDescriptorMap(tx: Uint8Array, shieldedHash: Uint8Array): Promise<number[]>;
    /**
     * Check if SDK has MASP parameters loaded
     * @async
     * @returns True if MASP parameters are loaded
     */
    hasMaspParams(): Promise<boolean>;
    /**
     * Fetch MASP parameters and store them in SDK
     * @async
     * @param [url] - optional URL to override the default
     * @returns void
     */
    fetchAndStoreMaspParams(url?: string): Promise<void>;
    /**
     * Load stored MASP params
     * @param pathOrDbName - Path to stored MASP params(nodejs) or name of the database(browser)
     * @param chainId - Chain ID to read the MASP params for
     * @async
     * @returns void
     */
    loadMaspParams(pathOrDbName: string, chainId: string): Promise<void>;
    /**
     * Add spending key to SDK wallet
     * @async
     * @param xsk - extended spending key
     * @param alias - alias for the key
     * @returns void
     */
    addSpendingKey(xsk: string, alias: string): Promise<void>;
    /**
     * Add viewing key to SDK wallet
     * @async
     * @param xvk - extended viewing key
     * @param alias - alias for the key
     * @returns void
     */
    addViewingKey(xvk: string, alias: string): Promise<void>;
    /**
     * Add payment address to SDK wallet
     * @async
     * @param xvk - Extended viewing key
     * @param alias - Alias for the key
     * @returns void
     */
    addDefaultPaymentAddress(xvk: string, alias: string): Promise<void>;
    /**
     * Returns the MASP address used as the receiving address in IBC transfers to
     * shielded accounts
     * @returns the MASP address
     */
    maspAddress(): string;
    /**
     * Clear shilded context
     * @param chainId - Chain ID to clear the shielded context for
     * @returns void
     */
    clearShieldedContext(chainId: string): Promise<void>;
    /**
     * Returns all the notes and conversions connected to the given viewing key
     *
     * @async
     * @param viewingKey - Viewing key to get notes and conversions for
     * @param chainId - Chain ID to load correct shielded context
     * @returns Promise resolving to a map of addresses to arrays of notes and conversions tuple
     */
    getNotesAndConversions(viewingKey: string, chainId: string): Promise<NotesAndConversions>;
}
