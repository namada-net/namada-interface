import { SkeletonLoading } from "@namada/components";
import { EmptyResourceIcon } from "App/Transfer/EmptyResourceIcon";
import clsx from "clsx";
import { getAssetImageUrl } from "integrations/utils";
import { GoChevronDown } from "react-icons/go";
import { Asset } from "types";

type SelectedAssetProps = {
  asset?: Asset;
  isLoading?: boolean;
  imageSize?: "small" | "large";
  isDisabled?: boolean;
  onClick?: () => void;
};

export const SelectedAsset = ({
  asset,
  isLoading,
  imageSize = "small",
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
              imageSize === "small" ? "w-8" : "w-16",
              "aspect-square object-cover select-none",
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
