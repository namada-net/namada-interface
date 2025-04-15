import Transport from "@ledgerhq/hw-transport";
import TransportUSB from "@ledgerhq/hw-transport-webusb";
import { NamadaApp, ResponseAppInfo, ResponseSign, ResponseVersion } from "@zondax/ledger-namada";
export type LedgerAddressAndPublicKey = {
    address: string;
    publicKey: string;
};
export type LedgerViewingKey = {
    xfvk: Uint8Array;
};
export type LedgerProofGenerationKey = {
    ak: Uint8Array;
    nsk: Uint8Array;
};
export type LedgerStatus = {
    version: ResponseVersion;
    info: ResponseAppInfo;
    deviceId?: string;
    deviceName?: string;
};
export declare const LEDGER_MIN_VERSION_ZIP32 = "3.0.0";
export declare const LEDGER_MASP_BLACKLISTED = "nanoS";
export type Bparams = {
    spend: {
        rcv: Uint8Array;
        alpha: Uint8Array;
    };
    output: {
        rcv: Uint8Array;
        rcm: Uint8Array;
    };
    convert: {
        rcv: Uint8Array;
    };
};
/**
 * Initialize USB transport
 * @async
 * @returns Transport object
 */
export declare const initLedgerUSBTransport: () => Promise<Transport>;
/**
 * Returns a list of ledger devices
 * @async
 * @returns List of USB devices
 */
export declare const ledgerUSBList: () => Promise<USBDevice[]>;
/**
 * Request ledger device - opens a popup to request the user to connect a ledger device
 * @async
 * @returns Transport object
 */
export declare const requestLedgerDevice: () => Promise<TransportUSB>;
export declare const DEFAULT_LEDGER_BIP44_PATH: string;
export declare const DEFAULT_LEDGER_ZIP32_PATH: string;
/**
 * Functionality for interacting with NamadaApp for Ledger Hardware Wallets
 */
export declare class Ledger {
    readonly namadaApp: NamadaApp;
    /**
     * @param namadaApp - Inititalized NamadaApp class from Zondax package
     */
    private constructor();
    /**
     * Initialize and return Ledger class instance with initialized Transport
     * @async
     * @param [transport] Ledger transport
     * @returns Ledger class instance
     */
    static init(transport?: Transport): Promise<Ledger>;
    /**
     * Return status and version info of initialized NamadaApp.
     * Throw exception if app is not initialized.
     * @async
     * @returns Version and info of NamadaApp
     */
    status(): Promise<LedgerStatus>;
    /**
     * Get address and public key associated with optional path, otherwise, use default path
     * Throw exception if app is not initialized.
     * @async
     * @param [path] Bip44 path for deriving key
     * @returns Address and public key
     */
    getAddressAndPublicKey(path?: string): Promise<LedgerAddressAndPublicKey>;
    /**
     * Prompt user to get address and public key associated with optional path, otherwise, use default path.
     * Throw exception if app is not initialized.
     * @async
     * @param [path] Bip44 path for deriving key
     * @returns Address and public key
     */
    showAddressAndPublicKey(path?: string): Promise<LedgerAddressAndPublicKey>;
    /**
     * Get Bparams for masp transactions
     * @async
     * @returns bparams
     */
    getBparams(): Promise<Bparams[]>;
    /**
     * Prompt user to get viewing key associated with optional path, otherwise, use default path.
     * Throw exception if app is not initialized, zip32 is not supported, or key is not returned.
     * @async
     * @param [path] Zip32 path for deriving key
     * @param [promptUser] boolean to determine whether to display on Ledger device and require approval
     * @returns ShieldedKeys
     */
    getViewingKey(path?: string, promptUser?: boolean): Promise<LedgerViewingKey>;
    /**
     * Prompt user to get proof generation key associated with optional path, otherwise, use default path.
     * Throw exception if app is not initialized, zip32 is not supported, or key is not returned.
     * @async
     * @param [path] Zip32 path for deriving key
     * @param [promptUser] boolean to determine whether to display on Ledger device and require approval
     * @returns ShieldedKeys
     */
    getProofGenerationKey(path?: string, promptUser?: boolean): Promise<LedgerProofGenerationKey>;
    /**
     * Sign tx bytes with the key associated with the provided (or default) path.
     * Throw exception if app is not initialized.
     * @async
     * @param tx - tx data blob to sign
     * @param [path] Bip44 path for signing account
     * @returns Response signature
     */
    sign(tx: Uint8Array, path?: string): Promise<ResponseSign>;
    /**
     * Query status to determine if device has thrown an error.
     * Throw exception if app is not initialized.
     * @async
     * @returns Error message if error is found
     */
    queryErrors(): Promise<string>;
    /**
     * Close the initialized transport, which may be needed if Ledger needs to be reinitialized due to error state
     * Throw exception if app is not initialized.
     * @async
     * @returns void
     */
    closeTransport(): Promise<void>;
    /**
     * Check if Zip32 is supported by the installed app's version.
     * Throws error if app is not initialized
     * @async
     * @returns boolean
     */
    isZip32Supported(): Promise<boolean>;
    /**
     * Validate the version against the minimum required version and
     * device type for Zip32 functionality.
     * Throw error if it is unsupported or app is not initialized.
     * @async
     * @returns void
     */
    private validateZip32Support;
}
