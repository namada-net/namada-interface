import { Asset, Chain } from "@chain-registry/types";
import { isShieldedAddress } from "App/Transfer/common";
import BigNumber from "bignumber.js";
import { WalletProvider } from "types";
export type TransferType =
  | "namada-transfer"
  | "masp-shield"
  | "masp-unshield"
  | "ibc-transfer"
  | "ibc-withdraw";

export type TransferHookType =
  | "useTransfer"
  | "useIbcTransaction"
  | "useTransaction";

export interface BaseTransferParams {
  source: string;
  target: string;
  token: string;
  displayAmount: BigNumber;
  asset?: Asset;
  memo?: string;
}

export interface IbcTransferParams extends BaseTransferParams {
  registry?: {
    chain: Chain;
    assets: Asset[];
  };
  sourceChannel: string;
  destinationChannel?: string;
  shielded: boolean;
  sourceAddress: string;
  selectedAsset?: Asset;
}

export interface IbcWithdrawParams {
  amountInBaseDenom: BigNumber;
  channelId: string;
  portId: string;
  token: string;
  source: string;
  receiver: string;
  gasSpendingKey?: string;
  memo?: string;
  refundTarget?: string;
  signer: {
    publicKey: string;
    address: string;
  };
}

export interface TransferConfig {
  hookType: TransferHookType;
  transferType: TransferType;
  isShielded: boolean;
  requiresDisposableSigner: boolean;
  requiresIbcChannels: boolean;
  supportsBatching: boolean;
  statusMessages: {
    beforeBuildTx: string;
    beforeSign: string;
    beforeBroadcast: string;
    buildTxExplanation?: string;
  };
}

export interface UseTransferConfig {
  source: string;
  target: string;
  token: string;
  displayAmount: BigNumber;
  asset?: Asset;
  onUpdateStatus?: (status: string) => void;
  onBeforeBuildTx?: () => void;
  onBeforeSign?: () => void;
  onBeforeBroadcast?: () => void;
  onError?: (error: Error) => void;
}

export interface UseIbcTransactionConfig {
  registry?: {
    chain: Chain;
    assets: Asset[];
  };
  sourceAddress: string;
  sourceChannel: string;
  destinationChannel: string;
  shielded: boolean;
  selectedAsset?: Asset;
}

export interface UseTransactionConfig {
  eventType: "IbcTransfer";
  createTxAtom: unknown;
  params: IbcWithdrawParams[];
  useDisposableSigner: boolean;
  parsePendingTxNotification: () => {
    title: string;
    description: string;
  };
  parseErrorTxNotification: () => {
    title: string;
    description: string;
  };
  onBeforeBuildTx?: () => void;
  onBeforeSign?: () => void;
  onBeforeBroadcast?: () => void;
  onError?: (error: unknown, context?: unknown) => Promise<void>;
}

export interface TransferHookConfig {
  transferType: TransferType;
  hookType: TransferHookType;
  config: TransferConfig;
  useTransferConfig?: UseTransferConfig;
  useIbcTransactionConfig?: UseIbcTransactionConfig;
  useTransactionConfig?: UseTransactionConfig;
}

/**
 * Determines the transfer type based on source and destination addresses and chains
 */
export const getTransferType = (
  sourceAddress: string,
  destinationAddress: string,
  sourceChain?: Chain,
  destinationChain?: Chain,
  sourceWallet?: WalletProvider,
  destinationWallet?: WalletProvider
): TransferType => {
  const isSourceShielded = isShieldedAddress(sourceAddress);
  const isDestinationShielded = isShieldedAddress(destinationAddress);

  // IBC transfers - different chains or different wallets
  if (
    sourceChain?.chain_id !== destinationChain?.chain_id ||
    sourceWallet?.id !== destinationWallet?.id
  ) {
    // If source is Namada and destination is external
    if (
      sourceChain?.bech32_prefix === "tnam" &&
      destinationChain?.bech32_prefix !== "tnam"
    ) {
      return "ibc-withdraw";
    }

    // If source is external and destination is Namada
    if (
      sourceChain?.bech32_prefix !== "tnam" &&
      destinationChain?.bech32_prefix === "tnam"
    ) {
      return "ibc-transfer";
    }
  }

  // Namada internal transfers
  if (
    sourceChain?.bech32_prefix === "tnam" &&
    destinationChain?.bech32_prefix === "tnam"
  ) {
    // MASP operations - transparent to shielded
    if (!isSourceShielded && isDestinationShielded) {
      return "masp-shield";
    }

    // MASP operations - shielded to transparent
    if (isSourceShielded && !isDestinationShielded) {
      return "masp-unshield";
    }

    // Regular Namada transfer (both shielded, both transparent, or shielded to shielded)
    return "namada-transfer";
  }

  // Default to regular transfer
  return "namada-transfer";
};

