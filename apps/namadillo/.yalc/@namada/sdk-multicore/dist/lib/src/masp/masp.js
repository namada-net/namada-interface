var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Sdk as SdkWasm } from "../../../wasm/src";
/**
 * Class representing utilities related to MASP
 */
export class Masp {
    /**
     * @param sdk - Instance of Sdk struct from wasm lib
     */
    constructor(sdk) {
        this.sdk = sdk;
    }
    /**
     * Get spend notes descriptor map
     * @async
     * @param tx - tx bytes
     * @param shieldedHash - bytes of the shielded hash
     * @returns - Promise resolving to an array of numbers representing the descriptor map
     */
    getDescriptorMap(tx, shieldedHash) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sdk.get_descriptor_map(tx, shieldedHash);
        });
    }
    /**
     * Check if SDK has MASP parameters loaded
     * @async
     * @returns True if MASP parameters are loaded
     */
    hasMaspParams() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield SdkWasm.has_masp_params();
        });
    }
    /**
     * Fetch MASP parameters and store them in SDK
     * @async
     * @param [url] - optional URL to override the default
     * @returns void
     */
    fetchAndStoreMaspParams(url) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield SdkWasm.fetch_and_store_masp_params(url);
        });
    }
    /**
     * Load stored MASP params
     * @param pathOrDbName - Path to stored MASP params(nodejs) or name of the database(browser)
     * @param chainId - Chain ID to read the MASP params for
     * @async
     * @returns void
     */
    loadMaspParams(pathOrDbName, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sdk.load_masp_params(pathOrDbName, chainId);
        });
    }
    /**
     * Add spending key to SDK wallet
     * @async
     * @param xsk - extended spending key
     * @param alias - alias for the key
     * @returns void
     */
    addSpendingKey(xsk, alias) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sdk.add_spending_key(xsk, alias);
        });
    }
    /**
     * Add viewing key to SDK wallet
     * @async
     * @param xvk - extended viewing key
     * @param alias - alias for the key
     * @returns void
     */
    addViewingKey(xvk, alias) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sdk.add_viewing_key(xvk, alias);
        });
    }
    /**
     * Add payment address to SDK wallet
     * @async
     * @param xvk - Extended viewing key
     * @param alias - Alias for the key
     * @returns void
     */
    addDefaultPaymentAddress(xvk, alias) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sdk.add_default_payment_address(xvk, alias);
        });
    }
    /**
     * Returns the MASP address used as the receiving address in IBC transfers to
     * shielded accounts
     * @returns the MASP address
     */
    maspAddress() {
        return this.sdk.masp_address();
    }
    /**
     * Clear shilded context
     * @param chainId - Chain ID to clear the shielded context for
     * @returns void
     */
    clearShieldedContext(chainId) {
        return SdkWasm.clear_shielded_context(chainId);
    }
    /**
     * Returns all the notes and conversions connected to the given viewing key
     *
     * @async
     * @param viewingKey - Viewing key to get notes and conversions for
     * @param chainId - Chain ID to load correct shielded context
     * @returns Promise resolving to a map of addresses to arrays of notes and conversions tuple
     */
    getNotesAndConversions(viewingKey, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sdk.query_notes_to_spend(viewingKey, chainId);
        });
    }
}
