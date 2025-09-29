export const txKinds = [
  "Bond",
  "Unbond",
  "Redelegate",
  "Withdraw",
  "ClaimRewards",
  "VoteProposal",
  "RevealPk",
  "IbcTransfer",
  "TransparentTransfer",
  "ShieldedTransfer",
  "ShieldingTransfer",
  "UnshieldingTransfer",
  "ShieldedSwap",
  "Unknown",
] as const;

export type TxKind = (typeof txKinds)[number];
