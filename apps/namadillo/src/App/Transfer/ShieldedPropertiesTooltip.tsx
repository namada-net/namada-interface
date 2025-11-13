import { Tooltip } from "@namada/components";
import clsx from "clsx";
import { useMemo } from "react";
import { BsEye, BsEyeSlash } from "react-icons/bs";
import semiTransparentEye from "./assets/semi-transparent-eye.svg";
import shieldedEye from "./assets/shielded-eye.svg";
import transparentEye from "./assets/transparent-eye.svg";
import { isShieldedAddress } from "./common";

type TransactionType = "transparent" | "semi-transparent" | "shielded";

export const ShieldedPropertiesTooltip = ({
  sourceAddress,
  destinationAddress,
}: {
  sourceAddress: string | undefined;
  destinationAddress: string | undefined;
}): JSX.Element => {
  const isSourceShielded = isShieldedAddress(sourceAddress ?? "");
  const isDestShielded = isShieldedAddress(destinationAddress ?? "");

  // Determine transaction type
  const transactionType: TransactionType = useMemo(() => {
    if (isSourceShielded && isDestShielded) {
      return "shielded";
    } else if (!isSourceShielded && !isDestShielded) {
      return "transparent";
    } else {
      return "semi-transparent";
    }
  }, [isSourceShielded, isDestShielded]);

  const visible = useMemo((): JSX.Element => {
    return (
      <span className="flex items-center gap-2">
        <span className="text-white text-sm font-medium">Visible</span>
        <BsEye className="text-white w-4 h-4" />
      </span>
    );
  }, []);

  const hidden = useMemo(() => {
    return (
      <span className="flex items-center gap-2">
        <span className="text-yellow-400 text-sm font-medium">Hidden</span>
        <BsEyeSlash className="text-yellow-400 w-4 h-4" />
      </span>
    );
  }, []);

  // Determine visibility for each property based on transaction type
  const senderVisible = transactionType !== "shielded" && !isSourceShielded;
  const recipientVisible = transactionType === "transparent" || !isDestShielded;
  const assetVisible = transactionType !== "shielded";
  const amountVisible = transactionType !== "shielded";

  // Transaction type header
  const transactionTypeHeader = useMemo(() => {
    return (
      <div className="flex items-center justify-center gap-2 bg-neutral-800 rounded-sm py-2 px-4">
        <span
          className={clsx(
            "text-sm font-medium",
            transactionType === "shielded" && "text-yellow-400"
          )}
        >
          {transactionType === "shielded" ?
            "Shielded"
          : transactionType === "semi-transparent" ?
            "Semi-transparent"
          : "Transparent"}
        </span>
        <img
          src={
            transactionType === "shielded" ? shieldedEye
            : transactionType === "semi-transparent" ?
              semiTransparentEye
            : transparentEye
          }
          alt={
            transactionType === "shielded" ? "Shielded"
            : transactionType === "semi-transparent" ?
              "Semi-transparent"
            : "Transparent"
          }
          className="w-4 h-4"
        />
      </div>
    );
  }, [transactionType]);

  return (
    <Tooltip position="top" className="z-50 rounded-lg -mt-2">
      <div className="min-w-[18rem] py-3 space-y-3">
        {transactionTypeHeader}

        <div className="flex w-full items-center justify-between">
          <span className="text-neutral-400 text-sm">Sender address</span>
          {senderVisible ? visible : hidden}
        </div>
        <div className="flex w-full items-center justify-between">
          <span className="text-neutral-400 text-sm">Asset</span>
          {assetVisible ? visible : hidden}
        </div>
        <div className="flex w-full items-center justify-between">
          <span className="text-neutral-400 text-sm">Amount</span>
          {amountVisible ? visible : hidden}
        </div>
        <div className="flex w-full items-center justify-between">
          <span className="text-neutral-400 text-sm">Destination address</span>
          {recipientVisible ? visible : hidden}
        </div>
      </div>
    </Tooltip>
  );
};
