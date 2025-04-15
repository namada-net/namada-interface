import { HDWallet, Mnemonic as MnemonicWasm, readStringPointer, ShieldedHDWallet, StringPointer, Address as AddressWasm, ExtendedSpendingKey, ExtendedViewingKey, gen_payment_address, public_key_to_bech32, } from "../../../wasm/src";
import { NAMADA_COIN_TYPE as coinType } from "../types";
import { makeBip44PathArray, makeSaplingPathArray } from "../utils";
import { DEFAULT_BIP44_PATH, DEFAULT_ZIP32_PATH, MODIFIED_ZIP32_PATH, } from "./types";
/**
 * Namespace for key related functions
 */
export class Keys {
    /**
     * @param cryptoMemory - Memory accessor for crypto lib
     */
    constructor(cryptoMemory) {
        this.cryptoMemory = cryptoMemory;
    }
    /**
     * Get address and public key from private key
     * @param privateKey - Private key
     * @returns Address and public key
     */
    getAddress(privateKey) {
        const addr = new AddressWasm(privateKey);
        const address = addr.implicit();
        const publicKey = addr.public();
        return {
            address,
            publicKey,
        };
    }
    /**
     * Get transparent keys and address from private key
     * @param privateKey - Private key
     * @returns Keys and address
     */
    fromPrivateKey(privateKey) {
        return Object.assign(Object.assign({}, this.getAddress(privateKey)), { privateKey });
    }
    /**
     * Derive transparent keys and address from a mnemonic and path
     * @param phrase - Mnemonic phrase
     * @param [path] - Bip44 path object
     * @param [passphrase] - Bip39 passphrase
     * @returns Keys and address
     */
    deriveFromMnemonic(phrase, path = DEFAULT_BIP44_PATH, passphrase) {
        const mnemonic = MnemonicWasm.from_phrase(phrase);
        const passphrasePtr = typeof passphrase === "string"
            ? new StringPointer(passphrase)
            : undefined;
        const seedPtr = mnemonic.to_seed(passphrasePtr);
        const hdWallet = new HDWallet(seedPtr);
        const bip44Path = makeBip44PathArray(coinType, path);
        const key = hdWallet.derive(new Uint32Array(bip44Path));
        const privateKeyStringPtr = key.to_hex();
        const privateKey = readStringPointer(privateKeyStringPtr, this.cryptoMemory);
        // Clear wasm resources from memory
        mnemonic.free();
        hdWallet.free();
        key.free();
        privateKeyStringPtr.free();
        return Object.assign(Object.assign({}, this.getAddress(privateKey)), { privateKey });
    }
    /**
     * Derive transparent keys and address from a seed and path
     * @param seed - Seed
     * @param [path] - Bip44 path object
     * @returns Keys and address
     */
    deriveFromSeed(seed, path = DEFAULT_BIP44_PATH) {
        const hdWallet = HDWallet.from_seed(seed);
        const bip44Path = makeBip44PathArray(coinType, path);
        const key = hdWallet.derive(new Uint32Array(bip44Path));
        const privateKeyStringPtr = key.to_hex();
        const privateKey = readStringPointer(privateKeyStringPtr, this.cryptoMemory);
        // Clear wasm resources from memory
        hdWallet.free();
        key.free();
        privateKeyStringPtr.free();
        return Object.assign(Object.assign({}, this.getAddress(privateKey)), { privateKey });
    }
    /**
     * Derive shielded keys and address from a seed and path
     * @param seed - Seed
     * @param [zip32Path] - Zip32 path object to derive the shielded keys
     * @param [diversifier] - Diversifier bytes
     * @returns Shielded keys and address
     */
    deriveShieldedFromSeed(seed, zip32Path = DEFAULT_ZIP32_PATH, diversifier) {
        const bip44Path = MODIFIED_ZIP32_PATH;
        const shieldedHdWallet = new ShieldedHDWallet(seed, makeBip44PathArray(coinType, bip44Path));
        return this.deriveFromShieldedWallet(shieldedHdWallet, zip32Path, diversifier);
    }
    /**
     * Derive shielded keys and address from private key bytes
     * @param privateKeyBytes - secret
     * @param path - Zip32 path object
     * @param diversifier - Diversifier bytes
     * @returns Shielded keys and address
     */
    deriveShieldedFromPrivateKey(privateKeyBytes, path = DEFAULT_ZIP32_PATH, diversifier) {
        const shieldedHdWallet = ShieldedHDWallet.new_from_sk(privateKeyBytes);
        return this.deriveFromShieldedWallet(shieldedHdWallet, path, diversifier);
    }
    /**
     *
     * @param shieldedHdWallet - Shielded HD Wallet instance
     * @param path - Zip32 path object
     * @param diversifier - Diversifier bytes
     * @returns Object representing MASP related keys
     */
    deriveFromShieldedWallet(shieldedHdWallet, path, diversifier) {
        const { account, index } = path;
        const saplingPath = makeSaplingPathArray(877, account, index);
        const derivedAccount = shieldedHdWallet.derive(saplingPath, diversifier);
        // Retrieve serialized types from wasm
        const xsk = derivedAccount.xsk();
        const xfvk = derivedAccount.xfvk();
        // Deserialize and encode keys and address
        const extendedSpendingKey = new ExtendedSpendingKey(xsk);
        const extendedViewingKey = new ExtendedViewingKey(xfvk);
        const spendingKey = extendedSpendingKey.encode();
        const viewingKey = extendedViewingKey.encode();
        const pseudoExtendedKey = extendedSpendingKey
            .to_pseudo_extended_key()
            .encode();
        const [diversifierIndex, address] = extendedViewingKey.default_payment_address();
        // Clear wasm resources from memory
        shieldedHdWallet.free();
        derivedAccount.free();
        extendedViewingKey.free();
        extendedSpendingKey.free();
        return {
            address,
            diversifierIndex,
            spendingKey,
            viewingKey,
            pseudoExtendedKey,
        };
    }
    /**
     * Generate a payment address from viewing key and diversifier index
     * @param xfvk - viewing key
     * @param [index] - diversifier index
     * @returns GeneratedPaymentAddress
     */
    genPaymentAddress(xfvk, index = 0) {
        const [diversifierIndex, address] = gen_payment_address(xfvk, index);
        return {
            address,
            diversifierIndex,
        };
    }
    /**
     * Given a bech32m-encoded extended spending key, return viewing and proof-gen keys
     * @param spendingKey - string
     * @returns ShieldedKeys
     */
    shieldedKeysFromSpendingKey(spendingKey) {
        const extendedSpendingKey = ExtendedSpendingKey.from_string(spendingKey);
        const pseudoExtendedKey = extendedSpendingKey
            .to_pseudo_extended_key()
            .encode();
        const viewingKey = extendedSpendingKey.to_viewing_key().encode();
        const [diversifierIndex, address] = extendedSpendingKey.to_default_address();
        return {
            address,
            diversifierIndex,
            viewingKey,
            pseudoExtendedKey,
            spendingKey,
        };
    }
    /**
     * Generate a disposable transparent keypair
     * @returns Keys and address
     */
    genDisposableKeypair() {
        const key = HDWallet.disposable_keypair();
        const privateKeyStringPtr = key.to_hex();
        const privateKey = readStringPointer(privateKeyStringPtr, this.cryptoMemory);
        key.free();
        privateKeyStringPtr.free();
        return Object.assign(Object.assign({}, this.getAddress(privateKey)), { privateKey });
    }
}
//TODO: think where to put this function
export const publicKeyToBech32 = (publicKey) => {
    return public_key_to_bech32(publicKey);
};
