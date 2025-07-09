import { CopyToClipboardControl, Tooltip } from "@namada/components";
import { shortenAddress } from "@namada/utils";
import { TokenCurrency } from "App/Common/TokenCurrency";
import { AssetImage } from "App/Transfer/AssetImage";
import {
  isMaspAddress,
  isShieldedAddress,
  isTransparentAddress,
} from "App/Transfer/common";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { nativeTokenAddressAtom } from "atoms/chain";
import { namadaRegistryChainAssetsMapAtom } from "atoms/integrations";
import { TransactionHistory as TransactionHistoryType } from "atoms/transactions/atoms";
import { allValidatorsAtom } from "atoms/validators";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { FaLock } from "react-icons/fa6";
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
} from "react-icons/io5";
import { twMerge } from "tailwind-merge";
import { isNamadaAsset, toDisplayAmount } from "utils";
import keplrSvg from "../../integrations/assets/keplr.svg";

type Tx = TransactionHistoryType;
type Props = { tx: Tx };
type RawDataSection = {
  amount: string;
  sources: Array<{ amount: string; owner: string }>;
  targets: Array<{ amount: string; owner: string }>;
};
type BondData = {
  amount: string;
  source: string;
  validator: string;
};

export function getToken(
  txn: Tx["tx"],
  nativeToken: string
): string | undefined {
  if (
    txn?.kind === "bond" ||
    txn?.kind === "unbond" ||
    txn?.kind === "redelegation"
  )
    return nativeToken;
  let parsed;
  try {
    parsed = txn?.data ? JSON.parse(txn.data) : undefined;
  } catch (error) {
    console.error("Failed to parse getToken data:", error);
  }
  if (!parsed) return undefined;
  const sections = Array.isArray(parsed) ? parsed : [parsed];

  // return the first token found in sources or targets
  for (const section of sections) {
    if (section.sources?.length) {
      return section.sources[0].token;
    }
    if (section.targets?.length) {
      return section.targets[0].token;
    }
  }

  return undefined;
}

const getBondOrUnbondTransactionInfo = (
  tx: Tx["tx"]
): { amount: BigNumber; sender?: string; receiver?: string } | undefined => {
  if (!tx?.data) return undefined;

  let parsed: BondData;
  try {
    parsed = typeof tx.data === "string" ? JSON.parse(tx.data) : tx.data;
  } catch {
    return undefined;
  }
  return {
    amount: new BigNumber(parsed.amount ?? "0"),
    sender: parsed.source,
    receiver: parsed.validator,
  };
};

const getTransactionInfo = (
  tx: Tx["tx"],
  transparentAddress: string
): { amount: BigNumber; sender?: string; receiver?: string } | undefined => {
  if (!tx?.data) return undefined;

  const parsed = typeof tx.data === "string" ? JSON.parse(tx.data) : tx.data;

  // Handle redelegation case
  if (
    tx.kind === "redelegation" &&
    parsed.src_validator &&
    parsed.dest_validator
  ) {
    return {
      amount: BigNumber(parsed.amount),
      sender: parsed.src_validator,
      receiver: parsed.dest_validator,
    };
  }

  const sections: RawDataSection[] = Array.isArray(parsed) ? parsed : [parsed];
  const target = sections.find((s) => s.targets?.length);
  const source = sections.find((s) => s.sources?.length);

  let amount: BigNumber | undefined;
  const mainTarget = target?.targets.find(
    (src) => src.owner === transparentAddress
  );
  const mainSource = source?.sources.find(
    (src) => src.owner === transparentAddress
  );

  if (mainTarget) {
    amount = new BigNumber(mainTarget.amount);
  } else if (mainSource) {
    amount = new BigNumber(mainSource.amount);
  }
  const receiver = target?.targets[0].owner;
  const sender = source?.sources[0].owner;

  return amount ? { amount, sender, receiver } : undefined;
};

