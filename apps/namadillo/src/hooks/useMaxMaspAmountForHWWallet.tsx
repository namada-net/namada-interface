import { estimateMaxMaspTxAmountLedgerAtom } from "atoms/balance";
import { namadaRegistryChainAssetsMapAtom } from "atoms/integrations";
import BigNumber from "bignumber.js";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { Asset, GasConfig } from "types";
import { toDisplayAmount } from "utils";
import { getDisplayGasFee } from "utils/gas";

type MaxMaspAmountForHWWalletResponse = {
  amount: BigNumber;
  displayWarning: boolean;
  calculating: boolean;
};

type MaxMaspAmountForHWWalletParams = {
  asset?: Asset;
  amount?: BigNumber;
  gasConfig: GasConfig;
};

export const useMaxMaspAmountForHWWallet = ({
  asset,
  amount,
  gasConfig,
}: MaxMaspAmountForHWWalletParams): MaxMaspAmountForHWWalletResponse | null => {
  const maxMaspTxAmountQuery = useAtomValue(
    estimateMaxMaspTxAmountLedgerAtom({
      token: asset?.address,
      feeToken: gasConfig.gasToken,
    })
  );
  const chainAssetsMap = useAtomValue(namadaRegistryChainAssetsMapAtom);

  const res = useMemo(() => {
    if (!maxMaspTxAmountQuery) {
      return null;
    }
    const { data } = maxMaspTxAmountQuery;
    if (!data || !asset || !amount) {
      return [BigNumber(0), false] as const;
    }
    const displayGas = getDisplayGasFee(gasConfig, chainAssetsMap.data || {});

    const max = toDisplayAmount(asset, data);
    const displayWarning = max.lt(amount);
    const maxWithFee = max.minus(displayGas.totalDisplayAmount);

    return [maxWithFee, displayWarning] as const;
  }, [
    maxMaspTxAmountQuery?.data?.toString(),
    gasConfig.gasLimit.toString(),
    amount?.toString(),
    asset?.address,
  ]);

  if (!res || !maxMaspTxAmountQuery) {
    return null;
  }

  const [maxAmount, displayWarning] = res;
  return {
    amount: maxAmount,
    displayWarning,
    calculating:
      maxMaspTxAmountQuery.isPending || maxMaspTxAmountQuery.isFetching,
  };
};
