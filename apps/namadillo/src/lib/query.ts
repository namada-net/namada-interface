import { Sdk } from "@namada/sdk/web";
import {
  Account,
  AccountType,
  TxMsgValue,
  TxProps,
  TxResponseMsgValue,
  WrapperTxProps,
} from "@namada/types";
import { getIndexerApi } from "atoms/api";
import { chainParametersAtom } from "atoms/chain";
import { NamadaKeychain } from "hooks/useNamadaKeychain";
import invariant from "invariant";
import { getDefaultStore } from "jotai";
import { Address, ChainSettings, GasConfig } from "types";
import {
  TransactionEventsClasses,
  TransactionEventsStatus,
} from "types/events";
import { textToErrorDetail, toErrorDetail } from "utils";
import { getSdkInstance } from "utils/sdk";

export type TransactionPair<T> = {
  encodedTxData: EncodedTxData<T>;
  signedTxs: Uint8Array[];
};

export type EncodedTxData<T> = {
  type: string;
  txs: (TxProps & {
    innerTxHashes: string[];
  })[];
  wrapperTxProps: WrapperTxProps;
  meta?: {
    props: T[];
  };
};

export type TransactionNotification = {
  success?: { title: string; text: string };
  error?: { title: string; text: string };
};

export type PreparedTransaction<T> = {
  encodedTx: WrapperTxProps;
  signedTx: Uint8Array;
  meta: T;
};

export const revealPublicKeyType = "revealPublicKey";

const getTxProps = (
  account: Account,
  gasConfig: GasConfig,
  chain: ChainSettings,
  memo?: string
): WrapperTxProps => {
  invariant(
    !!account.publicKey,
    "Account doesn't contain a publicKey attached to it"
  );

  return {
    token: gasConfig.gasToken,
    feeAmount: gasConfig.gasPriceInMinDenom,
    gasLimit: gasConfig.gasLimit,
    chainId: chain.chainId,
    publicKey: account.publicKey!,
    memo,
  };
};

export const isPublicKeyRevealed = async (
  address: Address
): Promise<boolean> => {
  const api = getIndexerApi();
  let publicKey: string | undefined;
  try {
    publicKey = (await api.apiV1RevealedPublicKeyAddressGet(address)).data
      ?.publicKey;
  } catch {}
  return Boolean(publicKey);
};

/**
 * Builds an batch  transactions based on the provided query properties.
 * Each transaction is built through the provided transaction function `txFn`.
 * @param {T[]} queryProps - An array of properties used to build transactions.
 * @param {(WrapperTxProps, T) => Promise<TxMsgValue>} txFn - Function to build each transaction.
 */
export const buildTx = async <T>(
  sdk: Sdk,
  account: Account,
  gasConfig: GasConfig,
  chain: ChainSettings,
  queryProps: T[],
  txFn: (wrapperTxProps: WrapperTxProps, props: T) => Promise<TxMsgValue>,
  memo?: string,
  shouldRevealPk: boolean = true
): Promise<EncodedTxData<T>> => {
  const wrapperTxProps = getTxProps(account, gasConfig, chain, memo);
  const txs: TxMsgValue[] = [];
  const txProps: TxProps[] = [];

  // Determine if RevealPK is needed:
  if (shouldRevealPk) {
    const publicKeyRevealed = await isPublicKeyRevealed(account.address);
    if (!publicKeyRevealed) {
      const revealPkTx = await sdk.tx.buildRevealPk(wrapperTxProps);
      txs.push(revealPkTx);
    }
  }

  for (const props of queryProps) {
    const tx = await txFn.apply(sdk.tx, [wrapperTxProps, props]);
    txs.push(tx);
  }

  if (account.type === AccountType.Ledger) {
    txProps.push(...txs);
  } else {
    txProps.push(sdk.tx.buildBatch(txs));
  }

  return {
    txs: txProps.map(({ args, hash, bytes, signingData }) => {
      const innerTxHashes = sdk.tx.getInnerTxHashes(bytes);
      return {
        args,
        hash,
        bytes,
        signingData,
        innerTxHashes,
      };
    }),
    wrapperTxProps,
    type: txFn.name,
    meta: {
      props: queryProps,
    },
  };
};

/**
 * Asynchronously signs an encoded batch transaction using Namada extension.
 */
export const signTx = async <T>(
  typedEncodedTx: EncodedTxData<T>,
  owner: string
): Promise<Uint8Array[]> => {
  const namada = await new NamadaKeychain().get();
  const signingClient = namada?.getSigner();

  const store = getDefaultStore();
  const { data: chainParameters } = store.get(chainParametersAtom);
  const checksums = chainParameters?.checksums;

  try {
    // Sign txs
    const signedTxBytes = await signingClient?.sign(
      typedEncodedTx.txs,
      owner,
      checksums
    );

    if (!signedTxBytes) {
      throw new Error("Signing batch Tx failed");
    }

    return signedTxBytes;
  } catch (err) {
    const message = err instanceof Error ? err.message : err;
    throw new Error("Signing failed: " + message);
  }
};

