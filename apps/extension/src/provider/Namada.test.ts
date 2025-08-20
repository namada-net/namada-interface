/* eslint-disable @typescript-eslint/no-explicit-any */

import { Namada } from "@namada/types";

import { PARENT_ACCOUNT_ID_KEY, UtilityStore } from "background/keyring";
import { VaultService } from "background/vault";
import * as utils from "extension/utils";
import { VaultStorage } from "storage";
import { KVStoreMock, init } from "test/init";
import { toPublicAccount } from "utils";
import { ACTIVE_ACCOUNT, keyStore, password } from "./data.mock";

// Needed for now as utils import webextension-polyfill directly
jest.mock("webextension-polyfill", () => ({}));

jest.mock("webextension-polyfill", () => ({
  tabs: {
    onRemoved: {
      addListener: jest.fn(),
    },
  },
}));

describe("Namada", () => {
  let namada: Namada;
  let vaultStorage: VaultStorage;
  let utilityStore: KVStoreMock<UtilityStore>;
  let vaultService: VaultService;

  beforeAll(async () => {
    jest.spyOn(utils, "getNamadaRouterId").mockResolvedValue(1);
    ({ namada, vaultStorage, utilityStore, vaultService } = await init());

    jest
      .spyOn(VaultService.prototype, "checkPassword")
      .mockReturnValue(Promise.resolve(true));

    await vaultService.unlock(password);
  });

  afterAll(async () => {
    await vaultService.lock();
  });

  it("should return all accounts", async () => {
    const store = {
      password: undefined,
      data: {
        "key-store": keyStore,
      },
    };

    await vaultStorage.set(store);
    await utilityStore.set(PARENT_ACCOUNT_ID_KEY, ACTIVE_ACCOUNT);
    const storedKeyStore = keyStore.map((store) => store.public);
    const storedAccounts = await namada.accounts();
    expect(storedAccounts).toEqual(
      storedKeyStore.map((derivedAccount) => toPublicAccount(derivedAccount))
    );
  });
});
