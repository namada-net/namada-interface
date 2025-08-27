import { CopyToClipboardControl, Tooltip } from "@namada/components";
import { formatPercentage, shortenAddress } from "@namada/utils";
import { FiatCurrency } from "App/Common/FiatCurrency";
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
import { tokenPricesFamily } from "atoms/prices/atoms";
import { proposalFamily } from "atoms/proposals";
import { TransactionHistory as TransactionHistoryType } from "atoms/transactions/atoms";
import { allValidatorsAtom } from "atoms/validators";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { AtomWithQueryResult } from "jotai-tanstack-query";
import { useCallback } from "react";
import { FaLock } from "react-icons/fa6";
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { NamadaAsset, Validator } from "types";
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

type VoteTransactionInfo = {
  proposalId: string;
  vote: string;
};

type TransactionInfo = {
  amount: BigNumber;
  sender?: string;
  receiver?: string;
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

const getVoteTransactionInfo = (tx: Tx["tx"]): VoteTransactionInfo | void => {
  if (!tx?.data) return;
  let parsed;
  try {
    parsed = JSON.parse(tx.data);
  } catch {
    parsed = tx.data;
  }

  return {
    proposalId: parsed.id || "",
    vote: parsed.vote || "",
  };
};

const getBondOrUnbondTransactionInfo = (
  tx: Tx["tx"]
): TransactionInfo | undefined => {
  if (!tx?.data) return undefined;

  let parsed: BondData;
  try {
    parsed = JSON.parse(tx.data);
  } catch {
    return undefined;
  }
  return {
    amount: new BigNumber(parsed.amount ?? "0"),
    sender: parsed.source,
    receiver: parsed.validator,
  };
};

const getRedelegationTransactionInfo = (
  tx: Tx["tx"]
): TransactionInfo | undefined => {
  if (!tx?.data) return undefined;
  let parsed;
  try {
    parsed = JSON.parse(tx.data);
  } catch {
    parsed = tx.data;
  }

  return {
    amount: BigNumber(parsed.amount),
    sender: parsed.src_validator,
    receiver: parsed.dest_validator,
  };
};

const getTransactionInfo = (
  tx: Tx["tx"],
  transparentAddress: string
): TransactionInfo | undefined => {
  if (!tx?.data) return undefined;

  const parsed = typeof tx.data === "string" ? JSON.parse(tx.data) : tx.data;

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

// Common data for all teh card types
const useTransactionCardData = (
  tx: Tx
): {
  transaction: Tx["tx"];
  asset: NamadaAsset | undefined;
  transparentAddress: string;
  transactionFailed: boolean;
  validators: AtomWithQueryResult<Validator[], Error>;
} => {
  const transaction = tx.tx;
  const nativeToken = useAtomValue(nativeTokenAddressAtom).data;
  const chainAssetsMap = useAtomValue(namadaRegistryChainAssetsMapAtom);
  const token = getToken(transaction, nativeToken ?? "");
  const asset = token ? chainAssetsMap.data?.[token] : undefined;
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const transparentAddress =
    accounts?.find((acc) => isTransparentAddress(acc.address))?.address ?? "";
  const transactionFailed = transaction?.exitCode === "rejected";
  const validators = useAtomValue(allValidatorsAtom);

  return {
    transaction,
    asset,
    transparentAddress,
    transactionFailed,
    validators,
  };
};

const getDisplayAmount = (
  txnInfo: TransactionInfo | undefined,
  asset: NamadaAsset | undefined,
  transactionTopLevel: Tx
): BigNumber => {
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

const ValidatorTooltip = ({
  validator,
  children,
}: {
  validator: Validator;
  children: React.ReactNode;
}): JSX.Element => {
  return (
    <div className="relative group/tooltip cursor-pointer">
      {children}
      <Tooltip
        position="bottom"
        className="p-0 w-[335px] z-[9999] bg-black border-2 border-yellow rounded-md"
      >
        <div className="p-5">
          <div className="flex items-center gap-3 pb-3 border-b border-neutral-700 mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              {validator.imageUrl ?
                <img
                  src={validator.imageUrl}
                  alt={validator.alias || "Validator"}
                  className="w-full h-full object-cover"
                />
              : <div className="w-full h-full bg-neutral-700 flex items-center justify-center text-neutral-400 text-sm">
                  {validator.alias?.charAt(0) || "?"}
                </div>
              }
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg">
                {validator.alias || "Unknown Validator"}
              </h3>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-neutral-300 font-mono text-sm">
              {shortenAddress(validator.address, 16, 16)}
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Commission</span>
              <span className="text-white">
                {formatPercentage(validator.commission)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Approximate APR (%)</span>
              <span className="text-white">
                {formatPercentage(validator.expectedApr)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Voting Power</span>
              <span className="text-white">
                {validator.votingPowerPercentage ?
                  formatPercentage(
                    new BigNumber(validator.votingPowerPercentage)
                  )
                : "0%"}
              </span>
            </div>
          </div>
        </div>
      </Tooltip>
    </div>
  );
};

const TransactionCardContainer = ({
  children,
  hasValidatorImage = false,
}: {
  children: React.ReactNode;
  transactionFailed: boolean;
  hasValidatorImage?: boolean;
}): JSX.Element => {
  return (
    <article
      className={twMerge(
        clsx(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-center my-1 font-semibold",
          "gap-5 bg-neutral-800 rounded-sm px-5 text-white border border-transparent",
          "transition-colors duration-200 hover:border-neutral-500",
          hasValidatorImage ? "py-3" : "py-5"
        )
      )}
    >
      {children}
    </article>
  );
};

const TransactionHeader = ({
  transactionFailed,
  title,
  wrapperId,
  timestamp,
}: {
  transactionFailed: boolean;
  title: string;
  wrapperId?: string;
  timestamp?: number;
}): JSX.Element => {
  return (
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
          {transactionFailed && "Failed"} {title}{" "}
          <div className="relative group/tooltip">
            <CopyToClipboardControl
              className="ml-1.5 text-neutral-400"
              value={wrapperId ?? ""}
            />
            <Tooltip position="right" className="p-2 -mr-3 w-[150px] z-10">
              Copy transaction hash
            </Tooltip>
          </div>
        </h3>
        <h3 className="text-neutral-400">
          {timestamp ?
            new Date(timestamp * 1000)
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
  );
};

const TransactionAmount = ({
  asset,
  amount,
}: {
  asset: NamadaAsset | undefined;
  amount: BigNumber;
}): JSX.Element => {
  const tokenPrices = useAtomValue(
    tokenPricesFamily(asset?.address ? [asset.address] : [])
  );
  const tokenPrice = asset?.address && tokenPrices.data?.[asset.address];
  const dollarAmount = tokenPrice && amount.multipliedBy(tokenPrice);

  return (
    <div className="flex items-center">
      <div className="aspect-square w-10 h-10 mt-1">
        <AssetImage asset={asset} />
      </div>
      <div className="ml-2 flex flex-col">
        <TokenCurrency
          className="font-semibold text-white"
          amount={amount}
          symbol={asset?.symbol ?? ""}
        />
        {dollarAmount && (
          <FiatCurrency
            className="text-neutral-400 text-sm"
            amount={dollarAmount}
          />
        )}
      </div>
    </div>
  );
};

const BondUnbondTransactionCard = ({ tx }: Props): JSX.Element => {
  const { transaction, asset, transactionFailed, validators } =
    useTransactionCardData(tx);
  const txnInfo = getBondOrUnbondTransactionInfo(transaction);
  const displayAmount = getDisplayAmount(txnInfo, asset, tx);
  const validator = validators?.data?.find(
    (v) => v.address === txnInfo?.receiver
  );

  const getTitle = useCallback((): string => {
    if (transaction?.kind === "bond") return "Stake";
    if (transaction?.kind === "unbond") return "Unstake";
    return "Bond/Unbond";
  }, [transaction?.kind]);

  return (
    <TransactionCardContainer
      transactionFailed={transactionFailed}
      hasValidatorImage={!!validator?.imageUrl}
    >
      <TransactionHeader
        transactionFailed={transactionFailed}
        title={getTitle()}
        wrapperId={transaction?.wrapperId}
        timestamp={tx.timestamp}
      />
      <TransactionAmount asset={asset} amount={displayAmount} />
      <div className="flex flex-col">
        <h4 className="text-neutral-400">
          {transaction?.kind === "bond" ? "To Validator" : "From Validator"}
        </h4>
        <h4>
          {validator?.imageUrl ?
            <ValidatorTooltip validator={validator}>
              <div className="flex items-center">
                <span className="mr-2 text-sm">{validator?.alias}</span>
                <img
                  src={validator?.imageUrl}
                  className="w-6 h-6 rounded-full"
                />
              </div>
            </ValidatorTooltip>
          : shortenAddress(txnInfo?.receiver ?? "", 10, 10)}
        </h4>
      </div>
    </TransactionCardContainer>
  );
};

const RedelegationTransactionCard = ({ tx }: Props): JSX.Element => {
  const { transaction, asset, transactionFailed, validators } =
    useTransactionCardData(tx);
  const txnInfo = getRedelegationTransactionInfo(transaction);
  const displayAmount = getDisplayAmount(txnInfo, asset, tx);
  const redelegationSource = validators?.data?.find(
    (v) => v.address === txnInfo?.sender
  );
  const redelegationTarget = validators?.data?.find(
    (v) => v.address === txnInfo?.receiver
  );

  return (
    <TransactionCardContainer
      transactionFailed={transactionFailed}
      hasValidatorImage={
        !!(redelegationSource?.imageUrl || redelegationTarget?.imageUrl)
      }
    >
      <TransactionHeader
        transactionFailed={transactionFailed}
        title="Redelegate"
        wrapperId={transaction?.wrapperId}
        timestamp={tx.timestamp}
      />

      <TransactionAmount asset={asset} amount={displayAmount} />

      <div className="flex flex-col">
        <h4 className="text-neutral-400">From Validator</h4>
        <h4>
          {redelegationSource?.imageUrl ?
            <ValidatorTooltip validator={redelegationSource}>
              <div className="flex items-center">
                <span className="mr-2 text-sm">
                  {redelegationSource?.alias}
                </span>
                <img
                  src={redelegationSource?.imageUrl}
                  className="w-6 h-6 rounded-full"
                />
              </div>
            </ValidatorTooltip>
          : shortenAddress(txnInfo?.sender ?? "", 10, 10)}
        </h4>
      </div>

      <div className="flex flex-col">
        <h4 className="text-neutral-400">To Validator</h4>
        <h4>
          {redelegationTarget?.imageUrl ?
            <ValidatorTooltip validator={redelegationTarget}>
              <div className="flex items-center">
                <span className="mr-2 text-sm">
                  {redelegationTarget?.alias}
                </span>
                <img
                  src={redelegationTarget?.imageUrl}
                  className="w-6 h-6 rounded-full"
                />
              </div>
            </ValidatorTooltip>
          : shortenAddress(txnInfo?.receiver ?? "", 10, 10)}
        </h4>
      </div>
    </TransactionCardContainer>
  );
};

const VoteTransactionCard = ({ tx }: Props): JSX.Element => {
  const { transaction, transactionFailed } = useTransactionCardData(tx);
  const voteInfo = getVoteTransactionInfo(transaction);
  const proposalId = voteInfo?.proposalId && BigInt(voteInfo.proposalId);
  const proposal = useAtomValue(proposalFamily(proposalId || BigInt(0)));
  const navigate = useNavigate();

  const proposalTitle =
    proposal.data?.content.title ?
      `#${voteInfo?.proposalId} - ${proposal.data.content.title.slice(0, 20)}...`
    : `#${voteInfo?.proposalId}`;
  const proposer = proposal.data?.author;
  return (
    <TransactionCardContainer transactionFailed={transactionFailed}>
      <TransactionHeader
        transactionFailed={transactionFailed}
        title="Vote"
        wrapperId={transaction?.wrapperId}
        timestamp={tx.timestamp}
      />
      <div className="flex flex-col">
        <h4 className="text-neutral-400">Vote</h4>
        <h4
          className={clsx("uppercase", {
            "text-success": voteInfo?.vote.toLowerCase() === "yay",
            "text-fail": voteInfo?.vote.toLowerCase() === "nay",
          })}
        >
          {voteInfo?.vote ?? "-"}
        </h4>
      </div>
      <div className="flex flex-col">
        <h4 className="text-neutral-400">Proposal</h4>
        <h4>
          <div className="relative group/tooltip">
            <button
              onClick={() =>
                navigate(`/governance/proposal/${voteInfo?.proposalId}`)
              }
              className="hover:text-yellow cursor-pointer flex"
            >
              {proposalTitle}
            </button>
            {proposal.data?.content.title && (
              <Tooltip position="top" className="p-2 w-[300px] z-10">
                {`#${voteInfo?.proposalId} - ${proposal.data.content.title}`}
              </Tooltip>
            )}
          </div>
        </h4>
      </div>
      <div className="flex flex-col">
        <h4 className="text-neutral-400">Proposer</h4>
        <h4>{proposer ? shortenAddress(proposer, 10, 10) : "-"}</h4>
      </div>
    </TransactionCardContainer>
  );
};

const WithdrawTransactionCard = ({ tx }: Props): JSX.Element => {
  const { transaction, transactionFailed, validators } =
    useTransactionCardData(tx);

  const txnInfo = JSON.parse(tx.tx?.data ?? "{}");
  const validator = validators?.data?.find(
    (v) => v.address === txnInfo?.validator
  );

  return (
    <TransactionCardContainer
      transactionFailed={transactionFailed}
      hasValidatorImage={!!validator?.imageUrl}
    >
      <TransactionHeader
        transactionFailed={transactionFailed}
        title="Withdraw"
        wrapperId={transaction?.wrapperId}
        timestamp={tx.timestamp}
      />
      <div className="flex flex-col">
        <h4 className="text-neutral-400">From Validator</h4>
        <h4>
          {validator?.imageUrl ?
            <ValidatorTooltip validator={validator}>
              <div className="flex">
                <img
                  src={validator?.imageUrl}
                  className="w-9 h-9 mt-1 rounded-full"
                />{" "}
                <span className="mt-2 ml-2">{validator?.alias}</span>
              </div>
            </ValidatorTooltip>
          : shortenAddress(txnInfo?.validator ?? "", 10, 10)}
        </h4>
      </div>
    </TransactionCardContainer>
  );
};

const GeneralTransactionCard = ({ tx }: Props): JSX.Element => {
  const { transaction, asset, transparentAddress, transactionFailed } =
    useTransactionCardData(tx);
  const txnInfo = getTransactionInfo(transaction, transparentAddress);
  const displayAmount = getDisplayAmount(txnInfo, asset, tx);
  const receiver = txnInfo?.receiver;
  const sender = txnInfo?.sender;
  const isReceived = tx?.kind === "received";
  const isInternalUnshield =
    tx?.kind === "received" && isMaspAddress(sender ?? "");

  const getTitle = (): string => {
    const kind = transaction?.kind;

    if (!kind) return "Unknown";
    if (isInternalUnshield) return "Unshielding Transfer";
    if (isReceived) return "Receive";
    if (kind.startsWith("ibc")) return "IBC Transfer";
    if (kind === "claimRewards") return "Claim Rewards";
    if (kind === "transparentTransfer") return "Transparent Transfer";
    if (kind === "shieldingTransfer") return "Shielding Transfer";
    if (kind === "unshieldingTransfer") return "Unshielding Transfer";
    if (kind === "shieldedTransfer") return "Shielded Transfer";
    return "Transfer";
  };

  return (
    <TransactionCardContainer transactionFailed={transactionFailed}>
      <TransactionHeader
        transactionFailed={transactionFailed}
        title={getTitle()}
        wrapperId={transaction?.wrapperId}
        timestamp={tx.timestamp}
      />

      <TransactionAmount asset={asset} amount={displayAmount} />

      <div className="flex flex-col">
        <h4 className="text-neutral-400">From</h4>
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

      <div className="flex flex-col">
        <h4 className="text-neutral-400">To</h4>
        <h4 className={isShieldedAddress(receiver ?? "") ? "text-yellow" : ""}>
          {isShieldedAddress(receiver ?? "") ?
            <span className="flex items-center gap-1">
              <FaLock className="w-4 h-4" /> Shielded
            </span>
          : <div className="flex items-center gap-1">
              {renderKeplrIcon(receiver ?? "")}
              {shortenAddress(receiver ?? "", 10, 10)}
            </div>
          }
        </h4>
      </div>
    </TransactionCardContainer>
  );
};

export const TransactionCard = ({ tx }: Props): JSX.Element => {
  const transactionKind = tx.tx?.kind;

  if (transactionKind === "bond" || transactionKind === "unbond") {
    return <BondUnbondTransactionCard tx={tx} />;
  }

  if (transactionKind === "redelegation") {
    return <RedelegationTransactionCard tx={tx} />;
  }

  if (transactionKind === "voteProposal") {
    return <VoteTransactionCard tx={tx} />;
  }

  if (transactionKind === "withdraw") {
    return <WithdrawTransactionCard tx={tx} />;
  }

  return <GeneralTransactionCard tx={tx} />;
};
