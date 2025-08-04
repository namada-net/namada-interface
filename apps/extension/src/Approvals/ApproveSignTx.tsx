import { ActionButton, GapPatterns, Stack } from "@namada/components";
import { useSanitizedParams } from "@namada/hooks";
import { TxType, TxTypeLabel } from "@namada/sdk/web";
import {
  AccountType,
  CommitmentDetailProps,
  NamadaChains,
  TransferProps,
} from "@namada/types";
import { shortenAddress } from "@namada/utils";
import { PageHeader } from "App/Common/PageHeader";
import { ApprovalDetails } from "Approvals/Approvals";
import { Commitment } from "Approvals/Commitment";
import { TransactionDataPanel } from "Approvals/TransactionDataPanel";
import { TopLevelRoute } from "Approvals/types";
import { QueryTxDetailsMsg, RejectSignTxMsg } from "background/approvals";
import { useRequester } from "hooks/useRequester";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ports } from "router";
import { closeCurrentTab, parseTransferType } from "utils";
import { ApprovalPanelHeader } from "./ApprovalPanelHeader";

type Props = {
  details?: ApprovalDetails;
  setDetails: (details: ApprovalDetails) => void;
};

export const ApproveSignTx: React.FC<Props> = ({ details, setDetails }) => {
  const navigate = useNavigate();
  const requester = useRequester();
  const params = useSanitizedParams();
  const accountType =
    (params?.accountType as AccountType) || AccountType.PrivateKey;
  const msgId = params?.msgId;
  const origin = params?.origin;
  const signer = params?.signer;
  const [displayTransactionData, setDisplayTransactionData] = useState(false);

  useEffect(() => {
    const fetchDetails = async (): Promise<void> => {
      if (signer && msgId && origin) {
        const txDetails = await requester.sendMessage(
          Ports.Background,
          new QueryTxDetailsMsg(msgId)
        );

        // Collect all commitment types
        const txTypes = txDetails
          .map((d) =>
            d.commitments.map((cmt) => ({
              ...cmt,
              wrapperFeePayer: d.wrapperFeePayer,
            }))
          )
          .flat()
          .map((commitment) => {
            if (commitment.txType === TxType.Transfer) {
              const { type } = parseTransferType(
                commitment as unknown as CommitmentDetailProps<TransferProps>,
                commitment.wrapperFeePayer
              );
              return type;
            } else if (commitment.txType === TxType.IBCTransfer) {
              return commitment.maspTxIn && commitment.maspTxOut ?
                  "IbcUnshieldTransfer"
                : "IbcTransfer";
            } else {
              return commitment.txType as string;
            }
          });

        setDetails({
          msgId,
          signer,
          accountType,
          origin,
          chainIds: txDetails.map((cmt) => cmt.chainId),
          txDetails,
          txType: txTypes[0],
        });
      }
    };

    // TODO: Add error state
    fetchDetails().catch((e) => console.error(e));
  }, []);

  const handleApproveSubmit = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault();
      if (accountType === AccountType.Ledger) {
        return navigate(`${TopLevelRoute.ConfirmLedgerTx}`);
      }
      navigate(TopLevelRoute.ConfirmSignTx);
    },
    [accountType]
  );

  const handleReject = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      try {
        if (msgId) {
          await requester.sendMessage(
            Ports.Background,
            new RejectSignTxMsg(msgId)
          );
          // Close tab
          return await closeCurrentTab();
        }
        throw new Error("msgId was not provided!");
      } catch (e) {
        console.warn(e);
      }
      return;
    },
    [msgId]
  );

  const getDataAsText = (): string => {
    if (!details) return "";

    const data = details.txDetails.map((d) => ({
      ...d,
      commitments: d.commitments.map((cmt) => ({
        ...cmt,
        txType: TxTypeLabel[cmt.txType as TxType],
      })),
    }));

    return JSON.stringify(data.length === 1 ? data[0] : data, null, 2);
  };

  const numberOfTx =
    details?.txDetails.reduce((len, details) => {
      return len + details.commitments.length || 0;
    }, 0) || 0;

  return (
    <Stack
      className="h-full text-white pt-4 pb-6"
      gap={GapPatterns.TitleContent}
    >
      <PageHeader title="Confirm Transaction" />
      <div className="flex flex-col h-full gap-4 justify-between">
        <main>
          <ApprovalPanelHeader
            numberOfTransactions={numberOfTx}
            onChangeViewData={setDisplayTransactionData}
            viewTransactionData={displayTransactionData}
          />
          {!displayTransactionData && (
            <Stack gap={1}>
              {details?.txDetails?.map(
                ({ commitments, wrapperFeePayer }) =>
                  commitments?.length &&
                  commitments
                    .filter((tx) => tx.memo !== "MASP_FEE_PAYMENT")
                    .map((tx, i) => (
                      <Commitment
                        key={`${tx.hash}-${i}`}
                        commitment={tx}
                        wrapperFeePayer={wrapperFeePayer}
                      />
                    ))
              )}
            </Stack>
          )}
          {displayTransactionData && details?.txDetails && (
            <TransactionDataPanel data={getDataAsText()} />
          )}
        </main>
        <Stack gap={2} as="form" onSubmit={handleApproveSubmit}>
          <p className="text-xs">
            {signer && (
              <>
                Signer: <strong>{shortenAddress(signer)}</strong>
              </>
            )}
            <br />
            Origin: <strong>{origin}</strong>
            <br />
            Chain:{" "}
            <strong>
              {details?.chainIds
                // Get only unique chain IDs
                .filter((chainId, i) => details.chainIds.indexOf(chainId) === i)
                // Display chain alias for known networks, otherwise display chain ID
                .map((chainId) => NamadaChains.get(chainId) || chainId)
                .join(", ")}
            </strong>
          </p>
          <Stack gap={1.5} direction="vertical">
            <ActionButton>Approve</ActionButton>
            <ActionButton
              backgroundHoverColor="black"
              textHoverColor="yellow"
              onClick={handleReject}
              outlineColor="yellow"
            >
              Reject
            </ActionButton>
          </Stack>
        </Stack>
      </div>
    </Stack>
  );
};
