import { chains } from "@namada/chains";
import {
  makeBip44Path,
  MODIFIED_ZIP32_PATH,
  PhraseSize,
  ShieldedKeys,
} from "@namada/sdk";
import { KVStore } from "@namada/storage";
import {
  AccountType,
  Bip44Path,
  DerivedAccount,
  GenDisposableSignerResponse,
  Path,
  SignArbitraryResponse,
  TxProps,
  Zip32Path,
} from "@namada/types";
import {
  assertNever,
  Result,
  shortenAddress,
  truncateInMiddle,
} from "@namada/utils";

import {
  AccountSecret,
  AccountSource,
  AccountStore,
  ActiveAccountStore,
  DeleteAccountError,
  KeyRingStatus,
  MnemonicValidationResponse,
  SensitiveAccountStoreData,
  UtilityStore,
} from "./types";

import { fromHex } from "@cosmjs/encoding";
import { SdkService } from "background/sdk";
import { VaultService } from "background/vault";
import {
  KeyStore,
  KeyStoreType,
  LocalStorage,
  SensitiveType,
  VaultStorage,
} from "storage";
import { generateId } from "utils";

// Generated UUID namespace for uuid v5
const UUID_NAMESPACE = "9bfceade-37fe-11ed-acc0-a3da3461b38c";

export const KEYSTORE_KEY = "key-store";
export const PARENT_ACCOUNT_ID_KEY = "parent-account-id";
export const AUTHKEY_KEY = "auth-key-store";
export const DISPOSABLE_SIGNER_KEY = "disposable-signer";
export const DEFAULT_BIP44_PATH = { account: 0, change: 0, index: 0 };

type DerivedAccountInfo = {
  address: string;
  id: string;
  text: string;
  owner: string;
  pseudoExtendedKey?: string;
  diversifierIndex?: number;
};

/**
 * Keyring stores keys in persisted background.
 */
export class KeyRing {
  private _status: KeyRingStatus = KeyRingStatus.Empty;

  constructor(
    protected readonly vaultService: VaultService,
    protected readonly vaultStorage: VaultStorage,
    protected readonly sdkService: SdkService,
    protected readonly utilityStore: KVStore<UtilityStore>,
    protected readonly localStorage: LocalStorage
  ) {}

  public get status(): KeyRingStatus {
    return this._status;
  }

  public async getActiveAccount(): Promise<ActiveAccountStore | undefined> {
    return await this.utilityStore.get(PARENT_ACCOUNT_ID_KEY);
  }

  public async setActiveAccount(id: string, type: AccountType): Promise<void> {
    await this.utilityStore.set(PARENT_ACCOUNT_ID_KEY, { id, type });
  }

  public validateMnemonic(phrase: string): MnemonicValidationResponse {
    const mnemonic = this.sdkService.getSdk().getMnemonic();
    const isValid = mnemonic.validateMnemonic(phrase);

    return isValid;
  }

  // Return new mnemonic to client for validation
  public async generateMnemonic(
    size: PhraseSize = PhraseSize.N12
  ): Promise<string[]> {
    const mnemonic = this.sdkService.getSdk().getMnemonic();
    const words = mnemonic.generate(size);

    return words;
  }

  public async storeLedger(
    alias: string,
    address: string,
    publicKey: string,
    bip44Path: Bip44Path,
    zip32Path?: Zip32Path,
    pseudoExtendedKey?: string,
    extendedViewingKey?: string,
    paymentAddress?: string,
    diversifierIndex?: number
  ): Promise<AccountStore | false> {
    const id = generateId(UUID_NAMESPACE, alias, address);
    const accountStore: AccountStore = {
      id,
      alias,
      address,
      publicKey,
      owner: address,
      path: bip44Path,
      type: AccountType.Ledger,
      source: "imported",
      timestamp: 0,
    };

    const sensitive = await this.vaultService.encryptSensitiveData({
      text: "",
      passphrase: "",
    });
    await this.vaultStorage.add(KeyStore, {
      public: accountStore,
      sensitive,
    });

    if (
      zip32Path &&
      pseudoExtendedKey &&
      extendedViewingKey &&
      paymentAddress
    ) {
      const shieldedId = generateId(UUID_NAMESPACE, alias, paymentAddress);
      const shieldedAccountStore: AccountStore = {
        id: shieldedId,
        alias,
        address: paymentAddress,
        publicKey,
        owner: extendedViewingKey,
        path: zip32Path,
        pseudoExtendedKey,
        parentId: id,
        type: AccountType.ShieldedKeys,
        source: "imported",
        diversifierIndex,
        timestamp: 0,
      };

      const shieldedSensitive = await this.vaultService.encryptSensitiveData({
        text: "",
        passphrase: "",
      });
      await this.vaultStorage.add(KeyStore, {
        public: shieldedAccountStore,
        sensitive: shieldedSensitive,
      });
    }

    await this.setActiveAccount(id, AccountType.Ledger);
    return accountStore;
  }

