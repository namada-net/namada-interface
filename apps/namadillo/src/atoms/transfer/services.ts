import {
  Account,
  AccountType,
  BparamsMsgValue,
  GenDisposableSignerResponse,
  IbcTransferMsgValue,
  IbcTransferProps,
  ShieldedTransferMsgValue,
  ShieldedTransferProps,
  ShieldingTransferMsgValue,
  ShieldingTransferProps,
  TransparentTransferMsgValue,
  TransparentTransferProps,
  UnshieldingTransferMsgValue,
  UnshieldingTransferProps,
} from "@namada/types";
import BigNumber from "bignumber.js";
import * as Comlink from "comlink";
import { NamadaKeychain } from "hooks/useNamadaKeychain";
import { buildTx, EncodedTxData, isPublicKeyRevealed } from "lib/query";
import { Address, ChainSettings, GasConfig } from "types";
import { getSdkInstance } from "utils/sdk";
import {
  IbcTransfer,
  Shield,
  ShieldedTransfer,
  Unshield,
} from "workers/MaspTxMessages";
import {
  registerTransferHandlers as maspTxRegisterTransferHandlers,
  Worker as MaspTxWorkerApi,
} from "workers/MaspTxWorker";
import MaspTxWorker from "workers/MaspTxWorker?worker";

export type WorkerTransferParams = {
  sourceAddress: Address;
  destinationAddress: Address;
  tokenAddress: Address;
  amount: BigNumber;
  gasConfig: GasConfig;
};

const workerBuildTxPair = async <T>({
  rpcUrl,
  nativeToken,
  buildTxFn,
}: {
  rpcUrl: string;
  nativeToken: Address;
  buildTxFn: (
    workerLink: Comlink.Remote<MaspTxWorkerApi>
  ) => Promise<EncodedTxData<T>>;
}): Promise<EncodedTxData<T>> => {
  maspTxRegisterTransferHandlers();
  const worker = new MaspTxWorker();
  const workerLink = Comlink.wrap<MaspTxWorkerApi>(worker);
  await workerLink.init({
    type: "init",
    payload: { rpcUrl, token: nativeToken, maspIndexerUrl: "" },
  });
  const encodedTxData = await buildTxFn(workerLink);
  worker.terminate();
  return encodedTxData;
};

export const getDisposableSigner =
  async (): Promise<GenDisposableSignerResponse> => {
    const namada = await new NamadaKeychain().get();
    const disposableSigner = await namada?.getSigner().genDisposableKeypair();
    if (!disposableSigner) {
      throw new Error("No signer available");
    }
    return disposableSigner;
  };

export const persistDisposableSigner = async (
  address: string
): Promise<void> => {
  const namada = await new NamadaKeychain().get();
  await namada?.getSigner().persistDisposableKeypair(address);
};

export const clearDisposableSigner = async (address: string): Promise<void> => {
  const namada = await new NamadaKeychain().get();
  await namada?.getSigner().clearDisposableKeypair(address);
};

export const createTransparentTransferTx = async (
  chain: ChainSettings,
  account: Account,
  props: TransparentTransferMsgValue[],
  gasConfig: GasConfig,
  memo?: string
): Promise<EncodedTxData<TransparentTransferProps> | undefined> => {
  const sdk = await getSdkInstance();
  return await buildTx(
    sdk,
    account,
    gasConfig,
    chain,
    props,
    sdk.tx.buildTransparentTransfer,
    memo
  );
};

/**
 * "Shielded transfer" refers to transfers between two shielded addresses.
 */
export const createShieldedTransferTx = async (
  chain: ChainSettings,
  account: Account,
  props: ShieldedTransferMsgValue[],
  gasConfig: GasConfig,
  rpcUrl: string,
  disposableSigner: GenDisposableSignerResponse,
  memo?: string
): Promise<EncodedTxData<ShieldedTransferProps> | undefined> => {
  const { publicKey: signerPublicKey } = disposableSigner;
  const source = props[0]?.data[0]?.source;
  const destination = props[0]?.data[0]?.target;
  const token = props[0]?.data[0]?.token;
  const amount = props[0]?.data[0]?.amount;

  let bparams: BparamsMsgValue[] | undefined;

  if (account.type === AccountType.Ledger) {
    const sdk = await getSdkInstance();
    const ledger = await sdk.initLedger();
    bparams = await ledger.getBparams();
    ledger.closeTransport();
  }

  return await workerBuildTxPair({
    rpcUrl,
    nativeToken: chain.nativeTokenAddress,
    buildTxFn: async (workerLink) => {
      const msgValue = new ShieldedTransferMsgValue({
        gasSpendingKey: source,
        data: [{ source, target: destination, token, amount }],
        bparams,
      });
      const msg: ShieldedTransfer = {
        type: "shielded-transfer",
        payload: {
          account: {
            ...account,
            publicKey: signerPublicKey,
          },
          gasConfig,
          props: [msgValue],
          chain,
          memo,
        },
      };
      return (await workerLink.shieldedTransfer(msg)).payload;
    },
  });
};

