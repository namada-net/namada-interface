import { PhraseSize } from "@namada/sdk";
import {
  AccountType,
  Bip44Path,
  DerivedAccount,
  Zip32Path,
} from "@namada/types";
import { Result } from "@namada/utils";
import { ResponseSign } from "@zondax/ledger-namada";
import { Message } from "router";
import { validatePrivateKey, validateProps, validateSpendingKey } from "utils";
import { ROUTE } from "./constants";
import {
  AccountSecret,
  AccountStore,
  DeleteAccountError,
  MnemonicValidationResponse,
} from "./types";

enum MessageType {
  DeriveShieldedAccount = "derive-shielded-account",
  GenerateMnemonic = "generate-mnemonic",
  GetActiveAccount = "get-active-account",
  QueryParentAccounts = "query-parent-accounts",
  SaveAccountSecret = "save-account-secret",
  SetActiveAccount = "set-active-account",
  DeleteAccount = "delete-account",
  ValidateMnemonic = "validate-mnemonic",
  AddLedgerAccount = "add-ledger-account",
  RevealAccountMnemonic = "reveal-account-mnemonic",
  RevealSpendingKey = "reveal-spending-key",
  RevealPrivateKey = "reveal-private-key",
  RenameAccount = "rename-account",
  QueryAccountDetails = "query-account-details",
  AppendLedgerSignature = "append-ledger-signature",
  GenPaymentAddress = "generate-payment-address",
}

export class GenerateMnemonicMsg extends Message<string[]> {
  public static type(): MessageType {
    return MessageType.GenerateMnemonic;
  }

  constructor(public readonly size?: PhraseSize) {
    super();
  }

  validate(): void {
    return;
  }

  route(): string {
    return ROUTE;
  }

  type(): string {
    return GenerateMnemonicMsg.type();
  }
}

export class RevealAccountMnemonicMsg extends Message<string> {
  public static type(): MessageType {
    return MessageType.RevealAccountMnemonic;
  }

  constructor(public readonly accountId: string) {
    super();
  }

  validate(): void {
    return;
  }

  route(): string {
    return ROUTE;
  }

  type(): string {
    return RevealAccountMnemonicMsg.type();
  }
}

export class RevealSpendingKeyMsg extends Message<string> {
  public static type(): MessageType {
    return MessageType.RevealSpendingKey;
  }

  constructor(public readonly accountId: string) {
    super();
  }

  validate(): void {
    return;
  }

  route(): string {
    return ROUTE;
  }

  type(): string {
    return RevealSpendingKeyMsg.type();
  }
}

export class RevealPrivateKeyMsg extends Message<string> {
  public static type(): MessageType {
    return MessageType.RevealPrivateKey;
  }

  constructor(public readonly accountId: string) {
    super();
  }

  validate(): void {
    return;
  }

  route(): string {
    return ROUTE;
  }

  type(): string {
    return RevealPrivateKeyMsg.type();
  }
}

export class ValidateMnemonicMsg extends Message<MnemonicValidationResponse> {
  public static type(): MessageType {
    return MessageType.ValidateMnemonic;
  }

  constructor(public readonly phrase: string) {
    super();
  }

  validate(): void {
    return;
  }

  route(): string {
    return ROUTE;
  }

  type(): string {
    return ValidateMnemonicMsg.type();
  }
}

export class RenameAccountMsg extends Message<DerivedAccount> {
  public static type(): MessageType {
    return MessageType.RenameAccount;
  }

  constructor(
    public readonly accountId: string,
    public readonly alias: string
  ) {
    super();
  }

  validate(): void {
    if (this.alias.length === 0) {
      throw new Error("Invalid account name");
    }
  }

  route(): string {
    return ROUTE;
  }

  type(): string {
    return RenameAccountMsg.type();
  }
}

export class SaveAccountSecretMsg extends Message<AccountStore | false> {
  public static type(): MessageType {
    return MessageType.SaveAccountSecret;
  }

  constructor(
    public readonly accountSecret: AccountSecret,
    public readonly alias: string,
    public readonly flow: "create" | "import",
    public readonly path?: Bip44Path
  ) {
    super();
  }

  validate(): void {
    if (!this.flow) {
      throw new Error("Flow is required!");
    }

    if (!this.accountSecret) {
      throw new Error("A wordlist or private key is required!");
    }

    switch (this.accountSecret.t) {
      case "Mnemonic":
        if (
          this.accountSecret.seedPhrase.length !== PhraseSize.N12 &&
          this.accountSecret.seedPhrase.length !== PhraseSize.N24
        ) {
          throw new Error("Invalid wordlist length! Not a valid mnemonic.");
        }
        break;

      case "PrivateKey":
        if (!validatePrivateKey(this.accountSecret.privateKey).ok) {
          throw new Error("Invalid private key!");
        }
        break;

      case "ShieldedKeys":
        if (!validateSpendingKey(this.accountSecret.spendingKey).ok) {
          throw new Error("Invalid spending key!");
        }
        break;

      default:
        throw new Error("Unknown account secret type");
    }
  }

