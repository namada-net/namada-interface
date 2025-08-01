import { getSdk } from "@namada/sdk/web";
import sdkInit from "@namada/sdk/web-init";
import clsx from "clsx";
import { ReactNode, useCallback, useEffect, useState } from "react";

import { ActionButton, Stack } from "@namada/components";
import {
  Ledger,
  makeBip44Path,
  makeSaplingPath,
  TxType,
} from "@namada/sdk/web";
import { LedgerError, ResponseSign } from "@zondax/ledger-namada";

import { fromBase64, toBase64 } from "@cosmjs/encoding";
import { chains } from "@namada/chains";
import { CommitmentDetailProps, TransferProps } from "@namada/types";
import { PageHeader } from "App/Common";
import { ApprovalDetails } from "Approvals/Approvals";
import {
  QueryPendingTxBytesMsg,
  ReplaceMaspSignaturesMsg,
  SubmitApprovedSignLedgerTxMsg,
  SubmitApprovedSignTxMsg,
} from "background/approvals";
import { QueryAccountDetailsMsg } from "background/keyring";
import { useRequester } from "hooks/useRequester";
import { Ports } from "router";
import { closeCurrentTab, parseTransferType } from "utils";
import { ApproveIcon } from "./ApproveIcon";
import { LedgerIcon } from "./LedgerIcon";
import { StatusBox } from "./StatusBox";
import { Status } from "./types";

type Props = {
  details: ApprovalDetails;
};

const Step: React.FC<{
  title: string;
  description: React.ReactNode;
  icon: ReactNode;
  selected: boolean;
  disabled?: boolean;
}> = ({ title, description, icon, selected, disabled }) => {
  return (
    <div
      className={clsx(
        "text-white p-4",
        selected ? "border border-yellow rounded-md" : "",
        disabled ? "opacity-25" : ""
      )}
    >
      <div className="flex items-center gap-4">
        <div className="bg-black w-20 h-20 rounded-md flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-yellow text-base uppercase font-semibold">
            {title}
          </div>
          <div className="text-sm font-medium">{description}</div>
        </div>
      </div>
    </div>
  );
};

