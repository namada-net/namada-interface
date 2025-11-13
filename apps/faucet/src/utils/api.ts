import {
  ChallengeResponse,
  Data,
  ErrorResponse,
  SettingsResponse,
  TransferResponse,
} from "./types";

export const {
  NAMADA_INTERFACE_FAUCET_API_ENDPOINT: endpoint = "/api/v1/faucet",
} = process.env;

export class API {
  constructor(public readonly baseUrl: string) {}

  /**
   * Wrapper for fetch requests to handle ReadableStream response when errors are received from API
   *
   * @param {string} endpoint
   * @param {RequestInit} options
   *
   * @returns Object
   */
  async request<T = unknown>(
    endpoint: string,
    options: RequestInit = { method: "GET" }
  ): Promise<T> {
    return await fetch(this.endpoint(endpoint), {
      ...options,
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        const reader = response?.body?.getReader();
        const errors = reader?.read().then((data): Promise<ErrorResponse> => {
          const response = JSON.parse(
            new TextDecoder().decode(data.value)
          ) as ErrorResponse;
          // If code 429 is received on any request, rate limiting is blocking
          // requests from this IP, so provide a specific message:
          if (response.code === 429) {
            response.message = "Too many requests! Try again in one hour.";
          }
          return Promise.reject(response);
        });
        if (!errors) {
          throw new Error("Unable to parse error response");
        }
        return errors;
      })
      .catch((e) => {
        console.error(e);
        return Promise.reject(e);
      });
  }

  /**
   * Request faucet settings
   *
   * @returns Object
   */
  async settings(): Promise<SettingsResponse> {
    return this.request("/setting");
  }

  /**
   * Request challenge from endpoint url
   *
   * @returns Object
   */
  async challenge(): Promise<ChallengeResponse> {
    return this.request("");
  }

  /**
   * Submit a transfer request
   *
   * @param {Data} data
   * @returns {Object}
   */
  async submitTransfer(data: Data): Promise<TransferResponse> {
    return this.request("", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  private endpoint(path?: string): URL {
    return new URL(`${this.baseUrl}${endpoint}${path ? path : ""}`);
  }
}