export const TransactionCard = ({
  tx: transactionTopLevel,
}: Props): JSX.Element => {
  const transaction = transactionTopLevel.tx;
  const nativeToken = useAtomValue(nativeTokenAddressAtom).data;
  const chainAssetsMap = useAtomValue(namadaRegistryChainAssetsMapAtom);
  const token = getToken(transaction, nativeToken ?? "");

  const asset = token ? chainAssetsMap.data?.[token] : undefined;
  const isBondingOrUnbondingTransaction = ["bond", "unbond"].includes(
    transactionTopLevel?.tx?.kind ?? ""
  );
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);

  const transparentAddress =
    accounts?.find((acc) => isTransparentAddress(acc.address))?.address ?? "";

  const txnInfo =
    isBondingOrUnbondingTransaction ?
      getBondOrUnbondTransactionInfo(transaction)
    : getTransactionInfo(transaction, transparentAddress);
  const receiver = txnInfo?.receiver;
  const sender = txnInfo?.sender;
  const isReceived = transactionTopLevel?.kind === "received";
  const isInternalUnshield =
    transactionTopLevel?.kind === "received" && isMaspAddress(sender ?? "");
  const transactionFailed = transaction?.exitCode === "rejected";
  const validators = useAtomValue(allValidatorsAtom);
  const validator = validators?.data?.find((v) => v.address === receiver);

  const getDisplayAmount = (): BigNumber => {
    if (!txnInfo?.amount) {
      return BigNumber(0);
    }
    if (!asset) {
      return txnInfo.amount;
    }

    // This is a temporary hack b/c NAM amounts are mixed in nam and unam for indexer before 3.2.0
    // Whenever the migrations are run and all transactions are in micro units we need to remove this
    // before 3.2.0 -> mixed
    // after 3.2.0 -> unam
    const guessIsDisplayAmount = (): boolean => {
      // Only check Namada tokens, not other chain tokens
      if (!isNamadaAsset(asset)) {
        return false;
      }

      // This is a fixed flag date that most operator have already upgraded to
      // indexer 3.2.0, meaning all transactions after this time are safe
      const timeFlag = new Date("2025-06-18T00:00:00").getTime() / 1000;
      const txTimestamp = transactionTopLevel.timestamp;
      if (txTimestamp && txTimestamp > timeFlag) {
        return false;
      }

      // If the amount contains the float dot, like "1.000000", it's nam
      const hasFloatAmount = (): boolean => {
        try {
          const stringData = transactionTopLevel.tx?.data;
          const objData = stringData ? JSON.parse(stringData) : {};
          return [...objData.sources, ...objData.targets].find(
            ({ amount }: { amount: string }) => amount.includes(".")
          );
        } catch {
          return false;
        }
      };
      if (hasFloatAmount()) {
        return true;
      }

      // if it's a huge amount, it should be unam
      if (txnInfo.amount.gte(new BigNumber(1_000_000))) {
        return false;
      }

      // if it's a small amount, it should be nam
      if (txnInfo.amount.lte(new BigNumber(10))) {
        return true;
      }

      // if has no more hints, just accept the data as it is
      return false;
    };

    const isAlreadyDisplayAmount = guessIsDisplayAmount();
    if (isAlreadyDisplayAmount) {
      // Do not transform to display amount in case it was already saved as display amount
      return txnInfo.amount;
    }

    return toDisplayAmount(asset, txnInfo.amount);
  };

  const renderKeplrIcon = (address: string): JSX.Element | null => {
    if (isShieldedAddress(address)) return null;
    if (isTransparentAddress(address)) return null;
    return <img src={keplrSvg} height={18} width={18} />;
  };

  const getTitle = (tx: Tx["tx"]): string => {
    const kind = tx?.kind;

    if (!kind) return "Unknown";
    if (isInternalUnshield) return "Unshielding Transfer";
    if (isReceived) return "Receive";
    if (kind.startsWith("ibc")) return "IBC Transfer";
    if (kind === "redelegation") return "Redelegate";
    if (kind === "voteProposal") return "Vote";
    if (kind === "withdraw") return "Withdraw";
    if (kind === "bond") return "Stake";
    if (kind === "unbond") return "Unstake";
    if (kind === "claimRewards") return "Claim Rewards";
    if (kind === "transparentTransfer") return "Transparent Transfer";
    if (kind === "shieldingTransfer") return "Shielding Transfer";
    if (kind === "unshieldingTransfer") return "Unshielding Transfer";
    if (kind === "shieldedTransfer") return "Shielded Transfer";
    return "Transfer";
  };

  const displayAmount = getDisplayAmount();
  return (
    <article
      className={twMerge(
        clsx(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-center my-1 font-semibold",
          "gap-5 bg-neutral-800 rounded-sm px-5 text-white border border-transparent",
          "transition-colors duration-200 hover:border-neutral-500",
          isBondingOrUnbondingTransaction && validator?.imageUrl ?
            "py-3"
          : "py-5"
        )
      )}
    >
      <div className="flex items-center gap-3">
        <i
          className={twMerge(
            clsx("text-2xl", {
              "text-success": !transactionFailed,
              "text-fail": transactionFailed,
            })
          )}
        >
          {!transactionFailed && (
            <IoCheckmarkCircleOutline className="ml-1 mt-0.5 w-10 h-10" />
          )}
          {transactionFailed && (
            <IoCloseCircleOutline className="ml-1 mt-0.5 w-10 h-10" />
          )}
        </i>

        <div className="flex flex-col">
          <h3
            className={twMerge(
              clsx("flex", {
                "text-success": !transactionFailed,
                "text-fail": transactionFailed,
              })
            )}
          >
            {transactionFailed && "Failed"} {getTitle(transaction)}{" "}
            <div className="relative group/tooltip">
              <CopyToClipboardControl
                className="ml-1.5 text-neutral-400"
                value={transaction?.wrapperId ?? ""}
              />
              <Tooltip position="right" className="p-2 -mr-3 w-[150px] z-10">
                Copy transaction hash
              </Tooltip>
            </div>
          </h3>
          <h3 className="text-neutral-400">
            {transactionTopLevel?.timestamp ?
              new Date(transactionTopLevel.timestamp * 1000)
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

      <div className="flex items-center">
        <div className="aspect-square w-10 h-10 mt-1">
          <AssetImage asset={asset} />
        </div>
        <TokenCurrency
          className="font-semibold text-white mt-1 ml-2"
          amount={displayAmount}
          symbol={asset?.symbol ?? ""}
        />
      </div>

      {!isBondingOrUnbondingTransaction && (
        <div className="flex flex-col">
          <h4 className={isShieldedAddress(sender ?? "") ? "text-yellow" : ""}>
            From
          </h4>
          <h4 className={isShieldedAddress(sender ?? "") ? "text-yellow" : ""}>
            {isShieldedAddress(sender ?? "") ?
              <span className="flex items-center gap-1">
                <FaLock className="w-4 h-4" /> Shielded
              </span>
            : <div className="flex items-center gap-1">
                {renderKeplrIcon(sender ?? "")}
                {shortenAddress(sender ?? "", 10, 10)}
              </div>
            }
          </h4>
        </div>
      )}

      <div className="flex flex-col">
        <h4 className={isShieldedAddress(receiver ?? "") ? "text-yellow" : ""}>
          {isBondingOrUnbondingTransaction ? "Validator" : "To"}
        </h4>
        <h4 className={isShieldedAddress(receiver ?? "") ? "text-yellow" : ""}>
          {isShieldedAddress(receiver ?? "") ?
            <span className="flex items-center gap-1">
              <FaLock className="w-4 h-4" /> Shielded
            </span>
          : isBondingOrUnbondingTransaction ?
            validator?.imageUrl ?
              <img
                src={validator?.imageUrl}
                className="w-9 h-9 mt-1 rounded-full"
              />
            : shortenAddress(receiver ?? "", 10, 10)
          : <div className="flex items-center gap-1">
              {renderKeplrIcon(receiver ?? "")}
              {shortenAddress(receiver ?? "", 10, 10)}
            </div>
          }
        </h4>
      </div>
    </article>
  );
};
