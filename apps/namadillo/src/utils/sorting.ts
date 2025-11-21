import BigNumber from "bignumber.js";
import { SortedColumnPair } from "types";

export const compareBigNumbers = (
  n1: BigNumber | undefined,
  n2: BigNumber | undefined,
  isDescending: boolean
): number => {
  if (n1 === undefined && n2 === undefined) return 0;
  if (!n1) return isDescending ? -1 : 1;
  if (!n2) return isDescending ? 1 : -1;
  return isDescending ? n1.minus(n2).toNumber() : n2.minus(n1).toNumber();
};

export const compareStrings = (
  str1: string,
  str2: string,
  isDescending: boolean
): number => {
  return isDescending ? str1.localeCompare(str2) : str2.localeCompare(str1);
};

const compareNumbers = (
  a: number,
  b: number,
  isDescending: boolean
): number => {
  if (a > b) return isDescending ? 1 : -1;
  if (a < b) return isDescending ? -1 : 1;
  return 0;
};

export const sortCollection = <T, S extends keyof T>(
  collection: T[],
  sortablePair?: SortedColumnPair<S>
): T[] => {
  if (collection.length === 0 || !sortablePair) return collection;

  const [key, sortOrder] = sortablePair;
  const isDescending = sortOrder === "desc";

  return collection.sort((a: T, b: T) => {
    const aValue = a[key];
    const bValue = b[key];

    if (aValue instanceof BigNumber && bValue instanceof BigNumber) {
      return compareBigNumbers(aValue, bValue, isDescending);
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      return compareNumbers(aValue, bValue, isDescending);
    } else if (typeof aValue === "string" && typeof bValue === "string") {
      return compareStrings(aValue, bValue, isDescending);
    }

    return 0;
  });
};
