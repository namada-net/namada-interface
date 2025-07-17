import { AssetList, Chain } from "@chain-registry/types";
import { DeliverTxResponse, SigningStargateClient } from "@cosmjs/stargate";
import { ExtensionKey } from "@namada/types";
import { chainAtom, chainTokensAtom } from "atoms/chain";
import { defaultServerConfigAtom } from "atoms/settings";
import { queryDependentFn } from "atoms/utils";
import BigNumber from "bignumber.js";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import invariant from "invariant";
import { atomWithMutation, atomWithQuery } from "jotai-tanstack-query";
import { atomFamily, atomWithStorage } from "jotai/utils";
import {
  Asset,
  AssetWithAmount,
  BaseDenom,
  Coin,
  IbcChannels,
  RpcStorage,
} from "types";
import { toDisplayAmount } from "utils";
import { getKeplrWallet } from "utils/ibc";
import {
  getAvailableChains,
  getChainRegistryByChainName,
  getNamadaChainAssetsMap,
  getNamadaChainRegistry,
  getNamadaIbcInfo,
} from "./functions";
import {
  broadcastIbcTransaction,
  fetchIbcChannelFromRegistry,
  fetchIbcRateLimits,
  queryAndStoreRpc,
  queryAssetBalances,
} from "./services";

type IBCTransferAtomParams = {
  client: SigningStargateClient;
  tx: TxRaw;
};

type AssetBalanceAtomParams = {
  chain?: Chain;
  assets?: AssetList;
  walletAddress?: string;
};

export const connectedWalletsAtom = atomWithStorage<
  Partial<Record<ExtensionKey, boolean>>
>("namadillo:connectedWallets", {});

// Currently we're just integrating with Keplr, but in the future we might use different wallets
export const selectedWalletAtom = atomWithStorage<ExtensionKey | undefined>(
  "namadillo:wallet",
  undefined
);

export const selectedIBCChainAtom = atomWithStorage<string | undefined>(
  "namadillo:ibc:chainId",
  undefined
);

export const rpcByChainAtom = atomWithStorage<
  Record<string, RpcStorage> | undefined
>("namadillo:rpc:active", undefined);

export const broadcastIbcTransactionAtom = atomWithMutation(() => {
  return {
    mutationKey: ["ibc-transfer"],
    mutationFn: async ({
      client,
      tx,
    }: IBCTransferAtomParams): Promise<DeliverTxResponse> => {
      return await broadcastIbcTransaction(client, tx);
    },
  };
});

/// Balance of KEPLR assets, should be only used in the context of deposits to Namada
export const assetBalanceAtomFamily = atomFamily(
  ({ chain, walletAddress, assets }: AssetBalanceAtomParams) => {
    return atomWithQuery<Record<BaseDenom, AssetWithAmount>>((get) => {
      const chainSettings = get(chainAtom);
      return {
        queryKey: ["assets", walletAddress, chain?.chain_id, assets],
        ...queryDependentFn(async () => {
          return await queryAndStoreRpc(chain!, async (rpc: string) => {
            invariant(chainSettings.data, "No chain settings");

            const isHousefire =
              chainSettings.data.chainId.includes("housefire");
            const chainName =
              isHousefire && chain!.chain_name === "osmosis" ?
                `${chain!.chain_name}-housefire`
              : chain!.chain_name;

            const assetsBalances = await queryAssetBalances(
              walletAddress!,
              rpc
            );
            const assetList = getChainRegistryByChainName(chainName)?.assets;
            invariant(assetList, "Asset list not found for chain");

            const entries = assetsBalances
              // Because there is no filerMap in js
              .flatMap((ab) => {
                const asset = assetList.assets.find((a) => a.base === ab.denom);
                return asset ? [[asset, ab] as const] : [];
              })
              .map(([asset, ab]) => ({
                asset,
                amount: toDisplayAmount(asset, BigNumber(ab.minDenomAmount)),
              }))
              // Not the most efficient but way more readable
              .map((item) => [item.asset.base, item] as const);

            return Object.fromEntries(entries);
          });
        }, [!!walletAddress, !!chain]),
      };
    });
  },
  (prev, current) => {
    return Boolean(
      !current.chain ||
        !current.walletAddress ||
        (prev.chain?.chain_id === current.chain?.chain_id &&
          prev.walletAddress === current.walletAddress)
    );
  }
);

/// Balance of ALL KEPLR assets across all supported chains using chainAssetsMap
/// Automatically discovers wallet addresses for each chain
export const allKeplrAssetsBalanceAtom = atomWithQuery<
  Record<BaseDenom, AssetWithAmount>
