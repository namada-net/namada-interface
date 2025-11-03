import { getChainFromAddress } from "integrations/utils";
import { Address } from "types";

export const getAddressLabel = (
  address: Address,
  type: "transparent" | "shielded" | "ibc"
): string => {
  switch (type) {
    case "transparent":
      return "Namada Transparent";
    case "shielded":
      return "Namada Shielded";
    case "ibc":
      const chain = getChainFromAddress(address);
      return chain?.pretty_name || chain?.chain_name || "IBC Address";
  }
};
