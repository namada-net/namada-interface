// apps/namadillo/src/hooks/useTransferResolver.ts

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
  | "namada-transfer"
  | "masp-shield"
  | "masp-unshield"
  | "ibc-transfer"
  | "ibc-withdraw";

type UseTransferResolverProps = {
  transferType: TransferType;
  // Add other necessary parameters from the different transfer hooks
  // For example:
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

    case "ibc-transfer": {
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
      const { source, target, token, displayAmount, asset, memo } = rest;
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

// This function returns the appropriate hook call based on transfer type
// Usage: const result = useTransferByType(getTransferConfig(props));
export const useTransferByType = (
  config: ReturnType<typeof getTransferConfig>
) => {
  if (config.type === "transfer") {
    return useTransfer(config.config);
  } else if (config.type === "ibcTransaction") {
    return useIbcTransaction(config.config);
  } else if (config.type === "transaction") {
    return useTransaction(config.config);
  }

  throw new Error("Invalid config type");
};
