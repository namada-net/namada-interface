/* eslint-disable @typescript-eslint/no-explicit-any */
import { AccountType } from "@namada/types";
import { KVStoreMock } from "test/init";
import { VaultStorage } from "./VaultStorage";
import { KeyStore } from "./schemas";

jest.mock("webextension-polyfill", () => ({}));

describe("VaultStorage", () => {
  let vaultStorage: VaultStorage;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    vaultStorage = new VaultStorage(new KVStoreMock("VaultStorage"));
  });

  it("should remove item from storage", async () => {
    const id = "1";
    await addNonSensitiveData(vaultStorage, id);

    await vaultStorage.remove(KeyStore, "id", "1");

    expect(await vaultStorage.findOne(KeyStore, "id", "1")).toBeNull();
  });
});

const addNonSensitiveData = async (
  vaultStorage: VaultStorage,
  id: string
): Promise<void> => {
  await vaultStorage.set({
    data: {
      "key-store": [
        {
          public: {
            id: `${id}`,
            alias: `test-${id}`,
            address: `test-${id}`,
            owner: `test-${id}`,
            path: { account: 0, change: 0, index: 0 },
            type: AccountType.Mnemonic,
            source: "generated",
            timestamp: 0,
          },
          sensitive: {} as any,
        },
      ],
    },
  });
};
