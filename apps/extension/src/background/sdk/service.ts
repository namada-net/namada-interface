import { initSdk, Sdk } from "@namada/sdk";

const {
  NAMADA_INTERFACE_NAMADA_TOKEN:
    defaultTokenAddress = "tnam1qxgfw7myv4dh0qna4hq0xdg6lx77fzl7dcem8h7e",
} = process.env;

// Extension does not use RPC URL
const RPC_URL = "";

export class SdkService {
  private constructor(private readonly sdk: Sdk) {}

  static async init(): Promise<SdkService> {
    const sdk = await initSdk({
      rpcUrl: RPC_URL,
      token: defaultTokenAddress,
    });

    return new SdkService(sdk);
  }

  getSdk(): Sdk {
    return this.sdk;
  }
}
