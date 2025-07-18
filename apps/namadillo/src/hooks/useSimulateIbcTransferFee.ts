import { SigningStargateClient } from "@cosmjs/stargate";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { simulateIbcTransferGas } from "atoms/integrations";
import BigNumber from "bignumber.js";
import { getIbcGasConfig } from "integrations/utils";
import invariant from "invariant";
import { createIbcTransferMessage } from "lib/transactions";
import { Asset, ChainRegistryEntry, GasConfig } from "types";
import { isNamadaAsset } from "utils";
import { sanitizeAddress } from "utils/address";
import { sanitizeChannel } from "utils/ibc";

type useSimulateIbcTransferFeeProps = {
  stargateClient?: SigningStargateClient;
  registry?: ChainRegistryEntry;
  isShieldedTransfer?: boolean;
  sourceAddress?: string;
  selectedAsset?: Asset;
  channel?: string;
};

export const useSimulateIbcTransferFee = ({
  stargateClient,
  registry,
  selectedAsset,
  isShieldedTransfer,
  sourceAddress,
  channel,
}: useSimulateIbcTransferFeeProps): UseQueryResult<GasConfig> => {
  return useQuery({
    queryKey: [
      "gasConfig",
      registry?.chain?.chain_id,
      selectedAsset?.base,
      isShieldedTransfer,
    ],
    retry: false,
    queryFn: async () => {
      try {
        invariant(registry, "Error: registry is required");
        const MASP_MEMO_LENGTH = 2356;

        // while Keplr can't accept NAM for fees, and stargate can't simulate the NAM fee,
        // we use a hardcoded value of "uosmo"
        const getToken = (): string => {
          if (isNamadaAsset(selectedAsset)) {
            return "uosmo";
          }
          return selectedAsset?.base || registry?.assets.assets[0].base || "";
        };

        const transferMsg = createIbcTransferMessage(
          sanitizeChannel(channel!),
          // We can't mock sourceAddress because the simulate function requires
          // a valid address with funds
          sanitizeAddress(sourceAddress!),
          sanitizeAddress(sourceAddress!),
          new BigNumber(1),
          getToken(),
          isShieldedTransfer ? "0".repeat(MASP_MEMO_LENGTH) : ""
        );

        const simulatedGas = await simulateIbcTransferGas(
          stargateClient!,
          sourceAddress!,
          transferMsg
        );

        const feeToken = registry.chain.fees?.fee_tokens?.[0];
        invariant(feeToken, "Error: fee token is required");

        const gasConfig = getIbcGasConfig(feeToken, simulatedGas);
        invariant(gasConfig, "Error: invalid Gas config");
        return gasConfig;
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    enabled: Boolean(registry && stargateClient && sourceAddress && channel),
  });
};
