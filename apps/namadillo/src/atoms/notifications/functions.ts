export const notificationIdSeparator = ";";
import { TxProps } from "@namada/types";
import { TransactionPair } from "lib/query";

export const createNotificationId = (data?: TxProps["hash"][]): string => {
  if (!data) return Date.now().toString();
  if (Array.isArray(data)) return data.join(notificationIdSeparator);
  return data;
};

export const getNotificationId = <T>(tx: TransactionPair<T>): string => {
  const notificationId = createNotificationId(
    tx.encodedTxData.txs.map((tx) => tx.hash)
  );

  return notificationId;
};
