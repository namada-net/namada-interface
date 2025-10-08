import BigNumber from "bignumber.js";
import { RedelegateChange, Validator } from "types";

export const getTopValidatorsAddresses = (
  validators: Validator[],
  topNumber = 10
): string[] => {
  return validators
    .sort((v1: Validator, v2: Validator): number => {
      if (!v1.votingPowerInNAM) return -1;
      if (!v2.votingPowerInNAM) return 1;
      return v1.votingPowerInNAM.gt(v2.votingPowerInNAM) ? -1 : 1;
    })
    .slice(0, topNumber)
    .map((validator) => validator.address);
};

const buildRedelegateChange = (
  sourceValidator: string,
  destinationValidator: string,
  amount: BigNumber
): RedelegateChange => ({ sourceValidator, destinationValidator, amount });

export const getAmountDistribution = (
  _reducedAmounts: Record<string, BigNumber>,
  _increasedAmounts: Record<string, BigNumber>
): RedelegateChange[] => {
  const redelegateChanges: RedelegateChange[] = [];
  const reducedAmounts = { ..._reducedAmounts };
  const increasedAmounts = { ..._increasedAmounts };

  // If two addresses are present in both objects, fix the assigned amounts
  for (const address in reducedAmounts) {
    if (increasedAmounts.hasOwnProperty(address)) {
      const diff = reducedAmounts[address].minus(increasedAmounts[address]);
      if (diff.eq(0)) {
        delete reducedAmounts[address];
        delete increasedAmounts[address];
        continue;
      }

      if (diff.gt(0)) {
        delete increasedAmounts[address];
        reducedAmounts[address] = diff;
        continue;
      }

      if (diff.lt(0)) {
        delete reducedAmounts[address];
        increasedAmounts[address] = diff.abs();
      }
    }
  }

  const addressesToReduce = Object.keys(reducedAmounts).sort(
    (address1: string, address2: string) =>
      reducedAmounts[address1].gt(reducedAmounts[address2]) ? -1 : 1
  );

  const addressesToIncrement = Object.keys(increasedAmounts).sort(
    (address1: string, address2: string) =>
      increasedAmounts[address1].gt(increasedAmounts[address2]) ? 1 : -1
  );

  for (const addressToReduce of addressesToReduce) {
    let totalToReduce = reducedAmounts[addressToReduce];
    let shift = false;

    for (const addressToIncrement of addressesToIncrement) {
      const increment = increasedAmounts[addressToIncrement];
      const redelegate = buildRedelegateChange.bind(
        null,
        addressToReduce,
        addressToIncrement
      );

      // redelegating a partial of the current source address to another
      if (totalToReduce.gt(increment)) {
        totalToReduce = totalToReduce.minus(increment);
        redelegateChanges.push(redelegate(increment));
        shift = true;
        continue;
      }

      // we're just decreasing the same amount left
      if (totalToReduce.eq(increment)) {
        redelegateChanges.push(redelegate(increment));
        shift = true;
        break;
      }

      // redelegating all we have from the current source address, but we need more.
      redelegateChanges.push(redelegate(totalToReduce));
      increasedAmounts[addressToIncrement] =
        increasedAmounts[addressToIncrement].minus(totalToReduce);
      break;
    }

    if (shift) {
      addressesToIncrement.shift();
    }
  }

  return redelegateChanges;
};
