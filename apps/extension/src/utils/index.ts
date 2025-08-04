import { fromBase64, toBase64 } from "@cosmjs/encoding";
import {
  AccountType,
  CommitmentDetailProps,
  DerivedAccount,
  NamadaKeychainAccount,
  Path,
  TransferProps,
  TxProps,
} from "@namada/types";
import { v5 as uuid } from "uuid";
import browser from "webextension-polyfill";

import { Result } from "@namada/utils";
import { TransferType } from "Approvals/types";
import { EncodedTxData } from "background/approvals";

/**
 * Query the current extension tab and close it
 */
export const closeCurrentTab = async (): Promise<void> => {
  const tab = await browser.tabs.getCurrent();
  if (tab.id) {
    await browser.tabs.remove(tab.id);
  }
};

/**
 * Launch the Setup tab, close existing popup
 */
export const openSetupTab = async (): Promise<void> => {
  await browser.tabs
    .create({
      url: browser.runtime.getURL("setup.html"),
    })
    .then(() => close());
};

export const fillArray = (arr: string[], length: number): string[] => {
  return arr.concat(Array(length - arr.length).fill("")).slice(0, length);
};

/**
 * Construct unique uuid (v5), passing in an arbitrary number of arguments.
 * This could be a unique parameter of the object receiving the id,
 * or an index based on the number of existing objects in a hierarchy.
 */
export const generateId = (
  namespace: string,
  ...args: (number | string)[]
): string => {
  return uuid(args.join(":"), namespace);
};

export const validateProps = <T>(object: T, props: (keyof T)[]): void => {
  props.forEach((prop) => {
    if (typeof object[prop] === "undefined") {
      throw new Error(`${String(prop)} was not provided!`);
    }
  });
};

const PRIVATE_KEY_MAX_LENGTH = 64;

export type PrivateKeyError =
  | { t: "TooLong"; maxLength: number }
  | { t: "BadCharacter" };

// Very basic private key validation
export const validatePrivateKey = (
  privateKey: string
): Result<null, PrivateKeyError> =>
  privateKey.length > PRIVATE_KEY_MAX_LENGTH ?
    Result.err({ t: "TooLong", maxLength: PRIVATE_KEY_MAX_LENGTH })
  : !/^[0-9a-f]*$/.test(privateKey) ? Result.err({ t: "BadCharacter" })
  : Result.ok(null);

// Remove prefix from private key, which may be present when exporting keys from CLI
export const filterPrivateKeyPrefix = (privateKey: string): string =>
  privateKey.length === PRIVATE_KEY_MAX_LENGTH + 2 ?
    privateKey.replace(/^00/, "")
  : privateKey;

const SPENDING_KEY_MAX_LENGTH = 284;
const SPENDING_KEY_BECH32M_PREFIX = "zsknam1";
export type SpendingKeyError =
  | { t: "IncorrectLength"; length: number }
  | { t: "BadPrefix"; prefix: string };

// Spending key basic validation, ignore empty field
export const validateSpendingKey = (
  spendingKey: string
): Result<null, SpendingKeyError> =>
  spendingKey.length === 0 ? Result.ok(null)
  : spendingKey.length !== SPENDING_KEY_MAX_LENGTH ?
    Result.err({ t: "IncorrectLength", length: 284 })
  : !/^zsknam1/.test(spendingKey) ?
    Result.err({ t: "BadPrefix", prefix: SPENDING_KEY_BECH32M_PREFIX })
  : Result.ok(null);

// Convert any Uint8Arrays in TxProps to string, and construct EncodedTxData
export const toEncodedTx = (txProps: TxProps): EncodedTxData => ({
  ...txProps,
  bytes: toBase64(txProps.bytes),
  signingData: txProps.signingData.map((sd) => ({
    ...sd,
    masp: sd.masp ? toBase64(sd.masp) : undefined,
    shieldedHash: sd.shieldedHash ? toBase64(sd.shieldedHash) : undefined,
    accountPublicKeysMap:
      sd.accountPublicKeysMap ? toBase64(sd.accountPublicKeysMap) : undefined,
  })),
});

// Convert base64 strings back to Uint8Arrays in EncodedTxData to restore TxProps
export const fromEncodedTx = (encodedTxData: EncodedTxData): TxProps => ({
  ...encodedTxData,
  bytes: fromBase64(encodedTxData.bytes),
  signingData: encodedTxData.signingData.map((sd) => ({
    ...sd,
    masp: sd.masp ? fromBase64(sd.masp) : undefined,
    shieldedHash: sd.shieldedHash ? fromBase64(sd.shieldedHash) : undefined,
    accountPublicKeysMap:
      sd.accountPublicKeysMap ? fromBase64(sd.accountPublicKeysMap) : undefined,
  })),
});

