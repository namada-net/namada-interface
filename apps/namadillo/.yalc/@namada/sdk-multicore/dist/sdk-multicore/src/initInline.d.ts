import { InitOutput } from "../../wasm/src/sdk/sdk";
export declare const init: () => Promise<InitOutput>;
import { Sdk, SdkWasmOptions } from "../../lib/src";
/**
 * Query native token from the node
 * @async
 * @param rpc - URL of the node
 * @returns
 */
export declare function getNativeToken(rpc: string): Promise<string>;
/**
 * Initialize the SDK memory
 * @async
 * @param props - SdkWasmOptions object
 * @returns - Sdk instance
 */
export declare function initSdk(props: SdkWasmOptions): Promise<Sdk>;
/**
 * Export init promise directly
 */
export default init;