  public async revealMnemonic(accountId: string): Promise<string> {
    const account = await this.vaultStorage.findOneOrFail(
      KeyStore,
      "id",
      accountId
    );

    if (account.public.type !== AccountType.Mnemonic) {
      throw new Error("Account should have be created using a mnemonic test.");
    }

    const sensitiveData =
      await this.vaultService.reveal<SensitiveAccountStoreData>(
        account.sensitive
      );

    if (!sensitiveData) {
      return "";
    }

    return sensitiveData.text;
  }

  public async revealSpendingKey(accountId: string): Promise<string> {
    const account = await this.vaultStorage.findOneOrFail(
      KeyStore,
      "id",
      accountId
    );

    if (account.public.type !== AccountType.ShieldedKeys) {
      throw new Error("Account should have be created using a spending key");
    }

    const sensitiveData =
      await this.vaultService.reveal<SensitiveAccountStoreData>(
        account.sensitive
      );

    if (!sensitiveData) {
      return "";
    }

    return JSON.parse(sensitiveData.text).spendingKey;
  }

  public async revealPrivateKey(accountId: string): Promise<string> {
    const account = await this.vaultStorage.findOneOrFail(
      KeyStore,
      "id",
      accountId
    );

    if (
      ![AccountType.PrivateKey, AccountType.Disposable].includes(
        account.public.type
      )
    ) {
      throw new Error("Account should have been created using a private key");
    }

    const sensitiveData =
      await this.vaultService.reveal<SensitiveAccountStoreData>(
        account.sensitive
      );

    if (!sensitiveData) {
      return "";
    }

    return sensitiveData.text;
  }

  accountStoreShielded(
    address: string,
    viewingKey: string,
    pseudoExtendedKey: string,
    text: string,
    alias: string,
    diversifierIndex: number,
    path: Bip44Path,
    vaultLength: number,
    source: AccountSource,
    timestamp: number
  ): AccountStore {
    // Generate unique id for shielded key
    const shieldedId = generateId(
      UUID_NAMESPACE,
      text,
      alias,
      address,
      viewingKey,
      path.account,
      vaultLength
    );

    return {
      id: shieldedId,
      alias,
      address,
      owner: viewingKey,
      diversifierIndex,
      path,
      pseudoExtendedKey,
      type: AccountType.ShieldedKeys,
      source,
      timestamp,
    };
  }

  accountStoreDefault(
    accountType: AccountType,
    address: string,
    publicKey: string,
    text: string,
    alias: string,
    path: Bip44Path,
    vaultLength: number,
    source: AccountSource,
    timestamp: number
  ): AccountStore {
    // Generate unique ID for new parent account:
    const id = generateId(
      UUID_NAMESPACE,
      text,
      alias,
      address,
      path.account,
      path.change,
      path.index,
      vaultLength
    );

    return {
      id,
      alias,
      address,
      owner: address,
      path,
      publicKey,
      type: accountType,
      source,
      timestamp,
    };
  }

