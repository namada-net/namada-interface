import { createContext, useEffect, useState } from "react";
import { GoGear } from "react-icons/go";
import dotsBackground from "../../public/bg-dots.svg";

import { Alert, Modal } from "@namada/components";

import {
  AppContainer,
  BackgroundImage,
  BottomSection,
  ContentContainer,
  FaucetContainer,
  InfoContainer,
  SettingsButton,
  SettingsButtonContainer,
  TopSection,
} from "App/App.components";
import { FaucetForm } from "App/Faucet";

import { Config } from "config";
import { API, toNam } from "utils";
import {
  AppBanner,
  AppHeader,
  CallToActionCard,
  CardsContainer,
  Faq,
} from "./Common";
import { SettingsForm } from "./SettingsForm";

const runFullNodeUrl = "https://docs.namada.net/operators/ledger";
const becomeBuilderUrl = "https://docs.namada.net/integrating-with-namada";

type Settings = {
  difficulty?: number;
  tokens?: Record<string, string>;
  startsAt: number;
  startsAtText?: string;
  withdrawLimit: number;
};

type AppContext = {
  baseUrl: string;
  settingsError?: string;
  api: API;
  isTestnetLive: boolean;
  settings: Settings;
  setApi: (api: API) => void;
  setUrl: (url: string) => void;
  setIsModalOpen: (value: boolean) => void;
};

const START_TIME_UTC = 1702918800;
const START_TIME_TEXT = new Date(START_TIME_UTC * 1000).toLocaleString(
  "en-gb",
  {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }
);

export const FaucetAppContext = createContext<AppContext | null>(null);

type Props = {
  config: Config;
};

export const FaucetApp = ({ config }: Props): JSX.Element => {
  const { limit, base_url: baseUrl } = config;

  const [isTestnetLive, setIsTestnetLive] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    startsAt: START_TIME_UTC,
    startsAtText: `${START_TIME_TEXT} UTC`,
    withdrawLimit: toNam(limit),
  });
  const [url, setUrl] = useState(localStorage.getItem("baseUrl") || baseUrl);
  const [api, setApi] = useState<API>(new API(url));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settingsError, setSettingsError] = useState<string>();

  const fetchSettings = async (api: API): Promise<void> => {
    const {
      difficulty,
      tokens_alias_to_address: tokens,
      withdraw_limit: withdrawLimit = limit,
    } = await api.settings().catch((e) => {
      const message = e.errors?.message;
      setSettingsError(`Error requesting settings: ${message?.join(" ")}`);
      throw new Error(e);
    });
    // Append difficulty level and tokens to settings
    setSettings({
      ...settings,
      difficulty,
      tokens,
      withdrawLimit: toNam(withdrawLimit),
    });
  };

  useEffect(() => {
    // Sync url to localStorage
    localStorage.setItem("baseUrl", url);
    const api = new API(url);
    setApi(api);
    const { startsAt } = settings;
    const now = new Date();
    const nowUTC = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes()
    );
    const startsAtToMilliseconds = startsAt * 1000;
    if (nowUTC < startsAtToMilliseconds) {
      setIsTestnetLive(false);
    }

    // Fetch settings from faucet API
    fetchSettings(api)
      .then(() => setSettingsError(undefined))
      .catch((e) => setSettingsError(`Failed to load settings! ${e}`));
  }, [url]);

  return (
    <FaucetAppContext.Provider
      value={{
        api,
        isTestnetLive,
        baseUrl: url,
        settingsError,
        settings,
        setApi,
        setUrl,
        setIsModalOpen,
      }}
    >
      <AppBanner />
      <BackgroundImage imageUrl={dotsBackground} />
      <AppContainer>
        <ContentContainer>
          <SettingsButtonContainer>
            <SettingsButton
              onClick={() => setIsModalOpen(true)}
              title="Settings"
            >
              <GoGear />
            </SettingsButton>
          </SettingsButtonContainer>

          <TopSection>
            <AppHeader />
          </TopSection>
          <FaucetContainer>
            {settingsError && (
              <InfoContainer>
                <Alert type="error">{settingsError}</Alert>
              </InfoContainer>
            )}

            <FaucetForm isTestnetLive={isTestnetLive} />
          </FaucetContainer>
          {isModalOpen && (
            <Modal onClose={() => setIsModalOpen(false)}>
              <SettingsForm />
            </Modal>
          )}
          <BottomSection>
            <CardsContainer>
              <CallToActionCard
                description="Contribute to the Namada network's resiliency"
                title="RUN A FULL NODE"
                href={runFullNodeUrl}
              />
              <CallToActionCard
                description="Integrate Namada into applications or extend its capabilities"
                title="BECOME A BUILDER"
                href={becomeBuilderUrl}
              />
            </CardsContainer>
            <Faq />
          </BottomSection>
        </ContentContainer>
      </AppContainer>
    </FaucetAppContext.Provider>
  );
};
