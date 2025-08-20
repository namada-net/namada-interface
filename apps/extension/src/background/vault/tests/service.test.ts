import { AccountType } from "@namada/types";
import { Result } from "@namada/utils";
import { SdkService } from "background/sdk";
import { KVPrefix } from "router";
import { KeyStore, KeyStoreType, VaultStorage } from "storage";
import { KVStoreMock } from "test/init";
import { VaultService } from "../service";
import { SessionValues } from "../types";

jest.mock("webextension-polyfill", () => ({}));

type VaultPublicObj = { id: string; alias: string };
type VaultSensitiveValue = { bar: string };

const getKeyStore = (id: string, alias: string): KeyStoreType => ({
  id,
  alias,
  address: "address",
  owner: "owner",
  path: {
    account: 0,
    change: 0,
    index: 0,
  },
  type: AccountType.Mnemonic,
  source: "generated",
  timestamp: 0,
});

describe("Testing untouched Vault Service", () => {
  let service: VaultService;
  let storage: VaultStorage;
  const keyString = "key-store";
  const password = "123foo";
  const secretText = "secret";

  beforeEach(async () => {
    storage = new VaultStorage(new KVStoreMock(KVPrefix.IndexedDB));
    const sessionStore = new KVStoreMock<SessionValues>(
      KVPrefix.SessionStorage
    );

    const sdkService = await SdkService.init();
    service = new VaultService(storage, sessionStore, sdkService);
    await service.initialize();
    await service.createPassword(password);
  });

  it("Should lock and unlock extension properly", async () => {
    // Should be unlocked after password creation
    expect(await service.isLocked()).toBeFalsy();

    await service.lock();
    expect(await service.isLocked()).toBeTruthy();
    await expect(service.assertIsUnlocked()).rejects.toThrow();
    await service.unlock(password);
    expect(await service.isLocked()).toBeFalsy();
    expect(await service.checkPassword(password)).toBeTruthy();
  });

  it("Should encrypt and decrypt message correctly", async () => {
    const sensitiveData = secretText;
    const publicData = getKeyStore("id", "alias");
    const sensitive = await service.encryptSensitiveData<VaultSensitiveValue>(
      {
        bar: sensitiveData,
      },
      password
    );

    await service.assertIsUnlocked();
    await storage.add(KeyStore, {
      public: publicData,
      sensitive,
    });

    const vaultData = await storage.findOneOrFail(
      KeyStore,
      "alias",
      publicData.alias
    );

    const output = await service.reveal<VaultSensitiveValue>(
      vaultData.sensitive
    );
    expect(output?.bar).toEqual(sensitiveData);
  });

  const addFakeData = async (): Promise<VaultPublicObj[]> => {
    const sensitiveData = { bar: secretText };
    const data = [
      { id: "key0", alias: "value0" },
      { id: "key1", alias: "value1" },
      { id: "key2", alias: "value2" },
    ].map((obj) => getKeyStore(obj.id, obj.alias));

    const sensitive = await service.encryptSensitiveData<VaultSensitiveValue>(
      sensitiveData,
      password
    );

    for (const obj of data) {
      await storage.add(KeyStore, { public: obj, sensitive });
    }

    return data;
  };

  it("Should manage data correctly", async () => {
    await service.assertIsUnlocked();
    const data = await addFakeData();

    expect(await service.getLength(keyString)).toBe(data.length);
    expect(await storage.findOne(KeyStore, "id", "key0")).toHaveProperty(
      "public.alias",
      "value0"
    );
    expect(await storage.findOne(KeyStore, "id", "key1")).toHaveProperty(
      "public.alias",
      "value1"
    );
    expect(await storage.findOneOrFail(KeyStore, "id", "key0")).toHaveProperty(
      "public.alias",
      "value0"
    );

    expect(await storage.findOne(KeyStore, "id", "ops")).toBeNull();
    expect(await storage.findAll(KeyStore)).toHaveLength(3);

    const query1 = await storage.findAll(KeyStore, "id", "key1");
    expect(query1).toHaveLength(1);
    expect(query1[0]).toHaveProperty("public.alias", "value1");

    const query2 = await storage.findAllOrFail(KeyStore, "id", "key1");
    expect(query2).toHaveLength(1);
  });

  it("Should re-encrypt data correctly", async () => {
    await service.assertIsUnlocked();
    await addFakeData();

    const newPassword = "321bar";
    const status = await service.resetPassword(password, newPassword);
    expect(status).toEqual(Result.ok(null));

    await service.lock();
    expect(await service.unlock(newPassword)).toBeTruthy();
    const data = await storage.findAll(KeyStore);
    expect(data).toHaveLength(3);

    for (const obj of data) {
      expect(
        await service.reveal<VaultSensitiveValue>(obj.sensitive)
      ).toHaveProperty("bar", secretText);
    }
  });
});
