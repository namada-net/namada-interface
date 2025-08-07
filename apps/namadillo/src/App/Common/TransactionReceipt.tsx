import { Chain } from "@chain-registry/types";
import { CopyToClipboardControl, Stack } from "@namada/components";
import { shortenAddress } from "@namada/utils";
import {
  isNamadaAddress,
  isShieldedAddress,
  parseChainInfo,
} from "App/Transfer/common";
import { SelectedChain } from "App/Transfer/SelectedChain";
import { SelectedWallet } from "App/Transfer/SelectedWallet";
import { TokenAmountCard } from "App/Transfer/TokenAmountCard";
import { TransferArrow } from "App/Transfer/TransferArrow";
import { getChainRegistryByChainId } from "atoms/integrations";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { wallets } from "integrations";
import { useMemo } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { GoHourglass, GoXCircle } from "react-icons/go";
import { PartialTransferTransactionData, TransferStep } from "types";

type TransactionReceiptProps = {
  transaction: PartialTransferTransactionData;
};

const stepDescription: Record<TransferStep, string> = {
  sign: "Signature required",
  "ibc-to-shielded": "IBC Transfer to Namada MASP",
  "zk-proof": "Generating ZK Proof",
  "ibc-to-transparent": "IBC Transfer to Namada",
  "shielded-to-shielded": "Transfer to Namada Shielded",
  "transparent-to-shielded": "Transfer to Namada Shielded",
  "transparent-to-transparent": "Transfer to Namada Transparent",
  "shielded-to-transparent": "Transfer to Namada Transparent",
  "ibc-withdraw": "Transfer from Namada",
  "waiting-confirmation": "Waiting for confirmation",
  complete: "Transfer Complete",
};

const TransferTransactionReceipt = ({
  transaction,
}: TransactionReceiptProps): JSX.Element => {
  const getChain = (chainId: string, address: string): Chain | undefined => {
    const chain = getChainRegistryByChainId(chainId)?.chain;
    if (isNamadaAddress(address) && chain) {
      return parseChainInfo(chain, isShieldedAddress(address || ""));
    }
    return chain;
  };

  const sourceChain = useMemo(() => {
    return getChain(transaction.chainId, transaction.sourceAddress || "");
  }, [transaction]);

  const destinationChain = useMemo(() => {
    return getChain(
      "destinationChainId" in transaction ?
        transaction.destinationChainId || ""
      : transaction.chainId,
      transaction.destinationAddress || ""
    );
  }, [transaction]);

  const sourceWallet =
    isNamadaAddress(transaction.sourceAddress || "") ?
      wallets.namada
    : wallets.keplr;

  return (
    <Stack className="max-w-[440px] mx-auto">
      <div className="rounded-md bg-neutral-800 px-4 pb-6">
        <header className="relative flex justify-between pt-4">
          {sourceChain && (
            <SelectedChain
              chain={sourceChain}
              wallet={sourceChain ? sourceWallet : undefined}
            />
          )}

          <SelectedWallet address={transaction.sourceAddress} />
        </header>
        <hr className="mt-4 mb-2.5 mx-2 border-white opacity-[5%]" />
        <TokenAmountCard
          asset={transaction.asset}
          displayAmount={transaction.displayAmount || new BigNumber(0)}
        />
      </div>
      <i className="flex items-center justify-center w-11 mx-auto -my-8 relative z-10">
        <TransferArrow color={transaction.shielded ? "#FF0" : "#FFF"} />
      </i>
      <div
        className={clsx(
          "rounded-md bg-neutral-800 px-4 pt-6 pb-5 border",
          transaction.shielded ? "border-yellow" : "border-white"
        )}
      >
        <TokenAmountCard
          asset={transaction.asset}
          displayAmount={transaction.displayAmount || new BigNumber(0)}
        />
        <footer>
          <hr className="mt-4 mb-2.5 mx-2 border-white opacity-[5%]" />
          <div className="flex justify-between items-center">
            {destinationChain && (
              <SelectedChain
                chain={destinationChain}
                wallet={sourceWallet}
                iconSize="36px"
              />
            )}
            <SelectedWallet address={transaction.destinationAddress} />
          </div>
        </footer>
      </div>
    </Stack>
  );
};

export const TransactionReceipt = ({
  transaction,
}: TransactionReceiptProps): JSX.Element => {
  return (
    <div>
      <header className="mb-8">
        <div className="flex justify-center my-3 text-5xl">
          {transaction.status === "error" && (
            <span className="text-fail">{<GoXCircle />}</span>
          )}
          {transaction.status === "success" && (
            <span className="text-success">{<FaCheckCircle />}</span>
          )}
          {transaction.status === "pending" && (
            <span className="text-neutral-600">{<GoHourglass />}</span>
          )}
        </div>
        <h2
          className={clsx("text-center text-xl", {
            "text-success": transaction.status === "success",
            "text-fail": transaction.status === "error",
          })}
        >
          {transaction.status === "error" ?
            "Transaction Failed"
          : stepDescription[transaction.currentStep || "sign"]}
        </h2>
        {transaction.errorMessage && (
          <div className="text-center text-red-900 text-sm mb-3">
            {transaction.errorMessage}
          </div>
        )}
        {transaction.hash && (
          <span className="my-1 text-sm text-center block text-neutral-600">
            Transaction hash:{" "}
            <span className="inline-flex gap-1">
              {shortenAddress(transaction.hash, 8, 8)}
              <CopyToClipboardControl value={transaction.hash} />
            </span>
          </span>
        )}
      </header>
      <article>
        <TransferTransactionReceipt transaction={transaction} />
      </article>
    </div>
  );
};
