import { Chain } from "@chain-registry/types";
import { isShieldedAddress, isTransparentAddress } from "App/Transfer/common";
import BigNumber from "bignumber.js";
import { wallets } from "integrations";
import { AddressWithAssetAndAmountMap, GasConfig, WalletProvider } from "types";
import { checkKeychainCompatibleWithMasp } from "utils/compatibility";
import {
  TransferDestinationProps,
  TransferSourceProps,
  ValidationResult,
} from "./types";

// Check if the provided address is valid for the destination chain and transaction type
export const isValidDestinationAddress = ({
  customAddress,
  chain,
}: {
  customAddress: string;
  chain: Chain | undefined;
}): boolean => {
  // Skip validation if no custom address or chain provided
  if (!customAddress || !chain) return true;

  // Check shielded/transparent address requirements for Namada
  if (chain.bech32_prefix === "nam") {
    return (
      isTransparentAddress(customAddress) || isShieldedAddress(customAddress)
    );
  }

  // For non-Namada chains, validate using prefix
  return customAddress.startsWith(chain.bech32_prefix);
};

// Check if there's enough balance to pay for transaction fees
export const hasEnoughBalanceForFees = ({
  sourceWallet,
  availableAssets,
  gasConfig,
  displayGasFeeAmount,
}: {
  sourceWallet: WalletProvider | undefined;
  availableAssets: AddressWithAssetAndAmountMap | undefined;
  gasConfig: GasConfig | undefined;
  displayGasFeeAmount: BigNumber | undefined;
}): boolean => {
  // Skip if transaction fees will be handled by another wallet, like Keplr.
  // (Ex: when users transfer from IBC to Namada)
  if (sourceWallet && sourceWallet !== wallets.namada) {
    return true;
  }

  if (!availableAssets || !gasConfig || !displayGasFeeAmount) {
    return false;
  }

  // Find how much the user has in their account for the selected fee token
  const feeTokenAddress = gasConfig.gasToken;

  if (!availableAssets.hasOwnProperty(feeTokenAddress)) {
    return false;
  }

  const assetDisplayAmount = availableAssets[feeTokenAddress].amount;
  return assetDisplayAmount.gt(displayGasFeeAmount);
};

// Main validation function for transfer form
export const validateTransferForm = ({
  source,
  destination,
  gasConfig,
  availableAmountMinusFees,
  keychainVersion,
  availableAssets,
  displayGasFeeAmount,
}: {
  source: TransferSourceProps;
  destination: TransferDestinationProps;
  gasConfig: GasConfig | undefined;
  availableAmountMinusFees: BigNumber | undefined;
  keychainVersion: string | undefined;
  availableAssets: AddressWithAssetAndAmountMap | undefined;
  displayGasFeeAmount: BigNumber | undefined;
}): ValidationResult => {
  if (!source.wallet) {
    return "NoSourceWallet";
  } else if (source.walletAddress === destination.customAddress) {
    return "TheSameAddress";
  } else if (
    !isValidDestinationAddress({
      customAddress: destination.customAddress ?? "",
      chain: destination.chain,
    })
  ) {
    return "CustomAddressNotMatchingChain";
  } else if (
    (source.isShieldedAddress || destination.isShieldedAddress) &&
    keychainVersion &&
    !checkKeychainCompatibleWithMasp(keychainVersion)
  ) {
    return "KeychainNotCompatibleWithMasp";
  } else if (!source.chain) {
    return "NoSourceChain";
  } else if (!destination.chain) {
    return "NoDestinationChain";
  } else if (!source.selectedAssetAddress) {
    return "NoSelectedAsset";
  } else if (
    !hasEnoughBalanceForFees({
      sourceWallet: source.wallet,
      availableAssets,
      gasConfig,
      displayGasFeeAmount,
    })
  ) {
    return "NotEnoughBalanceForFees";
  } else if (!source.amount || source.amount.eq(0)) {
    return "NoAmount";
  } else if (
    !availableAmountMinusFees ||
    source.amount.gt(availableAmountMinusFees)
  ) {
    return "NotEnoughBalance";
  } else if (!destination.wallet && !destination.customAddress) {
    return "NoDestinationWallet";
  } else if (
    (source.isShieldedAddress || destination.isShieldedAddress) &&
    source.ledgerAccountInfo &&
    !source.ledgerAccountInfo.deviceConnected
  ) {
    return "NoLedgerConnected";
  } else {
    return "Ok";
  }
};

// Get button text error with fallback to default text
export const getButtonTextError = (
  validationResult: ValidationResult,
  defaultText: string,
  buttonTextErrors: Partial<Record<ValidationResult, string>> = {}
): string => {
  if (
    buttonTextErrors.hasOwnProperty(validationResult) &&
    buttonTextErrors[validationResult]
  ) {
    return buttonTextErrors[validationResult];
  }
  return defaultText;
};

// Get appropriate button text based on validation result and state
export const getButtonText = ({
  isSubmitting,
  submittingText,
  validationResult,
  availableAmountMinusFees,
  buttonTextErrors = {},
}: {
  isSubmitting: boolean | undefined;
  submittingText?: string;
  validationResult: ValidationResult;
  availableAmountMinusFees: BigNumber | undefined;
  buttonTextErrors?: Partial<Record<ValidationResult, string>>;
}): string => {
  if (isSubmitting) {
    return submittingText || "Submitting...";
  }

  const getText = (defaultText: string): string =>
    getButtonTextError(validationResult, defaultText, buttonTextErrors);

  switch (validationResult) {
    case "NoSourceWallet":
      return getText("Select Wallet");
    case "TheSameAddress":
      return getText("Source and destination addresses are the same");
    case "NoSourceChain":
    case "NoDestinationChain":
      return getText("Select Chain");
    case "NoSelectedAsset":
      return getText("Select Asset");
    case "NoDestinationWallet":
      return getText("Select Destination Wallet");
    case "NoAmount":
      return getText("Define an amount to transfer");
    case "NoTransactionFee":
      return getText("No transaction fee is set");
    case "CustomAddressNotMatchingChain":
      return getText("Custom address does not match chain");
    case "NotEnoughBalance":
      return getText("Not enough balance");
    case "NotEnoughBalanceForFees":
      return getText("Not enough balance to pay for transaction fees");
    case "KeychainNotCompatibleWithMasp":
      return getText("Keychain is not compatible with MASP");
    case "NoLedgerConnected":
      return getText("Connect your ledger and open the Namada App");
  }

  if (!availableAmountMinusFees) {
    return getText("Wallet amount not available");
  }

  return "Submit";
};
