import { chains } from "@namada/chains";
import { ActionButton, Alert, Image, Stack } from "@namada/components";
import {
  ExtendedViewingKey,
  initSdk,
  LEDGER_MIN_VERSION_ZIP32,
  Ledger as LedgerApp,
  makeBip44Path,
  makeSaplingPath,
  ProofGenerationKey,
  PseudoExtendedKey,
} from "@namada/sdk";
import { Bip44Path, Zip32Path } from "@namada/types";
import { LedgerError } from "@zondax/ledger-namada";
import { LedgerStep } from "Setup/Common";
import { AdvancedOptions } from "Setup/Common/AdvancedOptions";
import Bip44Form from "Setup/Common/Bip44Form";
import { LedgerApprovalStep } from "Setup/Common/LedgerApprovalStep";
import Zip32Form from "Setup/Common/Zip32Form";
import routes from "Setup/routes";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  bip44Path: Bip44Path;
  zip32Path: Zip32Path;
  setBip44Path: (path: Bip44Path) => void;
  setZip32Path: (path: Zip32Path) => void;
};

export const LedgerConnect: React.FC<Props> = ({
  bip44Path,
  zip32Path,
  setBip44Path,
  setZip32Path,
}) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [isLedgerConnecting, setIsLedgerConnecting] = useState(false);
  const [ledger, setLedger] = useState<LedgerApp>();
  const [isZip32Supported, setIsZip32Supported] = useState(true);

  // Import keys steps (transparent, viewing key, proof-gen key)
  const [currentApprovalStep, setCurrentApprovalStep] = useState(1);

  const queryLedger = async (ledger: LedgerApp): Promise<void> => {
    setError(undefined);

    let encodedExtendedViewingKey: string | undefined;
    let encodedPaymentAddress: string | undefined;
    let encodedPseudoExtendedKey: string | undefined;
    let diversifierIndex: number | undefined;

    try {
      const {
        version: { errorMessage, returnCode },
      } = await ledger.status();

      if (returnCode !== LedgerError.NoErrors) {
        throw new Error(errorMessage);
      }
      const isMaspSupported = await ledger?.isZip32Supported();
      setIsZip32Supported(isMaspSupported);

      setIsLedgerConnecting(true);
      setCurrentApprovalStep(1);
      const { address, publicKey } = await ledger.showAddressAndPublicKey(
        makeBip44Path(chains.namada.bip44.coinType, bip44Path)
      );

      if (isMaspSupported) {
        // Import Shielded Keys
        const path = makeSaplingPath(chains.namada.bip44.coinType, {
          account: zip32Path.account,
        });

        setCurrentApprovalStep(2);
        const { xfvk } = await ledger.getViewingKey(path);

        setCurrentApprovalStep(3);
        const { ak, nsk } = await ledger.getProofGenerationKey(path);

        // We only do this to initialize wasm, props don't matter
        await initSdk({
          rpcUrl: "",
          token: "tnam1q9gr66cvu4hrzm0sd5kmlnjje82gs3xlfg3v6nu7",
        });

        const extendedViewingKey = new ExtendedViewingKey(xfvk);
        encodedExtendedViewingKey = extendedViewingKey.encode();
        [diversifierIndex, encodedPaymentAddress] =
          extendedViewingKey.default_payment_address();

        const proofGenerationKey = ProofGenerationKey.from_bytes(ak, nsk);
        const pseudoExtendedKey = PseudoExtendedKey.from(
          extendedViewingKey,
          proofGenerationKey
        );
        encodedPseudoExtendedKey = pseudoExtendedKey.encode();
      }

      setIsLedgerConnecting(false);

      navigate(routes.ledgerImport(), {
        state: {
          address,
          publicKey,
          extendedViewingKey: encodedExtendedViewingKey,
          paymentAddress: encodedPaymentAddress,
          pseudoExtendedKey: encodedPseudoExtendedKey,
          diversifierIndex,
        },
      });
    } catch (e) {
      setIsLedgerConnecting(false);
      handleError(e);
    } finally {
      await ledger.closeTransport();
    }
  };

  const connectUSB = async (): Promise<void> => {
    try {
      const ledger = await LedgerApp.init();
      setLedger(ledger);
    } catch (e) {
      handleError(e);
    }
  };

  const connectNamadaApp = async (): Promise<void> => {
    if (ledger) {
      await queryLedger(ledger);
    }
  };

  const resetOnError = (): void => {
    setLedger(undefined);
  };

  const handleError = (e: unknown): void => {
    resetOnError();

    if (e instanceof Error) {
      setError(e.message);
      return;
    }

    setError(`${e}`);
  };

  return (
    <Stack gap={6} className="justify-between min-h-[470px]">
      <Stack as="ol" gap={4} className="flex-1 justify-center mx-auto w-full">
        {error && (
          <Alert title="Error" type="error">
            {error}
          </Alert>
        )}

        {isLedgerConnecting && !isZip32Supported && (
          <Alert type="warning">
            Shielded key import is not available for the Nano S or on versions
            below {LEDGER_MIN_VERSION_ZIP32}
          </Alert>
        )}

        {isLedgerConnecting && (
          <LedgerApprovalStep
            currentApprovalStep={currentApprovalStep}
            isZip32Supported={isZip32Supported}
          />
        )}

        {!isLedgerConnecting && (
          <>
            <AdvancedOptions>
              <Bip44Form path={bip44Path} setPath={setBip44Path} />
              {/*
                NOTE: I don't think we can conditionally show/hide the zip32 form, because the version check needs
                to happen after the Ledger is connected, but user must first choose to initiate that connection.
                This should be fine, as eventually (soon) everyone will be on the supported version.
              */}
              <Zip32Form path={zip32Path} setPath={setZip32Path} />
            </AdvancedOptions>
            <LedgerStep
              title="Step 1"
              text="Connect and unlock your ledger Hardware Wallet"
              onClick={() => connectUSB()}
              active={!ledger}
              complete={!!ledger}
              buttonDisabled={!!ledger}
              image={
                <Image styleOverrides={{ width: "100%" }} imageName="Ledger" />
              }
            />
            <LedgerStep
              title="Step 2"
              text="Open the Namada App on your ledger device"
              active={!!ledger}
              complete={false}
              onClick={() => connectNamadaApp()}
              buttonDisabled={!ledger || isLedgerConnecting}
              image={
                <Image
                  styleOverrides={{ width: "100%" }}
                  imageName="LogoMinimal"
                />
              }
            />
          </>
        )}
      </Stack>
      <ActionButton size="lg" disabled={true}>
        Next
      </ActionButton>
    </Stack>
  );
};
