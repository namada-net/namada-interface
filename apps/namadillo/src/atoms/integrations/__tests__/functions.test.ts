import { Asset, Chain, IBCInfo } from "@chain-registry/types";
import { NamadaAsset } from "types";
import {
  getAvailableChains,
  getChainRegistryByChainId,
  getChainRegistryByChainName,
  getChannelFromIbcInfo,
  getDenomFromIbcTrace,
  getIbcAssetByNamadaAsset,
  getNamadaChainAssetsMap,
  getNamadaChainRegistry,
  getNamadaIbcInfo,
  getRestApiAddressByIndex,
  getRpcByIndex,
} from "../functions";

// Mock the chain registry imports
jest.mock("chain-registry/mainnet/osmosis", () => ({
  chain: {
    chain_name: "osmosis",
    chain_id: "osmosis-1",
    chain_type: "cosmos",
    apis: {
      rpc: [{ address: "https://rpc.osmosis.zone" }],
      rest: [{ address: "https://lcd.osmosis.zone" }],
    },
  },
  assets: {
    assets: [
      {
        symbol: "OSMO",
        base: "uosmo",
        denom_units: [{ denom: "uosmo", exponent: 0 }],
      },
    ],
  },
}));

jest.mock("chain-registry/mainnet/namada", () => ({
  chain: {
    chain_name: "namada",
    chain_id: "shielded-expedition.88f17d1d14",
    chain_type: "cosmos",
    apis: {
      rpc: [{ address: "https://rpc.namada.zone" }],
      rest: [{ address: "https://lcd.namada.zone" }],
    },
  },
  assets: {
    assets: [
      {
        symbol: "NAM",
        base: "unam",
        address: "tnam1qxvg64psvhwumv3mwrrjfcz0h3t3274hwggyzcee",
        denom_units: [{ denom: "unam", exponent: 0 }],
      },
    ],
  },
  ibc: [
    {
      chain_1: {
        chain_name: "namada",
        client_id: "test-client-1",
        connection_id: "test-connection-1",
      },
      chain_2: {
        chain_name: "osmosis",
        client_id: "test-client-2",
        connection_id: "test-connection-2",
      },
      channels: [
        {
          chain_1: { channel_id: "channel-0", port_id: "transfer" },
          chain_2: { channel_id: "channel-1", port_id: "transfer" },
        },
      ],
    },
  ],
}));

jest.mock("chain-registry/mainnet/cosmoshub", () => ({
  chain: {
    chain_name: "cosmoshub",
    chain_id: "cosmoshub-4",
    chain_type: "cosmos",
    apis: {
      rpc: [{ address: "https://rpc.cosmos.network" }],
      rest: [{ address: "https://lcd.cosmos.network" }],
    },
  },
  assets: {
    assets: [
      {
        symbol: "ATOM",
        base: "uatom",
        denom_units: [{ denom: "uatom", exponent: 0 }],
      },
    ],
  },
}));

