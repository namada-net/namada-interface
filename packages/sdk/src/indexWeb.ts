import { Query as QueryWasm, Sdk as SdkWasm } from "@namada/shared";
import { Sdk } from "./index";
export * from "./index";
export * from "./utils";

/**
 * Get the SDK instance
 * @async
 * @param cryptoMemory - WebAssembly.Memory of crypto package
 * @param url - URL of the node
 * @param maspIndexerUrl - optional URL of the MASP indexer
 * @param dbName - Name of the database for the serialized wallet
 * @param [token] - Native token of the chain
 * @throws {Error} - Unable to Query native token
 * @returns - Sdk instance
 */
export function getSdk(
  cryptoMemory: WebAssembly.Memory,
  url: string,
  maspIndexerUrl: string,
  dbName: string,
  token: string
): Sdk {
  // We change empty string to undefined so it "maps" to the Option<String> in Rust
  const maspIndexerUrlOpt =
    maspIndexerUrl.length === 0 ? undefined : maspIndexerUrl;
  // Instantiate QueryWasm
  const query = new QueryWasm();

  // Instantiate SdkWasm
  const sdk = new SdkWasm();
  return new Sdk(sdk, query, cryptoMemory, url, token);
}

/**
 * Query native token from the node
 * @async
 * @param rpc - URL of the node
 * @returns
 */
export async function getNativeToken(rpc: string): Promise<string> {
  return await new QueryWasm().query_native_token();
}
