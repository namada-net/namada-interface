import { Chain } from "@chain-registry/types";
import clsx from "clsx";
import { getChainImageUrl } from "integrations/utils";
import { GoChevronDown } from "react-icons/go";
import { WalletProvider } from "types";
import { EmptyResourceIcon } from "./EmptyResourceIcon";

type SelectedChainProps = {
  chain?: Chain;
  wallet?: WalletProvider;
  onClick?: () => void;
  iconSize?: string;
};

export const SelectedChain = ({
  chain,
  wallet,
  onClick,
  iconSize,
}: SelectedChainProps): JSX.Element => {
  const selectorClassList = clsx(
    `flex items-center gap-2.5 text-white font-light`,
    { "cursor-auto": !onClick }
  );

  const isDisabled = !wallet;
  const logoUrl = getChainImageUrl(chain);
  return (
    <button
      type="button"
      className={clsx("block group", {
        "pointer-events-none opacity-30": isDisabled,
      })}
      disabled={isDisabled}
      onClick={onClick}
      aria-description={
        wallet && chain ?
          `${chain.pretty_name} chain is selected`
        : `No chain selected`
      }
    >
      {(!wallet || !chain) && (
        <span className={selectorClassList}>
          <EmptyResourceIcon className="w-7" />
          {onClick ?
            <>
              Select chain <GoChevronDown className="text-sm" />
            </>
          : <span className="bg-neutral-900 w-20 h-7 rounded-sm opacity-30" />}
        </span>
      )}
      {wallet && chain && (
        <span className={selectorClassList}>
          <img
            className="aspect-square object-center bg-neutral-800 rounded-full select-none"
            alt={`${chain.pretty_name} image`}
            src={logoUrl}
            style={{ width: iconSize || "30px" }}
          />
          <span className="whitespace-nowrap overflow-ellipsis max-w-[200px] overflow-hidden">
            {chain.pretty_name}
          </span>
          {onClick && <GoChevronDown className="text-sm" />}
        </span>
      )}
    </button>
  );
};