  route(): string {
    return ROUTE;
  }

  type(): string {
    return SaveAccountSecretMsg.type();
  }
}

export class AddLedgerAccountMsg extends Message<AccountStore | false> {
  public static type(): MessageType {
    return MessageType.AddLedgerAccount;
  }

  constructor(
    public readonly alias: string,
    public readonly address: string,
    public readonly publicKey: string,
    public readonly bip44Path: Bip44Path,
    public readonly zip32Path?: Zip32Path,
    public readonly extendedViewingKey?: string,
    public readonly pseudoExtendedKey?: string,
    public readonly paymentAddress?: string,
    public readonly diversifierIndex?: number
  ) {
    super();
  }

  validate(): void {
    validateProps(this, ["alias", "address", "publicKey", "bip44Path"]);
  }

  route(): string {
    return ROUTE;
  }

  type(): string {
    return AddLedgerAccountMsg.type();
  }
}

export class DeriveShieldedAccountMsg extends Message<DerivedAccount> {
  public static type(): MessageType {
    return MessageType.DeriveShieldedAccount;
  }

  constructor(
    public readonly path: Zip32Path,
    public readonly accountType: AccountType,
    public readonly alias: string,
    public readonly parentId: string,
    public readonly source: "imported" | "generated"
  ) {
    super();
  }

  validate(): void {
    validateProps(this, ["path", "accountType", "alias", "parentId", "source"]);

    const { account } = this.path;

    if (!`${account}`) {
      throw new Error("A Zip32Path account path was not provided!");
    }
  }

  route(): string {
    return ROUTE;
  }

  type(): string {
    return DeriveShieldedAccountMsg.type();
  }
}

export class SetActiveAccountMsg extends Message<void> {
  public static type(): MessageType {
    return MessageType.SetActiveAccount;
  }

  constructor(
    public readonly accountId: string,
    public readonly accountType: AccountType
  ) {
    super();
  }

  validate(): void {
    validateProps(this, ["accountId", "accountType"]);
  }

  route(): string {
    return ROUTE;
  }

  type(): string {
    return SetActiveAccountMsg.type();
  }
}

export class GetActiveAccountMsg extends Message<
  { id: string; type: AccountType } | undefined
> {
  public static type(): MessageType {
    return MessageType.GetActiveAccount;
  }

  constructor() {
    super();
  }

  validate(): void {
    return;
  }

  route(): string {
    return ROUTE;
  }

  type(): string {
    return GetActiveAccountMsg.type();
  }
}

export class QueryParentAccountsMsg extends Message<DerivedAccount[]> {
  public static type(): MessageType {
    return MessageType.QueryParentAccounts;
  }

  constructor() {
    super();
  }

  validate(): void {
    return;
  }

  route(): string {
    return ROUTE;
  }

  type(): string {
    return QueryParentAccountsMsg.type();
  }
}

export class DeleteAccountMsg extends Message<
  Result<null, DeleteAccountError>
> {
  public static type(): MessageType {
    return MessageType.DeleteAccount;
  }

  constructor(public accountId: string) {
    super();
  }

  validate(): void {
    return;
  }

  route(): string {
    return ROUTE;
  }

  type(): string {
    return DeleteAccountMsg.type();
  }
}

export class QueryAccountDetailsMsg extends Message<
  [DerivedAccount, DerivedAccount | undefined] | undefined
> {
  public static type(): MessageType {
    return MessageType.QueryAccountDetails;
  }

  constructor(public address: string) {
    super();
  }

  validate(): void {
    validateProps(this, ["address"]);
  }

  route(): string {
    return ROUTE;
  }

  type(): string {
    return QueryAccountDetailsMsg.type();
  }
}

export class AppendLedgerSignatureMsg extends Message<Uint8Array> {
  public static type(): MessageType {
    return MessageType.AppendLedgerSignature;
  }

  constructor(
    public txBytes: Uint8Array,
    public signature: ResponseSign
  ) {
    super();
  }

  validate(): void {
    validateProps(this, ["txBytes", "signature"]);
  }

  route(): string {
    return ROUTE;
  }

  type(): string {
    return AppendLedgerSignatureMsg.type();
  }
}

export class GenPaymentAddressMsg extends Message<DerivedAccount | undefined> {
  public static type(): MessageType {
    return MessageType.GenPaymentAddress;
  }

  constructor(public accountId: string) {
    super();
  }

  validate(): void {
    validateProps(this, ["accountId"]);
  }

  route(): string {
    return ROUTE;
  }

  type(): string {
    return GenPaymentAddressMsg.type();
  }
}
