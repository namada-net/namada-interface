import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { defaultAccountAtom } from "atoms/accounts";
import {
  dispatchToastNotificationAtom,
  getNotificationId,
} from "atoms/notifications";
import { getDisposableSigner } from "atoms/transfer/services";
import invariant from "invariant";
import { Atom, useAtomValue, useSetAtom } from "jotai";
import { AtomWithMutationResult } from "jotai-tanstack-query";
import {
  broadcastTxWithEvents,
  EncodedTxData,
  signTx,
  TransactionPair,
} from "lib/query";
import { BuildTxAtomParams, ToastNotification } from "types";
import { TransactionError } from "types/errors";
import { TransactionEventTypes } from "types/events";
import { TransactionFeeProps, useTransactionFee } from "./useTransactionFee";

type AtomType<T> = Atom<
  AtomWithMutationResult<
    EncodedTxData<T> | undefined,
    unknown,
    BuildTxAtomParams<T>,
    unknown
  >
>;

type PartialNotification = Pick<ToastNotification, "title" | "description">;

export type UseTransactionPropsEvents<T> = {
  onSigned?: (tx: TransactionPair<T>) => void;
  onError?: (err: unknown, context?: TransactionPair<T>) => Promise<void>;
  onBeforeCreateDisposableSigner?: () => void;
  onBeforeBuildTx?: () => void;
  onBeforeSign?: (encodedTxData: EncodedTxData<T>) => void;
  onBeforeBroadcast?: (tx: TransactionPair<T>) => Promise<void>;
  onBroadcasted?: (tx: TransactionPair<T>) => void;
};

export type UseTransactionProps<T> = {
  params: T[];
  createTxAtom: AtomType<T>;
  useDisposableSigner?: boolean;
  eventType: TransactionEventTypes;
  parsePendingTxNotification?: (tx: TransactionPair<T>) => PartialNotification;
  parseErrorTxNotification?: () => PartialNotification;
} & UseTransactionPropsEvents<T>;

export type UseTransactionOutput<T> = {
  isEnabled: boolean;
  feeProps: TransactionFeeProps;
  execute: (
    params?: Partial<BuildTxAtomParams<T>>
  ) => Promise<TransactionPair<T>>;
} & UseMutationResult<
  TransactionPair<T>,
  Error,
  Partial<BuildTxAtomParams<T>> | undefined,
  unknown
>;

export const useTransaction = <T,>({
  params,
  createTxAtom,
  useDisposableSigner,
  eventType,
  parsePendingTxNotification,
  parseErrorTxNotification,
  onError,
  onSigned,
  onBeforeCreateDisposableSigner,
  onBeforeBuildTx,
  onBeforeSign,
  onBeforeBroadcast,
  onBroadcasted,
}: UseTransactionProps<T>): UseTransactionOutput<T> => {
  const { data: account } = useAtomValue(defaultAccountAtom);
  const dispatchNotification = useSetAtom(dispatchToastNotificationAtom);
  const { mutateAsync: performBuildTx } = useAtomValue(createTxAtom);

  // Claim & Stake is the only array of tx kinds. The rest are single tx kinds.
  const arr = new Array(Math.max(1, params.length));
  const kinds =
    Array.isArray(eventType) ?
      // **IMPORTANT**
      // If eventType is an array, we set kinds by multiplying each kind by params length
      // i.e. (["ClaimRewards", "Bond"] AND params.length == 2) => ["ClaimRewards", "Bond", "ClaimRewards", "Bond"]
      arr.fill(eventType).flat()
    : arr.fill(eventType); // Don't display zeroed value when params are not set yet.

  const feeProps = useTransactionFee(
    kinds,
    kinds.some((k) => ["ShieldedTransfer", "UnshieldingTransfer"].includes(k))
  );
  const broadcastEventType =
    !Array.isArray(eventType) ? eventType : "ClaimRewards";

  const dispatchPendingTxNotification = (
    tx: TransactionPair<T>,
    notification: PartialNotification
  ): void => {
    const notificationId = getNotificationId(tx);

    dispatchNotification({
      ...notification,
      id: notificationId,
      type: "pending",
    });
  };

  // Handles errors BEFORE or during broadcasting.
  const dispatchErrorNotification = (
    error: unknown,
    notification: PartialNotification,
    tx: TransactionPair<T>
  ): void => {
    const notificationId = getNotificationId(tx);
    dispatchNotification({
      ...notification,
      id: notificationId,
      details: error instanceof Error ? error.message : undefined,
      type: "error",
    });
  };

  const transactionQuery = useMutation({
    mutationFn: async (
      additionalParams: Partial<BuildTxAtomParams<T>> = {}
    ) => {
      try {
        invariant(
          account?.address,
          "Extension not connected or no account is selected"
        );

        const txAdditionalParams = { ...additionalParams };
        if (useDisposableSigner) {
          onBeforeCreateDisposableSigner?.();
          txAdditionalParams.signer = await getDisposableSigner();
        }

        onBeforeBuildTx?.();
        const variables = {
          params,
          gasConfig: feeProps.gasConfig,
          account,
          ...txAdditionalParams,
        };
        const encodedTxData = await performBuildTx(variables);

        invariant(encodedTxData, "Error: invalid TX created by buildTx");
        useDisposableSigner &&
          invariant(
            txAdditionalParams.signer?.address,
            "Disposable signer could not be created"
          );

        const signerAddress =
          useDisposableSigner ?
            txAdditionalParams.signer?.address
          : account.address;

        invariant(signerAddress, "Signer address is required");
        onBeforeSign?.(encodedTxData);
        const signedTxs = await signTx(encodedTxData, signerAddress);
        const transactionPair: TransactionPair<T> = {
          signedTxs,
          encodedTxData,
        };

        onSigned?.(transactionPair);
        if (parsePendingTxNotification) {
          dispatchPendingTxNotification(
            transactionPair,
            parsePendingTxNotification(transactionPair)
          );
        }

        await onBeforeBroadcast?.(transactionPair);
        try {
          await broadcastTxWithEvents(
            transactionPair.encodedTxData,
            transactionPair.signedTxs,
            transactionPair.encodedTxData.meta?.props,
            broadcastEventType
          );

          onBroadcasted?.(transactionPair);
        } catch (error) {
          if (parseErrorTxNotification) {
            dispatchErrorNotification(
              error,
              parseErrorTxNotification(),
              transactionPair
            );
          }
          throw new TransactionError<T>("Transaction error", {
            cause: {
              originalError: error,
              context: transactionPair,
            },
          });
        }
        return transactionPair;
      } catch (error) {
        if (error instanceof TransactionError) {
          onError?.(error.cause.originalError, error.cause.context);
        } else {
          onError?.(error);
        }
        throw error;
      }
    },
  });

  return {
    ...transactionQuery,
    feeProps,
    execute: transactionQuery.mutateAsync,
    isEnabled: Boolean(
      !transactionQuery.isPending &&
        !transactionQuery.isSuccess &&
        !feeProps.isLoading &&
        account &&
        params.length > 0
    ),
  };
};
