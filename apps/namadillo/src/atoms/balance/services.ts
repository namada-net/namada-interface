import * as Comlink from "comlink";

import {
  Balance,
  DatedViewingKey,
  MaxMaspTxAmountProps,
  NotesAndConversions,
  ProgressBarNames,
  SdkEvents,
} from "@namada/sdk-multicore";
import { getSdkInstance } from "utils/sdk";
import {
  Events,
  ProgressBarFinished,
  ProgressBarIncremented,
  ProgressBarStarted,
  Worker as ShieldedSyncWorkerApi,
} from "workers/ShieldedSyncWorker";
import ShieldedSyncWorker from "workers/ShieldedSyncWorker?worker";
// TODO: move to @namada/types?
import BigNumber from "bignumber.js";
import { EstimateMaxMaspTxAmountByNotes } from "workers/MaspTxMessages";
import {
  Worker as MaspTxWorkerApi,
  registerTransferHandlers,
} from "workers/MaspTxWorker";
import MaspTxWorker from "workers/MaspTxWorker?worker";

export type ShieldedSyncEventMap = {
  [SdkEvents.ProgressBarStarted]: ProgressBarStarted[];
  [SdkEvents.ProgressBarIncremented]: ProgressBarIncremented[];
  [SdkEvents.ProgressBarFinished]: ProgressBarFinished[];
};

let runningShieldedSync: Promise<void> | undefined;

export async function shieldedSync({
  rpcUrl,
  maspIndexerUrl,
  token,
  viewingKeys,
  chainId,
  onProgress,
}: {
  rpcUrl: string;
  maspIndexerUrl?: string;
  token: string;
  viewingKeys: DatedViewingKey[];
  chainId: string;
  onProgress?: (perc: number) => void;
}): Promise<void> {
  // If there is a sync running, wait until it is finished to run another.
  // This is important because we could want to queue a new sync after
  // a transaction is completed but there is already one sync in progress
  if (runningShieldedSync) {
    await runningShieldedSync;
  }

  const executeSync = async (): Promise<void> => {
    const worker = new ShieldedSyncWorker();
    worker.onmessage = ({ data }: MessageEvent<Events>) => {
      if (!onProgress) {
        return;
      }
      if (
        data.type === SdkEvents.ProgressBarIncremented &&
        data.name === ProgressBarNames.Fetched
      ) {
        if (onProgress) {
          const { current, total } = data;
          const perc =
            total === 0 ? 0 : Math.max(0, Math.min(1, current / total));
          onProgress(perc);
        }
      }
      if (
        data.type === SdkEvents.ProgressBarFinished &&
        data.name === ProgressBarNames.Fetched
      ) {
        onProgress(1);
      }
    };
    try {
      const shieldedSyncWorker = Comlink.wrap<ShieldedSyncWorkerApi>(worker);
      await shieldedSyncWorker.init({
        type: "init",
        payload: { rpcUrl, maspIndexerUrl, token },
      });
      await shieldedSyncWorker.sync({
        type: "sync",
        payload: { vks: viewingKeys, chainId },
      });
    } finally {
      worker.terminate();
    }
  };

  runningShieldedSync = executeSync();
  return runningShieldedSync;
}

export const fetchShieldedBalance = async (
  viewingKey: DatedViewingKey,
  addresses: string[],
  chainId: string
): Promise<Balance> => {
  const sdk = await getSdkInstance();
  return await sdk.rpc.queryBalance(viewingKey.key, addresses, chainId);
};

export const getNotesAndConversions = async (
  viewingKey: string,
  chainId: string
): Promise<NotesAndConversions> => {
  const sdk = await getSdkInstance();
  const worker = new MaspTxWorker();
  const workerLink = Comlink.wrap<MaspTxWorkerApi>(worker);
  await workerLink.init({
    type: "init",
    payload: {
      // TODO:
      rpcUrl: "https://namada-rpc.emberstake.xyz",
      token: sdk.nativeToken,
      maspIndexerUrl: "",
    },
  });

  const res = await workerLink.notesAndConversions({
    type: "notes-and-conversions",
    payload: { viewingKey, chainId },
  });
  worker.terminate();

  return res.payload;
};

export const estimateMaxMaspTxAmountByNotes = async (
  props: MaxMaspTxAmountProps,
  chainId: string
): Promise<boolean> => {
  const sdk = await getSdkInstance();
  return await sdk.masp.estimateMaxMaspTxAmount(props, chainId);
};

export const estimateMaxMaspTxAmountByNotesWorker = async (
  //TODO: do not reuse worker type here
  props: EstimateMaxMaspTxAmountByNotes["payload"]
): Promise<boolean> => {
  registerTransferHandlers();
  const sdk = await getSdkInstance();
  const worker = new MaspTxWorker();
  const workerLink = Comlink.wrap<MaspTxWorkerApi>(worker);
  await workerLink.init({
    type: "init",
    payload: {
      // TODO:
      rpcUrl: "https://namada-rpc.emberstake.xyz",
      token: sdk.nativeToken,
      maspIndexerUrl: "",
    },
  });

  const res = await workerLink.estimateMaxMaspTxAmountByNotes({
    type: "estimate-max-masp-tx-amount-by-notes",
    payload: props,
  });
  worker.terminate();

  return res.payload;
};

// const reduceNotes = (
//   x: number,
//   sortedNotes: [string, string?][]
// ): BigNumber => {
//   const amount = sortedNotes.slice(0, x).reduce((acc, [note, conv]) => {
//     const val = conv ? BigNumber(conv) : BigNumber(note);
//     return acc.plus(val);
//   }, BigNumber(0));

//   return BigNumber(amount);
// };

export const fetchShieldedRewards = async (
  viewingKey: DatedViewingKey,
  chainId: string,
  rpcUrl: string
): Promise<string> => {
  registerTransferHandlers();
  const sdk = await getSdkInstance();
  const worker = new MaspTxWorker();
  const workerLink = Comlink.wrap<MaspTxWorkerApi>(worker);
  await workerLink.init({
    type: "init",
    payload: { rpcUrl, token: sdk.nativeToken, maspIndexerUrl: "" },
  });

  const { payload: rewards } = await workerLink.shieldedRewards({
    type: "shielded-rewards",
    payload: {
      viewingKey: viewingKey.key,
      chainId,
    },
  });
  worker.terminate();

  return rewards;
};

export const fetchShieldedRewardsPerToken = async (
  viewingKey: DatedViewingKey,
  tokens: string[],
  chainId: string,
  rpcUrl: string
): Promise<Record<string, BigNumber>> => {
  registerTransferHandlers();
  const sdk = await getSdkInstance();
  const worker = new MaspTxWorker();
  const workerLink = Comlink.wrap<MaspTxWorkerApi>(worker);
  await workerLink.init({
    type: "init",
    payload: { rpcUrl, token: sdk.nativeToken, maspIndexerUrl: "" },
  });

  const { payload: rewards } = await workerLink.shieldedRewardsPerToken({
    type: "shielded-rewards-per-token",
    payload: {
      viewingKey: viewingKey.key,
      tokens,
      chainId,
    },
  });
  worker.terminate();

  return rewards;
};
