import { GasPriceTable } from "atoms/fees";
import BigNumber from "bignumber.js";
import { findCheapestToken } from "./findCheapestToken";

describe("findCheapestToken", () => {
  const tokenA = { address: "0xTokenA" };
  const tokenB = { address: "0xTokenB" };
  const tokenC = { address: "0xTokenC" };

  const gasLimit = new BigNumber(1000);

  it("returns the token with the cheapest gas price in USD and sufficient balance", () => {
    const gasPriceTable = [
      {
        token: tokenA,
        gasPriceInMinDenom: new BigNumber(2),
      },
      {
        token: tokenB,
        gasPriceInMinDenom: new BigNumber(1),
      },
      {
        token: tokenC,
        gasPriceInMinDenom: new BigNumber(3),
      },
    ] as GasPriceTable;

    const balance = [
      { token: tokenA.address, minDenomAmount: new BigNumber(5000) },
      { token: tokenB.address, minDenomAmount: new BigNumber(5000) },
      { token: tokenC.address, minDenomAmount: new BigNumber(5000) },
    ];

    const gasDollarMap = {
      [tokenA.address]: new BigNumber(2),
      [tokenB.address]: new BigNumber(5),
      [tokenC.address]: new BigNumber(1),
    };

    const result = findCheapestToken(
      gasPriceTable,
      balance,
      gasLimit,
      gasDollarMap
    );
    expect(result).toBe(tokenC.address);
  });

  it("skips cheaper tokens without sufficient balance", () => {
    const gasPriceTable = [
      {
        token: tokenA,
        gasPriceInMinDenom: new BigNumber(1),
      },
      {
        token: tokenB,
        gasPriceInMinDenom: new BigNumber(2),
      },
    ] as GasPriceTable;

    const balance = [
      { token: tokenA.address, minDenomAmount: new BigNumber(500) },
      { token: tokenB.address, minDenomAmount: new BigNumber(5000) },
    ];

    const gasDollarMap = {
      [tokenA.address]: new BigNumber(1),
      [tokenB.address]: new BigNumber(2),
    };

    const result = findCheapestToken(
      gasPriceTable,
      balance,
      gasLimit,
      gasDollarMap
    );
    expect(result).toBe(tokenB.address);
  });

  it("returns undefined when no tokens have sufficient balance", () => {
    const gasPriceTable = [
      {
        token: tokenA,
        gasPriceInMinDenom: new BigNumber(1),
      },
      {
        token: tokenB,
        gasPriceInMinDenom: new BigNumber(2),
      },
    ] as GasPriceTable;

    const balance = [
      { token: tokenA.address, minDenomAmount: new BigNumber(500) },
      { token: tokenB.address, minDenomAmount: new BigNumber(100) },
    ];

    const gasDollarMap = {
      [tokenA.address]: new BigNumber(1),
      [tokenB.address]: new BigNumber(1),
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
      {
        token: tokenA,
        gasPriceInMinDenom: new BigNumber(1),
      },
    ] as GasPriceTable;

    const balance = [
      { token: tokenA.address, minDenomAmount: new BigNumber(5000) },
    ];

    const gasDollarMap = {
      [tokenB.address]: new BigNumber(1),
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
      {
        token: tokenA,
        gasPriceInMinDenom: new BigNumber(2),
      },
      {
        token: tokenB,
        gasPriceInMinDenom: new BigNumber(2),
      },
    ] as GasPriceTable;

    const balance = [
      { token: tokenA.address, minDenomAmount: new BigNumber(5000) },
      { token: tokenB.address, minDenomAmount: new BigNumber(5000) },
    ];

    const gasDollarMap = {
      [tokenA.address]: new BigNumber(2),
      [tokenB.address]: new BigNumber(1),
    };

    const result = findCheapestToken(
      gasPriceTable,
      balance,
      gasLimit,
      gasDollarMap
    );
    expect(result).toBe(tokenB.address);
  });

  it("returns the correct token when dollar values are equal but gas prices differ", () => {
    const gasPriceTable = [
      {
        token: tokenA,
        gasPriceInMinDenom: new BigNumber(2),
      },
      {
        token: tokenB,
        gasPriceInMinDenom: new BigNumber(3),
      },
    ] as GasPriceTable;

    const balance = [
      { token: tokenA.address, minDenomAmount: new BigNumber(5000) },
      { token: tokenB.address, minDenomAmount: new BigNumber(5000) },
    ];

    const gasDollarMap = {
      [tokenA.address]: new BigNumber(2),
      [tokenB.address]: new BigNumber(2),
    };

    const result = findCheapestToken(
      gasPriceTable,
      balance,
      gasLimit,
      gasDollarMap
    );
    expect(result).toBe(tokenA.address);
  });
});
