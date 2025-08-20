import { CryptoRecord } from "@namada/sdk";
import { StoredRecord } from "@namada/storage";
import { AccountType, DerivedAccount, Path } from "@namada/types";

export type AccountSource = "imported" | "generated";

export interface AccountStore extends StoredRecord {
  alias: string;
  address: string;
  modifiedZip32Path?: string;
  owner: string;
  publicKey?: string;
  path: Path;
  parentId?: string;
  pseudoExtendedKey?: string;
  type: AccountType;
  source: AccountSource;
  timestamp: number;
  diversifierIndex?: number;
}

export type AccountState = DerivedAccount & {
  parentId: string;
  private: Uint8Array;
  public: Uint8Array;
};

export enum KeyRingStatus {
  NotLoaded,
  Empty,
  Locked,
  Unlocked,
}

export type TabStore = {
  tabId: number;
  timestamp: number;
};

export type ActiveAccountStore = {
  id: string;
  type: AccountType;
};

export type DurablityStore = {
  isDurable: string;
};

export type SensitiveAccountStoreData = { text: string; passphrase?: string };

export type UtilityStore = ActiveAccountStore | { [id: string]: CryptoRecord };

export enum DeleteAccountError {
  BadPassword,
  KeyStoreError,
}

type Mnemonic = { t: "Mnemonic"; seedPhrase: string[]; passphrase: string };
type PrivateKey = { t: "PrivateKey"; privateKey: string };
type SpendingKey = { t: "ShieldedKeys"; spendingKey: string };
export type AccountSecret = Mnemonic | PrivateKey | SpendingKey;

export type MnemonicValidationResponse = {
  isValid: boolean;
  error?: string;
};

export type SigningKey = {
  privateKey?: string;
  xsk?: string;
};
