import { Sdk } from "@namada/sdk-multicore";
import {
  IbcTransferMsgValue,
  ShieldedTransferMsgValue,
  ShieldingTransferMsgValue,
  TxResponseMsgValue,
  UnshieldingTransferMsgValue,
} from "@namada/types";
import BigNumber from "bignumber.js";
import * as Comlink from "comlink";
import { buildTx, EncodedTxData } from "lib/query";
import { namadaAsset, toDisplayAmount } from "utils";
import { initSdk } from "../../../../node_modules/@namada/sdk-multicore/dist/sdk-multicore/src/initInline";
import {
  Broadcast,
  BroadcastDone,
  GenerateIbcShieldingMemo,
  GenerateIbcShieldingMemoDone,
  IbcTransfer,
  IbcTransferDone,
  Init,
  InitDone,
  Shield,
  ShieldDone,
  ShieldedRewards,
  ShieldedRewardsDone,
  ShieldedRewardsPerToken,
  ShieldedRewardsPerTokenDone,
  ShieldedTransfer,
  ShieldedTransferDone,
  Unshield,
  UnshieldDone,
} from "./MaspTxMessages";
import { registerBNTransferHandler } from "./utils";

export class Worker {
  private sdk: Sdk | undefined;

  async init(m: Init): Promise<InitDone> {
    this.sdk = await initSdk({
      ...m.payload,
      maspIndexerUrl: m.payload.maspIndexerUrl || undefined,
    });
    return { type: "init-done", payload: null };
  }

  async shield(m: Shield): Promise<ShieldDone> {
    if (!this.sdk) {
      throw new Error("SDK is not initialized");
    }
    return {
      type: "shield-done",
      payload: await shield(this.sdk, m.payload),
    };
  }

  async unshield(m: Unshield): Promise<UnshieldDone> {
    if (!this.sdk) {
      throw new Error("SDK is not initialized");
    }
    return {
      type: "unshield-done",
      payload: await unshield(this.sdk, m.payload),
    };
  }

  async shieldedTransfer(m: ShieldedTransfer): Promise<ShieldedTransferDone> {
    if (!this.sdk) {
      throw new Error("SDK is not initialized");
    }
    return {
      type: "shielded-transfer-done",
      payload: await shieldedTransfer(this.sdk, m.payload),
    };
  }

  async generateIbcShieldingMemo(
    m: GenerateIbcShieldingMemo
  ): Promise<GenerateIbcShieldingMemoDone> {
    if (!this.sdk) {
      throw new Error("SDK is not initialized");
    }
    return {
      type: "generate-ibc-shielding-memo-done",
      payload: await generateIbcShieldingMemo(this.sdk, m.payload),
    };
  }

  async ibcTransfer(m: IbcTransfer): Promise<IbcTransferDone> {
    if (!this.sdk) {
      throw new Error("SDK is not initialized");
    }

    return {
      type: "ibc-transfer-done",
      payload: await ibcTransfer(this.sdk, m.payload),
    };
  }

  async shieldedRewards(m: ShieldedRewards): Promise<ShieldedRewardsDone> {
    if (!this.sdk) {
      throw new Error("SDK is not initialized");
    }

    return {
      type: "shielded-rewards-done",
      payload: await shieldedRewards(this.sdk, m.payload),
    };
  }

  async shieldedRewardsPerToken(
    m: ShieldedRewardsPerToken
  ): Promise<ShieldedRewardsPerTokenDone> {
    if (!this.sdk) {
      throw new Error("SDK is not initialized");
    }

    return {
      type: "shielded-rewards-per-token-done",
      payload: await shieldedRewardsPerToken(this.sdk, m.payload),
    };
  }

  async broadcast(m: Broadcast): Promise<BroadcastDone> {
    if (!this.sdk) {
      throw new Error("SDK is not initialized");
    }

    const res = await broadcast(this.sdk, m.payload);

    return { type: "broadcast-done", payload: res };
  }
}

async function shield(
  sdk: Sdk,
  payload: Shield["payload"]
): Promise<EncodedTxData<ShieldingTransferMsgValue>> {
  const {
    publicKeyRevealed,
    account,
    gasConfig,
    chain,
    props: shieldingProps,
    memo,
  } = payload;

  await sdk.masp.loadMaspParams("", chain.chainId);
  const encodedTxData = await buildTx<ShieldingTransferMsgValue>(
    sdk,
    account,
    gasConfig,
    chain,
    shieldingProps,
    sdk.tx.buildShieldingTransfer,
    memo,
    !publicKeyRevealed
  );

  return encodedTxData;
}

