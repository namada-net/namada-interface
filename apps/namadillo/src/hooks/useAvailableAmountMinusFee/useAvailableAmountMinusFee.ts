import { namadaRegistryChainAssetsMapAtom } from "atoms/integrations";
import BigNumber from "bignumber.js";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { GasConfig } from "types";
import { getDisplayGasFee } from "utils/gas";

export const useAvailableAmountMinusFees = (
  gasConfig: GasConfig,
  address?: string,
  availableAmount?: BigNumber
): BigNumber | undefined => {
  const { data: chainAssetsMap } = useAtomValue(
    namadaRegistryChainAssetsMapAtom
  );

  return useMemo(() => {
    if (
      !availableAmount ||
      // Don't subtract if the gas token is different than the selected asset:
      gasConfig.gasToken !== address
    ) {
      return availableAmount;
    }
    const displayGasFee = getDisplayGasFee(gasConfig, chainAssetsMap || {});

    const amountMinusFees = availableAmount
      .minus(displayGasFee.totalDisplayAmount)
      .decimalPlaces(6);

    return BigNumber.max(amountMinusFees, 0);
  }, [address, availableAmount?.toString()]);
};
