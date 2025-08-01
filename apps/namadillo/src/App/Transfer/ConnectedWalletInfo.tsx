import { SelectedWallet } from "./SelectedWallet";

type ConnectedWalletInfoProps = {
  walletAddress: string;
};

export const ConnectedWalletInfo = ({
  walletAddress,
}: ConnectedWalletInfoProps): JSX.Element => {
  return (
    <div className="flex justify-between items-center">
      <SelectedWallet address={walletAddress} className="[&_img]:-order-1" />
      <span className="text-sm text-neutral-500">Connected</span>
    </div>
  );
};