async function unshield(
  sdk: Sdk,
  payload: Unshield["payload"]
): Promise<EncodedTxData<UnshieldingTransferMsgValue>> {
  const { account, gasConfig, chain, props } = payload;
  await sdk.masp.loadMaspParams("", chain.chainId);
  const encodedTxData = await buildTx<UnshieldingTransferMsgValue>(
    sdk,
    account,
    gasConfig,
    chain,
    props,
    sdk.tx.buildUnshieldingTransfer,
    undefined,
    false
  );

  return encodedTxData;
}

async function shieldedTransfer(
  sdk: Sdk,
  payload: ShieldedTransfer["payload"]
): Promise<EncodedTxData<ShieldedTransferMsgValue>> {
  const { account, gasConfig, chain, props } = payload;
  await sdk.masp.loadMaspParams("", chain.chainId);
  const encodedTxData = await buildTx<ShieldedTransferMsgValue>(
    sdk,
    account,
    gasConfig,
    chain,
    props,
    sdk.tx.buildShieldedTransfer,
    undefined,
    false
  );

  return encodedTxData;
}

async function ibcTransfer(
  sdk: Sdk,
  payload: IbcTransfer["payload"]
): Promise<EncodedTxData<IbcTransferMsgValue>> {
  const { account, gasConfig, chain, props, publicKeyRevealed } = payload;

  await sdk.masp.loadMaspParams("", chain.chainId);
  const encodedTxData = await buildTx<IbcTransferMsgValue>(
    sdk,
    account,
    gasConfig,
    chain,
    props,
    sdk.tx.buildIbcTransfer,
    undefined,
    !publicKeyRevealed
  );

  return encodedTxData;
}

async function generateIbcShieldingMemo(
  sdk: Sdk,
  payload: GenerateIbcShieldingMemo["payload"]
): Promise<string> {
  const { target, token, amount, destinationChannelId, chainId } = payload;
  await sdk.masp.loadMaspParams("", chainId);

  const memo = await sdk.tx.generateIbcShieldingMemo(
    target,
    token,
    amount,
    destinationChannelId
  );

  return memo;
}

// TODO: Move this to separate worker
async function shieldedRewardsPerToken(
  sdk: Sdk,
  payload: ShieldedRewardsPerToken["payload"]
): Promise<Record<string, BigNumber>> {
  const { viewingKey, tokens, chainId } = payload;
  await sdk.masp.loadMaspParams("", chainId);

  // const www = await sdk.rpc.shieldedRewardsPerToken(viewingKey.key, chainId);
  const rewards = await Promise.all(
    tokens.map((token) =>
      sdk.rpc
        .shieldedRewardsPerToken(viewingKey, token, chainId)
        .then((amount) => ({
          [token]: toDisplayAmount(namadaAsset(), BigNumber(amount)),
        }))
    )
  );

  return rewards.reduce((acc, r) => ({ ...acc, ...r }), {});
}

// TODO: Move this to separate worker
async function shieldedRewards(
  sdk: Sdk,
  payload: ShieldedRewards["payload"]
): Promise<string> {
  const { viewingKey, chainId } = payload;
  await sdk.masp.loadMaspParams("", chainId);

  return await sdk.rpc.shieldedRewards(viewingKey, chainId);
}

// TODO: We will probably move this to the separate worker
async function broadcast(
  sdk: Sdk,
  payload: Broadcast["payload"]
): Promise<TxResponseMsgValue[]> {
  const { encodedTxData, signedTxs } = payload;

  const result: TxResponseMsgValue[] = [];

  for await (const signedTx of signedTxs) {
    for await (const _ of encodedTxData.txs) {
      const response = await sdk.rpc.broadcastTx(signedTx, BigInt(120));
      result.push(response);
    }
  }
  return result;
}

export const registerTransferHandlers = (): void => {
  registerBNTransferHandler<ShieldDone>("shield-done");
  registerBNTransferHandler<Shield>("shield");
  registerBNTransferHandler<ShieldedTransferDone>("shielded-transfer-done");
  registerBNTransferHandler<ShieldedTransfer>("shielded-transfer");
  registerBNTransferHandler<UnshieldDone>("unshield-done");
  registerBNTransferHandler<IbcTransfer>("ibc-transfer");
  registerBNTransferHandler<IbcTransferDone>("ibc-transfer-done");
  registerBNTransferHandler<Unshield>("unshield");
  registerBNTransferHandler<GenerateIbcShieldingMemo>(
    "generate-ibc-shielding-memo"
  );
  registerBNTransferHandler<ShieldedRewardsPerToken>(
    "shielded-rewards-per-token"
  );
  registerBNTransferHandler<ShieldedRewardsPerTokenDone>(
    "shielded-rewards-per-token-done"
  );
  registerBNTransferHandler<ShieldedRewards>("shielded-rewards");
  registerBNTransferHandler<ShieldedRewardsDone>("shielded-rewards-done");
  registerBNTransferHandler<Broadcast>("broadcast");
};

registerTransferHandlers();
Comlink.expose(new Worker());
