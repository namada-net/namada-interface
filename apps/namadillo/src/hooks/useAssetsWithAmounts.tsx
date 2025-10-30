import { isNamadaAddress, isShieldedAddress } from "App/Transfer/common";
import {
  namadaShieldedAssetsAtom,
  namadaTransparentAssetsAtom,
} from "atoms/balance";
import {
  allKeplrAssetsBalanceAtom,
  namadaRegistryChainAssetsMapAtom,
} from "atoms/integrations";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { AssetWithAmountAndChain } from "types";
import { filterAvailableAssetsWithBalance } from "utils/assets";

export const useAssetsWithAmounts = (
  sourceAddress: string
): AssetWithAmountAndChain[] => {
  const isShielded = isShieldedAddress(sourceAddress);
  const { data: usersAssets } = useAtomValue(
    isShielded ? namadaShieldedAssetsAtom : namadaTransparentAssetsAtom
  );
  const availableAssets = filterAvailableAssetsWithBalance(usersAssets);
  const chainAssets = useAtomValue(namadaRegistryChainAssetsMapAtom);
  const keplrBalances = useAtomValue(allKeplrAssetsBalanceAtom);

  return useMemo(() => {
    const result: AssetWithAmountAndChain[] = [];
    // Check if current address is a Keplr address (not shielded or transparent Namada)
    const isKeplrAddress = !isNamadaAddress(sourceAddress);

    if (isKeplrAddress && keplrBalances.data) {
      // For Keplr addresses, show all available chain assets with balance data from allKeplrBalances
      Object.values(keplrBalances.data).forEach(
        ({ asset, amount, chainName }) => {
          result.push({
            asset,
            amount,
            chainName,
          });
        }
      );
    } else {
      // For Namada addresses, use the appropriate assets atom
      Object.values(availableAssets ?? {}).forEach((item) => {
        if (item.asset && item.asset.address) {
          result.push({ ...item, chainName: "namada" });
        }
      });
    }

    return result;
  }, [sourceAddress, availableAssets, chainAssets.data, keplrBalances.data]);
};
