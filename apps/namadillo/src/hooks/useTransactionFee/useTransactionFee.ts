import { GasEstimate } from "@namada/indexer-client";
import { transparentBalanceAtom } from "atoms/accounts";
import { shieldedBalanceAtom } from "atoms/balance";
import { nativeTokenAddressAtom } from "atoms/chain";
import {
  gasEstimateFamily,
  GasPriceTable,
  gasPriceTableAtom,
  isPublicKeyRevealedAtom,
} from "atoms/fees";
import { tokenPricesFamily } from "atoms/prices/atoms";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { GasConfig } from "types";
import { TxKind } from "types/txKind";
import { findCheapestToken } from "./internal";

export type TransactionFeeProps = {
  gasConfig: GasConfig;
  isLoading: boolean;
  gasEstimate: GasEstimate | undefined;
  gasPriceTable: GasPriceTable | undefined;
  onChangeGasLimit: (value: BigNumber) => void;
  onChangeGasToken: (value: string) => void;
};

export const useTransactionFee = (
  txKinds: TxKind[],
  isShielded = false
): TransactionFeeProps => {
  const [gasLimitValue, setGasLimitValue] = useState<BigNumber | undefined>();
  const [gasTokenValue, setGasTokenValue] = useState<string | undefined>();
  const userTransparentBalances = useAtomValue(transparentBalanceAtom);
  const userShieldedBalances = useAtomValue(shieldedBalanceAtom);
  const isPublicKeyRevealed = useAtomValue(isPublicKeyRevealedAtom);

  const { data: nativeToken, isLoading: isLoadingNativeToken } = useAtomValue(
    nativeTokenAddressAtom
  );

  const { data: gasEstimate, isLoading: isLoadingGasEstimate } = useAtomValue(
    gasEstimateFamily(isPublicKeyRevealed ? txKinds : ["RevealPk", ...txKinds])
  );

  const { data: gasPriceTable, isLoading: isLoadingGasPriceTable } =
    useAtomValue(gasPriceTableAtom);

  const gasDollarMap =
    useAtomValue(
      tokenPricesFamily(gasPriceTable?.map((item) => item.token.address) ?? [])
    ).data ?? {};

  const averageGasLimit = gasEstimate && BigNumber(gasEstimate.avg);
  const gasLimit = gasLimitValue ?? averageGasLimit ?? BigNumber(0);

  const availableGasTokenAddress = useMemo(() => {
    if (!gasPriceTable) return nativeToken;

    if (isShielded && !userShieldedBalances.data) {
      return nativeToken;
    }

    if (!isShielded && !userTransparentBalances.data) {
      return nativeToken;
    }

    // Separate shielded amount from transparent
    const balances =
      (isShielded ?
        // TODO: we need to refactor userShieldedBalances to return Balance[] type instead
        userShieldedBalances.data?.map((balance) => ({
          minDenomAmount: BigNumber(balance.minDenomAmount),
          token: balance.address,
        }))
      : userTransparentBalances.data?.map((balance) => ({
          minDenomAmount: BigNumber(balance.minDenomAmount),
          token: balance.token.address,
        }))) || [];

    // Check if user has enough NAM to pay fees
    const nativeAddressBalance = balances.find(
      (balance) => balance.token === nativeToken
    );

    if (nativeAddressBalance) {
      // Find gas price for native token, should be always present
      const gasPrice = gasPriceTable.find(
        ({ token }) => token.address === nativeToken
      )?.gasPriceInMinDenom;
      invariant(gasPrice, "Gas price for native token is not found");

      const requiredBalance = BigNumber(gasLimit).times(gasPrice);

      // Check if user has enough native token to pay fees
      if (BigNumber(nativeAddressBalance.minDenomAmount).gte(requiredBalance)) {
        return nativeAddressBalance.token;
      }
    }
    // Fallback to another token containing balance
    const gas = gasPriceTable.filter((gas) => {
      return !!balances.find(
        (balances) =>
          balances.token === gas.token.address && balances.minDenomAmount.gt(0)
      );
    });

    // All users balances are empty, so we return native token
    if (gas.length === 0) {
      return nativeToken;
    }

    // Search for the cheapest token for fees (in dollars) among the available tokens:
    return (
      findCheapestToken(gas, balances, gasLimit, gasDollarMap) || nativeToken
    );
  }, [
    userTransparentBalances.data,
    userShieldedBalances.data,
    gasPriceTable,
    gasDollarMap,
    isShielded,
    gasLimit,
  ]);

  const gasToken = gasTokenValue ?? availableGasTokenAddress ?? "";
  const gasPrice =
    gasPriceTable?.find((i) => i.token.address === gasToken)
      ?.gasPriceInMinDenom ?? BigNumber(0);

  const gasConfig: GasConfig = {
    gasLimit,
    gasPriceInMinDenom: gasPrice,
    gasToken,
  };

  const isLoading =
    userTransparentBalances.isLoading ||
    isLoadingNativeToken ||
    isLoadingGasEstimate ||
    isLoadingGasPriceTable;

  return {
    gasConfig,
    isLoading,
    gasEstimate,
    gasPriceTable,
    onChangeGasLimit: setGasLimitValue,
    onChangeGasToken: setGasTokenValue,
  };
};