  // Store validated mnemonic, private key, or spending key
  public async storeAccountSecret(
    accountSecret: AccountSecret,
    alias: string,
    flow: "create" | "import",
    path: Bip44Path = { account: 0, change: 0, index: 0 }
  ): Promise<AccountStore> {
    await this.vaultService.assertIsUnlocked();

    const keys = this.sdkService.getSdk().getKeys();
    const source: AccountSource = flow === "create" ? "generated" : "imported";
    const timestamp = source === "generated" ? new Date().getTime() : 0;

    const { sk, text, passphrase, accountType } = ((): {
      sk: string;
      text: string;
      passphrase: string;
      accountType: AccountType;
    } => {
      switch (accountSecret.t) {
        case "Mnemonic":
          const phrase = accountSecret.seedPhrase.join(" ");
          const transparentKeys = keys.deriveFromMnemonic(
            phrase,
            path,
            accountSecret.passphrase
          );

          return {
            sk: transparentKeys.privateKey,
            text: phrase,
            passphrase: accountSecret.passphrase,
            accountType: AccountType.Mnemonic,
          };

        case "PrivateKey":
          const { privateKey } = accountSecret;

          return {
            sk: privateKey,
            text: privateKey,
            passphrase: "",
            accountType: AccountType.PrivateKey,
          };

        case "ShieldedKeys":
          const { spendingKey } = accountSecret;
          return {
            sk: spendingKey,
            text: JSON.stringify({ spendingKey }),
            passphrase: "",
            accountType: AccountType.ShieldedKeys,
          };
        default:
          return assertNever(accountSecret);
      }
    })();

    const vaultLength = await this.vaultService.getLength(KEYSTORE_KEY);

    const accountStore = (() => {
      switch (accountType) {
        case AccountType.ShieldedKeys:
          const shieldedKeys = keys.shieldedKeysFromSpendingKey(sk);

          return this.accountStoreShielded(
            shieldedKeys.address,
            shieldedKeys.viewingKey,
            shieldedKeys.pseudoExtendedKey,
            text,
            alias,
            shieldedKeys.diversifierIndex,
            path,
            vaultLength,
            source,
            timestamp
          );

        default:
          const { address, publicKey } = keys.getAddress(sk);

          return this.accountStoreDefault(
            accountType,
            address,
            publicKey,
            text,
            alias,
            path,
            vaultLength,
            source,
            timestamp
          );
      }
    })();

    // Check whether keys already exist for this account
    const account = await this.queryAccountByAddress(accountStore.address);
    if (account) {
      throw new Error(
        `Keys for ${truncateInMiddle(accountStore.address, 5, 8)} already imported!`
      );
    }

    const sensitiveData: SensitiveAccountStoreData = { text, passphrase };
    const sensitive =
      await this.vaultService.encryptSensitiveData(sensitiveData);

    await this.vaultStorage.add(KeyStore, {
      public: accountStore,
      sensitive,
    });
    await this.setActiveAccount(accountStore.id, accountStore.type);
    return accountStore;
  }

  private async getParentSecret(parentId: string): Promise<{
    secret: Uint8Array;
  }> {
    const parentAccount = await this.queryAccountById(parentId);

    if (!parentAccount) {
      throw "No parent account has been found";
    }

    const storedSecret = await this.vaultStorage.findOneOrFail(
      KeyStore,
      "id",
      parentId
    );

    try {
      const sensitiveData =
        await this.vaultService.reveal<SensitiveAccountStoreData>(
          storedSecret.sensitive
        );

      if (!sensitiveData) {
        throw new Error(
          "Returned an empty value while decrypting mnemonic from password"
        );
      }

      const { text, passphrase } = sensitiveData;

      if (parentAccount.type === AccountType.Mnemonic) {
        const mnemonicSdk = this.sdkService.getSdk().getMnemonic();
        const seed = mnemonicSdk.toSeed(text, passphrase);

        return { secret: seed };
      } else {
        return { secret: fromHex(text) };
      }
    } catch (e) {
      console.error(e);
      throw Error("Could not decrypt mnemonic using the provided password");
    }
  }

