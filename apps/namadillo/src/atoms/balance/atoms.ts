import { DefaultApi } from "@namada/indexer-client";
import { Account, AccountType, DatedViewingKey } from "@namada/types";
import {
  accountsAtom,
  allDefaultAccountsAtom,
  defaultAccountAtom,
  transparentBalanceAtom,
} from "atoms/accounts/atoms";
import { indexerApiAtom } from "atoms/api";
import {
  chainParametersAtom,
  chainTokensAtom,
  fetchBlockHeightByTimestamp,
  nativeTokenAddressAtom,
} from "atoms/chain";
import { shouldUpdateBalanceAtom } from "atoms/etc";
import { namadaRegistryChainAssetsMapAtom } from "atoms/integrations";
import { tokenPricesFamily } from "atoms/prices/atoms";
import { maspIndexerUrlAtom, rpcUrlAtom } from "atoms/settings";
import { queryDependentFn } from "atoms/utils";
import { isAxiosError } from "axios";
import BigNumber from "bignumber.js";
import { sequenceT } from "fp-ts/lib/Apply";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import invariant from "invariant";
import { atom, getDefaultStore } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomWithStorage } from "jotai/utils";
import { Address, TokenBalance } from "types";
import { namadaAsset, toDisplayAmount } from "utils";
import {
  mapNamadaAddressesToAssets,
  mapNamadaAssetsToTokenBalances,
} from "./functions";
import {
  fetchShieldedBalance,
  fetchShieldedRewards,
  fetchShieldedRewardsPerToken,
  shieldedSync,
} from "./services";

/**
  Gets the viewing key and its birthday timestamp if it's a generated key
 */
const toDatedKeypair = async (
  api: DefaultApi,
  { viewingKey, source, timestamp }: Account
): Promise<DatedViewingKey> => {
  if (typeof viewingKey === "undefined") {
    throw new Error("Viewing key not found");
  }
  if (typeof timestamp === "undefined") {
    throw new Error("Timestamp not found");
  }
  let height = 0;

  if (source === "generated") {
    try {
      height = await fetchBlockHeightByTimestamp(api, timestamp);
    } catch (e) {
      if (isAxiosError(e) && e.status === 404) {
        console.warn(
          "Failed to fetch block height by timestamp, falling back to height 0",
          e
        );
      }
    }
  }

  return {
    key: viewingKey,
    birthday: height,
  };
};

export const viewingKeysAtom = atomWithQuery<
  [DatedViewingKey | undefined, DatedViewingKey[]]
>((get) => {
  const accountsQuery = get(accountsAtom);
  const defaultAccountsQuery = get(allDefaultAccountsAtom);
  const api = get(indexerApiAtom);

  return {
    queryKey: ["viewing-keys", accountsQuery.data, defaultAccountsQuery.data],
    ...queryDependentFn(async () => {
      const shieldedAccounts = accountsQuery.data!.filter(
        (a) => a.type === AccountType.ShieldedKeys
      );
      const defaultShieldedAccount = defaultAccountsQuery.data?.find(
        (account) => account.type === AccountType.ShieldedKeys
      );

      const viewingKeys = await Promise.all(
        shieldedAccounts.map(toDatedKeypair.bind(null, api))
      );

      if (!defaultShieldedAccount) {
        return [undefined, viewingKeys];
      } else {
      }
      const defaultViewingKey = await toDatedKeypair(
        api,
        defaultShieldedAccount
      );

      return [defaultViewingKey, viewingKeys];
    }, [accountsQuery, defaultAccountsQuery]),
  };
});

export const storageShieldedBalanceAtom = atomWithStorage<
  Record<Address, { address: Address; minDenomAmount: string }[]>
>("namadillo:shieldedBalance", {});

export const shieldedSyncProgress = atom(0);

export const lastCompletedShieldedSyncAtom = atomWithStorage<
  Record<Address, Date | undefined>
>("namadillo:last-shielded-sync", {}, undefined, { getOnInit: true });

export const isShieldedSyncCompleteAtom = atom((get) => {
  return get(shieldedSyncProgress) === 1;
});

