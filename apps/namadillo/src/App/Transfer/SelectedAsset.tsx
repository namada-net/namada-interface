import { SkeletonLoading } from "@namada/components";
import clsx from "clsx";
import { getAssetImageUrl } from "integrations/utils";
import { GoChevronDown } from "react-icons/go";
import { Asset } from "types";
import { EmptyResourceIcon } from "./EmptyResourceIcon";

type SelectedAssetProps = {
  asset?: Asset;
  isLoading?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
};

export const SelectedAsset = ({
  asset,
  isLoading,
  isDisabled,
  onClick,
}: SelectedAssetProps): JSX.Element => {
  const selectorClassList = clsx(
    `flex items-center gap-4 text-xl text-white font-light cursor-pointer uppercase`
  );
  return (
    <button
      type="button"
      className={clsx("block group", {
        "opacity-30": isLoading,
        "pointer-events-none": isDisabled,
      })}
      disabled={isDisabled}
      onClick={onClick}
      aria-description={
        asset ? `${asset.name} is selected` : `No asset selected`
      }
    >
      {!asset && (
        <span className={selectorClassList}>
          <EmptyResourceIcon className="w-8" />
          {isLoading && (
            <SkeletonLoading
              className="bg-neutral-700"
              height="1em"
              width="70px"
            />
          )}
          {!isLoading && !isDisabled && (
            <>
              Asset
              <GoChevronDown className="text-sm" />
            </>
          )}
        </span>
      )}
      {asset && (
        <span className={selectorClassList}>
          <img
            className={clsx(
              "w-8 aspect-square object-cover select-none",
              "object-center bg-neutral-800 rounded-full"
            )}
            alt={`${asset.name} image`}
            src={getAssetImageUrl(asset)}
          />
          <span className="flex items-center gap-1 text-md">
            {asset.symbol}
            {!isDisabled && (
              <i className="text-sm">
                <GoChevronDown />
              </i>
            )}
          </span>
        </span>
      )}
    </button>
  );
};
