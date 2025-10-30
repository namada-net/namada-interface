import { SUPPORTED_ASSETS_MAP } from "atoms/integrations";
import { useMemo } from "react";
import { AssetWithAmount, BaseDenom, ChainRegistryEntry } from "types";

export const useAvailableIbcAssets = ({
  userAssets,
  registry,
}: {
  userAssets: Record<BaseDenom, AssetWithAmount> | undefined;
  registry: ChainRegistryEntry;
}): Record<BaseDenom, AssetWithAmount> | undefined => {
  const availableAssets = useMemo(() => {
    if (!userAssets || !registry) return undefined;

    const output: Record<BaseDenom, AssetWithAmount> = {};
    Object.entries(userAssets).forEach(([key, { asset }]) => {
      if (
        SUPPORTED_ASSETS_MAP.get(registry.chain.chain_name)?.includes(
          asset.symbol
        )
      )
        output[key] = { ...userAssets[key] };
    });

    return output;
  }, [Object.keys(userAssets || {}).join(""), registry?.chain.chain_name]);

  return availableAssets;
};
