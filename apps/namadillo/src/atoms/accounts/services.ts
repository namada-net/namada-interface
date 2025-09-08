import { Balance, DefaultApi } from "@namada/indexer-client";
import { NamadaKeychainAccount } from "@namada/types";
import { NamadaKeychain } from "hooks/useNamadaKeychain";

export const fetchAccounts = async (): Promise<
  readonly NamadaKeychainAccount[]
> => {
  const namada = await new NamadaKeychain().get();
  const result = await namada?.accounts();
  return result || [];
};

export const fetchDefaultAccount = async (): Promise<
  NamadaKeychainAccount | undefined
> => {
  const namada = await new NamadaKeychain().get();
  return await namada?.defaultAccount();
};

export const fetchAccountBalance = async (
  api: DefaultApi,
  account: NamadaKeychainAccount
): Promise<Balance[]> => {
  return (await api.apiV1AccountAddressGet(account.address)).data;
};
