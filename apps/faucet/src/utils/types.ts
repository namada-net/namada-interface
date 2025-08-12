export type PowChallenge = {
  challenge: string;
  difficulty: number;
};

export type ChallengeResponse = {
  challenge: string;
  tag: string;
};

export type SettingsResponse = {
  difficulty: number;
  chain_id: string;
  start_at: number;
  tokens_alias_to_address: Record<string, string>;
  withdraw_limit: number;
};

export type TransferDetails = {
  target: string;
  token: string;
  amount: number;
};

export type Data = {
  solution: string;
  tag: string;
  challenge: unknown;
  transfer: TransferDetails;
  captcha_token?: string;
};

export type TransferResponse = {
  amount: number;
  sent: boolean;
  target: string;
  token: string;
};

export type ErrorResponse = {
  code: number;
  message: string;
};