/**
 * Gets the transfer configuration for a given transfer type
 */
export const getTransferConfig = (
  transferType: TransferType
): TransferConfig => {
  switch (transferType) {
    case "masp-shield":
      return {
        hookType: "useTransfer",
        transferType: "masp-shield",
        isShielded: true,
        requiresDisposableSigner: false,
        requiresIbcChannels: false,
        supportsBatching: false,
        statusMessages: {
          beforeBuildTx: "Generating MASP Parameters...",
          beforeSign: "Waiting for signature...",
          beforeBroadcast: "Broadcasting Shielding transaction...",
          buildTxExplanation:
            "Generating MASP parameters can take a few seconds. Please wait...",
        },
      };

    case "masp-unshield":
      return {
        hookType: "useTransfer",
        transferType: "masp-unshield",
        isShielded: true,
        requiresDisposableSigner: false,
        requiresIbcChannels: false,
        supportsBatching: false,
        statusMessages: {
          beforeBuildTx: "Generating MASP Parameters...",
          beforeSign: "Waiting for signature...",
          beforeBroadcast: "Broadcasting unshielding transaction...",
          buildTxExplanation:
            "Generating MASP parameters can take a few seconds. Please wait...",
        },
      };

    case "namada-transfer":
      return {
        hookType: "useTransfer",
        transferType: "namada-transfer",
        isShielded: false,
        requiresDisposableSigner: false,
        requiresIbcChannels: false,
        supportsBatching: false,
        statusMessages: {
          beforeBuildTx: "Preparing transaction...",
          beforeSign: "Waiting for signature...",
          beforeBroadcast: "Broadcasting transaction to Namada...",
        },
      };

    case "ibc-transfer":
      return {
        hookType: "useIbcTransaction",
        transferType: "ibc-transfer",
        isShielded: false,
        requiresDisposableSigner: false,
        requiresIbcChannels: true,
        supportsBatching: false,
        statusMessages: {
          beforeBuildTx: "Preparing IBC transfer...",
          beforeSign: "Waiting for signature...",
          beforeBroadcast: "Submitting IBC transfer...",
        },
      };

    case "ibc-withdraw":
      return {
        hookType: "useTransaction",
        transferType: "ibc-withdraw",
        isShielded: false,
        requiresDisposableSigner: true,
        requiresIbcChannels: true,
        supportsBatching: false,
        statusMessages: {
          beforeBuildTx: "Creating IBC transaction...",
          beforeSign: "Waiting for signature...",
          beforeBroadcast: "Broadcasting transaction to Namada...",
        },
      };

    default:
      throw new Error(`Unknown transfer type: ${transferType}`);
  }
};

/**
 * Configuration resolver that prepares hook configurations for different transfer types
 */
