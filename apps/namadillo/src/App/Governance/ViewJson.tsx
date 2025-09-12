import { useAtomValue } from "jotai";
import { generatePath, useNavigate } from "react-router-dom";

import { Modal } from "@namada/components";
import {
  PgfIbcTarget,
  PgfTarget,
  ProposalData,
  ProposalWithData,
} from "@namada/types";
import { assertNever, copyToClipboard } from "@namada/utils";
import { ModalContainer } from "App/Common/ModalContainer";
import { routes } from "App/routes";
import { proposalWithDataFamily } from "atoms/proposals";
import clsx from "clsx";
import { useProposalIdParam } from "hooks";
import { useState } from "react";
import { GoCheck, GoCopy } from "react-icons/go";

type DefaultData = string;

type PgfStewardData = {
  add?: string;
  remove: string[];
};

type PgfTargetJson = {
  internal: {
    target: string;
    amount: string;
  };
};

type PgfIbcTargetJson = {
  ibc: {
    target: string;
    amount: string;
    channel_id: string;
    port_id: string;
  };
};

type PgfPaymentData = {
  continuous: (PgfTargetJson | PgfIbcTargetJson)[];
  retro: (PgfTargetJson | PgfIbcTargetJson)[];
};

type DataJson = DefaultData | PgfStewardData | PgfPaymentData | undefined;

type ProposalJson = {
  proposal: {
    id: bigint;
    content: { [key: string]: string | undefined };
    author: string;
    voting_start_epoch: bigint;
    voting_end_epoch: bigint;
    activation_epoch: bigint;
  };
  data: DataJson;
};

const formatPgfTarget = (value: PgfTarget): PgfTargetJson => ({
  internal: {
    target: value.internal.target,
    amount: value.internal.amount.toString(),
  },
});

const formatIbcPgfTarget = (value: PgfIbcTarget): PgfIbcTargetJson => ({
  ibc: {
    target: value.ibc.target,
    amount: value.ibc.amount.toString(),
    channel_id: value.ibc.channelId,
    port_id: value.ibc.portId,
  },
});

const formatData = (proposalData: ProposalData): DataJson => {
  switch (proposalData.type) {
    case "default":
      return undefined;

    case "default_with_wasm":
      return proposalData.data;

    case "pgf_steward":
      const addRemove = proposalData.data;

      // deliberately specify keys to ensure no unwanted data is printed
      return {
        add: addRemove.add,
        remove: addRemove.remove,
      };

    case "pgf_payment":
      const pgfActions = proposalData.data;

      const continuous = [
        ...pgfActions.continuous.add,
        ...pgfActions.continuous.remove,
      ].map((item) => {
        if ("internal" in item) {
          return formatPgfTarget(item);
        } else {
          return formatIbcPgfTarget(item);
        }
      });

      const retro = pgfActions.retro.map((retroItem) => {
        if ("internal" in retroItem) {
          return formatPgfTarget(retroItem);
        } else {
          return formatIbcPgfTarget(retroItem);
        }
      });

      // deliberately specify keys to ensure no unwanted data is printed
      return { continuous, retro };

    default:
      return assertNever(proposalData);
  }
};

const getProposalJsonString = (proposalWithData: ProposalWithData): string => {
  const { proposal, decodedData } = proposalWithData;
  const proposalJson: ProposalJson = {
    proposal: {
      id: proposal.id,
      content: proposal.content,
      author: proposal.author,
      voting_start_epoch: proposal.startEpoch,
      voting_end_epoch: proposal.endEpoch,
      activation_epoch: proposal.activationEpoch,
    },
    data: formatData(decodedData),
  };

  const stringified = JSON.stringify(
    proposalJson,
    (_, value) => {
      // TODO: This is not technically safe to cast BigInt to Number, but in
      // practice is probably fine. Still, we should consider replacing this
      // code.
      if (typeof value === "bigint") {
        return Number(value);
      }

      // Stop JSON.stringify from spacing out WASM data.
      // This adds double quotes we need to go back and remove later.
      if (value instanceof Object.getPrototypeOf(Uint8Array)) {
        return "[" + Array.from(value).join(", ") + "]";
      }

      return value;
    },
    2
  );

  const { type } = decodedData;

  if (type === "default_with_wasm") {
    // remove double quotes around WASM data
    return stringified.replace(/("data": )"(\[.*\])"(\n}$)/, "$1$2$3");
  } else {
    return stringified;
  }
};

export const ViewJson: React.FC = () => {
  const navigate = useNavigate();

  const proposalId = useProposalIdParam();

  if (proposalId === null) {
    return null;
  }

  const onCloseModal = (): void =>
    navigate(
      generatePath(routes.governanceProposal, {
        proposalId: proposalId.toString(),
      })
    );

  return (
    <Modal onClose={onCloseModal}>
      <ModalContainer header={null} onClose={onCloseModal}>
        <WithProposalId proposalId={proposalId} />
      </ModalContainer>
    </Modal>
  );
};

const WithProposalId: React.FC<{ proposalId: bigint }> = ({ proposalId }) => {
  const proposalWithDataQuery = useAtomValue(
    proposalWithDataFamily(proposalId)
  );

  return (
      proposalWithDataQuery.status === "pending" ||
        proposalWithDataQuery.status === "error"
    ) ?
      null
    : <Loaded proposalWithData={proposalWithDataQuery.data} />;
};

const Loaded: React.FC<{ proposalWithData: ProposalWithData }> = ({
  proposalWithData,
}) => {
  const [copied, setCopied] = useState(false);

  const jsonString = getProposalJsonString(proposalWithData);

  const onCopy = (): void => {
    if (!copied) {
      setCopied(true);
      copyToClipboard(jsonString);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-full flex flex-col justify-end">
      <i
        className={clsx(
          "border border-current rounded-sm p-1 absolute",
          "text-lg top-6 right-17 text-white transition-colors",
          { "hover:text-yellow cursor-pointer": !copied }
        )}
        onClick={onCopy}
      >
        {copied ?
          <GoCheck />
        : <GoCopy />}
      </i>
      <pre
        className={clsx(
          "overflow-x-auto dark-scrollbar whitespace-pre-wrap",
          "sm:px-8 h-[95%]"
        )}
      >
        {jsonString}
      </pre>
    </div>
  );
};
