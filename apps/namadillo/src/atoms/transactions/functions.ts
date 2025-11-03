import { DefaultApi } from "@namada/indexer-client";
import { fetchBlockTimestampByHeight } from "atoms/chain/services";
import { getDefaultStore } from "jotai";
import { TransferTransactionData } from "types";
import { TransactionHistory, transactionHistoryAtom } from "./atoms";

export const filterPendingTransactions = (
  tx: TransferTransactionData
): boolean => {
  return !["success", "error"].includes(tx.status);
};

export const filterCompleteTransactions = (
  tx: TransferTransactionData
): boolean => {
  return ["success", "error"].includes(tx.status);
};

export const searchAllStoredTxByHash = (
  hash: string
): TransferTransactionData | undefined => {
  const store = getDefaultStore();
  const fullTxHistory = store.get(transactionHistoryAtom);
  const allTxs = Object.values(fullTxHistory).flat();
  return allTxs.find((tx) => tx.hash === hash);
};

export const addTimestamps = async (
  api: DefaultApi,
  history: TransactionHistory[]
): Promise<TransactionHistory[]> => {
  return Promise.all(
    history.map(async (item) => {
      // hacky fix until types get fixed
      if (item.blockHeight) {
        const timestamp = await fetchBlockTimestampByHeight(
          api,
          parseInt((item as unknown as { blockHeight: string }).blockHeight, 10)
        );
        return { ...item, timestamp };
      }
      return item;
    })
  );
};