export const isCustomPath = (path: Path): boolean => {
  const { account, change = 0, index = 0 } = path;
  if (account + change + index > 0) {
    return true;
  }
  return false;
};

export const ShieldedPoolLabel = "the shielded pool";
export const hasShieldedSection = (tx: TransferProps): boolean => {
  return Boolean(tx.shieldedSectionHash);
};
export const isShieldedPool = (address: string): boolean => {
  const shieldedPoolRegex = /qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq/;
  return Boolean(address.match(shieldedPoolRegex));
};

/**
 * Create label to indicate specific type of Transfer
 * @param tx TransferProps
 * @returns string label
 */
export const parseTransferType = (
  tx: CommitmentDetailProps<TransferProps>,
  wrapperFeePayer: string
): { source: string; target: string; type: TransferType } => {
  const { sources, targets } = tx;
  const maspTxInLen = tx.maspTxIn?.length || 0;
  const maspTxOutLen = tx.maspTxOut?.length || 0;

  // We unnshield to pay fees if transparent target is a wrapperFeePayer
  const unshieldingToPayFees =
    maspTxInLen > 0 &&
    Boolean(targets.find((t) => t.owner === wrapperFeePayer));

  const isUnshieldingTransfer =
    unshieldingToPayFees ?
      targets.length > 1
    : maspTxInLen > 0 && targets.length === 1;

  const isShieldedTransfer =
    unshieldingToPayFees ?
      targets.length === 1
    : maspTxInLen > 0 && targets.length === 0;

  const isShieldingTransfer =
    maspTxOutLen > 0 && maspTxInLen === 0 && sources.length > 0;

  let type: TransferType = "Transparent";
  const txHasShieldedSection = hasShieldedSection(tx);

  if (txHasShieldedSection) {
    if (isShieldedTransfer) {
      type = "Shielded";
    } else if (isUnshieldingTransfer) {
      type = "Unshielding";
    } else if (isShieldingTransfer) {
      type = "Shielding";
    } else {
      type = "Unknown";
    }
  }
  const displaySource =
    isShieldedTransfer || isUnshieldingTransfer ?
      tx.maspTxIn?.at(0)?.owner
    : sources.at(0)?.owner;

  const displayTarget =
    isShieldedTransfer || isShieldingTransfer ?
      tx.maspTxOut?.at(maspTxOutLen - 1)?.address
    : targets.at(0)?.owner;

  return {
    source: displaySource || "",
    target: displayTarget || "",
    type,
  };
};

/**
 * Accepts a derived account, returns only values needed for Account
 * @param derivedAccount - Derived account type returned from keyring
 * @returns Account type for public API
 */
export const toPublicAccount = (
  derivedAccount: DerivedAccount
): NamadaKeychainAccount => {
  const {
    id,
    alias,
    address,
    type,
    parentId,
    publicKey,
    owner,
    pseudoExtendedKey,
    source,
    timestamp,
    diversifierIndex,
  } = derivedAccount;
  const isShielded = type === AccountType.ShieldedKeys;
  const account: NamadaKeychainAccount = {
    id,
    alias,
    address,
    parentId,
    type,
  };
  if (isShielded) {
    account.viewingKey = owner;
    account.pseudoExtendedKey = pseudoExtendedKey;
    account.source = source;
    account.timestamp = timestamp;
    account.diversifierIndex = diversifierIndex || 1;
  } else {
    account.publicKey = publicKey;
  }
  return account;
};

/**
 * Determine if shielded account is outdated
 * @param shieldedAccount - derived shielded account
 * @param parentAccountType - type of parent account
 * @returns boolean
 */
export const isOutdatedShieldedAccount = (
  shieldedAccount: DerivedAccount,
  parentAccountType: AccountType
): boolean => {
  let outdated = false;
  // Rule #1: All shielded accounts must have pseudoExtendedKey
  if (typeof shieldedAccount.pseudoExtendedKey === "undefined") {
    return true;
  }
  // Rule #2: Shielded accounts from mnemonic must have modifiedZip32Path
  if (parentAccountType === AccountType.Mnemonic) {
    if (typeof shieldedAccount.modifiedZip32Path === "undefined") {
      outdated = true;
    }
  }
  return outdated;
};
