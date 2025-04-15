export declare enum PhraseSize {
    N12 = 12,
    N24 = 24
}
/**
 * Class for accessing mnemonic functionality from wasm
 */
export declare class Mnemonic {
    protected readonly cryptoMemory: WebAssembly.Memory;
    /**
     * @param cryptoMemory - Memory accessor for crypto lib
     */
    constructor(cryptoMemory: WebAssembly.Memory);
    /**
     * Generate a new 12 or 24 word mnemonic
     * @param [size] Mnemonic length
     * @returns An array of words
     */
    generate(size?: PhraseSize): string[];
    /**
     * Convert mnemonic to seed bytes
     * @param phrase - Mnemonic phrase
     * @param [passphrase] Bip39 passphrase
     * @returns Seed bytes
     */
    toSeed(phrase: string, passphrase?: string): Uint8Array;
    /**
     * Validate a mnemonic string, raise an exception providing reason
     * for failure if invalid, otherwise return nothing
     * @param phrase - Mnemonic phrase
     * @returns Object with validation result and error message if invalid
     */
    validateMnemonic(phrase: string): {
        isValid: boolean;
        error?: string;
    };
}
