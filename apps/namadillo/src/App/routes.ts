export const routes = {
  root: "/",

  // Staking
  staking: "/staking",
  stakingBondingIncrement: "/staking/bonding/increment",
  stakingBondingRedelegate: "/staking/bonding/redelegate",
  stakingBondingUnstake: "/staking/bonding/unstake",
  stakingClaimRewards: "/staking/claim-rewards",
  stakingWithdrawal: "/staking/withdraw",

  // Governance
  governance: "/governance",
  governanceProposal: "/governance/proposal/:proposalId",
  governanceSubmitVote: "/governance/submit-vote/:proposalId",
  governanceJson: "/governance/json/:proposalId",

  // Masp
  shield: "/shield",
  unshield: "/unshield",
  shieldAssets: "/shield-assets",

  // Ibc
  ibc: "/ibc",
  ibcWithdraw: "/ibc/withdraw",
  ibcShieldAll: "/ibc/shield-all",

  // Transfer
  transfer: "/transfer",
  history: "/history",
  transaction: "/transaction/:hash",
  receive: "/receive",

  // Swap
  swap: "/swap",

  // Settings
  settings: "/settings",
  settingsAdvanced: "/settings/advanced",
  settingsSignArbitrary: "/settings/sign-arbitrary",
  settingsMASP: "/settings/masp",
  settingsLedger: "/settings/ledger",
  settingsFeatures: "/settings/features",

  // Other
  switchAccount: "/switch-account",
  signMessages: "/sign-messages",
  bugReport: "/bug-report",
} as const;

export const params = {
  asset: "asset",
  shielded: "shielded",
} as const;
