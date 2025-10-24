import { connectedWalletsAtom } from "atoms/integrations";
import { wallets } from "integrations";
import { KeplrWalletManager } from "integrations/Keplr";
import { useAtom } from "jotai";
import { AccountIconButton } from "./AccountIconButton";
import { DisconnectAccountIcon } from "./DisconnectAccountIcon";

export const KeplrAccount = (): JSX.Element => {
  const [connectedWallets, setConnectedWallets] = useAtom(connectedWalletsAtom);

  if (!connectedWallets.keplr) {
    return <></>;
  }

  const onClickDisconnect = async (): Promise<void> => {
    const keplrWallet = new KeplrWalletManager();
    setConnectedWallets((obj) => ({ ...obj, [keplrWallet.key]: false }));
    const keplrInstance = await keplrWallet.get();
    if (keplrInstance) {
      await keplrInstance.disable();
    }
  };

  return (
    <div className="flex items-center rounded-sm text-sm text-white bg-black pl-2 pr-1">
      <img
        src={wallets.keplr.iconUrl}
        alt="Namada Wallet"
        className="w-5 h-5"
      />
      <AccountIconButton onClick={onClickDisconnect}>
        <DisconnectAccountIcon />
      </AccountIconButton>
    </div>
  );
};