/**
 * Builds an array of **transaction pairs**. Each transaction pair consists of a signed
 * transaction and its corresponding encoded transaction data.
 *
 * Encoded transaction data includes the transaction itself along with additional metadata
 * that holds the initial values used for its creation.
 *
 */
export const signEncodedTx = async <T>(
  encodedTxData: EncodedTxData<T>,
  owner: Address
): Promise<TransactionPair<T>> => {
  const signedTxs = await signTx<T>(encodedTxData, owner);
  return {
    signedTxs,
    encodedTxData,
  };
};

export const broadcastTransaction = async <T>(
  encodedTx: EncodedTxData<T>,
  signedTxs: Uint8Array[]
): Promise<PromiseSettledResult<[EncodedTxData<T>, TxResponseMsgValue]>[]> => {
  const { rpc } = await getSdkInstance();
  const response = await Promise.allSettled(
    encodedTx.txs.map((_, i) =>
      rpc
        .broadcastTx(signedTxs[i])
        .then(
          (res) => [encodedTx, res] as [EncodedTxData<T>, TxResponseMsgValue]
        )
    )
  );

  return response;
};

// We use this to prevent dispatching events for transfer events
// as they are handled by useTransactionWatcher
export const isTransferEventType = (
  eventType?: TransactionEventsClasses
): boolean => {
  return eventType ?
      [
        "IbcTransfer",
        "ShieldedTransfer",
        "TransparentTransfer",
        "ShieldedTransfer",
        "UnshieldingTransfer",
      ].includes(eventType)
    : false;
};

export const broadcastTxWithEvents = async <T>(
  encodedTx: EncodedTxData<T>,
  signedTxs: Uint8Array[],
  data?: T[],
  eventType?: TransactionEventsClasses
): Promise<void> => {
  if (encodedTx.txs.length !== signedTxs.length) {
    throw new Error("Did not receive enough signatures!");
  }

  !isTransferEventType(eventType) &&
    window.dispatchEvent(
      new CustomEvent(`${eventType}.Pending`, {
        detail: { tx: encodedTx.txs, data },
      })
    );

  const results = await broadcastTransaction(encodedTx, signedTxs);
  const hashes = encodedTx.txs
    .map((tx) => (tx as TxProps & { innerTxHashes: string[] }).innerTxHashes)
    .flat();

  try {
    const resolvedResults = results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        throw new Error(toErrorDetail(encodedTx.txs, result.reason));
      }
    });

    const { status, successData, failedData } = parseTxAppliedErrors(
      resolvedResults,
      hashes,
      data!
    );

    // Notification
    !isTransferEventType(eventType) &&
      window.dispatchEvent(
        new CustomEvent(`${eventType}.${status}`, {
          detail: {
            tx: encodedTx.txs,
            data,
            successData,
            failedData,
          },
        })
      );
  } catch (error) {
    !isTransferEventType(eventType) &&
      window.dispatchEvent(
        new CustomEvent(`${eventType}.Error`, {
          detail: {
            tx: encodedTx.txs,
            data,
            error,
          },
        })
      );
    throw error;
  }
};

type TxAppliedResults<T> = {
  status: TransactionEventsStatus;
  successData?: T[];
  failedData?: { value: T; error?: string }[];
};

type Hash = string;
type Error = string | undefined;
// Given an array of broadcasted Tx results,
// collect any errors
const parseTxAppliedErrors = <T>(
  results: [EncodedTxData<T>, TxResponseMsgValue][],
  txHashes: Hash[],
  data: T[]
): TxAppliedResults<T> => {
  const txErrors: [Hash, Error][] = [];
  const dataWithHash = data?.map((d, i) => ({
    ...d,
    hash: txHashes[i],
  }));

  results.forEach(([encodedTx, result]) => {
    result.commitments.forEach((batchTxResult) => {
      const { hash, isApplied, error } = batchTxResult;
      if (!isApplied) {
        txErrors.push([
          hash,
          error && textToErrorDetail(error, encodedTx.txs[0]),
        ]);
      }
    });
  });

  if (txErrors.length) {
    const successData = dataWithHash?.filter((data) => {
      return !txErrors.find(([hash]) => hash === data.hash);
    });

    // flatMap because js does not have filterMap
    const failedData = dataWithHash?.flatMap((data) => {
      const err = txErrors.find(([hash]) => hash === data.hash);
      return err ? [{ value: data, error: err[1] }] : [];
    });

    if (successData?.length) {
      return {
        status: "PartialSuccess",
        successData,
        failedData,
      };
    } else {
      return { status: "Error", failedData };
    }
  }

  return { status: "Success" };
};