  private async persistAccount(
    path: Path,
    parentId: string,
    type: AccountType,
    alias: string,
    derivedAccountInfo: DerivedAccountInfo,
    source: "imported" | "generated",
    timestamp: number
  ): Promise<DerivedAccount> {
    const { address, id, text, owner, pseudoExtendedKey } = derivedAccountInfo;

    let modifiedZip32Path: string | undefined;

    const parent = parentId ? await this.queryAccountById(parentId) : null;

    if (parent) {
      if (
        type === AccountType.ShieldedKeys &&
        parent.type === AccountType.Mnemonic
      ) {
        modifiedZip32Path = makeBip44Path(
          chains.namada.bip44.coinType,
          MODIFIED_ZIP32_PATH
        );
      }
    }

    const account: AccountStore = {
      id,
      address,
      alias,
      parentId,
      path,
      type,
      modifiedZip32Path,
      owner,
      pseudoExtendedKey,
      source,
      timestamp,
      diversifierIndex:
        type === AccountType.ShieldedKeys ?
          derivedAccountInfo.diversifierIndex
        : undefined,
    };
    const sensitive = await this.vaultService.encryptSensitiveData({
      text,
      passphrase: "",
    });
    await this.vaultStorage.add(KeyStore, {
      public: { ...account, owner },
      sensitive,
    });
    return account;
  }

  public async deriveShieldedAccount(
    path: Zip32Path,
    type: AccountType,
    alias: string,
    parentId: string,
    source: "imported" | "generated"
  ): Promise<DerivedAccount> {
    await this.vaultService.assertIsUnlocked();

    if (type !== AccountType.PrivateKey && type !== AccountType.ShieldedKeys) {
      throw new Error("Unsupported account type");
    }

    const parentAccount = await this.queryAccountById(parentId);
    if (!parentAccount) {
      throw new Error(`Parent account not found: ${parentId}`);
    }

    const { secret } = await this.getParentSecret(parentId);
    const id = generateId(
      UUID_NAMESPACE,
      "shielded-account",
      parentAccount.id,
      path.account
    );
    const keysNs = this.sdkService.getSdk().getKeys();

    let shieldedKeys: ShieldedKeys;
    const parentType = parentAccount.type;

    if (parentType === AccountType.Mnemonic) {
      shieldedKeys = keysNs.deriveShieldedFromSeed(secret, path);
    } else if (parentType === AccountType.PrivateKey) {
      shieldedKeys = keysNs.deriveShieldedFromPrivateKey(secret, path);
    } else {
      throw new Error(`Invalid account type! ${parentType}`);
    }

    const {
      address,
      diversifierIndex,
      viewingKey,
      spendingKey,
      pseudoExtendedKey,
    } = shieldedKeys;

    const info = {
      address,
      id,
      owner: viewingKey,
      text: JSON.stringify({ spendingKey }),
      pseudoExtendedKey,
      diversifierIndex,
    };

    // Check whether keys already exist for this account
    const existingAccount = await this.queryAccountByAddress(info.address);
    if (existingAccount) {
      throw new Error(
        `Keys for ${truncateInMiddle(info.address, 5, 8)} already imported!`
      );
    }

    const timestamp = source === "generated" ? new Date().getTime() : 0;
    const derivedShieldedAccount = await this.persistAccount(
      path,
      parentId,
      type,
      alias,
      info,
      source,
      timestamp
    );
    return derivedShieldedAccount;
  }

  public async queryAllAccounts(): Promise<DerivedAccount[]> {
    const accounts = await this.vaultStorage.findAll(KeyStore);
    return accounts.map((entry) => entry.public);
  }

  /**
   * Query single account by ID
   */
  public async queryAccountById(accountId: string): Promise<DerivedAccount> {
    const account = (
      await this.vaultStorage.findOneOrFail(KeyStore, "id", accountId)
    ).public;

    return account;
  }

  /**
   * Query accounts from storage (active parent account + associated derived child accounts)
   */
  public async queryAccountsByParentId(
    parentId: string
  ): Promise<DerivedAccount[]> {
    const parentAccount = await this.vaultStorage.findOne(
      KeyStore,
      "id",
      parentId
    );

    const derivedAccounts =
      (await this.vaultStorage.findAll(KeyStore, "parentId", parentId)) || [];

    if (parentAccount) {
      const accounts = [parentAccount, ...derivedAccounts];
      return accounts.map((entry) => entry.public as AccountStore);
    }

    return [];
  }

