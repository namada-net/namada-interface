import { GoLinkExternal } from "react-icons/go";
import { WalletProvider } from "types";

type WalletCardProps = {
  wallet: WalletProvider;
  installed: boolean;
  connected: boolean;
  onConnect?: () => void;
  onSelect?: () => void;
};

export const WalletCard = ({
  wallet,
  installed,
  connected,
  onConnect,
  onSelect,
}: WalletCardProps): JSX.Element => {
  const getDownloadUrl = (): string => {
    if (/firefox/i.test(navigator.userAgent)) {
      return wallet.downloadUrl.firefox;
    }
    return wallet.downloadUrl.chrome;
  };

  const handleClick = (): void => {
    if (installed && !connected) return onConnect?.();
    if (installed && connected) return onSelect?.();
  };

  const Component =
    installed ?
      (props: React.HTMLAttributes<HTMLButtonElement>) => (
        <button onClick={handleClick} {...props} />
      )
    : (props: React.HTMLAttributes<HTMLAnchorElement>) => (
        <a
          href={getDownloadUrl()}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        />
      );

  return (
    <Component className="group flex justify-between items-center w-full cursor-pointer hover:bg-neutral-900 rounded-sm p-2">
      <span className="flex gap-2 items-center text-white">
        <img src={wallet.iconUrl} className="w-8 aspect-square rounded-sm" />
        {wallet.name}
      </span>
      <span className="text-xs text-neutral-400 group-hover:text-yellow">
        {!installed && (
          <div className="flex items-center gap-2">
            Install <GoLinkExternal />
          </div>
        )}
        {installed && !connected && <div>Connect</div>}
        {installed && connected && <div>Select</div>}
      </span>
    </Component>
  );
};
