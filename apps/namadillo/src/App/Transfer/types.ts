import { Chain } from "@chain-registry/types";
import BigNumber from "bignumber.js";
import { Address, Asset, LedgerAccountInfo, WalletProvider } from "types";

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
  ledgerAccountInfo?: LedgerAccountInfo;
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

export type OnSubmitTransferParams = {
  displayAmount: BigNumber;
  destinationAddress: Address;
  sourceAddress: Address;
  memo?: string;
};

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