export const shieldedBalanceAtom = atomWithQuery((get) => {
  const enablePolling = get(shouldUpdateBalanceAtom);
  const viewingKeysQuery = get(viewingKeysAtom);
  const chainTokensQuery = get(chainTokensAtom);
  const chainParametersQuery = get(chainParametersAtom);
  const namTokenAddressQuery = get(nativeTokenAddressAtom);
  const rpcUrl = get(rpcUrlAtom);
  const maspIndexerUrl = get(maspIndexerUrlAtom);
  const defaultAccount = get(defaultAccountAtom);

  const [viewingKey, allViewingKeys] = viewingKeysQuery.data ?? [];
  const chainTokens = chainTokensQuery.data?.map((t) => t.address);
  const chainId = chainParametersQuery.data?.chainId;
  const namTokenAddress = namTokenAddressQuery.data;

  return {
    refetchInterval: enablePolling ? 1000 : false,
    queryKey: ["shield-sync", viewingKey, chainTokens, chainId],
    ...queryDependentFn(async () => {
      if (
        !viewingKey ||
        !allViewingKeys ||
        !chainTokens ||
        !chainId ||
        !namTokenAddress ||
        !rpcUrl
      ) {
        return [];
      }
      const { set, get } = getDefaultStore();

      await shieldedSync({
        rpcUrl,
        maspIndexerUrl,
        token: namTokenAddress,
        viewingKeys: allViewingKeys,
        chainId,
        onProgress: (perc) => set(shieldedSyncProgress, perc),
      });

      const response = await fetchShieldedBalance(
        viewingKey,
        chainTokens,
        chainId
      );

      const shieldedBalance = response.map(([address, amount]) => ({
        address,
        minDenomAmount: amount,
      }));

      const storage = get(storageShieldedBalanceAtom);
      set(storageShieldedBalanceAtom, {
        ...storage,
        [viewingKey.key]: shieldedBalance,
      });

      if (defaultAccount.data) {
        const lastCompleteSyncInfo = get(lastCompletedShieldedSyncAtom);
        // Migration Previously we were storing sync info as a date string,
        // now we store it as a map of transparent accounts
        const syncInfo =
          typeof lastCompleteSyncInfo === "object" ? lastCompleteSyncInfo : {};
        set(lastCompletedShieldedSyncAtom, {
          ...syncInfo,
          [defaultAccount.data.address]: new Date(),
        });
      }

      return shieldedBalance;
    }, [
      viewingKeysQuery,
      chainTokensQuery,
      chainParametersQuery,
      namTokenAddressQuery,
    ]),
  };
});

export const namadaShieldedAssetsAtom = atomWithQuery((get) => {
  const storageShieldedBalance = get(storageShieldedBalanceAtom);
  const viewingKeysQuery = get(viewingKeysAtom);
  const chainTokensQuery = get(chainTokensAtom);
  const chainAssetsMap = get(namadaRegistryChainAssetsMapAtom);

  const [viewingKey] = viewingKeysQuery.data ?? [];
  const shieldedBalance = viewingKey && storageShieldedBalance[viewingKey.key];

  return {
    queryKey: ["namada-shielded-assets", shieldedBalance, chainAssetsMap.data],
    ...queryDependentFn(async () => {
      invariant(chainAssetsMap.data, "No chain assets map");

      return mapNamadaAddressesToAssets({
        balances:
          shieldedBalance?.map((i) => ({ ...i, tokenAddress: i.address })) ??
          [],
        assets: Object.values(chainAssetsMap.data),
      });
    }, [viewingKeysQuery, chainTokensQuery, chainAssetsMap]),
  };
});

export const namadaTransparentAssetsAtom = atomWithQuery((get) => {
  const transparentBalances = get(transparentBalanceAtom);
  const chainAssetsMap = get(namadaRegistryChainAssetsMapAtom);

  const transparentBalance = transparentBalances.data;

  return {
    queryKey: [
      "namada-transparent-assets",
      transparentBalance,
      chainAssetsMap.data,
    ],
    ...queryDependentFn(async () => {
      invariant(chainAssetsMap.data, "No chain assets map");

      return mapNamadaAddressesToAssets({
        balances: transparentBalance ?? [],
        assets: Object.values(chainAssetsMap.data),
      });
    }, [transparentBalances, chainAssetsMap]),
  };
});

export const shieldedTokensAtom = atomWithQuery<TokenBalance[]>((get) => {
  const shieldedAssets = get(namadaShieldedAssetsAtom);
  const tokenPrices = get(
    tokenPricesFamily(
      Object.keys(shieldedAssets.data ?? {}).map((address) => address)
    )
  );

  return {
    queryKey: ["shielded-tokens", shieldedAssets.data, tokenPrices.data],
    ...queryDependentFn(
      async () =>
        mapNamadaAssetsToTokenBalances(
          shieldedAssets.data ?? {},
          tokenPrices.isSuccess ? (tokenPrices.data ?? {}) : {}
        ),
      [shieldedAssets]
    ),
  };
});

