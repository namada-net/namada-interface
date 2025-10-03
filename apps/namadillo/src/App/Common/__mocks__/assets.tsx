import { Asset } from "types";

export const assetMock: Asset = {
  description:
    "Ethereum is a decentralized blockchain platform for running smart contracts and dApps, with Ether (ETH) as its native cryptocurrency, enabling a versatile ecosystem beyond just digital currency.",
  extended_description:
    "Ethereum, symbolized as ETH, is a groundbreaking cryptocurrency and blockchain platform introduced in 2015 by a team led by Vitalik Buterin. Unlike Bitcoin, which primarily serves as a digital currency, Ethereum is designed to be a decentralized platform for running smart contracts and decentralized applications (dApps). These smart contracts are self-executing contracts with the terms directly written into code, enabling trustless and automated transactions without intermediaries. Ethereum's blockchain can host a wide variety of applications, from financial services to gaming, making it a versatile and powerful tool in the world of blockchain technology.\n\nOne of the most notable features of Ethereum is its native cryptocurrency, Ether (ETH), which is used to pay for transaction fees and computational services on the network. Ethereum has also been the backbone for the explosive growth of decentralized finance (DeFi), which seeks to recreate traditional financial systems with blockchain-based alternatives. Additionally, Ethereum is undergoing a significant upgrade known as Ethereum 2.0, which aims to improve scalability, security, and energy efficiency through a shift from proof-of-work (PoW) to proof-of-stake (PoS) consensus mechanisms. This transition is expected to enhance the network's performance and reduce its environmental impact, further solidifying Ethereum's position as a leading platform in the blockchain ecosystem.",
  denom_units: [
    {
      denom: "wei",
      exponent: 0,
    },
    {
      denom: "gwei",
      exponent: 9,
    },
    {
      denom: "eth",
      exponent: 18,
      aliases: ["ether"],
    },
  ],
  type_asset: "evm-base",
  base: "wei",
  name: "Ethereum",
  display: "eth",
  symbol: "ETH",
  address: "tnam1qzwhl0u4kjj869q55k44n7jl69u5c2gv9sejtwqk",
  logo_URIs: {
    svg: "https://example.com/eth-icon.png",
  },
  coingecko_id: "ethereum",
  images: [
    {
      png: "https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ethereum/images/eth-white.png",
      svg: "https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ethereum/images/eth-white.svg",
      theme: {
        primary_color_hex: "#303030",
      },
    },
  ],
};

export const assetMock2: Asset = {
  description:
    'Bitcoin, the first and most well-known cryptocurrency, allows decentralized peer-to-peer transactions on a secure blockchain network, serving as "digital gold."',
  extended_description:
    'Bitcoin, often referred to as BTC, is the first and most well-known cryptocurrency, introduced in 2009 by an anonymous entity known as Satoshi Nakamoto. It was designed as a decentralized digital currency, allowing peer-to-peer transactions without the need for a central authority or intermediary. Bitcoin operates on a technology called blockchain, a distributed ledger that records all transactions across a network of computers. The security and integrity of the blockchain are maintained through a process called mining, where participants solve complex mathematical problems to validate and add new transactions to the blockchain. Bitcoin\'s decentralized nature and limited supply, capped at 21 million coins, have contributed to its status as "digital gold" and a store of value.\n\nBitcoin has significantly influenced the financial world, inspiring the development of thousands of other cryptocurrencies and blockchain technologies. Its adoption has grown over the years, with numerous merchants and service providers accepting it as a payment method. Additionally, Bitcoin has become a popular investment asset, attracting both individual and institutional investors. Despite its volatility and regulatory challenges, Bitcoin remains a dominant force in the crypto space, symbolizing the potential for a more open and inclusive financial system. Its impact extends beyond finance, as it continues to drive innovation in areas such as decentralized finance (DeFi), supply chain management, and digital identity verification.',
  denom_units: [
    {
      denom: "sat",
      exponent: 0,
    },
    {
      denom: "btc",
      exponent: 8,
    },
  ],
  type_asset: "bitcoin-like",
  base: "sat",
  name: "Bitcoin",
  display: "btc",
  symbol: "BTC",
  address: "tnam1qpzxm7chztek5zch82uf68d5zawutjjhu5qq7hdq",
  logo_URIs: { svg: "btc.svg" },
  coingecko_id: "bitcoin",
  images: [
    {
      svg: "https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/bitcoin/images/btc.svg",
      png: "https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/bitcoin/images/btc.png",
      theme: {
        primary_color_hex: "#f4941c",
        background_color_hex: "#f4941c",
        circle: true,
      },
    },
  ],
};

export const assetMockList: Asset[] = [assetMock, assetMock2];
export const assetWithoutLogo: Asset = { ...assetMock, logo_URIs: {} };
