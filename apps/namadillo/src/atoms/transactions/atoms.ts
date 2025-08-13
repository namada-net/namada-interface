import {
  Pagination,
  TransactionHistory as TransactionHistoryBase,
} from "@namada/indexer-client";
import { allDefaultAccountsAtom, defaultAccountAtom } from "atoms/accounts";
import { indexerApiAtom } from "atoms/api";
import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomFamily, atomWithStorage } from "jotai/utils";
import { Address, TransferTransactionData } from "types";
import {
  addTimestamps,
  filterCompleteTransactions,
  filterPendingTransactions,
} from "./functions";
import { fetchHistoricalTransactions, fetchTransaction } from "./services";

export type RecentAddress = {
  address: Address;
  label?: string;
  type: "transparent" | "shielded" | "ibc";
  timestamp: number;
};

export interface TransactionHistory extends TransactionHistoryBase {
  timestamp?: number;
}

interface PaginatedTx {
  results: TransactionHistory[];
  pagination: Pagination;
}

export const transactionStorageKey = "namadillo:transactions";

export const transactionHistoryAtom = atomWithStorage<
  Record<Address, TransferTransactionData[]>
>(transactionStorageKey, {});

export const recentAddressesAtom = atomWithStorage<RecentAddress[]>(
  "namadillo:recentAddresses",
  [],
  undefined,
  { getOnInit: true }
);

export const myTransactionHistoryAtom = atom<TransferTransactionData[]>(
  (get) => {
    const transactions = get(transactionHistoryAtom);
    const account = get(defaultAccountAtom);
    if (!account || !account.data?.address) return [];
    return transactions[account.data.address] || [];
  }
);

export const pendingTransactionsHistoryAtom = atom((get) => {
  const myTransactions = get(myTransactionHistoryAtom);
  return myTransactions.filter(filterPendingTransactions);
});

export const completeTransactionsHistoryAtom = atom((get) => {
  const myTransactions = get(myTransactionHistoryAtom);
  return myTransactions.filter(filterCompleteTransactions);
});

export const fetchTransactionAtom = atom((get) => {
  const api = get(indexerApiAtom);
  return (hash: string) => fetchTransaction(api, hash);
});

// New atom family for paginated transaction history
export const chainTransactionHistoryFamily = atomFamily(
  (options?: { page?: number; perPage?: number; fetchAll?: boolean }) =>
    atomWithQuery<PaginatedTx>((get) => {
      const api = get(indexerApiAtom);
      const accounts = get(allDefaultAccountsAtom);
      const addresses = accounts.data?.map((a) => a.address);

      return {
        enabled: !!addresses,
        queryKey: [
          "chain-transaction-history",
          addresses,
          options?.fetchAll ? "all" : options?.page,
          options?.perPage,
        ],
        queryFn: async () => {
          if (!addresses) {
            return {
              results: [],
              pagination: {
                totalPages: "0",
                totalItems: "0",
                currentPage: "0",
                perPage: "0",
              },
            };
          }

          const fetchPage = (page?: number): Promise<PaginatedTx> =>
            fetchHistoricalTransactions(api, addresses, page, options?.perPage);

          // ── fetchAll ────────────────────────────────────────────────────────
          if (options?.fetchAll) {
            const first = await fetchPage(1);
            const total = parseInt(first.pagination.totalPages ?? "0", 10);

            const others =
              total > 1 ?
                await Promise.all(
                  Array.from({ length: total - 1 }, (_, i) => fetchPage(i + 2))
                )
              : [];

            const all = [...first.results, ...others.flatMap((p) => p.results)];

            return {
              results: await addTimestamps(api, all),
              pagination: {
                ...first.pagination,
                currentPage: "all",
              },
            };
          }

          const pageData = await fetchPage(options?.page);
          return {
            ...pageData,
            results: await addTimestamps(api, pageData.results),
          };
        },
      };
    }),
  (a, b) =>
    a?.page === b?.page &&
    a?.perPage === b?.perPage &&
    a?.fetchAll === b?.fetchAll
);
