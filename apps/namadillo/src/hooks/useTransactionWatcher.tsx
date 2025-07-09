import { useQuery } from "@tanstack/react-query";
import {
  dispatchTransferEvent,
  handleStandardTransfer,
  transactionTypeToEventName,
  updateIbcTransferStatus,
  updateIbcWithdrawalStatus,
} from "atoms/integrations";
import {
  fetchTransactionAtom,
  pendingTransactionsHistoryAtom,
} from "atoms/transactions";
import { useAtomValue } from "jotai";
import { IbcTransferTransactionData } from "types";

export const useTransactionWatcher = (): void => {
  const pendingTransactions = useAtomValue(pendingTransactionsHistoryAtom);
  const fetchTransaction = useAtomValue(fetchTransactionAtom);

  useQuery({
    queryKey: ["transaction-status", pendingTransactions],
    enabled: pendingTransactions.length > 0,
    queryFn: async () => {
      return Promise.allSettled(
        pendingTransactions.map(async (tx) => {
          switch (tx.type) {
            case "TransparentToTransparent":
            case "TransparentToShielded":
            case "ShieldedToTransparent":
            case "ShieldedToShielded": {
              const newTx = await handleStandardTransfer(tx, fetchTransaction);
              console.log("Transaction updated:", newTx);
              dispatchTransferEvent(transactionTypeToEventName(tx), newTx);
              break;
            }

            case "IbcToTransparent":
            case "IbcToShielded": {
              const newTx = await updateIbcTransferStatus(
                tx as IbcTransferTransactionData
              );
              dispatchTransferEvent(transactionTypeToEventName(tx), newTx);
              break;
            }

            case "ShieldedToIbc":
            case "TransparentToIbc": {
              const newTx = await updateIbcWithdrawalStatus(
                tx as IbcTransferTransactionData
              );
              dispatchTransferEvent(transactionTypeToEventName(tx), newTx);
              break;
            }
          }
        })
      );
    },
    refetchInterval: 2000,
  });
};