/**
 * "Shielding transfer" refers to transfers from a transparent address to a shielded address.
 */
export const createShieldingTransferTx = async (
  chain: ChainSettings,
  account: Account,
  props: ShieldingTransferMsgValue[],
  gasConfig: GasConfig,
  rpcUrl: string,
  memo?: string
): Promise<EncodedTxData<ShieldingTransferProps> | undefined> => {
  const source = props[0]?.data[0]?.source;
  const destination = props[0]?.target;
  const token = props[0]?.data[0]?.token;
  const amount = props[0]?.data[0]?.amount;

  let bparams: BparamsMsgValue[] | undefined;

  if (account.type === AccountType.Ledger) {
    const sdk = await getSdkInstance();
    const ledger = await sdk.initLedger();
    bparams = await ledger.getBparams();
    ledger.closeTransport();
  }

  return await workerBuildTxPair({
    rpcUrl,
    nativeToken: chain.nativeTokenAddress,
    buildTxFn: async (workerLink) => {
      const publicKeyRevealed = await isPublicKeyRevealed(account.address);
      const msgValue = new ShieldingTransferMsgValue({
        target: destination,
        data: [{ source, token, amount }],
        bparams,
      });
      const msg: Shield = {
        type: "shield",
        payload: {
          account,
          gasConfig,
          props: [msgValue],
          chain,
          publicKeyRevealed,
          memo,
        },
      };
      return (await workerLink.shield(msg)).payload;
    },
  });
};

/**
 * "Unshielding transfer" refers to transfers from a shielded address to a transparent address.
 */
export const createUnshieldingTransferTx = async (
  chain: ChainSettings,
  account: Account,
  props: UnshieldingTransferMsgValue[],
  gasConfig: GasConfig,
  rpcUrl: string,
  disposableSigner: GenDisposableSignerResponse,
  memo?: string
): Promise<EncodedTxData<UnshieldingTransferProps> | undefined> => {
  const { publicKey: signerPublicKey, address: signerAddress } =
    disposableSigner;

  const source = props[0]?.source;
  const destination = props[0]?.data[0]?.target;
  const token = props[0]?.data[0]?.token;
  const amount = props[0]?.data[0]?.amount;

  let bparams: BparamsMsgValue[] | undefined;

  if (account.type === AccountType.Ledger) {
    const sdk = await getSdkInstance();
    const ledger = await sdk.initLedger();
    bparams = await ledger.getBparams();
    ledger.closeTransport();
  }

  return await workerBuildTxPair({
    rpcUrl,
    nativeToken: chain.nativeTokenAddress,
    buildTxFn: async (workerLink) => {
      const feePaymentMsgValue = new UnshieldingTransferMsgValue({
        source,
        data: [
          {
            target: signerAddress,
            token,
            amount: gasConfig.gasPriceInMinDenom.times(gasConfig.gasLimit),
          },
        ],
        bparams,
        skipFeeCheck: true,
      });
      const feePaymentMsgValueWithMemo = {
        ...feePaymentMsgValue,
        memo: "MASP_FEE_PAYMENT",
      };

      const msgValue = new UnshieldingTransferMsgValue({
        source,
        data: [{ target: destination, token, amount }],
        bparams,
        skipFeeCheck: true,
      });
      const msg: Unshield = {
        type: "unshield",
        payload: {
          account: {
            ...account,
            publicKey: signerPublicKey,
          },
          gasConfig,
          props: [feePaymentMsgValueWithMemo, msgValue],
          chain,
          memo,
        },
      };
      return (await workerLink.unshield(msg)).payload;
    },
  });
};

export const createIbcTx = async (
  chain: ChainSettings,
  account: Account,
  props: IbcTransferProps[],
  gasConfig: GasConfig,
  rpcUrl: string,
  signerPublicKey: string,
  memo?: string
): Promise<EncodedTxData<IbcTransferProps>> => {
  let bparams: BparamsMsgValue[] | undefined;
  if (account.type === AccountType.Ledger) {
    const sdk = await getSdkInstance();
    const ledger = await sdk.initLedger();
    bparams = await ledger.getBparams();
    ledger.closeTransport();
  }

  return await workerBuildTxPair({
    rpcUrl,
    nativeToken: chain.nativeTokenAddress,
    buildTxFn: async (workerLink) => {
      const msgValue = new IbcTransferMsgValue({
        ...props[0],
        gasSpendingKey: props[0].gasSpendingKey,
        bparams,
      });

      // We only check if we need to reveal the public key if the gas spending key is not provided
      const publicKeyRevealed =
        Boolean(msgValue.gasSpendingKey) ||
        (await isPublicKeyRevealed(account.address));

      const msg: IbcTransfer = {
        type: "ibc-transfer",
        payload: {
          account: {
            ...account,
            publicKey: signerPublicKey,
          },
          gasConfig,
          props: [msgValue],
          chain,
          memo,
          publicKeyRevealed,
        },
      };

      return (await workerLink.ibcTransfer(msg)).payload;
    },
  });
};
