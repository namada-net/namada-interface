import { Balance } from "@namada/indexer-client";
import {
  AccountType,
  GenDisposableSignerResponse,
  NamadaKeychainAccount,
} from "@namada/types";
import { indexerApiAtom } from "atoms/api";
import { nativeTokenAddressAtom } from "atoms/chain";
import { shouldUpdateBalanceAtom } from "atoms/etc";
import { namadaExtensionConnectedAtom } from "atoms/settings";
import { queryDependentFn } from "atoms/utils";
import BigNumber from "bignumber.js";
import { NamadaKeychain } from "hooks/useNamadaKeychain";
import { atom } from "jotai";
import { atomWithMutation, atomWithQuery } from "jotai-tanstack-query";
import { namadaAsset, toDisplayAmount } from "utils";
import {
  fetchAccountBalance,
  fetchAccounts,
  fetchDefaultAccount,
} from "./services";

export const accountsAtom = atomWithQuery<readonly NamadaKeychainAccount[]>(
  (get) => {
    const isExtensionConnected = get(namadaExtensionConnectedAtom);
    return {
      enabled: isExtensionConnected,
      queryKey: ["fetch-accounts", isExtensionConnected],
      queryFn: fetchAccounts,
    };
  }
);

export const defaultAccountAtom = atomWithQuery<
  NamadaKeychainAccount | undefined
>((get) => {
  const isExtensionConnected = get(namadaExtensionConnectedAtom);
  return {
    enabled: isExtensionConnected,
    queryKey: ["default-account", isExtensionConnected],
    queryFn: fetchDefaultAccount,
  };
});

export const allDefaultAccountsAtom = atomWithQuery<NamadaKeychainAccount[]>(
  (get) => {
    const defaultAccount = get(defaultAccountAtom);
    const accounts = get(accountsAtom);
    return {
      queryKey: ["all-default-accounts", accounts.data, defaultAccount.data],
      ...queryDependentFn(async () => {
        if (!accounts.data) {
          return [];
        }

        const transparentAccountIdx = accounts.data.findIndex(
          (account) => account.address === defaultAccount.data?.address
        );

        // namada.accounts() returns a plain array of accounts, composed by the transparent
        // account followed by its shielded accounts.
        if (transparentAccountIdx === -1) {
          return [];
        }

        const defaultAccounts = [accounts.data[transparentAccountIdx]];
        for (let i = transparentAccountIdx + 1; i < accounts.data.length; i++) {
          if (accounts.data[i].type !== AccountType.ShieldedKeys) {
            break;
          }
          defaultAccounts.push(accounts.data[i]);
        }

        return defaultAccounts;
      }, [accounts, defaultAccount]),
    };
  }
);

export const isLedgerAccountAtom = atom((get) => {
  const defaultAccounts = get(allDefaultAccountsAtom);
  return Boolean(
    defaultAccounts.data?.find((account) => account.type === AccountType.Ledger)
  );
});

export const updateDefaultAccountAtom = atomWithMutation(() => {
  const namadaPromise = new NamadaKeychain().get();
  return {
    mutationFn: (address: string) =>
      namadaPromise.then((injectedNamada) =>
        injectedNamada?.updateDefaultAccount(address)
      ),
  };
});

export const accountBalanceAtom = atomWithQuery<BigNumber>((get) => {
  const transparentBalanceQuery = get(transparentBalanceAtom);
  const tokenAddress = get(nativeTokenAddressAtom);
  const enablePolling = get(shouldUpdateBalanceAtom);

  return {
    // TODO: subscribe to indexer events when it's done
    refetchInterval: enablePolling ? 1000 : false,
    queryKey: ["balances", tokenAddress.data, transparentBalanceQuery.data],
    ...queryDependentFn(async (): Promise<BigNumber> => {
      const balance = transparentBalanceQuery.data
        ?.filter(({ token: ta }) => ta.address === tokenAddress.data)
        .map(({ token, minDenomAmount }) => ({
          token,
          amount: toDisplayAmount(namadaAsset(), new BigNumber(minDenomAmount)),
        }))
        .at(0);
      return balance ? BigNumber(balance.amount) : BigNumber(0);
    }, [tokenAddress, transparentBalanceQuery]),
  };
});

export const disposableSignerAtom = atomWithQuery<GenDisposableSignerResponse>(
  (get) => {
    const isExtensionConnected = get(namadaExtensionConnectedAtom);
    return {
      // As this generates new keypair each time, we have to refetch it manually
      enabled: false,
      queryKey: ["disposable-signer", isExtensionConnected],
      queryFn: async () => {
        const namada = await new NamadaKeychain().get();
        const res = await namada?.getSigner().genDisposableKeypair();
        if (!res) {
          throw new Error("Failed to generate disposable signer");
        }

        return res;
      },
    };
  }
);

export const transparentBalanceAtom = atomWithQuery<Balance[]>((get) => {
  const enablePolling = get(shouldUpdateBalanceAtom);
  const api = get(indexerApiAtom);
  const defaultAccountQuery = get(defaultAccountAtom);

  const account = defaultAccountQuery.data;

  return {
    refetchInterval: enablePolling ? 1000 : false,
    queryKey: ["transparent-balance", account],
    ...queryDependentFn(async () => {
      return account ? fetchAccountBalance(api, account) : [];
    }, [defaultAccountQuery]),
  };
});
