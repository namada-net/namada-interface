import { Sdk, SdkEvents } from "@namada/sdk-multicore";
import { initSdk } from "@namada/sdk-multicore/inline";
import * as Comlink from "comlink";
import { Init, InitDone, Sync, SyncDone } from "./ShieldedSyncMessages";

export type ProgressBarStarted = {
  type: SdkEvents.ProgressBarStarted;
  name: string;
};
export type ProgressBarIncremented = {
  type: SdkEvents.ProgressBarIncremented;
  name: string;
  current: number;
  total: number;
};

export type ProgressBarFinished = {
  type: SdkEvents.ProgressBarFinished;
  name: string;
};
export type Events =
  | ProgressBarStarted
  | ProgressBarIncremented
  | ProgressBarFinished;

export class Worker {
  private sdk: Sdk | undefined;

  async init(m: Init): Promise<InitDone> {
    this.sdk = await initSdk({
      ...m.payload,
      maspIndexerUrl: m.payload.maspIndexerUrl || undefined,
    });

    // TODO: this can be reduced to one event listener
    addEventListener(SdkEvents.ProgressBarStarted, (e) => {
      const event = e as CustomEvent<string>;
      const payload = JSON.parse(event.detail);
      postMessage({ ...payload, type: SdkEvents.ProgressBarStarted });
    });

    addEventListener(SdkEvents.ProgressBarIncremented, (e) => {
      const event = e as CustomEvent<string>;
      const payload = JSON.parse(event.detail);
      postMessage({ ...payload, type: SdkEvents.ProgressBarIncremented });
    });

    addEventListener(SdkEvents.ProgressBarFinished, (e) => {
      const event = e as CustomEvent<string>;
      const payload = JSON.parse(event.detail);
      postMessage({ ...payload, type: SdkEvents.ProgressBarFinished });
    });

    return { type: "init-done", payload: null };
  }

  async sync(m: Sync): Promise<SyncDone> {
    if (!this.sdk) {
      throw new Error("SDK is not initialized");
    }

    await shieldedSync(this.sdk, m.payload);
    return { type: "sync-done", payload: null };
  }
}

async function shieldedSync(sdk: Sdk, payload: Sync["payload"]): Promise<void> {
  const maxRetries = 10;
  const baseDelayMs = 100;
  const maxDelayMs = 1000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await sdk.rpc.shieldedSync(payload.vks, payload.chainId);
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        break;
      }

      const delay = Math.min(baseDelayMs * (attempt + 1), maxDelayMs);

      console.warn(
        `shieldedSync attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
        error
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error(`shieldedSync failed after ${maxRetries + 1} attempts.`);
}

Comlink.expose(new Worker());