  public async queryDefaultAccount(): Promise<DerivedAccount | undefined> {
    const accounts = await this.queryAllAccounts();
    const activeAccount = await this.getActiveAccount();

    return accounts.find((acc) => acc.id === activeAccount?.id);
  }

  public async updateDefaultAccount(address: string): Promise<void> {
    const accounts = await this.queryAccountDetails(address);
    if (!accounts) {
      throw new Error(`Account with address ${address} not found.`);
    }
    const [transactionAccount] = accounts;
    const { id, type } = transactionAccount;
    await this.setActiveAccount(id, type);
  }

  public async queryAccountByPublicKey(
    publicKey: string
  ): Promise<DerivedAccount[]> {
    const parentAccount = await this.vaultStorage.findOne(
      KeyStore,
      "publicKey",
      publicKey
    );

    const derivedAccounts =
      (await this.vaultStorage.findAll(
        KeyStore,
        "parentId",
        parentAccount?.public.id
      )) || [];

    if (parentAccount) {
      const accounts = [parentAccount, ...derivedAccounts];
      return accounts.map((entry) => entry.public as AccountStore);
    }

    return [];
  }

  /**
   * Query all top-level parent accounts (mnemonic accounts)
   */
  public async queryParentAccounts(): Promise<DerivedAccount[]> {
    const accounts =
      (await this.vaultStorage.findAll(
        KeyStore,
        "type",
        AccountType.Mnemonic
      )) || [];
    return accounts.map((account) => account.public as AccountStore);
  }

  private async getSpendingKey(address: string): Promise<string> {
    const account = await this.vaultStorage.findOne(
      KeyStore,
      "address",
      address
    );
    if (!account) {
      throw new Error(`Account for ${address} not found!`);
    }
    const allAccounts = await this.queryAllAccounts();
    const accountStore = allAccounts.find(
      (account) => account.address === address
    );

    if (!accountStore) {
      throw new Error(`Account for ${address} not found!`);
    }

    const sensitiveProps =
      await this.vaultService.reveal<SensitiveAccountStoreData>(
        account.sensitive
      );
    if (!sensitiveProps) {
      throw new Error(`Signing key for ${address} not found!`);
    }

    let shieldedAccount: DerivedAccount | undefined;

    if (accountStore.type === AccountType.ShieldedKeys) {
      shieldedAccount = accountStore;
    } else {
      shieldedAccount = allAccounts.find(
        (account) => account.parentId === accountStore.id
      );
    }

    const { text, passphrase } = sensitiveProps;

    if (!shieldedAccount) {
      throw new Error(`Shielded account for ${address} not found!`);
    }

    const zip32Path = {
      account: shieldedAccount.path.account,
    };
    const accountType = accountStore.type;
    let shieldedKeys: ShieldedKeys;
    const keys = this.sdkService.getSdk().getKeys();

    if (accountType === AccountType.Mnemonic) {
      const mnemonicSdk = this.sdkService.getSdk().getMnemonic();
      const seed = mnemonicSdk.toSeed(text, passphrase);
      shieldedKeys = keys.deriveShieldedFromSeed(seed, zip32Path);
    } else if (accountType === AccountType.PrivateKey) {
      shieldedKeys = keys.deriveShieldedFromPrivateKey(fromHex(text));
    } else if (accountType === AccountType.ShieldedKeys) {
      return JSON.parse(sensitiveProps.text).spendingKey;
    } else {
      throw new Error(`Unsupported account type: ${accountType}`);
    }

    return shieldedKeys.spendingKey;
  }