export const getTransferHookConfig = (
  transferType: TransferType,
  params: {
    // Common parameters
    source: string;
    target: string;
    token: string;
    displayAmount: BigNumber;
    asset?: Asset;
    onUpdateStatus?: (status: string) => void;
    onBeforeBuildTx?: () => void;
    onBeforeSign?: () => void;
    onBeforeBroadcast?: () => void;
    onError?: (error: Error) => void;

    // IBC-specific parameters
    registry?: {
      chain: Chain;
      assets: Asset[];
    };
    sourceAddress?: string;
    selectedAsset?: Asset;
    sourceChannel?: string;
    destinationChannel?: string;
    shielded?: boolean;

    // IBC withdraw specific
    signer?: {
      publicKey: string;
      address: string;
    };
    useDisposableSigner?: boolean;
  }
): TransferHookConfig => {
  const config = getTransferConfig(transferType);

  // Prepare status callbacks with default messages
  const prepareStatusCallbacks = (
    onUpdateStatus?: (status: string) => void,
    onBeforeBuildTx?: () => void,
    onBeforeSign?: () => void,
    onBeforeBroadcast?: () => void,
    onError?: (error: Error) => void
  ): {
    onBeforeBuildTx: () => void;
    onBeforeSign: () => void;
    onBeforeBroadcast: () => void;
    onError?: (error: Error) => void;
  } => {
    return {
      onBeforeBuildTx: () => {
        onUpdateStatus?.(config.statusMessages.beforeBuildTx);
        onBeforeBuildTx?.();
      },
      onBeforeSign: () => {
        onUpdateStatus?.(config.statusMessages.beforeSign);
        onBeforeSign?.();
      },
      onBeforeBroadcast: () => {
        onUpdateStatus?.(config.statusMessages.beforeBroadcast);
        onBeforeBroadcast?.();
      },
      onError,
    };
  };

  const statusCallbacks = prepareStatusCallbacks(
    params.onUpdateStatus,
    params.onBeforeBuildTx,
    params.onBeforeSign,
    params.onBeforeBroadcast,
    params.onError
  );

  // Prepare hook-specific configurations
  switch (config.hookType) {
    case "useTransfer":
      return {
        transferType,
        hookType: "useTransfer",
        config,
        useTransferConfig: {
          source: params.source,
          target: params.target,
          token: params.token,
          displayAmount: params.displayAmount,
          asset: params.asset,
          ...statusCallbacks,
        },
      };

    case "useIbcTransaction":
      return {
        transferType,
        hookType: "useIbcTransaction",
        config,
        useIbcTransactionConfig: {
          registry: params.registry,
          sourceAddress: params.sourceAddress || params.source,
          sourceChannel: params.sourceChannel || "",
          destinationChannel: params.destinationChannel || "",
          shielded: params.shielded || false,
          selectedAsset: params.selectedAsset,
        },
      };

    case "useTransaction":
      return {
        transferType,
        hookType: "useTransaction",
        config,
        useTransactionConfig: {
          eventType: "IbcTransfer",
          createTxAtom: "createIbcTxAtom", // This will need to be imported by the calling component
          params: [], // Will be populated when executing
          useDisposableSigner:
            params.useDisposableSigner || config.requiresDisposableSigner,
          parsePendingTxNotification: () => ({
            title: "IBC withdrawal transaction in progress",
            description: "Your IBC transaction is being processed",
          }),
          parseErrorTxNotification: () => ({
            title: "IBC withdrawal failed",
            description: "",
          }),
          onBeforeBuildTx: statusCallbacks.onBeforeBuildTx,
          onBeforeSign: statusCallbacks.onBeforeSign,
          onBeforeBroadcast: statusCallbacks.onBeforeBroadcast,
          onError: async (err: unknown) => {
            const error = err instanceof Error ? err : new Error(String(err));
            statusCallbacks.onError?.(error);
          },
        },
      };

    default:
      throw new Error(`Unknown hook type: ${config.hookType}`);
  }
};

/**
 * Utility function to prepare transaction data for different transfer types
 */
export const prepareTransactionData = (
  transferType: TransferType,
  params: {
    displayAmount: BigNumber;
    destinationAddress: string;
    memo?: string;
    sourceAddress?: string;
    selectedAsset?: Asset;
    sourceChannel?: string;
    destinationChannel?: string;
    amountInBaseDenom?: BigNumber;
    gasSpendingKey?: string;
    refundTarget?: string;
    signer?: {
      publicKey: string;
      address: string;
    };
  }
):
  | { memo?: string }
  | { destinationAddress: string; displayAmount: BigNumber; memo?: string }
  | {
      signer: { publicKey: string; address: string };
      params: IbcWithdrawParams[];
    } => {
  switch (transferType) {
    case "masp-shield":
    case "masp-unshield":
    case "namada-transfer":
      return {
        memo: params.memo,
      };

    case "ibc-transfer":
      return {
        destinationAddress: params.destinationAddress,
        displayAmount: params.displayAmount,
        memo: params.memo,
      };

    case "ibc-withdraw":
      if (!params.signer) {
        throw new Error("Signer is required for IBC withdraw");
      }
      if (!params.amountInBaseDenom) {
        throw new Error(
          "Amount in base denomination is required for IBC withdraw"
        );
      }
      if (!params.selectedAsset) {
        throw new Error("Selected asset is required for IBC withdraw");
      }
      if (!params.sourceAddress) {
        throw new Error("Source address is required for IBC withdraw");
      }

      const sourceAddress = params.sourceAddress as string;

      return {
        signer: params.signer,
        params: [
          {
            amountInBaseDenom: params.amountInBaseDenom,
            channelId: params.sourceChannel?.trim() || "",
            portId: "transfer",
            token: params.selectedAsset.address,
            source: sourceAddress,
            receiver: params.destinationAddress,
            gasSpendingKey: params.gasSpendingKey,
            memo: params.memo,
            refundTarget: params.refundTarget,
            signer: params.signer,
          },
        ],
      };

    default:
      throw new Error(`Unknown transfer type: ${transferType}`);
  }
};