export const shieldedRewardsPerTokenAtom = atomWithQuery((get) => {
  const shieldedAssets = get(namadaShieldedAssetsAtom);
  const chainParametersQuery = get(chainParametersAtom);
  const viewingKeysQuery = get(viewingKeysAtom);
  const rpcUrl = get(rpcUrlAtom);

  return {
    queryKey: ["shielded-rewards-per-token", shieldedAssets.data],
    ...queryDependentFn(async () => {
      const { chainId } = chainParametersQuery.data!;
      const [viewingKey] = viewingKeysQuery.data!;
      const assets = Object.entries(shieldedAssets.data ?? {}).map(
        ([address, entry]) => ({
          address,
          amount: entry.amount,
        })
      );

      if (!viewingKey) {
        return {};
      }
      const tokens = assets.map((a) => a.address);

      const rewards = await fetchShieldedRewardsPerToken(
        viewingKey,
        tokens,
        chainId,
        rpcUrl
      );

      return rewards;
    }, [shieldedAssets]),
  };
});

export const transparentTokensAtom = atomWithQuery<TokenBalance[]>((get) => {
  const transparentAssets = get(namadaTransparentAssetsAtom);
  const tokenPrices = get(
    tokenPricesFamily(
      Object.keys(transparentAssets.data ?? {}).map((address) => address)
    )
  );

  return {
    queryKey: ["transparent-tokens", transparentAssets.data, tokenPrices.data],
    ...queryDependentFn(
      () =>
        Promise.resolve(
          mapNamadaAssetsToTokenBalances(
            transparentAssets.data ?? {},
            tokenPrices.isSuccess ? (tokenPrices.data ?? {}) : {}
          )
        ),
      [transparentAssets]
    ),
  };
});

export const storageShieldedRewardsAtom = atomWithStorage<
  Record<Address, { minDenomAmount: string }>
>("namadillo:shieldedRewards", {});

export const shieldRewardsAtom = atomWithQuery((get) => {
  const viewingKeysQuery = get(viewingKeysAtom);
  const chainParametersQuery = get(chainParametersAtom);
  const rpcUrl = get(rpcUrlAtom);
  const { set } = getDefaultStore();

  return {
    queryKey: ["shield-rewards", viewingKeysQuery.data],
    ...queryDependentFn(async () => {
      const [viewingKey] = viewingKeysQuery.data!;
      if (!viewingKey) {
        return { minDenomAmount: BigNumber(0) };
      }
      const { chainId } = chainParametersQuery.data!;
      const minDenomAmount = BigNumber(
        await fetchShieldedRewards(viewingKey, chainId, rpcUrl)
      );

      const storage = get(storageShieldedRewardsAtom);
      set(storageShieldedRewardsAtom, {
        ...storage,
        [viewingKey.key]: { minDenomAmount: minDenomAmount.toString() },
      });

      return { minDenomAmount };
    }, [viewingKeysQuery, chainParametersQuery]),
  };
});

export const cachedShieldedRewardsAtom = atom((get) => {
  const viewingKeysQuery = O.fromNullable(get(viewingKeysAtom).data);
  const storage = O.fromNullable(get(storageShieldedRewardsAtom));

  const viewingKey = pipe(
    viewingKeysQuery,
    O.map(([viewingKey]) => O.fromNullable(viewingKey)),
    O.flatten
  );

  const storageRewards = pipe(
    sequenceT(O.Applicative)(viewingKey, storage),
    O.map(([viewingKey, storage]) => O.fromNullable(storage[viewingKey.key])),
    O.flatten,
    O.map((data) => ({ minDenomAmount: BigNumber(data.minDenomAmount) }))
  );

  const rewards = pipe(
    get(shieldRewardsAtom),
    O.fromPredicate((atom) => atom.isSuccess),
    O.map((atom) => atom.data)
  );

  const finalRewards = pipe(
    rewards,
    O.alt(() => storageRewards),
    O.map((data) => BigNumber(data.minDenomAmount)),
    O.getOrElse(() => BigNumber(0))
  );

  return {
    amount: toDisplayAmount(namadaAsset(), finalRewards),
  };
});
