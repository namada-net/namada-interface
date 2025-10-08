import { AssetList, Chain } from "@chain-registry/types";
import { DeliverTxResponse, SigningStargateClient } from "@cosmjs/stargate";
import { ExtensionKey } from "@namada/types";
import { chainAtom } from "atoms/chain";
import { defaultServerConfigAtom } from "atoms/settings";
import { queryDependentFn } from "atoms/utils";
import BigNumber from "bignumber.js";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import invariant from "invariant";
import { atomWithMutation, atomWithQuery } from "jotai-tanstack-query";
import { atomFamily, atomWithStorage } from "jotai/utils";
import { AssetWithAmount, BaseDenom, IbcChannels, RpcStorage } from "types";
import { toDisplayAmount } from "utils";
import {
  getChainRegistryByChainName,
  getNamadaChainAssetsMap,
  getNamadaChainRegistry,
  getNamadaIbcInfo,
} from "./functions";
import {
  broadcastIbcTransaction,
  fetchIbcChannelFromRegistry,
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
