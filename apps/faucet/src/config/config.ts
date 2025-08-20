import toml from "toml";
import { Config } from "./types";

export const DEFAULT_BASE_URL = "http://localhost:5000";
export const DEFAULT_ENDPOINT = "/api/v1/faucet";
export const DEFAULT_LIMIT = 1_000_000_000;
export const DEFAULT_URL = `${DEFAULT_BASE_URL}${DEFAULT_ENDPOINT}`;

const {
  NAMADA_INTERFACE_PROXY: isProxied,
  NAMADA_INTERFACE_PROXY_PORT: proxyPort = 9000,
} = process.env;

export const getConfig = async (): Promise<Config> => {
  const response = await fetch("/config.toml");
  if (response.ok) {
    const {
      base_url = DEFAULT_BASE_URL,
      endpoint = DEFAULT_ENDPOINT,
      limit = DEFAULT_LIMIT,
    } = toml.parse(await response.text());
    const baseUrl = localStorage.getItem("baseUrl") || base_url;
    const url =
      isProxied ?
        `http://localhost:${proxyPort}/proxy`
      : `${baseUrl}${endpoint}`;
    return {
      base_url: baseUrl,
      endpoint,
      url,
      limit,
    };
  } else {
    return {
      base_url: DEFAULT_BASE_URL,
      endpoint: DEFAULT_ENDPOINT,
      url: DEFAULT_URL,
      limit: DEFAULT_LIMIT,
    };
  }
};
