import { Chain } from "@chain-registry/types";
import namadaShieldedSvg from "./assets/namada-shielded.svg";
import namadaTransparentSvg from "./assets/namada-transparent.svg";

export const parseChainInfo = (
  chain?: Chain,
  isShielded?: boolean
): Chain | undefined => {
  if (!chain) return undefined;

  // Includes namadacampfire, namadahousefire, etc.
  if (chain.chain_name.indexOf("namada") === -1) {
    return chain;
  }

  return {
    ...chain,
    pretty_name: isShielded ? "Namada Shielded" : "Namada Transparent",
    logo_URIs: {
      ...chain.logo_URIs,
      svg: isShielded ? namadaShieldedSvg : namadaTransparentSvg,
    },
  };
};

export const isMaspAddress = (address: string): boolean => {
  return (
    address.toLowerCase() === "tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah"
  );
};

export const isShieldedAddress = (address: string): boolean => {
  return address.startsWith("znam") || isMaspAddress(address);
};

export const isTransparentAddress = (address: string): boolean => {
  return address.startsWith("tnam") && address.length === 45;
};

export const isNamadaAddress = (address: string): boolean => {
  return isShieldedAddress(address) || isTransparentAddress(address);
};

export const isIbcAddress = (address: string): boolean =>
  !!address && !isNamadaAddress(address);
