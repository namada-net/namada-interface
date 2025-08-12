import BigNumber from "bignumber.js";
import { sanitize } from "isomorphic-dompurify";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  ActionButton,
  Alert,
  AmountInput,
  Input,
  Option,
  Select,
} from "@namada/components";
import { Account, AccountType } from "@namada/types";
import { bech32mValidation, shortenAddress } from "@namada/utils";

import { chains } from "@namada/chains";
import { useUntil } from "@namada/hooks";
import { Namada } from "@namada/integrations";
import { Data, PowChallenge, TransferResponse } from "../utils";
import { AppContext } from "./App";
import {
  ButtonContainer,
  InfoContainer,
  InputContainer,
} from "./App.components";
import {
  FaucetFormContainer,
  FormStatus,
  PreFormatted,
} from "./Faucet.components";

declare global {
  interface Window {
    turnstile: {
      ready: (cb: () => void) => void;
      execute: (container: string, params: { sitekey: string; callback: (token: string) => void; "error-callback": (errorCode: string) => void }) => void;
      reset: (container: string) => void;
    };
  }
}

enum Status {
  PendingPowSolution,
  PendingTransfer,
  Completed,
  Error,
}

type Props = {
  isTestnetLive: boolean;
};

const bech32mPrefix = "tnam";

enum ExtensionAttachStatus {
  PendingDetection,
  NotInstalled,
  Installed,
}

