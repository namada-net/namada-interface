import { CopyToClipboardControl, Tooltip } from "@namada/components";
import { shortenAddress } from "@namada/utils";
import { TransactionHistory as TransactionHistoryType } from "atoms/transactions/atoms";
import clsx from "clsx";
import {
  IoCheckmarkCircleOutline,
  IoInformationCircleOutline,
} from "react-icons/io5";
import { twMerge } from "tailwind-merge";
import { TransactionCard } from "./TransactionCard";

type Props = {
  revealPkTx: TransactionHistoryType;
  mainTx: TransactionHistoryType;
};

export const BundledTransactionCard: React.FC<Props> = ({
  revealPkTx,
  mainTx,
}) => {
  const publicKey =
    revealPkTx.tx?.data ? JSON.parse(revealPkTx.tx.data).public_key : "";

  return (
    <article
      className={twMerge(
        clsx(
          "bg-neutral-800 rounded-sm px-5 text-white border border-transparent",
          "transition-colors duration-200 hover:border-neutral-500"
        )
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-center py-5 font-semibold gap-5 relative">
        <div className="flex items-center gap-3 relative">
          <i className="text-success text-2xl relative z-10">
            <IoCheckmarkCircleOutline className="ml-1 mt-0.5 w-10 h-10" />
          </i>
          <div className="absolute left-6 top-12 w-0.5 h-10 border-l-2 border-dashed border-success z-0"></div>
          <div className="flex flex-col">
            <h3 className="flex items-center text-success">
              Reveal PK
              <div className="relative group/tooltip ml-1.5">
                <IoInformationCircleOutline className="w-4 h-4 text-neutral-400 cursor-help" />
                <Tooltip
                  position="bottom"
                  className="p-3 w-[350px] z-50 text-sm"
                >
                  Revealing your public key registers your newly generated
                  Namada account on-chain so the network can associate deposits,
                  stake, and future signatures with a unique identity while
                  keeping your private key secret
                </Tooltip>
              </div>
              <div className="relative group/tooltip ml-1">
                <CopyToClipboardControl
                  className="text-neutral-400"
                  value={revealPkTx.tx?.wrapperId ?? ""}
                />
                <Tooltip position="right" className="p-2 -mr-3 w-[150px] z-10">
                  Copy transaction hash
                </Tooltip>
              </div>
            </h3>
            <h3 className="text-neutral-400">
              {revealPkTx.timestamp ?
                new Date(revealPkTx.timestamp * 1000)
                  .toLocaleString("en-US", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  .replace(",", "")
              : "-"}
            </h3>
          </div>
        </div>

        <div className="flex flex-col">
          <h4>Public Key</h4>
          <h4 className="flex items-center gap-2">
            <span className="font-mono text-sm">
              {shortenAddress(publicKey, 12, 12)}
            </span>
            <CopyToClipboardControl
              className="text-neutral-400"
              value={publicKey}
            />
          </h4>
        </div>
      </div>

      <div className="[&>article]:bg-transparent [&>article]:border-none [&>article]:rounded-none [&>article]:hover:border-none [&>article]:px-0 [&>article]:py-5 [&>article]:my-0 [&>article>div:first-child>i]:relative [&>article>div:first-child>i]:z-10">
        <TransactionCard tx={mainTx} />
      </div>
    </article>
  );
};