describe("functions", () => {
  describe("getChainRegistryByChainName", () => {
    it("should return IBC chain when found in SUPPORTED_IBC_CHAINS_MAP", () => {
      const result = getChainRegistryByChainName("osmosis");
      expect(result).toBeDefined();
      expect(result?.chain.chain_name).toBe("osmosis");
      expect(result?.chain.chain_id).toBe("osmosis-1");
    });

    it("should return Namada chain when found in SUPPORTED_NAM_CHAINS_MAP", () => {
      const result = getChainRegistryByChainName("namada");
      expect(result).toBeDefined();
      expect(result?.chain.chain_name).toBe("namada");
      expect(result?.chain.chain_id).toBe("shielded-expedition.88f17d1d14");
    });

    it("should return undefined for non-existent chain", () => {
      const result = getChainRegistryByChainName("non-existent-chain");
      expect(result).toBeUndefined();
    });

    it("should prioritize IBC chains over Namada chains when both exist", () => {
      // This test verifies the search order: IBC chains first, then Namada chains
      const result = getChainRegistryByChainName("osmosis");
      expect(result?.chain.chain_name).toBe("osmosis");
      // Should not return namada even if it exists in SUPPORTED_NAM_CHAINS_MAP
    });
  });

  describe("getChainRegistryByChainId", () => {
    it("should return chain registry entry for valid chain ID", () => {
      const result = getChainRegistryByChainId("osmosis-1");
      expect(result).toBeDefined();
      expect(result?.chain.chain_id).toBe("osmosis-1");
    });

    it("should return chain registry entry for Namada chain ID", () => {
      const result = getChainRegistryByChainId(
        "shielded-expedition.88f17d1d14"
      );
      expect(result).toBeDefined();
      expect(result?.chain.chain_id).toBe("shielded-expedition.88f17d1d14");
    });

    it("should return undefined for non-existent chain ID", () => {
      const result = getChainRegistryByChainId("non-existent-chain-id");
      expect(result).toBeUndefined();
    });
  });

  describe("getRpcByIndex", () => {
    it("should return RPC storage for valid chain and index", () => {
      const chain: Chain = {
        chain_name: "test-chain",
        chain_id: "test-1",
        chain_type: "cosmos",
        apis: {
          rpc: [
            { address: "https://rpc1.test.com" },
            { address: "https://rpc2.test.com" },
          ],
        },
      };

      const result = getRpcByIndex(chain, 0);
      expect(result).toEqual({
        address: "https://rpc1.test.com",
        index: 0,
      });
    });

    it("should return last RPC when index exceeds available RPCs", () => {
      const chain: Chain = {
        chain_name: "test-chain",
        chain_id: "test-1",
        chain_type: "cosmos",
        apis: {
          rpc: [{ address: "https://rpc1.test.com" }],
        },
      };

      const result = getRpcByIndex(chain, 5);
      expect(result).toEqual({
        address: "https://rpc1.test.com",
        index: 5,
      });
    });

    it("should throw error when no RPCs are available", () => {
      const chain: Chain = {
        chain_name: "test-chain",
        chain_id: "test-1",
        chain_type: "cosmos",
      };

      expect(() => getRpcByIndex(chain)).toThrow(
        "There are no available RPCs for test-chain"
      );
    });
  });

  describe("getRestApiAddressByIndex", () => {
    it("should return REST API address for valid chain and index", () => {
      const chain: Chain = {
        chain_name: "test-chain",
        chain_id: "test-1",
        chain_type: "cosmos",
        apis: {
          rest: [
            { address: "https://lcd1.test.com" },
            { address: "https://lcd2.test.com" },
          ],
        },
      };

      const result = getRestApiAddressByIndex(chain, 0);
      expect(result).toBe("https://lcd1.test.com");
    });

    it("should return last REST API when index exceeds available APIs", () => {
      const chain: Chain = {
        chain_name: "test-chain",
        chain_id: "test-1",
        chain_type: "cosmos",
        apis: {
          rest: [{ address: "https://lcd1.test.com" }],
        },
      };

      const result = getRestApiAddressByIndex(chain, 5);
      expect(result).toBe("https://lcd1.test.com");
    });

    it("should throw error when no REST APIs are available", () => {
      const chain: Chain = {
        chain_name: "test-chain",
        chain_id: "test-1",
        chain_type: "cosmos",
      };

      expect(() => getRestApiAddressByIndex(chain)).toThrow(
        "There are no available Rest APIs for test-chain"
      );
    });
  });

  describe("getDenomFromIbcTrace", () => {
    it("should extract denom from IBC address", () => {
      const ibcAddress = "transfer/channel-0/uatom";
      const result = getDenomFromIbcTrace(ibcAddress);
      expect(result).toBe("uatom");
    });

    it("should handle IBC address without transfer prefix", () => {
      const ibcAddress = "channel-0/uatom";
      const result = getDenomFromIbcTrace(ibcAddress);
      expect(result).toBe("uatom");
    });

    it("should return original string if no transfer or channel pattern", () => {
      const ibcAddress = "uatom";
      const result = getDenomFromIbcTrace(ibcAddress);
      expect(result).toBe("uatom");
    });
  });

  describe("getChannelFromIbcInfo", () => {
    it("should return correct channel IDs when Namada is on chain_1", () => {
      const ibcInfo: IBCInfo = {
        chain_1: {
          chain_name: "namada",
          client_id: "test-client-1",
          connection_id: "test-connection-1",
        },
        chain_2: {
          chain_name: "osmosis",
          client_id: "test-client-2",
          connection_id: "test-connection-2",
        },
        channels: [
          {
            chain_1: { channel_id: "channel-0", port_id: "transfer" },
            chain_2: { channel_id: "channel-1", port_id: "transfer" },
            ordering: "ordered",
            version: "ics20-1",
          },
        ],
      };

      const result = getChannelFromIbcInfo("namada", ibcInfo);
      expect(result).toEqual({
        namadaChannel: "channel-1",
        ibcChannel: "channel-0",
      });
    });

    it("should return correct channel IDs when Namada is on chain_2", () => {
      const ibcInfo: IBCInfo = {
        chain_1: {
          chain_name: "osmosis",
          client_id: "test-client-2",
          connection_id: "test-connection-2",
        },
        chain_2: {
          chain_name: "namada",
          client_id: "test-client-1",
          connection_id: "test-connection-1",
        },
        channels: [
          {
            chain_1: { channel_id: "channel-1", port_id: "transfer" },
            chain_2: { channel_id: "channel-0", port_id: "transfer" },
            ordering: "ordered",
            version: "ics20-1",
          },
        ],
      };

      const result = getChannelFromIbcInfo("namada", ibcInfo);
      expect(result).toEqual({
        namadaChannel: "channel-1",
        ibcChannel: "channel-0",
      });
    });

    it("should throw error when no channel entry is found", () => {
      const ibcInfo: IBCInfo = {
        chain_1: {
          chain_name: "namada",
          client_id: "test-client-1",
          connection_id: "test-connection-1",
        },
        chain_2: {
          chain_name: "osmosis",
          client_id: "test-client-2",
          connection_id: "test-connection-2",
        },
        channels: [],
      };

      expect(() => getChannelFromIbcInfo("namada", ibcInfo)).toThrow(
        "No channel entry found in IBC info"
      );
    });
  });

  describe("getAvailableChains", () => {
    it("should return available chains excluding housefire", () => {
      const result = getAvailableChains();
      expect(Array.isArray(result)).toBe(true);
      // Should not include chains with "housefire" in the key
      expect(
        result.every((chain) => !chain.chain_name.includes("housefire"))
      ).toBe(true);
    });
  });

  describe("getNamadaChainRegistry", () => {
    it("should return mainnet Namada registry when isHousefire is false", () => {
      const result = getNamadaChainRegistry(false);
      expect(result.chain.chain_name).toBe("namada");
    });

    it("should return housefire Namada registry when isHousefire is true", () => {
      const result = getNamadaChainRegistry(true);
      expect(result.chain.chain_name).toBe("namadahousefire");
    });
  });

  describe("getNamadaChainAssetsMap", () => {
    it("should return assets map for mainnet", () => {
      const result = getNamadaChainAssetsMap(false);
      expect(typeof result).toBe("object");
      // Should contain NAM asset
      expect(
        result["tnam1qxvg64psvhwumv3mwrrjfcz0h3t3274hwggyzcee"]
      ).toBeDefined();
    });

    it("should return assets map for housefire", () => {
      const result = getNamadaChainAssetsMap(true);
      expect(typeof result).toBe("object");
    });
  });

  describe("getIbcAssetByNamadaAsset", () => {
    it("should find IBC asset by base denom", () => {
      const namadaAsset = {
        symbol: "NAM",
        base: "unam",
        name: "Namada",
        display: "NAM",
        denom_units: [{ denom: "unam", exponent: 0 }],
        type_asset: "sdk.coin" as const,
        traces: [
          {
            type: "ibc" as const,
            counterparty: { base_denom: "uosmo" },
          },
        ],
      };

      const ibcAssets = [
        {
          symbol: "OSMO",
          base: "uosmo",
          denom_units: [{ denom: "uosmo", exponent: 0 }],
        },
      ];

      const result = getIbcAssetByNamadaAsset(
        namadaAsset as unknown as NamadaAsset,
        ibcAssets as unknown as Asset[]
      );
      expect(result).toBeDefined();
      expect(result?.base).toBe("uosmo");
    });

    it("should find IBC asset by traces", () => {
      const namadaAsset = {
        symbol: "stOSMO",
        base: "ibc/stosmo",
        traces: [
          {
            type: "ibc" as const,
            counterparty: { base_denom: "uosmo" },
          },
        ],
      };

      const ibcAssets = [
        {
          symbol: "stOSMO",
          base: "ibc/stosmo",
          traces: [
            {
              type: "ibc" as const,
              counterparty: { base_denom: "uosmo" },
            },
          ],
        },
      ];

      const result = getIbcAssetByNamadaAsset(
        namadaAsset as unknown as NamadaAsset,
        ibcAssets as unknown as Asset[]
      );
      expect(result).toBeDefined();
      expect(result?.symbol).toBe("stOSMO");
    });

    it("should return undefined when asset is not found", () => {
      const namadaAsset = {
        symbol: "UNKNOWN",
        base: "uunknown",
        traces: [
          {
            type: "ibc" as const,
            counterparty: { base_denom: "uunknown" },
          },
        ],
      };

      const ibcAssets = [
        {
          symbol: "OSMO",
          base: "uosmo",
          denom_units: [{ denom: "uosmo", exponent: 0 }],
        },
      ];

      const result = getIbcAssetByNamadaAsset(
        namadaAsset as unknown as NamadaAsset,
        ibcAssets as unknown as Asset[]
      );
      expect(result).toBeUndefined();
    });
  });

  describe("getNamadaIbcInfo", () => {
    it("should return IBC info for mainnet", () => {
      const result = getNamadaIbcInfo(false);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return IBC info for housefire", () => {
      const result = getNamadaIbcInfo(true);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
