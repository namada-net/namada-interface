import { DefaultApi } from "@namada/indexer-client";
import { isShieldedAddress, isTransparentAddress } from "App/Transfer/common";
import { fetchBlockTimestampByHeight } from "atoms/chain/services";
import { getChainRegistryByChainId } from "atoms/integrations/functions";
import { getChainFromAddress } from "integrations/utils";
import { getDefaultStore } from "jotai";
import { Address, TransferTransactionData } from "types";
import {
  RecentAddress,
  TransactionHistory,
  transactionHistoryAtom,
} from "./atoms";

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
      if (item.blockHeight) {
        const timestamp = await fetchBlockTimestampByHeight(
          api,
          parseInt(item.blockHeight, 10)
        );
        return { ...item, timestamp };
      }
      return item;
    })
  );
};

// Recent Addresses validation and helper functions
export type ValidationError = {
  type: "invalid-format" | "unsupported-chain" | "empty";
  message: string;
};

export type ValidationResult = {
  isValid: boolean;
  error?: ValidationError;
  addressType?: "transparent" | "shielded" | "ibc";
};

export const validateAddress = (address: string): ValidationResult => {
  // Check if address is empty
  if (!address.trim()) {
    return {
      isValid: false,
      error: {
        type: "empty",
        message: "Address cannot be empty",
      },
    };
  }

  const trimmedAddress = address.trim();

  // Check for Namada transparent address
  if (isTransparentAddress(trimmedAddress)) {
    return {
      isValid: true,
      addressType: "transparent",
    };
  }

  // Check for Namada shielded address
  if (isShieldedAddress(trimmedAddress)) {
    return {
      isValid: true,
      addressType: "shielded",
    };
  }

  // Check for IBC address
  const chain = getChainFromAddress(trimmedAddress);
  if (chain) {
    // Check if the chain is supported by using the registry function
    const registry = getChainRegistryByChainId(chain.chain_id);

    if (registry) {
      return {
        isValid: true,
        addressType: "ibc",
      };
    } else {
      return {
        isValid: false,
        error: {
          type: "unsupported-chain",
          message: `Chain ${chain.pretty_name || chain.chain_name} is not supported`,
        },
      };
    }
  }

  // If we reach here, the address format is invalid
  return {
    isValid: false,
    error: {
      type: "invalid-format",
      message:
        "Invalid address format. Please enter a valid Namada or IBC address",
    },
  };
};

export const addToRecentAddresses = (
  recentAddresses: RecentAddress[],
  address: Address,
  type: "transparent" | "shielded" | "ibc",
  label?: string
): RecentAddress[] => {
  // Remove existing entry if it exists
  const filtered = recentAddresses.filter(
    (recent) => recent.address !== address
  );

  // Add new entry at the beginning
  const newEntry: RecentAddress = {
    address,
    type,
    label,
    timestamp: Date.now(),
  };

  // Keep only the last 10 recent addresses
  return [newEntry, ...filtered].slice(0, 10);
};

export const getAddressLabel = (
  address: Address,
  type: "transparent" | "shielded" | "ibc"
): string => {
  switch (type) {
    case "transparent":
      return "Namada Transparent";
    case "shielded":
      return "Namada Shielded";
    case "ibc":
      const chain = getChainFromAddress(address);
      return chain?.pretty_name || chain?.chain_name || "IBC Address";
  }
};
