var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Message, TxMsgValue } from "./types";
/**
 * Non-Tx signing functions
 */
export class Signing {
    /**
     * Signing constructor
     * @param sdk - Instance of Sdk struct from wasm lib
     */
    constructor(sdk) {
        this.sdk = sdk;
    }
    /**
     * Sign Namada transaction
     * @param txProps - TxProps
     * @param signingKey - private key(s)
     * @param [chainId] - optional chain ID, will enforce validation if present
     * @returns signed tx bytes - Promise resolving to Uint8Array
     */
    sign(txProps, signingKey, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            const txMsgValue = new TxMsgValue(txProps);
            const msg = new Message();
            const txBytes = msg.encode(txMsgValue);
            let signingKeys = [];
            if (signingKey instanceof Array) {
                signingKeys = signingKey;
            }
            else {
                signingKeys.push(signingKey);
            }
            return yield this.sdk.sign_tx(txBytes, signingKeys, chainId);
        });
    }
    /**
     * Sign masp spends
     * @param txProps - TxProps
     * @param xsks - spending keys
     * @returns tx with masp spends signed - Promise resolving to Uint8Array
     */
    signMasp(txProps, xsks) {
        return __awaiter(this, void 0, void 0, function* () {
            const txMsgValue = new TxMsgValue(txProps);
            const msg = new Message();
            const txBytes = msg.encode(txMsgValue);
            return yield this.sdk.sign_masp(xsks, txBytes);
        });
    }
    /**
     * Sign arbitrary data
     * @param signingKey - private key
     * @param data - data to sign
     * @returns hash and signature
     */
    signArbitrary(signingKey, data) {
        return this.sdk.sign_arbitrary(signingKey, data);
    }
    /**
     * Verify arbitrary signature. Will throw an error if the signature is invalid
     * @param publicKey - public key to verify with
     * @param hash - signed hash
     * @param signature - Hex-encoded signature
     * @returns void
     */
    verifyArbitrary(publicKey, hash, signature) {
        return this.sdk.verify_arbitrary(publicKey, hash, signature);
    }
}