export const FaucetForm: React.FC<Props> = ({ isTestnetLive }) => {
  const {
    api,
    settings: { difficulty, tokens, withdrawLimit },
  } = useContext(AppContext)!;
  const [extensionAttachStatus, setExtensionAttachStatus] = useState(
    ExtensionAttachStatus.PendingDetection
  );
  const [isExtensionConnected, setIsExtensionConnected] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const accountLookup = accounts.reduce(
    (acc, account) => {
      acc[account.address] = account;
      return acc;
    },
    {} as Record<string, Account>
  );

  const chain = chains.namada;
  const integration = new Namada(chain);
  const [account, setAccount] = useState<Account>();
  const [accountsSelectData, setAccountsSelectData] = useState<
    Option<string>[]
  >([]);
  const [target, setTarget] = useState<string>();
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState(Status.Completed);
  const [statusText, setStatusText] = useState<string>();
  const [responseDetails, setResponseDetails] = useState<TransferResponse>();

  const powSolver: Worker = useMemo(
    () => new Worker(new URL("../workers/powWorker.ts", import.meta.url)),
    []
  );

  useEffect(() => {
    if (accounts) {
      setAccountsSelectData(
        accounts.map(({ alias, address }) => ({
          label: `${alias} - ${shortenAddress(address)}`,
          value: address,
        }))
      );
      setAccount(accounts[0]);
    }
  }, [accounts]);

  useEffect(() => {
    if (tokens?.NAM) {
      setTokenAddress(tokens.NAM);
    }
  }, [tokens]);

  const isFormValid: boolean =
    Boolean(tokenAddress) &&
    Boolean(amount) &&
    (amount || 0) <= withdrawLimit &&
    Boolean(target) &&
    status !== Status.PendingPowSolution &&
    status !== Status.PendingTransfer &&
    typeof difficulty !== "undefined" &&
    isTestnetLive;

  const submitFaucetTransfer = async (submitData: Data): Promise<void> => {
    try {
      setStatus(Status.PendingTransfer);
      const response = await api.submitTransfer(submitData).catch((e) => {
        console.info(e);
        const { code, message } = e;
        throw new Error(`Unable to submit transfer: ${code} ${message}`);
      });

      if (response.sent) {
        // Reset form if successful
        setAmount(0);
        setError(undefined);
        setStatus(Status.Completed);
        setStatusText("Transfer succeeded!");
        setResponseDetails(response);
        return;
      }
      setStatus(Status.Completed);
      setStatusText("Transfer did not succeed.");
      console.info(response);
    } catch (e) {
      setError(`${e}`);
      setStatus(Status.Error);
    }
  };

  const postPowChallenge = (powChallenge: PowChallenge): Promise<string> =>
    new Promise((resolve) => {
      powSolver.onmessage = ({ data }) => {
        resolve(data);
        powSolver.onmessage = null;
      };
      powSolver.postMessage(powChallenge);
    });

  const handleSubmit = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (
        !target ||
        !amount ||
        !tokenAddress ||
        typeof difficulty === "undefined"
      ) {
        console.error("Please provide the required values!");
        return;
      }

      // Validate target and token inputs
      const sanitizedToken = sanitize(tokenAddress);

      if (!sanitizedToken) {
        setStatus(Status.Error);
        setError("Invalid token address!");
        return;
      }

      if (!target) {
        setStatus(Status.Error);
        setError("No target specified!");
        return;
      }

      if (!bech32mValidation(bech32mPrefix, sanitizedToken)) {
        setError("Invalid bech32m address for token address!");
        setStatus(Status.Error);
        return;
      }

      setStatus(Status.PendingPowSolution);
      setStatusText(undefined);

      try {
        const { challenge, tag } = await api.challenge().catch(({ message, code }) => {
          throw new Error(`Unable to request challenge: ${code} - ${message}`);
        });

        const solution = await postPowChallenge({ challenge, difficulty });

        const token = await new Promise<string>((resolve, reject) => {
          if (window.turnstile) {
            window.turnstile.execute("turnstile-widget", {
              sitekey: process.env.NAMADA_INTERFACE_TURNSTILE_SITEKEY || "", // Replace with actual sitekey
              callback: (t: string) => resolve(t),
              "error-callback": (errorCode: string) => reject(new Error(`Turnstile error: ${errorCode}`)),
            });
          } else {
            reject(new Error("Turnstile not loaded"));
          }
        });

        const submitData: Data = {
          solution,
          tag,
          challenge,
          transfer: {
            target,
            token: sanitizedToken,
            amount: amount * 1_000_000,
          },
          captcha_token: token,
        };

        await submitFaucetTransfer(submitData);
      } catch (e) {
        setError(`${e}`);
        setStatus(Status.Error);
      }
    },
    [account, tokenAddress, amount]
  );

  useUntil(
    {
      predFn: async () => Promise.resolve(integration.detect()),
      onSuccess: () => {
        setExtensionAttachStatus(ExtensionAttachStatus.Installed);
      },
      onFail: () => {
        setExtensionAttachStatus(ExtensionAttachStatus.NotInstalled);
      },
    },
    { tries: 5, ms: 300 },
    [integration]
  );

  const handleConnectExtensionClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
      e.preventDefault();
      if (integration) {
        try {
          const isIntegrationDetected = integration.detect();

          if (!isIntegrationDetected) {
            throw new Error("Extension not installed!");
          }

          await integration.connect();
          const accounts = await integration.accounts();
          if (accounts) {
            setAccounts(
              accounts.filter(
                (account) => account.type !== AccountType.ShieldedKeys
              )
            );
          }
          setIsExtensionConnected(true);
        } catch (e) {
          console.error(e);
        }
      }
    },
    [integration]
  );

  useEffect(() => {
    if (account) {
      setTarget(account.address);
    }
  }, [account]);

  return (
    <FaucetFormContainer>
      <InputContainer>
        {account && accounts.length && (
          <Select
            data={accountsSelectData}
            value={account.address}
            label="Target"
            onChange={(e) => setAccount(accountLookup[e.target.value])}
          />
        )}
      </InputContainer>

      <InputContainer>
        <Input
          label="Target Address"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          autoFocus={true}
        />
      </InputContainer>

      {extensionAttachStatus === ExtensionAttachStatus.Installed &&
        !isExtensionConnected && (
          <InputContainer>
            <ActionButton onClick={handleConnectExtensionClick}>
              Load Accounts from Extension
            </ActionButton>
          </InputContainer>
        )}

      <InputContainer>
        <Input
          label="Token Address (defaults to NAM)"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
        />
      </InputContainer>

      <InputContainer>
        <AmountInput
          placeholder={`From 1 to ${withdrawLimit}`}
          label="Amount"
          value={amount === undefined ? undefined : new BigNumber(amount)}
          min={0}
          maxDecimalPlaces={3}
          onChange={(e) => setAmount(e.target.value?.toNumber())}
          error={
            amount && amount > withdrawLimit ?
              `Amount must be less than or equal to ${withdrawLimit}`
              : ""
          }
        />
      </InputContainer>

      {status !== Status.Error && (
        <FormStatus>
          {status === Status.PendingPowSolution && (
            <InfoContainer>
              <Alert type="warning">Computing POW Solution...</Alert>
            </InfoContainer>
          )}
          {status === Status.PendingTransfer && (
            <InfoContainer>
              <Alert type="warning">Processing Faucet Transfer..</Alert>
            </InfoContainer>
          )}
          {status === Status.Completed && statusText && (
            <InfoContainer>
              <Alert type="info">{statusText}</Alert>
            </InfoContainer>
          )}

          {responseDetails &&
            status !== Status.PendingPowSolution &&
            status !== Status.PendingTransfer && (
              <PreFormatted>
                {JSON.stringify(responseDetails, null, 2)}
              </PreFormatted>
            )}
        </FormStatus>
      )}
      {status === Status.Error && <Alert type="error">{error}</Alert>}

      <ButtonContainer>
        <ActionButton
          backgroundHoverColor="yellow"
          textHoverColor="black"
          outlineColor="yellow"
          className={`max-w-fit ${!isFormValid && "opacity-50"}`}
          color="cyan"
          onClick={handleSubmit}
          disabled={!isFormValid}
        >
          Get Testnet Tokens
        </ActionButton>
      </ButtonContainer>
      <div id="turnstile-widget"></div>
    </FaucetFormContainer>
  );
};