>((get) => {
  const chainSettings = get(chainAtom);
  const chainAssetsMap = get(namadaRegistryChainAssetsMapAtom);
  const connectedWallets = get(connectedWalletsAtom);

  return {
    queryKey: [
      "all-keplr-assets-comprehensive",
      chainSettings.data?.chainId,
      chainAssetsMap.data,
      connectedWallets,
    ],
    ...queryDependentFn(async () => {
      invariant(chainSettings.data, "No chain settings");
      invariant(chainAssetsMap.data, "No chain assets map");

      // Only proceed if Keplr is connected
      if (!connectedWallets?.keplr) {
        return {};
      }

      const isHousefire = chainSettings.data.chainId.includes("housefire");
      const availableChains = getAvailableChains();

      // Add housefire chains if needed
      const supportedChains =
        isHousefire ?
          ([
            ...availableChains,
            getChainRegistryByChainName("osmosis-housefire")?.chain,
          ].filter(Boolean) as Chain[])
        : availableChains;

      // Get Keplr wallet instance
      const keplr = getKeplrWallet();

      // First, silently check which chains we're already connected to
      const connectedChains: { chain: Chain; walletAddress: string }[] = [];

      await Promise.allSettled(
        supportedChains.map(async (chain) => {
          try {
            // Try to get key - if this throws, we're not connected to this chain
            const key = await keplr.getKey(chain.chain_id);
            if (key?.bech32Address) {
              connectedChains.push({
                chain,
                walletAddress: key.bech32Address,
              });
            }
          } catch (error) {
            console.error(
              `Failed to fetch balances for connected chain ${chain.chain_name}:`,
              error
            );
            // Chain not connected - silently skip without prompting user
            // This includes cases where user hasn't connected to this specific chain
            return;
          }
        })
      );

      // Only query balances from chains we're already connected to
      const chainBalancePromises = connectedChains.map(
        async ({ chain, walletAddress }) => {
          try {
            return await queryAndStoreRpc(chain, async (rpc: string) => {
              const chainName =
                isHousefire && chain.chain_name === "osmosis" ?
                  `${chain.chain_name}-housefire`
                : chain.chain_name;

              const assetsBalances = await queryAssetBalances(
                walletAddress,
                rpc
              );
              const assetList = getChainRegistryByChainName(chainName)?.assets;

              if (!assetList) {
                return [];
              }

              return assetsBalances.flatMap((ab) => {
                const asset = assetList.assets.find((a) => a.base === ab.denom);
                return asset ?
                    [{ asset, balance: ab, chainName: chain.chain_name }]
                  : [];
              });
            });
          } catch (error) {
            // RPC or balance query failed - log and continue
            console.warn(
              `Failed to fetch balances for connected chain ${chain.chain_name}:`,
              error
            );
            return [];
          }
        }
      );

      const chainBalances = await Promise.all(chainBalancePromises);
      const allBalances = chainBalances.flat();

      // Define the type for balance entries
      type BalanceEntry = {
        asset: Asset;
        balance: Coin;
      };

      // Process balances and create entries for ALL assets in chainAssetsMap
      const allChainAssets = Object.values(chainAssetsMap.data);
      const entries: [string, AssetWithAmount][] = [];

      // First, add assets that have actual balances
      allBalances.forEach(({ asset, balance }: BalanceEntry) => {
        // Try to find corresponding Namada asset in chainAssetsMap
        const namadaAsset = allChainAssets.find((namadaAsset) => {
          // Match by base denom
          if (asset.base === namadaAsset.base) {
            return true;
          }

          // Match by IBC trace counterparty base denom
          if (
            namadaAsset.traces?.[0]?.counterparty?.base_denom === asset.base
          ) {
            return true;
          }

          // Match by symbol
          if (asset.symbol && namadaAsset.symbol === asset.symbol) {
            return true;
          }

          return false;
        });

        const finalAsset = namadaAsset || asset;
        const amount = toDisplayAmount(
          finalAsset,
          BigNumber(balance.minDenomAmount)
        );

        if (amount.gt(0)) {
          entries.push([
            `${asset.base}`,
            {
              asset: finalAsset,
              amount,
            },
          ]);
        }
      });

      return Object.fromEntries(entries);
    }, [chainSettings, chainAssetsMap, !!connectedWallets?.keplr]),
  };
});

export const ibcRateLimitAtom = atomWithQuery((get) => {
  const chainTokens = get(chainTokensAtom);
  return {
    queryKey: ["ibc-rate-limit", chainTokens],
    ...queryDependentFn(async () => {
      return await fetchIbcRateLimits();
    }, [chainTokens]),
  };
});

export const ibcChannelsFamily = atomFamily((ibcChainName?: string) =>
  atomWithQuery<IbcChannels | null>((get) => {
    const chainSettings = get(chainAtom);
    const config = get(defaultServerConfigAtom);
    return {
      queryKey: ["known-channels", ibcChainName, chainSettings.data?.chainId],
      retry: false,
      ...queryDependentFn(async () => {
        invariant(chainSettings.data, "No chain settings");
        invariant(ibcChainName, "No IBC chain name");
        const isHousefire = chainSettings.data.chainId.includes("housefire");
        const ibcInfo = getNamadaIbcInfo(isHousefire);

        return fetchIbcChannelFromRegistry(ibcChainName, ibcInfo);
      }, [chainSettings, config, !!ibcChainName]),
    };
  })
);

export const namadaChainRegistryAtom = atomWithQuery((get) => {
  const chainSettings = get(chainAtom);

  return {
    queryKey: ["namada-chain-registry", chainSettings.data?.chainId],
    ...queryDependentFn(async () => {
      invariant(chainSettings.data, "No chain settings");
      const isHousefire = chainSettings.data.chainId.includes("housefire");

      return getNamadaChainRegistry(isHousefire);
    }, [chainSettings]),
  };
});

export const namadaRegistryChainAssetsMapAtom = atomWithQuery((get) => {
  const chainSettings = get(chainAtom);

  return {
    queryKey: ["namada-chain-assets-map", chainSettings.data?.chainId],
    ...queryDependentFn(async () => {
      invariant(chainSettings.data, "No chain settings");
      const isHousefire = chainSettings.data.chainId.includes("housefire");

      return getNamadaChainAssetsMap(isHousefire);
    }, [chainSettings]),
  };
});
