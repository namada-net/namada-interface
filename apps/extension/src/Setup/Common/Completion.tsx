import React, { useEffect } from "react";
import browser from "webextension-polyfill";

import { chains } from "@namada/chains";
import { ActionButton, Alert, Loading, ViewKeys } from "@namada/components";
import { makeBip44Path } from "@namada/sdk";
import { Bip44Path } from "@namada/types";
import {
  AccountSecret,
  AccountStore,
  DEFAULT_BIP44_PATH,
} from "background/keyring";
import { useNavigate } from "react-router-dom";
import { CompletionStatus } from "Setup/Setup";
import { isCustomPath } from "utils";

type Props = {
  alias: string;
  accountSecret?: AccountSecret;
  status?: CompletionStatus;
  statusInfo: string;
  parentAccountStore?: AccountStore;
  paymentAddress?: string;
  password?: string;
  passwordRequired: boolean | undefined;
  path: Bip44Path;
};

export const Completion: React.FC<Props> = (props) => {
  const {
    alias,
    accountSecret,
    password,
    passwordRequired,
    path,
    parentAccountStore,
    paymentAddress,
    status,
    statusInfo,
  } = props;

  const navigate = useNavigate();

  const derivationPath =
    accountSecret?.t === "PrivateKey" ? DEFAULT_BIP44_PATH : path;

  const transparentAccountPath =
    isCustomPath(derivationPath) ?
      makeBip44Path(chains.namada.bip44.coinType, derivationPath)
    : undefined;

  const closeCurrentTab = async (): Promise<void> => {
    const tab = await browser.tabs.getCurrent();
    if (tab.id) {
      await browser.tabs.remove(tab.id);
    }
  };

  useEffect(() => {
    if (!alias || !accountSecret || (passwordRequired && !password)) {
      navigate("/");
      return;
    }
  }, []);

  return (
    <>
      <Loading
        status={statusInfo}
        imageUrl="/assets/images/loading.gif"
        visible={status === CompletionStatus.Pending}
      />
      {status === CompletionStatus.Failed && (
        <Alert data-testid="setup-error-alert" type="error">
          {statusInfo}
        </Alert>
      )}
      {status === CompletionStatus.Completed && (
        <>
          <p className="text-white text-center text-base w-full -mt-3 mb-8">
            Here are the accounts generated from your keys
          </p>
          <ViewKeys
            publicKeyAddress={parentAccountStore?.publicKey}
            transparentAccountAddress={parentAccountStore?.address}
            transparentAccountPath={transparentAccountPath}
            shieldedAccountAddress={paymentAddress}
            trimCharacters={35}
            footer={
              <ActionButton
                size="lg"
                data-testid="setup-close-page-btn"
                onClick={closeCurrentTab}
              >
                Finish Setup
              </ActionButton>
            }
          />
        </>
      )}
    </>
  );
};
