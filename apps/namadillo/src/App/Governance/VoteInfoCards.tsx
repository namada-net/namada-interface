import { NamCurrency } from "App/Common/NamCurrency";
import { twMerge } from "tailwind-merge";

import { SkeletonLoading } from "@namada/components";
import {
  AddRemove,
  PgfActions,
  PgfIbcTarget,
  PgfTarget,
  ProposalWithData,
} from "@namada/types";

import { proposalWithDataFamily } from "atoms/proposals";
import BigNumber from "bignumber.js";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { namadaAsset, toDisplayAmount } from "utils";
import {
  secondsToDateTimeString,
  secondsToFullDateTimeString,
} from "utils/dates";

const InfoCard: React.FC<
  {
    title: React.ReactNode;
    content: React.ReactNode;
  } & Omit<React.ComponentProps<"div">, "title" | "content">
> = ({ title, content, className, ...rest }) => (
  <div
    className={twMerge("bg-[#1B1B1B] rounded-sm px-3 py-2", className)}
    {...rest}
  >
    <div className="text-xs text-[#8A8A8A] mb-1">{title}</div>
    <div className="text-sm">{content}</div>
  </div>
);

const PgfStewardInfoCards: React.FC<{
  addRemove: AddRemove;
}> = ({ addRemove }) => {
  return (
    <>
      <InfoCard
        title="Add"
        className="col-span-3"
        content={<span>{addRemove.add}</span>}
      />
      <InfoCard
        title="Remove"
        className="col-span-3"
        content={addRemove.remove.map((address) => (
          <span key={`info-card-remove-${address}`}>{address}</span>
        ))}
      />
    </>
  );
};

const extractPgfInfo = (
  pgfTarget: PgfTarget | PgfIbcTarget
): { target: string; amount: BigNumber } => {
  let target: string;
  let amount: BigNumber;

  if ("internal" in pgfTarget) {
    target = pgfTarget.internal.target;
    amount = pgfTarget.internal.amount;
  } else {
    target = pgfTarget.ibc.target;
    amount = pgfTarget.ibc.amount;
  }

  return { target, amount };
};

const PgfPaymentInfoCards: React.FC<{
  pgfActions: PgfActions;
}> = ({ pgfActions }) => {
  return (
    <>
      <InfoCard
        title="Continuous Add"
        className="col-span-full"
        content={pgfActions.continuous.add.map((continuous) => {
          const { target, amount } = extractPgfInfo(continuous);

          return (
            <span key={`info-card-continuous-add-${target}`}>
              {target} <NamCurrency amount={amount} />
              {"ibc" in continuous ?
                ` ${continuous.ibc.channelId} ${continuous.ibc.portId}`
              : ""}
            </span>
          );
        })}
      />
      <InfoCard
        title="Continuous Remove"
        className="col-span-full"
        content={pgfActions.continuous.remove.map((continuous) => {
          const { target, amount } = extractPgfInfo(continuous);

          return (
            <span key={`info-card-continuous-remove-${target}`}>
              {target} <NamCurrency amount={amount} />
              {"ibc" in continuous ?
                ` ${continuous.ibc.channelId} ${continuous.ibc.portId}`
              : ""}
            </span>
          );
        })}
      />
      <InfoCard
        title="Retro"
        className="col-span-full"
        content={
          <>
            <div className="grid grid-cols-[1fr,auto,1fr] gap-2 text-[#8A8A8A] text-xs mb-1">
              <div>Recipient Address</div>
              <div>Amount</div>
            </div>
            {pgfActions.retro.map((retro) => {
              const { target, amount } = extractPgfInfo(retro);

              return (
                <div
                  key={`info-card-retro-${target}`}
                  className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center"
                >
                  <div className="font-mono">{target}</div>
                  <NamCurrency
                    className="w-25 ml-10"
                    amount={toDisplayAmount(namadaAsset(), amount)}
                  />
                  <div>
                    {"ibc" in retro ?
                      `${retro.ibc.channelId} ${retro.ibc.portId}`
                    : ""}
                  </div>
                </div>
              );
            })}
          </>
        }
      />
    </>
  );
};

export const VoteInfoCards: React.FC<{
  proposalId: bigint;
}> = ({ proposalId }) => {
  const proposalWithDataQuery = useAtomValue(
    proposalWithDataFamily(proposalId)
  );

  return (
    <div className="grid grid-cols-6 gap-2 m-4">
      {(
        proposalWithDataQuery.status === "pending" ||
        proposalWithDataQuery.status === "error"
      ) ?
        <>
          <LoadingCard className="col-span-2" />
          <LoadingCard className="col-span-2" />
          <LoadingCard className="col-span-2" />
          <LoadingCard className="col-span-full" />
        </>
      : <Loaded proposalWithData={proposalWithDataQuery.data} />}
    </div>
  );
};

const LoadingCard: React.FC<{ className?: string }> = ({ className }) => (
  <InfoCard
    title={<SkeletonLoading height="20px" width="50%" />}
    content={<SkeletonLoading height="20px" width="100%" />}
    className={className}
  />
);

const DateTimeEpoch: React.FC<{ date: bigint; epoch: bigint }> = ({
  date,
  epoch,
}) => (
  <div className="leading-tight" title={secondsToFullDateTimeString(date)}>
    {secondsToDateTimeString(date)}
    <div className="text-xs text-neutral-500">Epoch {epoch.toString()}</div>
  </div>
);

const Loaded: React.FC<{
  proposalWithData: ProposalWithData;
}> = ({ proposalWithData }) => {
  const { proposal, decodedData, encodedData } = proposalWithData;
  const [dataHash, setDataHash] = useState<string>();

  useEffect(() => {
    if (
      encodedData?.type === "default_with_wasm" &&
      encodedData.data!.length > 0
    ) {
      setDataHash(encodedData.hash);
    }
  }, [proposal.proposalType]);

  return (
    <>
      <InfoCard
        title="Voting Start"
        content={
          <DateTimeEpoch
            date={proposal.startTime}
            epoch={proposal.startEpoch}
          />
        }
        className="col-span-2"
      />
      <InfoCard
        title="Voting End"
        content={
          <DateTimeEpoch date={proposal.endTime} epoch={proposal.endEpoch} />
        }
        className="col-span-2"
      />
      <InfoCard
        title="Activation Time"
        content={
          <DateTimeEpoch
            date={proposal.activationTime}
            epoch={proposal.activationEpoch}
          />
        }
        className="col-span-2"
      />
      <InfoCard
        title="Proposer"
        content={proposal.author}
        className="col-span-full"
      />
      {dataHash && (
        <InfoCard
          title="Data Hash"
          content={dataHash}
          className="col-span-full"
        />
      )}
      {decodedData.type === "pgf_steward" && (
        <PgfStewardInfoCards addRemove={decodedData.data} />
      )}
      {decodedData.type === "pgf_payment" && (
        <PgfPaymentInfoCards pgfActions={decodedData.data} />
      )}
    </>
  );
};
