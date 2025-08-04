import { AssetList, Chain, IBCInfo } from "@chain-registry/types";
import * as celestia from "chain-registry/mainnet/celestia";
import * as cosmoshub from "chain-registry/mainnet/cosmoshub";
import * as namada from "chain-registry/mainnet/namada";
import * as neutron from "chain-registry/mainnet/neutron";
import * as noble from "chain-registry/mainnet/noble";
import * as nyx from "chain-registry/mainnet/nyx";
import * as osmosis from "chain-registry/mainnet/osmosis";
import * as stride from "chain-registry/mainnet/stride";
import invariant from "invariant";
import {
  Address,
  Asset,
  ChainRegistryEntry,
  IbcChannels,
  NamadaAsset,
  NamadaChainRegistryEntry,
  RpcStorage,
} from "types";

// TODO: hardcoded for now, more info below
// ---- Housefire Chain Registry section ----
// **INFO**
// This section would not be needed if:
// - we add namada housefire to chain-registry testnets
// - housefire would use corresponding testnets from different chains,
// this way for example we could add housefire nam to osmosis testnet registry
import housefireIbcCelestia from "@namada/chain-registry/_testnets/_IBC/namadahousefire-celestia.json";
import housefireIbcCosmoshub from "@namada/chain-registry/_testnets/_IBC/namadahousefire-cosmoshub.json";
import housefireIbcOsmosis from "@namada/chain-registry/_testnets/_IBC/namadahousefire-osmosis.json";
import housefireIbcStride from "@namada/chain-registry/_testnets/_IBC/namadahousefire-stride.json";
import housefireAssets from "@namada/chain-registry/_testnets/namadahousefire/assetlist.json";
import housefireChain from "@namada/chain-registry/_testnets/namadahousefire/chain.json";

const housefire: ChainRegistryEntry = {
  chain: housefireChain as Chain,
  assets: housefireAssets as AssetList,
  ibc: [
    housefireIbcCelestia,
    housefireIbcCosmoshub,
    housefireIbcStride,
    housefireIbcOsmosis,
  ] as IBCInfo[],
};

const housefireNamOnOsmosisDenom =
  "ibc/48473B990DD70EC30F270727C4FEBA5D49C7D74949498CDE99113B13F9EA5522";

const namOnOsmosis = osmosis.assets.assets.find((a) => a.symbol === "NAM");
const housefireNamOnOsmosis = {
  ...namOnOsmosis,
  denom_units: namOnOsmosis?.denom_units.map((unit) => {
    if (unit.exponent === 0) {
      return {
        ...unit,
        denom: housefireNamOnOsmosisDenom,
      };
    } else {
      return unit;
    }
  }),
  base: housefireNamOnOsmosisDenom,
  traces: namOnOsmosis?.traces?.map((trace) => {
    if (trace.type === "ibc") {
      return {
        ...trace,
        counterparty: {
          ...trace.counterparty,
          channel_id: housefireIbcOsmosis.channels[0].chain_1.channel_id,
        },
        chain: {
          ...trace.chain,
          channel_id: housefireIbcOsmosis.channels[0].chain_2.channel_id,
          path: `transfer/${housefireIbcOsmosis.channels[0].chain_2.channel_id}/${housefireAssets.assets[0].address}`,
        },
      };
    }
  }),
};

const cosmosisForHousefire = {
  ...osmosis,
  assets: {
    ...osmosis.assets,
    assets: [
      housefireNamOnOsmosis,
      ...osmosis.assets.assets.filter((a) => a.symbol !== "NAM"),
    ] as Asset[],
  },
};

// ---- Housefire Chain Registry Section End ----

// Whitelist of supported chains
const SUPPORTED_IBC_CHAINS_MAP = new Map<string, ChainRegistryEntry>(
  Object.entries({
    osmosis: osmosis,
    "osmosis-housefire": cosmosisForHousefire,
    cosmoshub: cosmoshub,
    celestia: celestia,
    nyx: nyx,
    stride: stride,
    neutron: neutron,
    noble: noble,
  })
);

const SUPPORTED_NAM_CHAINS_MAP = new Map<string, ChainRegistryEntry>(
  Object.entries({
    namada: namada,
    "namada-housefire": housefire,
  })
);

export const SUPPORTED_ASSETS_MAP = new Map<string, string[]>(
  Object.entries({
    osmosis: ["NAM", "OSMO"],
    cosmoshub: ["ATOM"],
    celestia: ["TIA"],
    nyx: ["NYM"],
    stride: ["stOSMO", "stATOM", "stTIA"],
    neutron: ["NTRN"],
    noble: ["USDC"],
  })
);

