import { Chain } from "@chain-registry/types";
import { NamadaKeychainAccount } from "@namada/types";
import BigNumber from "bignumber.js";
import { TransactionFeeProps } from "hooks/useTransactionFee";
import { KeplrWalletManager } from "integrations/Keplr";
import { Dispatch, SetStateAction } from "react";
import {
  Address,
  Asset,
  AssetWithAmount,
  ChainRegistryEntry,
  GasConfig,
  LedgerAccountInfo,
  WalletProvider,
} from "types";

export type TransferModuleProps = {
  source: {
    address: string | undefined;
    availableAmount: BigNumber | undefined;
    amount: BigNumber | undefined;
    selectedAssetWithAmount: AssetWithAmount | undefined;
    onChangeSelectedAsset: (asset: AssetWithAmount | undefined) => void;
    onChangeAmount: (amount: BigNumber | undefined) => void;
    ledgerAccountInfo?: LedgerAccountInfo | undefined;
    onChangeAddress: (sourceAddress: string) => void;
  };
  destination: {
    address: string | undefined;
    customAddress?: string;
    isShieldedAddress: boolean;
    memo?: string;
    onChangeAddress?: (sourceAddress: string) => void;
    onChangeMemo?: Dispatch<SetStateAction<string>>;
  };
  requiresIbcChannels?: boolean;
  feeProps?: TransactionFeeProps;
  ibcChannels?: {
    sourceChannel: string;
    destinationChannel?: string;
    onChangeSourceChannel: (sourceChannel: string) => void;
    onChangeDestinationChannel?: (destinationChannel: string) => void;
  };
  isSubmitting: boolean;
  errorMessage?: string;
  gasConfig?: GasConfig;
  currentStatus: string;
  currentStatusExplanation?: string;
  onSubmitTransfer: (params: OnSubmitTransferParams) => Promise<void>;
  completedAt?: Date;
  onComplete: () => void;
  keplrWalletManager?: KeplrWalletManager;
};

export type TransferModuleConfig = {
  wallet?: WalletProvider;
  walletAddress?: string;
  availableWallets?: WalletProvider[];
  connected?: boolean;
  availableChains?: Chain[];
  chain?: Chain;
  isShieldedAddress?: boolean;
  onChangeWallet?: (wallet: WalletProvider) => void;
  onChangeShielded?: (isShielded: boolean) => void;
  isSyncingMasp?: boolean;
  // Additional information if selected account is a ledger
  ledgerAccountInfo?: LedgerAccountInfo | undefined;
};

export type TransferSourceProps = TransferModuleConfig & {
  availableAssets?: Asset[];
  isLoadingAssets?: boolean;
  selectedAssetAddress?: Address;
  availableAmount?: BigNumber;
  onChangeSelectedAsset?: (address: Address | undefined) => void;
  amount?: BigNumber;
  onChangeAmount?: (amount: BigNumber | undefined) => void;
};

export type IbcOptions = {
  sourceChannel: string;
  onChangeSourceChannel: (channel: string) => void;
  destinationChannel?: string;
  onChangeDestinationChannel?: (channel: string) => void;
};

export type TransferDestinationProps = TransferModuleConfig & {
  enableCustomAddress?: boolean;
  customAddress?: Address;
  onChangeCustomAddress?: (address: Address) => void;
};
export interface OnSubmitTransferParams {
  displayAmount?: string;
  destinationAddress?: string;
  sourceAddress?: string;
  memo?: string;
}

export type TransferType =
  | "ibc-deposit" // IBC => Namada
  | "ibc-withdraw" // Namada => IBC
  | "shield" // Namada Transparent => Namada Shielded
  | "unshield" // Namada Shielded => Namada Transparent
  | "namada-transfer"; // Namada Transparent => Namada Transparent OR Namada Shielded => Namada Shielded

export type ValidationResult =
  | "NoAmount"
  | "NoSourceWallet"
  | "NoSourceChain"
  | "NoSelectedAsset"
  | "NoDestinationWallet"
  | "NoTransactionFee"
  | "NotEnoughBalance"
  | "NotEnoughBalanceForFees"
  | "KeychainNotCompatibleWithMasp"
  | "CustomAddressNotMatchingChain"
  | "TheSameAddress"
  | "NoLedgerConnected"
  | "Ok";

export interface UseTransactionResolverReturn {
  submitTransfer: (params: OnSubmitTransferParams) => Promise<void>;
  isPending: boolean;
  isSuccess: boolean;
  error: Error | undefined;
  feeProps: TransactionFeeProps | undefined;
  completedAt: Date | undefined;
  redirectToTransactionPage: () => void;
}

export interface UseTransactionResolverProps {
  // Asset and chain info
  selectedAsset: { asset: Asset } | undefined;
  chainId: string | undefined;
  rpcUrl: string;

  // Addresses and accounts
  sourceAddress: string | undefined;
  destinationAddress: string | undefined;
  customAddress: string | undefined;
  shieldedAccount: NamadaKeychainAccount | undefined;
  transparentAccount: NamadaKeychainAccount | undefined;
  activeKeplrWalletAddress: string | undefined;

  // IBC specific
  keplrRegistry: ChainRegistryEntry | undefined;
  sourceChannel: string | undefined;
  destinationChannel: string | undefined;

  // Transfer specific
  displayAmount: BigNumber | undefined;
  isTargetShielded: boolean;
  isSourceShielded: boolean;
  isShielding: boolean;
  isUnshielding: boolean;

  // Status setters
  setCurrentStatus: Dispatch<SetStateAction<string>>;
  setCurrentStatusExplanation: (explanation: string) => void;
  setGeneralErrorMessage: (message: string) => void;
  setTxHash: (hash: string) => void;
  setRefundTarget: (target: string) => void;
  setLedgerStatus: (stop: boolean) => void;
}
