import { IbcTransferMsgValue } from "@namada/types";
import { isShieldedAddress } from "App/Transfer";
import {
  createIbcTxAtom,
  createShieldedTransferAtom,
  createShieldingTransferAtom,
  createTransparentTransferAtom,
  createUnshieldingTransferAtom,
} from "atoms/transfer/atoms";
import { BigNumber } from "bignumber.js";
import { Asset, ChainRegistryEntry, NamadaTransferTxKind } from "types";

export type TransferType =
  | "ibc-deposit"
  | "ibc-withdraw"
  | "shield"
  | "unshield"
  | "namada-transfer";

type UseTransferResolverProps = {
  transferType: TransferType;
  source: string;
  target: string;
  token: string;
  displayAmount: BigNumber;
  asset?: Asset;
  memo?: string;
  // For IBC
  registry?: ChainRegistryEntry;
  sourceAddress?: string;
  sourceChannel?: string;
  destinationChannel?: string;
  shielded?: boolean;
  selectedAsset?: Asset;
};

export const getTransferConfig = (
  props: UseTransferResolverProps
): {
  type: "transfer" | "ibcTransaction" | "transaction";
  config: Record<string, unknown>;
} => {
  const { transferType, ...rest } = props;

  // Return configuration for the appropriate hook
  switch (transferType) {
    case "shield":
    case "unshield":
    case "namada-transfer": {
      const { source, target } = rest;
      const txKind: NamadaTransferTxKind = `${
        isShieldedAddress(source) ? "Shielded" : "Transparent"
      }To${isShieldedAddress(target) ? "Shielded" : "Transparent"}`;

      let createTxAtom;
      let useDisposableSigner = false;

      switch (txKind) {
        case "TransparentToTransparent":
          createTxAtom = createTransparentTransferAtom;
          break;
        case "TransparentToShielded":
          createTxAtom = createShieldingTransferAtom;
          break;
        case "ShieldedToTransparent":
          createTxAtom = createUnshieldingTransferAtom;
          useDisposableSigner = true;
          break;
        case "ShieldedToShielded":
          createTxAtom = createShieldedTransferAtom;
          useDisposableSigner = true;
          break;
      }

      return {
        type: "transfer" as const,
        config: {
          ...rest,
          createTxAtom,
          useDisposableSigner,
          eventType: txKind,
        },
      };
    }

    case "ibc-deposit": {
      return {
        type: "ibcTransaction" as const,
        config: {
          registry: rest.registry,
          sourceAddress: rest.sourceAddress,
          sourceChannel: rest.sourceChannel,
          shielded: rest.shielded,
          destinationChannel: rest.destinationChannel,
          selectedAsset: rest.selectedAsset,
        },
      };
    }

    case "ibc-withdraw": {
      const { source, target, token, displayAmount, memo } = rest;
      const params: IbcTransferMsgValue[] = [
        {
          source,
          receiver: target,
          token,
          amountInBaseDenom: displayAmount, // Remove toBaseAmount for now
          channelId: rest.sourceChannel || "",
          portId: "transfer",
          gasSpendingKey: isShieldedAddress(source) ? source : undefined,
          memo,
        },
      ];

      return {
        type: "transaction" as const,
        config: {
          params,
          createTxAtom: createIbcTxAtom,
          useDisposableSigner: isShieldedAddress(source),
          eventType: "IbcTransfer" as const,
        },
      };
    }

    default:
      throw new Error(`Unknown transfer type: ${transferType}`);
  }
};

// Helper function to determine which hook to use based on config type
// This should be used by components to call the appropriate hook
export const getHookTypeFromConfig = (
  config: ReturnType<typeof getTransferConfig>
): "useTransfer" | "useIbcTransaction" | "useTransaction" => {
  if (config.type === "transfer") {
    return "useTransfer";
  } else if (config.type === "ibcTransaction") {
    return "useIbcTransaction";
  } else if (config.type === "transaction") {
    return "useTransaction";
  }

  throw new Error("Invalid config type");
};
