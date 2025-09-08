import {
  ApiV1CrawlersTimestampsGet200ResponseInner,
  ApiV1CrawlersTimestampsGetCrawlerNamesEnum,
  DefaultApi,
  HealthGet200Response,
} from "@namada/indexer-client";
import { isUrlValid } from "@namada/utils";
import toml from "toml";
import { SettingsTomlOptions } from "types";
import { getSdkInstance } from "utils/sdk";

export const getIndexerHealth = async (
  api: DefaultApi
): Promise<HealthGet200Response | undefined> => {
  try {
    const response = await api.healthGet();
    return response.data;
  } catch {
    return;
  }
};

export const getIndexerCrawlerInfo = async (
  api: DefaultApi,
  services?: ApiV1CrawlersTimestampsGetCrawlerNamesEnum[]
): Promise<ApiV1CrawlersTimestampsGet200ResponseInner[] | undefined> => {
  try {
    const response = await api.apiV1CrawlersTimestampsGet(services);
    return response.data;
  } catch {
    return;
  }
};

export const getMaspIndexerHealth = async (
  url: string
  // TODO replace the `HealthGet200Response` by the type returned from
  // the package "@namada/masp-indexer-client" when it is published
): Promise<HealthGet200Response | undefined> => {
  try {
    const response = await fetch(`${url}/health`);
    // Former masp indexers returns the commit hash string instead of json,
    // then we manually check if the returned string is a json-like:
    // - If yes, we convert to json with `JSON.parse()` and return it.
    // - If not, it's the commit hash string, then we manually create a json
    // This is to avoid compatibility issues. We can remove this condition
    // when all hosts update the masp indexer
    const text = await response.text();
    if (text.startsWith("{")) {
      return JSON.parse(text);
    } else {
      return { commit: text, version: "0.0.0" };
    }
  } catch {
    return;
  }
};

export const isRpcAlive = async (url: string): Promise<boolean> => {
  if (!isUrlValid(url)) {
    return false;
  }
  try {
    const response = await fetch(`${url}/health`);
    return response.ok && response.status === 200;
  } catch {
    return false;
  }
};

export const fetchDefaultTomlConfig =
  async (): Promise<SettingsTomlOptions> => {
    const response = await fetch("/config.toml");
    return toml.parse(await response.text()) as SettingsTomlOptions;
  };

export const clearShieldedContext = async (chainId: string): Promise<void> => {
  const sdk = await getSdkInstance();
  await sdk.getMasp().clearShieldedContext(chainId);
};
