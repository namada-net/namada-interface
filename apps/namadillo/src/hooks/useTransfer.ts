import {
  ShieldedTransferProps,
  ShieldingTransferProps,
  TransparentTransferProps,
  UnshieldingTransferProps,
} from "@namada/sdk-multicore";
import { AccountType } from "@namada/types";
import { routes } from "App/routes";
import { isShieldedAddress } from "App/Transfer/common";
import { allDefaultAccountsAtom } from "atoms/accounts";
import {
  createShieldedTransferAtom,
  createShieldingTransferAtom,
  createTransparentTransferAtom,
  createUnshieldingTransferAtom,
} from "atoms/transfer/atoms";
import BigNumber from "bignumber.js";
import {
  useTransaction,
  UseTransactionOutput,
  UseTransactionPropsEvents,
} from "hooks/useTransaction";
import { useAtomValue } from "jotai";
import { TransactionPair } from "lib/query";
import { useMemo, useState } from "react";
import { generatePath, useNavigate } from "react-router-dom";
import { Address, Asset, NamadaTransferTxKind } from "types";
import { isNamadaAsset, toBaseAmount } from "utils";
import { useOptimisticTransferUpdate } from "./useOptimisticTransferUpdate";

type useTransferParams = {
  source: Address;
  target: Address;
  token: Address;
  displayAmount: BigNumber;
  asset?: Asset;
  onUpdateStatus?: (status: string) => void;
} & UseTransactionPropsEvents<unknown>;

type useTransferOutput = (
  | UseTransactionOutput<TransparentTransferProps>
  | UseTransactionOutput<ShieldedTransferProps>
  | UseTransactionOutput<ShieldingTransferProps>
  | UseTransactionOutput<UnshieldingTransferProps>
) & {
  txKind: NamadaTransferTxKind;
  txHash?: string;
  completedAt: Date | undefined;
  redirectToTransactionPage: () => void;
};

export const useTransfer = ({
  source,
  target,
  token,
  displayAmount,
  asset,
  onUpdateStatus,
  ...events
}: useTransferParams): useTransferOutput => {
  const defaultAccounts = useAtomValue(allDefaultAccountsAtom);
  const shieldedAccount = defaultAccounts.data?.find(
    (account) => account.type === AccountType.ShieldedKeys
  );
  const pseudoExtendedKey = shieldedAccount?.pseudoExtendedKey ?? "";
  const optimisticTransferUpdate = useOptimisticTransferUpdate();
  const [completedAt, setCompletedAt] = useState<Date | undefined>();
  const [txHash, setTxHash] = useState<string | undefined>();
  const navigate = useNavigate();

  const baseDenomAmount = useMemo(() => {
    if (!displayAmount || !asset) {
      return new BigNumber(0);
    }

    if (isNamadaAsset(asset)) {
      return displayAmount;
    }

    return toBaseAmount(asset, displayAmount);
  }, [displayAmount, asset]);

  const commomProps = {
    parsePendingTxNotification: () => ({
      title: "Transfer transaction in progress",
      description: "Your transfer transaction is being processed",
    }),
    parseErrorTxNotification: () => ({
      title: "Transfer transaction failed",
      description: "Your transfer transaction has failed",
    }),
    ...events,
    onBroadcasted: (tx: TransactionPair<unknown>) => {
      if (target === shieldedAccount?.address) {
        optimisticTransferUpdate(token, baseDenomAmount);
      }
      if (source === shieldedAccount?.address) {
        optimisticTransferUpdate(token, baseDenomAmount.multipliedBy(-1));
      }
      setCompletedAt(new Date());
      setTxHash(tx.encodedTxData.txs[0].hash);
      events.onBroadcasted?.(tx);
    },
  };

  const transparentTransaction = useTransaction({
    eventType: "TransparentTransfer",
    createTxAtom: createTransparentTransferAtom,
    params: [{ data: [{ source, target, token, amount: baseDenomAmount }] }],
    ...commomProps,
  });

  const shieldedTransaction = useTransaction({
    eventType: "ShieldedTransfer",
    createTxAtom: createShieldedTransferAtom,
    params: [
      {
        data: [
          { source: pseudoExtendedKey, target, token, amount: baseDenomAmount },
        ],
      },
    ],
    useDisposableSigner: true,
    ...commomProps,
  });

  const shieldingTransaction = useTransaction({
    eventType: "ShieldingTransfer",
    createTxAtom: createShieldingTransferAtom,
    params: [{ target, data: [{ source, token, amount: baseDenomAmount }] }],
    onBeforeCreateDisposableSigner: () =>
      onUpdateStatus?.("Creating new disposable signer..."),
    onBeforeBuildTx: () =>
      onUpdateStatus?.("Generating MASP params and building transaction..."),
    onBeforeSign: () => onUpdateStatus?.("Waiting for signature..."),
    onBeforeBroadcast: async () =>
      onUpdateStatus?.("Broadcasting transaction..."),
    ...commomProps,
  });

  const unshieldingTransaction = useTransaction({
    eventType: "UnshieldingTransfer",
    createTxAtom: createUnshieldingTransferAtom,
    params: [
      {
        source: pseudoExtendedKey,
        data: [{ target, token, amount: baseDenomAmount }],
      },
    ],
    useDisposableSigner: true,
    ...commomProps,
  });

  const getAddressKind = (address: Address): "Shielded" | "Transparent" =>
    isShieldedAddress(address) ? "Shielded" : "Transparent";

  const txKind: NamadaTransferTxKind = `${getAddressKind(source)}To${getAddressKind(target)}`;

  const result = (() => {
    switch (txKind) {
      case "TransparentToTransparent":
        return transparentTransaction;
      case "TransparentToShielded":
        return shieldingTransaction;
      case "ShieldedToTransparent":
        return unshieldingTransaction;
      case "ShieldedToShielded":
        return shieldedTransaction;
    }
  })();

  return {
    ...result,
    txKind,
    completedAt,
    txHash,
    redirectToTransactionPage: () => {
      txHash && navigate(generatePath(routes.transaction, { hash: txHash }));
    },
  };
};
