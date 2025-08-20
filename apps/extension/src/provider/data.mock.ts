/* eslint-disable @typescript-eslint/no-explicit-any */
import { KdfType } from "@namada/sdk";
import { AccountType, BridgeType, Chain, Extensions } from "@namada/types";
import { ActiveAccountStore } from "background/keyring";
import { Vault } from "background/vault";
import { KeyStoreType } from "storage";

export const ACTIVE_ACCOUNT: ActiveAccountStore = {
  id: "324bfe0e-cb19-5f1a-9630-9daaaecadabe",
  type: AccountType.Mnemonic,
};

export const chain: Chain = {
  id: "namada",
  alias: "Namada Testnet",
  bech32Prefix: "atest",
  bip44: {
    // coinType = testnet (all coins) - Slip-0044
    // See: https://github.com/satoshilabs/slips/blob/master/slip-0044.md
    coinType: 1,
  },
  bridgeType: [BridgeType.IBC, BridgeType.Ethereum],
  rpc: "http://localhost:26657",
  chainId: "namada-75a7e12.69483d59a9fb174",
  extension: Extensions["namada"],
  currency: {
    token: "Namada",
    symbol: "NAM",
    gasPriceStep: { low: 0.01, average: 0.025, high: 0.03 }, // Optional
  },
};

export const keyStore: Vault<KeyStoreType>[] = [
  {
    public: {
      alias: "Parent Account",
      address:
        "atest1d9khqw36gvurxv6yxcmyvv6pgdzyxwp3g9z5gv6px5cyxs348yenjd6ygse5y32xxapy2dph26clnv",
      owner:
        "atest1d9khqw36gvurxv6yxcmyvv6pgdzyxwp3g9z5gv6px5cyxs348yenjd6ygse5y32xxapy2dph26clnv",
      id: ACTIVE_ACCOUNT.id,
      parentId: undefined,
      path: {
        account: 0,
        change: 0,
        index: 0,
      },
      publicKey: undefined,
      type: ACTIVE_ACCOUNT.type,
      timestamp: 0,
      source: "generated",
    },
    sensitive: {
      cipher: {
        type: "aes-256-gcm",
        iv: new Uint8Array([
          21, 236, 255, 45, 1, 85, 224, 91, 131, 95, 216, 186,
        ]),
        text: new Uint8Array([
          250, 49, 107, 16, 63, 98, 41, 44, 127, 146, 84, 218, 118, 97, 236, 40,
          151, 60, 2, 34, 75, 141, 136, 8, 177, 122, 11, 116, 5, 165, 11, 51,
          46, 148, 217, 177, 100, 189, 77, 88, 136, 230, 123, 84, 179, 56, 23,
          134, 81, 248, 158, 123, 219, 47, 107, 5, 216, 47, 214, 73, 28, 104,
          247, 202, 3, 114, 61, 76, 221, 122, 232, 12, 141, 24, 132, 236, 17,
          167, 219, 118, 244, 138, 139, 17, 169, 127, 124, 243, 23, 172, 41, 29,
        ]),
      },
      kdf: {
        type: KdfType.Argon2,
        params: {
          m_cost: 4096,
          t_cost: 3,
          p_cost: 1,
          salt: "Z29nfsJfAbe51KPQQcmlMA",
        },
      },
    },
  },
  {
    public: {
      alias: "Derived Account",
      address:
        "atest1d9khqw36geprgd2yxgcyy3fnxymnzwf4xpprgdzxgccryvp489qn2wzyxcmrgd2xxdznvv2p8akmfs",
      owner:
        "atest1d9khqw36geprgd2yxgcyy3fnxymnzwf4xpprgdzxgccryvp489qn2wzyxcmrgd2xxdznvv2p8akmfs",
      id: "123e4567-e89b-12d3-a456-426614174000",
      path: {
        account: 0,
        change: 0,
        index: 0,
      },
      publicKey: undefined,
      type: AccountType.PrivateKey,
      timestamp: 0,
      source: "generated",
    },
    sensitive: {
      cipher: {
        type: "aes-256-gcm",
        iv: new Uint8Array([
          21, 236, 255, 45, 1, 85, 224, 91, 131, 95, 216, 186,
        ]),
        text: new Uint8Array([
          250, 49, 107, 16, 63, 98, 41, 44, 127, 146, 84, 218, 118, 97, 236, 40,
          151, 60, 2, 34, 75, 141, 136, 8, 177, 122, 11, 116, 5, 165, 11, 51,
          46, 148, 217, 177, 100, 189, 77, 88, 136, 230, 123, 84, 179, 56, 23,
          134, 81, 248, 158, 123, 219, 47, 107, 5, 216, 47, 214, 73, 28, 104,
          247, 202, 3, 114, 61, 76, 221, 122, 232, 12, 141, 24, 132, 236, 17,
          167, 219, 118, 244, 138, 139, 17, 169, 127, 124, 243, 23, 172, 41, 29,
        ]),
      },
      kdf: {
        type: KdfType.Argon2,
        params: {
          m_cost: 4096,
          t_cost: 3,
          p_cost: 1,
          salt: "Z29nfsJfAbe51KPQQcmlMA",
        },
      },
    },
  },
];

export const mnemonic =
  "uncover refuse athlete early valid clump used punch season little hire split";

export const password = "asd";
