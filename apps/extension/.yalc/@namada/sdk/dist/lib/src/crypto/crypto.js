import { AES, Argon2, Argon2Params as Argon2ParamsWasm, ByteSize, Rng, Salt, readVecU8Pointer, } from "../../../wasm/src";
import { Argon2Config, KdfType } from "./types";
/**
 * Class Crypto handles AES encryption tasks
 */
export class Crypto {
    /**
     * @param cryptoMemory - WebAssembly Memory for crypto
     */
    constructor(cryptoMemory) {
        this.cryptoMemory = cryptoMemory;
    }
    /**
     * Provide object for storing encrypted data
     * @param cipherText - encrypted bytes
     * @param params - Argon2 parameters
     * @param iv - array of IV bytes
     * @param salt - salt string
     * @returns crypto record used for storage
     */
    makeCryptoRecord(cipherText, params, iv, salt) {
        const { m_cost, t_cost, p_cost } = params;
        return {
            cipher: {
                type: "aes-256-gcm",
                iv,
                text: cipherText,
            },
            kdf: {
                type: KdfType.Argon2,
                params: {
                    m_cost,
                    t_cost,
                    p_cost,
                    salt,
                },
            },
        };
    }
    /**
     * Encrypt string using AES and Argon2
     * @param  plainText - data to be encrypted
     * @param password - password to use for encryption
     * @returns crypto record
     */
    encrypt(plainText, password) {
        const { params, key, iv, salt } = this.makeEncryptionParams(password);
        const cipherText = this.encryptWithAES(key, iv, plainText);
        return this.makeCryptoRecord(cipherText, params, iv, salt);
    }
    /**
     * Construct encryption parameters such as password hash,
     * initialization vector, and salt from provided password
     * @param password - required for generating password hash
     * @returns encryption parameters
     */
    makeEncryptionParams(password) {
        const saltInstance = Salt.generate();
        const salt = saltInstance.as_string();
        saltInstance.free();
        const { m_cost, t_cost, p_cost } = Argon2Config;
        const argon2Params = new Argon2ParamsWasm(m_cost, t_cost, p_cost);
        const argon2 = new Argon2(password, salt, argon2Params);
        const params = argon2.params();
        const key = argon2.key();
        argon2.free();
        const iv = Rng.generate_bytes(ByteSize.N12);
        return { params, key, salt, iv };
    }
    /**
     * Encrypt plain-text with provide Key & IV
     * @param key - AES key
     * @param iv - IV for AES
     * @param plainText - string to be encrypted
     * @returns array of encrypted bytes
     */
    encryptWithAES(key, iv, plainText) {
        const aes = new AES(key, iv);
        const cipherText = aes.encrypt(plainText);
        aes.free();
        return cipherText;
    }
    /**
     * @param cryptoRecord - CryptoRecord value
     * @param password - password
     * @returns decrypted text
     */
    decrypt(cryptoRecord, password) {
        const { cipher, kdf } = cryptoRecord;
        const { m_cost, p_cost, t_cost, salt } = kdf.params;
        const argon2Params = new Argon2ParamsWasm(m_cost, t_cost, p_cost);
        const newKey = new Argon2(password, salt, argon2Params).key();
        const aes = new AES(newKey, cipher.iv);
        const vecU8Pointer = aes.decrypt(cipher.text);
        const decrypted = readVecU8Pointer(vecU8Pointer, this.cryptoMemory);
        const plainText = new TextDecoder().decode(decrypted);
        aes.free();
        vecU8Pointer.free();
        return plainText;
    }
}