export const ConfirmSignLedgerTx: React.FC<Props> = ({ details }) => {
  const requester = useRequester();
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<Status>();
  const [statusInfo, setStatusInfo] = useState("");
  const [stepTwoDescription, setStepTwoDescription] =
    useState<React.ReactNode>();
  const [isLedgerConnected, setIsLedgerConnected] = useState(false);
  const [ledger, setLedger] = useState<Ledger>();
  const { msgId, signer, txDetails } = details;

  useEffect(() => {
    if (status === Status.Completed) {
      void closeCurrentTab();
    }
  }, [status]);

  const signMaspTx = async (
    ledger: Ledger,
    bytes: Uint8Array,
    path: string,
    shieldedHash?: string
  ): Promise<{ sbar: Uint8Array; rbar: Uint8Array }[]> => {
    const signMaspSpendsResponse = await ledger.namadaApp.signMaspSpends(
      path,
      Buffer.from(bytes)
    );

    if (signMaspSpendsResponse.returnCode !== LedgerError.NoErrors) {
      throw new Error(
        `Signing masp spends error encountered: ${signMaspSpendsResponse.errorMessage}`
      );
    }

    if (!shieldedHash) {
      throw new Error("Shielded hash is required for MASP transactions");
    }

    const { cryptoMemory } = await sdkInit();
    // TODO: Find a better way to init the sdk, token has to be any valid token
    const sdk = getSdk(
      cryptoMemory,
      "",
      "",
      "",
      "tnam1q9gr66cvu4hrzm0sd5kmlnjje82gs3xlfg3v6nu7"
    );
    const descriptors = await sdk
      .getMasp()
      .getDescriptorMap(bytes, fromBase64(shieldedHash));

    const responses = [];
    // TODO: this probably means that we do not really need descriptor map, but just to iterate over the sapling inputs
    for (const _ of descriptors) {
      const spendSignatureResponse = await ledger.namadaApp.getSpendSignature();
      if (spendSignatureResponse.returnCode !== LedgerError.NoErrors) {
        throw new Error(
          `Getting spends signature error encountered: ${signMaspSpendsResponse.errorMessage}`
        );
      }
      responses.push(spendSignatureResponse);
    }

    return responses;
  };

  const signLedgerTx = async (
    ledger: Ledger,
    bytes: Uint8Array,
    path: string
  ): Promise<ResponseSign> => {
    // Open ledger transport
    setStatusInfo("Review and approve transaction on your Ledger");

    // Sign with Ledger
    const signature = await ledger.sign(bytes, path);
    const { errorMessage, returnCode } = signature;

    if (returnCode !== LedgerError.NoErrors) {
      throw new Error(`Signing error encountered: ${errorMessage}`);
    }
    return signature;
  };

  const handleMaspSignTx = useCallback(
    async (
      ledger: Ledger,
      tx: string,
      zip32Path: string,
      signatures: string[],
      shieldedHash?: string
    ) => {
      const responses = await signMaspTx(
        ledger,
        fromBase64(tx),
        zip32Path,
        shieldedHash
      );

      responses.forEach(({ sbar, rbar }) => {
        const signature = toBase64(new Uint8Array([...rbar, ...sbar]));
        signatures.push(signature);
      });
    },
    []
  );

  const handleSignTx = useCallback(
    async (
      ledger: Ledger,
      tx: string,
      bip44Path: string,
      signatures: ResponseSign[]
    ) => {
      const signature = await signLedgerTx(ledger, fromBase64(tx), bip44Path);
      signatures.push(signature);
    },
    []
  );

  const handleApproveLedgerSignTx = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      setIsLedgerConnected(false);
      setStatusInfo("Connecting Ledger...");
      setStatus(Status.Pending);

      const ledger = await Ledger.init().catch((e) => {
        setError(`${e}`);
        setStatus(Status.Failed);
      });

      if (!ledger) {
        return;
      }
      setLedger(ledger);

      const {
        version: { returnCode, errorMessage },
      } = await ledger.status();

      // Validate Ledger state first
      if (returnCode !== LedgerError.NoErrors) {
        await ledger.closeTransport();
        setError(errorMessage);
        setStatus(Status.Failed);
      }

      setIsLedgerConnected(true);
      setStepTwoDescription("Preparing transaction...");

      try {
        // TODO: we have to check if the signer is disposable or not

        const accountDetails = await requester.sendMessage(
          Ports.Background,
          new QueryAccountDetailsMsg(signer)
        );
        if (!accountDetails) {
          throw new Error(`Failed to query account details for ${signer}`);
        }
        const [transparentAccount, shieldedAccount] = accountDetails;

        const path = {
          account: transparentAccount.path.account,
          change: transparentAccount.path.change || 0,
          index: transparentAccount.path.index || 0,
        };

        const pendingTxs = await requester.sendMessage(
          Ports.Background,
          new QueryPendingTxBytesMsg(msgId)
        );

        if (!pendingTxs) {
          throw new Error(
            `Pending transactions for msgId: ${msgId} not found!`
          );
        }

        let txIndex = 0;
        const txCount = pendingTxs.length;
        const stepTwoText = "Approve on your device";

        if (txCount === 1) {
          setStepTwoDescription(<p>{stepTwoText}</p>);
        }

        // Those collections are being mutated in the loop
        const signatures: ResponseSign[] = [];
        const maspSignatures: string[] = [];

        const transferTypes = txDetails.flatMap((details) =>
          details.commitments
            .filter((cmt) =>
              [TxType.Transfer, TxType.IBCTransfer].includes(
                cmt.txType as TxType
              )
            )
            .map((cmt) =>
              cmt.txType === TxType.Transfer ?
                parseTransferType(
                  cmt as CommitmentDetailProps<TransferProps>,
                  details.wrapperFeePayer
                ).type
              : cmt.maspTxIn && cmt.maspTxOut ? "IbcUnshieldTransfer"
              : "IbcTransfer"
            )
        );
        // For now we work under the assumption that we can't batch transfers from masp with other tx types
        const fromMasp =
          transferTypes.includes("Shielded") ||
          transferTypes.includes("Unshielding") ||
          transferTypes.includes("IbcUnshieldTransfer");

        for await (const { tx, shieldedHash } of pendingTxs) {
          if (txCount > 1) {
            setStepTwoDescription(
              <p>
                {stepTwoText}
                <br />
                Tx {txIndex + 1} of {txCount}
              </p>
            );
          }

          if (fromMasp) {
            if (!shieldedAccount) {
              throw new Error(
                `Shielded account details for ${signer} not found!`
              );
            }
            const zip32Path = makeSaplingPath(chains.namada.bip44.coinType, {
              account: shieldedAccount.path.account,
            });
            // Adds new signature to the collection
            await handleMaspSignTx(
              ledger,
              tx,
              zip32Path,
              maspSignatures,
              shieldedHash
            );
          } else {
            const bip44Path = makeBip44Path(chains.namada.bip44.coinType, path);
            // Adds new signature to the collection
            await handleSignTx(ledger, tx, bip44Path, signatures);
          }

          txIndex++;
        }

        setStepTwoDescription(<p>Submitting...</p>);

        if (fromMasp) {
          await requester.sendMessage(
            Ports.Background,
            new ReplaceMaspSignaturesMsg(msgId, maspSignatures)
          );
          await requester.sendMessage(
            Ports.Background,
            new SubmitApprovedSignTxMsg(msgId, signer)
          );
        } else {
          await requester.sendMessage(
            Ports.Background,
            new SubmitApprovedSignLedgerTxMsg(msgId, signatures)
          );
        }

        setStatus(Status.Completed);
      } catch (e) {
        await ledger.closeTransport();
        setError(`${e}`);
        setStatus(Status.Failed);
        setIsLedgerConnected(false);
      }
    },
    []
  );

  const handleRejectButton = useCallback(() => {
    if (ledger) {
      void ledger.closeTransport();
    }
    void closeCurrentTab();
  }, []);

  return (
    <Stack full className="py-4">
      <PageHeader title="Ledger sign" />
      <Stack full as="form" onSubmit={handleApproveLedgerSignTx}>
        <StatusBox status={status} pendingText={statusInfo} errorText={error} />
        <Step
          title="Step 1"
          description='Make sure your Ledger is unlocked, and click "Submit"'
          icon={<LedgerIcon />}
          selected={!isLedgerConnected}
          disabled={isLedgerConnected}
        />
        <Step
          title="Step 2"
          description={stepTwoDescription}
          icon={<ApproveIcon />}
          selected={isLedgerConnected}
        />
        <div className="flex-1" />
        <Stack gap={2}>
          <ActionButton disabled={status === Status.Pending}>
            Submit
          </ActionButton>
          <ActionButton
            outlineColor="yellow"
            type="button"
            onClick={handleRejectButton}
          >
            Reject
          </ActionButton>
        </Stack>
      </Stack>
    </Stack>
  );
};
