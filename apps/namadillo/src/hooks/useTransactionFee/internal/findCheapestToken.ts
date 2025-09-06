import BigNumber from "bignumber.js";

import { GasPriceTable } from "atoms/fees";
import { Address } from "types";

export const findCheapestToken = (
  gasPriceTable: GasPriceTable,
  balance: { token: Address; minDenomAmount: BigNumber }[],
  gasLimit: BigNumber,
  gasDollarMap: Record<Address, BigNumber>
): string | undefined => {
  let minPriceInDollars: BigNumber | undefined,
    cheapestToken: string | undefined;

  for (const gasItem of gasPriceTable) {
    const price = gasDollarMap[gasItem.token.address];
    if (!price) continue;

    // Skip tokens that do not have enough balance
    const requiredBalance = BigNumber(gasLimit).times(
      gasItem.gasPriceInMinDenom
    );
    const tokenBalance = balance.find(
      (balance) => balance.token === gasItem.token.address
    );

    if (!tokenBalance || tokenBalance.minDenomAmount.lt(requiredBalance)) {
      continue;
    }

    // This is not real price as we multiply price in dollar by gas price in MIN denom
    // It's ok though as we use it only for comparison
    const gasPriceInDollars = price.multipliedBy(gasItem.gasPriceInMinDenom);
    if (
      typeof minPriceInDollars === "undefined" ||
      gasPriceInDollars.lt(minPriceInDollars)
    ) {
      minPriceInDollars = gasPriceInDollars;
      cheapestToken = gasItem.token.address;
    }
  }

  return cheapestToken;
};
