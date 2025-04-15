var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import initWasm from "../../wasm/src/sdk/sdk";
import { Query as QueryWasm, Sdk as SdkWasm } from "../../wasm/src";
// We have to use relative imports here othewise ts-patch is getting confused and produces wrong paths after compialtion
export const init = (wasm) => __awaiter(void 0, void 0, void 0, function* () {
    return yield initWasm(wasm);
});
import { Sdk } from "../../lib/src";
/**
 * Query native token from the node
 * @async
 * @param rpc - URL of the node
 * @returns
 */
export function getNativeToken(rpc) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new QueryWasm(rpc).query_native_token();
    });
}
/**
 * Initialize the SDK memory
 * @async
 * @param props - SdkWasmOptions object
 * @returns - Sdk instance
 */
export function initSdk(props) {
    return __awaiter(this, void 0, void 0, function* () {
        const { rpcUrl, token, maspIndexerUrl, dbName = "" } = props;
        // Load and initialize sdk wasm
        const wasm = yield fetch("sdk.namada.wasm").then((wasm) => wasm.arrayBuffer());
        const { memory } = yield init(wasm);
        // Instantiate QueryWasm
        const query = new QueryWasm(rpcUrl, maspIndexerUrl);
        // Instantiate SdkWasm
        const sdk = new SdkWasm(rpcUrl, token, dbName);
        return new Sdk(sdk, query, memory, rpcUrl, token);
    });
}
/**
 * Export init promise directly
 */
export default init;
