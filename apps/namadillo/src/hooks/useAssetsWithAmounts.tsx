import { isNamadaAddress, isShieldedAddress } from "App/Transfer/common";
import {
  namadaShieldedAssetsAtom,
  namadaTransparentAssetsAtom,
} from "atoms/balance";
import {
  allKeplrAssetsBalanceAtom,
  namadaRegistryChainAssetsMapAtom,
} from "atoms/integrations";
import BigNumber from "bignumber.js";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { Asset, AssetWithAmount } from "types";
import { filterAvailableAssetsWithBalance } from "utils/assets";

export const useAssetsWithAmounts = (
  sourceAddress: string
): AssetWithAmount[] => {
  const isShielded = isShieldedAddress(sourceAddress);
  const { data: usersAssets } = useAtomValue(
    isShielded ? namadaShieldedAssetsAtom : namadaTransparentAssetsAtom
  );
  const availableAssets = filterAvailableAssetsWithBalance(usersAssets);
  const chainAssets = useAtomValue(namadaRegistryChainAssetsMapAtom);
  const keplrBalances = useAtomValue(allKeplrAssetsBalanceAtom);

  return useMemo(() => {
    const chainAssetsMap = Object.values(chainAssets.data ?? {}) as Asset[];
    const result: AssetWithAmount[] = [];
    // Check if current address is a Keplr address (not shielded or transparent Namada)
    const isKeplrAddress = !isNamadaAddress(sourceAddress);

    if (isKeplrAddress) {
      // For Keplr addresses, show all available chain assets with balance data from allKeplrBalances
      chainAssetsMap.forEach((asset: Asset) => {
        let amount = BigNumber(0);
        // Look for balance in allKeplrBalances using the known key format
        if (keplrBalances.data) {
          const trace = asset.traces?.find((t: any) => t.type === "ibc");
          if (trace?.counterparty) {
            // For IBC assets
            const baseDenom = trace.counterparty.base_denom;
            if (keplrBalances.data[baseDenom])
              amount = keplrBalances.data[baseDenom].amount;
          } else {
            // For native assets: chainName:base
            const chainName = asset.name?.toLowerCase();
            if (chainName) {
              const key = `${asset.base}`;
              if (keplrBalances.data[key]) {
                amount = keplrBalances.data[key].amount;
              }
            }
          }

          result.push({
            asset,
            amount,
          });
        }
      });
    } else {
      // For Namada addresses, use the appropriate assets atom
      Object.values(availableAssets ?? {}).forEach((item) => {
        if (item.asset && item.asset.address) {
          result.push(item);
        }
      });
    }

    return result;
  }, [sourceAddress, availableAssets, chainAssets.data, keplrBalances.data]);
};
