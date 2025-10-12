import { Chain } from "@chain-registry/types";
import { twMerge } from "tailwind-merge";

export const ChainBadge = ({
  chain,
  className,
}: {
  chain?: Chain;
  className?: string;
}): JSX.Element => {
  if (!chain) {
    return <></>;
  }

  const image = chain?.images?.find((i) => i.theme?.circle === false);
  const imageUrl = image?.svg ?? image?.png;

  return (
    <div
      className={twMerge(
        "w-6 h-6 rounded-sm bg-black overflow-hidden",
        className
      )}
    >
      {imageUrl ?
        <img
          src={imageUrl}
          alt={chain.chain_name}
          className="w-full h-full object-contain"
          draggable={false}
        />
      : <span className="text-white">
          {chain.chain_name.charAt(0).toUpperCase()}
        </span>
      }
    </div>
  );
};
