import { SkeletonLoading, Stack } from "@namada/components";
import { Proposal } from "@namada/types";
import { proposalFamily } from "atoms/proposals";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { Fragment, ReactNode, useState } from "react";
import { twMerge } from "tailwind-merge";

const ExternalLink = ({ url }: { url: string }): JSX.Element => {
  return (
    <a href={url} target="_blank" rel="noreferrer nofollow">
      {url}
    </a>
  );
};

const formatLinks = (string: string): ReactNode => {
  const regex = /(http.*)/;
  return string.split(regex).map((part, index) => {
    const isUrl = regex.test(part);
    if (isUrl) {
      if (part.endsWith(".")) {
        return (
          <Fragment key={index}>
            <ExternalLink url={part.slice(0, -1)} />.
          </Fragment>
        );
      }
      return <ExternalLink key={index} url={part} />;
    }
    return part;
  });
};

export const ProposalDescription: React.FC<{
  proposalId: bigint;
}> = ({ proposalId }) => {
  const proposal = useAtomValue(proposalFamily(proposalId));

  return (
    <Stack className="text-sm px-8 -mt-3" gap={4}>
      {proposal.status === "error" || proposal.status === "pending" ?
        <>
          <SkeletonLoading height="1em" width="100%" />
          <SkeletonLoading height="1em" width="100%" />
        </>
      : <Loaded proposal={proposal.data} />}
    </Stack>
  );
};

const Loaded: React.FC<{
  proposal: Proposal;
}> = ({ proposal }) => {
  const [expanded, setExpanded] = useState(false);

  const { abstract, ...details } = proposal.content;

  const formattedDetails = Object.entries(details)
    .filter(([key]) => key !== "title")
    .map(([key, value]) => {
      const spacedKey = key.replaceAll("-", " ");
      const capitalizedKey =
        spacedKey.charAt(0).toUpperCase() + spacedKey.slice(1);

      return [capitalizedKey, value];
    });

  return (
    <>
      <Stack
        gap={4}
        className={twMerge(
          "overflow-hidden whitespace-pre-line [&_a]:underline [&_a:hover]:text-yellow",
          !expanded && "max-h-[350px]"
        )}
      >
        <section>{abstract}</section>
        {formattedDetails.map(([key, value], i) => (
          <section key={i}>
            <h3 className="text-[#8A8A8A]">{key}</h3>
            <p>{formatLinks(value ?? "")}</p>
          </section>
        ))}
      </Stack>

      <a
        className={clsx(
          "block text-center cursor-pointer",
          expanded ? "after:content-['_-']" : "after:content-['_+']"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        Show {expanded ? "Less" : "More"}
      </a>
    </>
  );
};
