import {
  isIbcAddress,
  isNamadaAddress,
  isShieldedAddress,
  isTransparentAddress,
} from "App/Transfer/common";
import {
  getChainRegistryByChainName,
  getNamadaChainAssetsMap,
} from "atoms/integrations";
import BigNumber from "bignumber.js";
import { KeplrWalletManager } from "integrations/Keplr";
import { Asset, AssetWithAmount, GasConfig } from "types";
import { checkKeychainCompatibleWithMasp } from "utils/compatibility";
import {
  OnSubmitTransferParams,
  TransferType,
  ValidateTransferFormDestination,
  ValidateTransferFormSource,
  ValidationResult,
} from "./types";

// This function only used to make sure users aren't sending Nam OSMO to IBC Cosmos etc.
export const isValidDestinationAddress = ({
  assetAddress,
  destinationAddress,
}: {
  assetAddress: string;
  destinationAddress: string;
}): boolean => {
  // Skip validation if it's not an IBC destination address
  if (isNamadaAddress(destinationAddress)) return true;
  const chainAssets = getNamadaChainAssetsMap(false);
  const asset = chainAssets[assetAddress];
  // Allow for sending NAM to Osmosis
  const isNamadaAsset = asset?.symbol === "NAM";
  if (isNamadaAsset && destinationAddress.startsWith("osmo")) return true;

  const ibcTrace = asset?.traces?.find((trace) => trace.type === "ibc");
  const chainName = ibcTrace?.counterparty.chain_name;
  const chain = getChainRegistryByChainName(chainName ?? "")?.chain;
  if (!chain || !destinationAddress) return false;
  // For non-Namada chains, validate using prefix
  return destinationAddress.startsWith(chain?.bech32_prefix ?? "");
};

// Check if there's enough balance to pay for transaction fees
export const hasEnoughBalanceForFees = ({
  isIbcToken,
  availableAssets,
  gasConfig,
  displayGasFeeAmount,
}: {
  isIbcToken: boolean;
  availableAssets: Record<string, AssetWithAmount> | undefined;
  gasConfig: GasConfig | undefined;
  displayGasFeeAmount: BigNumber | undefined;
}): boolean => {
  // Skip if transaction fees will be handled by another wallet, like Keplr.
  // (Ex: when users transfer from IBC to Namada)
  if (isIbcToken) return true;

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
  source: ValidateTransferFormSource;
  destination: ValidateTransferFormDestination;
  gasConfig: GasConfig | undefined;
  availableAmountMinusFees: BigNumber | undefined;
  keychainVersion: string | undefined;
  availableAssets: Record<string, AssetWithAmount> | undefined;
  displayGasFeeAmount: BigNumber | undefined;
}): ValidationResult => {
  if (source.address === destination.address) {
    return "TheSameAddress";
  } else if (!source.selectedAssetAddress) {
    return "NoSelectedAsset";
  } else if (
    !isValidDestinationAddress({
      assetAddress: source.assetAddress ?? "",
      destinationAddress: destination.address ?? "",
    })
  ) {
    return "CustomAddressNotMatchingChain";
  } else if (
    (source.isShieldedAddress || destination.isShieldedAddress) &&
    keychainVersion &&
    !checkKeychainCompatibleWithMasp(keychainVersion)
  ) {
    return "KeychainNotCompatibleWithMasp";
  } else if (
    !hasEnoughBalanceForFees({
      isIbcToken: isIbcAddress(source.address ?? ""),
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
  } else if (!destination.address) {
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
    return "Submitting...";
  }

  const getText = (defaultText: string): string =>
    getButtonTextError(validationResult, defaultText, buttonTextErrors);

  switch (validationResult) {
    case "NoSelectedAsset":
      return getText("Select Source Asset");
    case "NoSourceWallet":
      return getText("Select Wallet");
    case "TheSameAddress":
      return getText("Source and destination addresses are the same");
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

export const determineTransferType = (
  params: OnSubmitTransferParams
): TransferType => {
  const { destinationAddress, sourceAddress } = params;
  const sourceIsIbc = isIbcAddress(sourceAddress ?? "");
  const destinationIsIbc = isIbcAddress(destinationAddress ?? "");

  // 1. Source is shielded
  // 2. Destination is IBC/Namada
  const unshielding =
    (isShieldedAddress(sourceAddress ?? "") &&
      isTransparentAddress(destinationAddress ?? "")) ||
    isIbcAddress(destinationAddress ?? "");
  // 1. Source is IBC/Namada
  // 2. Destination is shielded
  const shielding =
    isShieldedAddress(destinationAddress ?? "") &&
    !isShieldedAddress(sourceAddress ?? "");

  if (sourceIsIbc) return "ibc-deposit";
  if (destinationIsIbc) return "ibc-withdraw";
  if (shielding) return "shield";
  if (unshielding) return "unshield";
  return "namada-transfer";
};

export const getKeplrAddressForAsset = async (
  sourceAsset: Asset
): Promise<string | null> => {
  const keplr = new KeplrWalletManager();
  const keplrInstance = await keplr.get();

  if (!keplrInstance) return null;

  // Determine chain name from asset
  const chainName =
    sourceAsset.base === "unam" ?
      "osmosis"
    : sourceAsset.traces?.[0]?.counterparty?.chain_name;

  if (!chainName) return null;

  // Get chain ID and fetch address
  const chainRegistry = getChainRegistryByChainName(chainName);
  const chainId = chainRegistry?.chain.chain_id;

  if (!chainId) return null;

  const key = await keplrInstance.getKey(chainId);
  return key.bech32Address;
};