export const getRpcByIndex = (chain: Chain, index = 0): RpcStorage => {
  const availableRpcs = chain.apis?.rpc;
  if (!availableRpcs) {
    throw new Error("There are no available RPCs for " + chain.chain_name);
  }

  const rpc = availableRpcs[Math.min(index, availableRpcs.length - 1)];
  return {
    address: rpc.address,
    index,
  };
};

export const getRestApiAddressByIndex = (chain: Chain, index = 0): string => {
  const availableRestApis = chain.apis?.rest;
  if (!availableRestApis) {
    throw new Error("There are no available Rest APIs for " + chain.chain_name);
  }
  const randomRestApi =
    availableRestApis[Math.min(index, availableRestApis.length - 1)];
  return randomRestApi.address;
};

export const getDenomFromIbcTrace = (ibcAddress: string): string => {
  return ibcAddress.replaceAll(/(transfer\/|channel-\d+\/)*/gi, "");
};

export const getChannelFromIbcInfo = (
  ibcChainName: string,
  ibcInfo: IBCInfo
): IbcChannels => {
  const { chain_2, channels } = ibcInfo;
  const channelEntry = channels[0];

  invariant(channelEntry, "No channel entry found in IBC info");

  const namadaOnChannel1 = chain_2.chain_name === ibcChainName;
  const namadaChannelId = namadaOnChannel1 ? "chain_1" : "chain_2";
  const ibcChannelId = namadaOnChannel1 ? "chain_2" : "chain_1";

  return {
    namadaChannel: channelEntry[namadaChannelId].channel_id,
    ibcChannel: channelEntry[ibcChannelId].channel_id,
  };
};

export const getChainRegistryByChainId = (
  chainId: string
): ChainRegistryEntry | undefined => {
  return [
    ...SUPPORTED_IBC_CHAINS_MAP.values(),
    ...SUPPORTED_NAM_CHAINS_MAP.values(),
  ].find((registry) => registry.chain.chain_id === chainId);
};

export const getChainRegistryByChainName = (
  chainName: string
): ChainRegistryEntry | undefined => {
  // Search in IBC chains first
  const ibcChain = SUPPORTED_IBC_CHAINS_MAP.get(chainName);
  if (ibcChain) {
    return ibcChain;
  }

  // If not found in IBC chains, search in Namada chains
  return SUPPORTED_NAM_CHAINS_MAP.get(chainName);
};

export const getAvailableChains = (): Chain[] => {
  return SUPPORTED_IBC_CHAINS_MAP.entries()
    .filter(([key]) => !key.includes("housefire"))
    .map(([_, entry]) => entry.chain)
    .toArray();
};

export const getNamadaChainRegistry = (
  isHousefire: boolean
): NamadaChainRegistryEntry => {
  return (isHousefire ? housefire : namada) as NamadaChainRegistryEntry;
};

export const getNamadaChainAssetsMap = (
  isHousefire: boolean
): Record<Address, NamadaAsset> =>
  getNamadaChainRegistry(isHousefire).assets.assets.reduce((acc, curr) => {
    return curr.address ? { ...acc, [curr.address]: curr } : acc;
  }, {});

export const getIbcAssetByNamadaAsset = (
  asset: NamadaAsset,
  ibcAssets: Asset[]
): Asset | undefined => {
  // Returns base denom for provided asset(e.g. "uosmo", "uatom", "unam")
  const counterpartyBaseDenom =
    asset.traces?.[0].counterparty.base_denom || asset.base;

  const ibcAsset = ibcAssets.find((ibcAsset) => {
    // Keep this check for native assets (e.g., if you were matching OSMO to OSMO)
    if (counterpartyBaseDenom === ibcAsset.base) {
      return true;
    }

    // For non-native IBC assets, we must search the entire traces array (e.g. stOSMO, Noble USDC)
    if (ibcAsset.traces) {
      return ibcAsset.traces.some(
        (trace) =>
          trace.type === "ibc" &&
          trace.counterparty.base_denom === counterpartyBaseDenom
      );
    }
  });
  return ibcAsset;
};

export const getNamadaIbcInfo = (isHousefire: boolean): IBCInfo[] => {
  const ibcInfo = getNamadaChainRegistry(isHousefire).ibc;
  invariant(ibcInfo, "Namada IBC info is not available");

  return ibcInfo;
};
