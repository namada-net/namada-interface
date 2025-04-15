import { CryptoRecord } from "./types";
/**
 * Class Crypto handles AES encryption tasks
 */
export declare class Crypto {
    protected readonly cryptoMemory: WebAssembly.Memory;
    /**
     * @param cryptoMemory - WebAssembly Memory for crypto
     */
    constructor(cryptoMemory: WebAssembly.Memory);
    /**
     * Provide object for storing encrypted data
     * @param cipherText - encrypted bytes
     * @param params - Argon2 parameters
     * @param iv - array of IV bytes
     * @param salt - salt string
     * @returns crypto record used for storage
     */
    private makeCryptoRecord;
    /**
     * Encrypt string using AES and Argon2
     * @param  plainText - data to be encrypted
     * @param password - password to use for encryption
     * @returns crypto record
     */
    encrypt(plainText: string, password: string): CryptoRecord;
    /**
     * Construct encryption parameters such as password hash,
     * initialization vector, and salt from provided password
     * @param password - required for generating password hash
     * @returns encryption parameters
     */
    private makeEncryptionParams;
    /**
     * Encrypt plain-text with provide Key & IV
     * @param key - AES key
     * @param iv - IV for AES
     * @param plainText - string to be encrypted
     * @returns array of encrypted bytes
     */
    private encryptWithAES;
    /**
     * @param cryptoRecord - CryptoRecord value
     * @param password - password
     * @returns decrypted text
     */
    decrypt(cryptoRecord: CryptoRecord, password: string): string;
}
