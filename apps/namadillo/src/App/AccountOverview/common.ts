import BigNumber from "bignumber.js";
import { TokenBalance } from "types";

// Sorts table data so nam is always on top and then descends by value
// NAM => $5 => $4 => $3 etc
export const sortedTableData = (data: TokenBalance[]): TokenBalance[] => {
  return data.sort((a, b) => {
    const aIsNam = a.asset.symbol === "NAM";
    const bIsNam = b.asset.symbol === "NAM";

    // NAM always will be shown on top
    if (aIsNam !== bIsNam) return aIsNam ? -1 : 1;
    const aValue = BigNumber(a.amount);
    const bValue = BigNumber(b.amount);
    return bValue.comparedTo(aValue);
  });
};
