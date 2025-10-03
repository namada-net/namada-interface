import { WalletProvider } from "types";

export const walletMock: WalletProvider = {
  id: "keplr",
  name: "Keplr",
  iconUrl: "test.svg",
  downloadUrl: {
    chrome: "https://google.com",
    firefox: "https://mozilla.org",
  },
};