  /**
   * For provided address, return associated private key
   */
  private async getSigningKey(address: string): Promise<string> {
    const account = await this.vaultStorage.findOne(
      KeyStore,
      "address",
      address
    );
    if (!account) {
      throw new Error(`Account for ${address} not found!`);
    }
    const accountStore = (await this.queryAllAccounts()).find(
      (account) => account.address === address
    );

    if (!accountStore) {
      throw new Error(`Account for ${address} not found!`);
    }
    const { path } = accountStore;

    const sensitiveProps =
      await this.vaultService.reveal<SensitiveAccountStoreData>(
        account.sensitive
      );
    if (!sensitiveProps) {
      throw new Error(`Signing key for ${address} not found!`);
    }
    const { text: secret, passphrase } = sensitiveProps;

    let privateKey: string;

    if (account.public.type === AccountType.PrivateKey) {
      privateKey = secret;
    } else {
      const sdk = this.sdkService.getSdk();
      const mnemonic = sdk.getMnemonic();
      const seed = mnemonic.toSeed(secret, passphrase);
      const bip44Path = {
        account: path.account,
        change: path.change || 0,
        index: path.index || 0,
      };

      const keys = this.sdkService.getSdk().getKeys();
      privateKey = keys.deriveFromSeed(seed, bip44Path).privateKey;
    }

    return privateKey;
  }

  public async queryAccountByAddress(
    address: string
  ): Promise<DerivedAccount | undefined> {
    return (await this.queryAllAccounts()).find(
      (account) => account.address === address
    );
  }

  private async findAllChildAccounts(
    accountId: string
  ): Promise<{ public: KeyStoreType; sensitive?: SensitiveType }[]> {
    return (
      (await this.vaultStorage.findAll(KeyStore, "parentId", accountId)) || []
    );
  }

  async renameAccount(
    topLevelAccountId: string,
    alias: string
  ): Promise<DerivedAccount> {
    const renameFn = (accountId: string): Promise<DerivedAccount> =>
      this.vaultStorage.update(KeyStore, "id", accountId, {
        alias,
      });

    const topLevelAccount = await renameFn(topLevelAccountId);

    const childAccounts = await this.findAllChildAccounts(topLevelAccountId);
    await Promise.all(
      childAccounts.map(async (account) => renameFn(account.public.id))
    );

    return topLevelAccount;
  }

  async deleteAccount(
    accountId: string
  ): Promise<Result<null, DeleteAccountError>> {
    const derivedAccounts = await this.findAllChildAccounts(accountId);

    const accountIds = [
      accountId,
      ...derivedAccounts.map((account) => account.public.id),
    ];

    for (const id of accountIds) {
      id && (await this.vaultStorage.remove(KeyStore, "id", id));
    }

    return Result.ok(null);
  }

  async sign(
    txProps: TxProps,
    signer: string,
    chainId: string
  ): Promise<Uint8Array> {
    await this.vaultService.assertIsUnlocked();
    const disposableKey = await this.localStorage.getDisposableSigner(signer);

    // If disposable key is provided, use it for signing
    const key =
      disposableKey ?
        disposableKey.privateKey
      : await this.getSigningKey(signer);

    const { signing } = this.sdkService.getSdk();

    return await signing.sign(txProps, key, chainId);
  }

  async signMasp(txProps: TxProps, signer: string): Promise<Uint8Array> {
    await this.vaultService.assertIsUnlocked();

    const disposableKey = await this.localStorage.getDisposableSigner(signer);
    const realAddress = disposableKey?.realAddress || signer;

    // If disposable key is provided, use it to map real address to spending key
    const xsks = [await this.getSpendingKey(realAddress)];

    const { signing } = this.sdkService.getSdk();

    return await signing.signMasp(txProps, xsks);
  }

  async signArbitrary(
    signer: string,
    data: string
  ): Promise<SignArbitraryResponse> {
    await this.vaultService.assertIsUnlocked();

    const key = await this.getSigningKey(signer);
    const sdk = this.sdkService.getSdk();
    const [hash, signature] = sdk.signing.signArbitrary(key, data);

    return { hash, signature };
  }

  async queryAccountDetails(
    address: string
  ): Promise<[DerivedAccount, DerivedAccount | undefined] | undefined> {
    const disposableKey = await this.localStorage.getDisposableSigner(address);

    const account = await this.vaultStorage.findOneOrFail(
      KeyStore,
      "address",
      // if we use disposable key, we want to get the real address
      disposableKey?.realAddress || address
    );
    if (!account) {
      return;
    }
    const shieldedAccount = await this.vaultStorage.findOne(
      KeyStore,
      "parentId",
      account.public.id
    );

    return [account.public, shieldedAccount?.public];
  }

