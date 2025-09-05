import { GasPriceTable } from "atoms/fees";
import BigNumber from "bignumber.js";
import { findCheapestToken } from "./findCheapestToken";

describe("findCheapestToken", () => {
  const tokenA = "0xTokenA";
  const tokenB = "0xTokenB";
  const tokenC = "0xTokenC";

  const gasLimit = new BigNumber(1000);

  it("returns the token with the cheapest gas price in USD and sufficient balance", () => {
    const gasPriceTable = [
      { token: tokenA, gasPriceInMinDenom: new BigNumber(2) },
      { token: tokenB, gasPriceInMinDenom: new BigNumber(1) },
      { token: tokenC, gasPriceInMinDenom: new BigNumber(3) },
    ] as GasPriceTable;

    const balance = [
      { token: tokenA, minDenomAmount: new BigNumber(5000) },
      { token: tokenB, minDenomAmount: new BigNumber(5000) },
      { token: tokenC, minDenomAmount: new BigNumber(5000) },
    ];

    const gasDollarMap = {
      [tokenA]: new BigNumber(2),
      [tokenB]: new BigNumber(5),
      [tokenC]: new BigNumber(1),
    };

    const result = findCheapestToken(
      gasPriceTable,
      balance,
      gasLimit,
      gasDollarMap
    );
    expect(result).toBe(tokenC);
  });

  it("skips cheaper tokens without sufficient balance", () => {
    const gasPriceTable = [
      { token: tokenA, gasPriceInMinDenom: new BigNumber(1) },
      { token: tokenB, gasPriceInMinDenom: new BigNumber(2) },
    ] as GasPriceTable;

    const balance = [
      { token: tokenA, minDenomAmount: new BigNumber(500) },
      { token: tokenB, minDenomAmount: new BigNumber(5000) },
    ];

    const gasDollarMap = {
      [tokenA]: new BigNumber(1),
      [tokenB]: new BigNumber(2),
    };

    const result = findCheapestToken(
      gasPriceTable,
      balance,
      gasLimit,
      gasDollarMap
    );
    expect(result).toBe(tokenB);
  });

  it("returns undefined when no tokens have sufficient balance", () => {
    const gasPriceTable = [
      { token: tokenA, gasPriceInMinDenom: new BigNumber(1) },
      { token: tokenB, gasPriceInMinDenom: new BigNumber(2) },
    ] as GasPriceTable;

    const balance = [
      { token: tokenA, minDenomAmount: new BigNumber(500) },
      { token: tokenB, minDenomAmount: new BigNumber(100) },
    ];

    const gasDollarMap = {
      [tokenA]: new BigNumber(1),
      [tokenB]: new BigNumber(1),
    };

    const result = findCheapestToken(
      gasPriceTable,
      balance,
      gasLimit,
      gasDollarMap
    );
    expect(result).toBeUndefined();
  });

  it("returns undefined when gasDollarMap is missing entries", () => {
    const gasPriceTable = [
      { token: tokenA, gasPriceInMinDenom: new BigNumber(1) },
    ] as GasPriceTable;

    const balance = [{ token: tokenA, minDenomAmount: new BigNumber(5000) }];

    const gasDollarMap = {
      [tokenB]: new BigNumber(1),
    };

    const result = findCheapestToken(
      gasPriceTable,
      balance,
      gasLimit,
      gasDollarMap
    );
    expect(result).toBeUndefined();
  });

  it("returns the correct token when gas prices are equal but dollar values differ", () => {
    const gasPriceTable = [
      { token: tokenA, gasPriceInMinDenom: new BigNumber(2) },
      { token: tokenB, gasPriceInMinDenom: new BigNumber(2) },
    ] as GasPriceTable;

    const balance = [
      { token: tokenA, minDenomAmount: new BigNumber(5000) },
      { token: tokenB, minDenomAmount: new BigNumber(5000) },
    ];

    const gasDollarMap = {
      [tokenA]: new BigNumber(2),
      [tokenB]: new BigNumber(1),
    };

    const result = findCheapestToken(
      gasPriceTable,
      balance,
      gasLimit,
      gasDollarMap
    );
    expect(result).toBe(tokenB);
  });

  it("returns the correct token when dollar values are equal but gas prices differ", () => {
    const gasPriceTable = [
      { token: tokenA, gasPriceInMinDenom: new BigNumber(2) },
      { token: tokenB, gasPriceInMinDenom: new BigNumber(3) },
    ] as GasPriceTable;

    const balance = [
      { token: tokenA, minDenomAmount: new BigNumber(5000) },
      { token: tokenB, minDenomAmount: new BigNumber(5000) },
    ];

    const gasDollarMap = {
      [tokenA]: new BigNumber(2),
      [tokenB]: new BigNumber(2),
    };

    const result = findCheapestToken(
      gasPriceTable,
      balance,
      gasLimit,
      gasDollarMap
    );
    expect(result).toBe(tokenA);
  });
});