  async genDisposableSigner(): Promise<
    GenDisposableSignerResponse | undefined
  > {
    const sdk = this.sdkService.getSdk();
    const { privateKey, publicKey, address } = sdk.keys.genDisposableKeypair();

    const defaultAccount = await this.queryDefaultAccount();
    if (!defaultAccount) {
      throw new Error("No default account found");
    }

    await this.localStorage.addDisposableSigner(
      address,
      privateKey,
      publicKey,
      defaultAccount.address
    );

    return { publicKey, address };
  }

  // Query and validate that account is a shielded account
  async queryShieldedAccountById(accountId: string): Promise<DerivedAccount> {
    const account = await this.queryAccountById(accountId);
    if (!account) {
      throw new Error(`Account with ID ${accountId} not found!`);
    }

    if (account.type !== AccountType.ShieldedKeys) {
      throw new Error(
        `Account with ID ${accountId} is not a shielded account!`
      );
    }

    if (!account.owner) {
      throw new Error(
        `Account with ID ${accountId} does not have a viewing key!`
      );
    }

    return account;
  }

  async genPaymentAddress(
    accountId: string
  ): Promise<DerivedAccount | undefined> {
    try {
      const account = await this.queryShieldedAccountById(accountId);
      let currentIndex = account.diversifierIndex;
      const { keys } = this.sdkService.getSdk();

      if (!currentIndex) {
        // Pre-existing accounts may not have a diversifier index, therefore,
        // we query the default, and increment the first valid diversifier index
        const genPaymentAddress = keys.genPaymentAddress(account.owner!);
        currentIndex = genPaymentAddress.diversifierIndex;
      }

      const { address, diversifierIndex } = keys.genPaymentAddress(
        account.owner!,
        currentIndex + 1
      );

      await this.vaultStorage.update(KeyStore, "id", accountId, {
        address,
        diversifierIndex,
      });

      return {
        ...account,
        address,
      };
    } catch (e) {
      throw new Error(`${e}`);
    }
  }

  async persistDisposableSigner(disposabelAddress: string): Promise<void> {
    const disposableSigner =
      await this.localStorage.getDisposableSigner(disposabelAddress);

    if (!disposableSigner) {
      throw new Error("No disposable signer found");
    }
    const { privateKey: disposablePrivateKey, publicKey: disposablePublicKey } =
      disposableSigner;

    const sdk = this.sdkService.getSdk();
    const { publicKey, privateKey, address } =
      sdk.keys.fromPrivateKey(disposablePrivateKey);

    // Extra safety check to make sure that the address passed is derived from the private key
    if (publicKey !== disposablePublicKey || address !== disposabelAddress) {
      throw new Error(
        "Passed address can't be derived from the stored private key"
      );
    }

    const vaultLength = await this.vaultService.getLength(KEYSTORE_KEY);
    const accountStore = this.accountStoreDefault(
      AccountType.Disposable,
      address,
      publicKey,
      privateKey,
      `Refund address: ${shortenAddress(address, 0, 8, "")}`,
      { account: 0, change: 0, index: 0 },
      vaultLength,
      "generated",
      Date.now()
    );

    const sensitiveData: SensitiveAccountStoreData = {
      text: privateKey,
      passphrase: undefined,
    };
    const sensitive =
      await this.vaultService.encryptSensitiveData(sensitiveData);

    await this.vaultStorage.add(KeyStore, {
      public: accountStore,
      sensitive,
    });
  }

  async clearDisposableSigner(address: string): Promise<void> {
    const disposableSigner =
      await this.localStorage.getDisposableSigner(address);
    const account = await this.queryAccountByAddress(address);
    // **IMPORTANT** We make sure that we ONLY can remove the existing disposable signer
    if (disposableSigner && account?.type === AccountType.Disposable) {
      await this.vaultStorage.remove(KeyStore, "address", address);
    }
  }
}
