import { TableRow } from "@namada/components";
import { formatPercentage } from "@namada/utils";
import { NamCurrency } from "App/Common/NamCurrency";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useValidatorTableSorting } from "hooks/useValidatorTableSorting";
import { twMerge } from "tailwind-merge";
import { MyValidator, Validator } from "types";
import { AmountField } from "./AmountField";
import { ValidatorCard } from "./ValidatorCard";
import { ValidatorsTable } from "./ValidatorsTable";

type UnstakeBondingTableProps = {
  myValidators: MyValidator[];
  updatedAmountByAddress: Record<string, BigNumber>;
  stakedAmountByAddress: Record<string, BigNumber>;
  onChangeValidatorAmount: (validator: Validator, amount: BigNumber) => void;
};

export const UnstakeBondingTable = ({
  myValidators,
  updatedAmountByAddress,
  stakedAmountByAddress,
  onChangeValidatorAmount,
}: UnstakeBondingTableProps): JSX.Element => {
  const validators = myValidators.map((mv) => mv.validator);

  const { sortableColumns, sortedValidators } = useValidatorTableSorting({
    validators,
    stakedAmountByAddress,
  });

  const headers = [
    { children: "Validator" },
    "Amount to Unstake",
    {
      children: (
        <div key={`unstake-new-total`} className="text-right">
          <span className="block">Stake</span>
          <small className="text-xs text-neutral-500 block">
            New total Stake
          </small>
        </div>
      ),
      ...sortableColumns["stakedAmount"],
    },
    {
      children: (
        <div key={`unstake-voting-power`} className="text-right">
          Voting Power
        </div>
      ),
      ...sortableColumns["stakedAmount"],
    },
    {
      children: (
        <div key={`unstake-commission`} className="text-right">
          Commission
        </div>
      ),
      ...sortableColumns["commission"],
    },
  ];

  const renderRow = (validator: Validator): TableRow => {
    const stakedAmount =
      stakedAmountByAddress[validator.address] ?? new BigNumber(0);

    const amountToUnstake =
      updatedAmountByAddress[validator.address] ?? new BigNumber(0);

    const hasNewAmounts = amountToUnstake.gt(0);
    const newAmount = stakedAmount.minus(amountToUnstake);

    return {
      className: "",
      cells: [
        // Validator Alias + Avatar
        <ValidatorCard
          key={`validator-name-${validator.address}`}
          validator={validator}
          hasStake={true}
        />,

        // Amount Text input
        <div
          key={`bonding-new-amounts-${validator.address}`}
          className="relative"
        >
          <AmountField
            placeholder="Select to decrease stake"
            value={amountToUnstake.eq(0) ? undefined : amountToUnstake}
            updated={hasNewAmounts}
            forceActive={true}
            validator={validator}
            data-validator-input={validator.address}
            hasStakedAmounts={stakedAmountByAddress[validator.address]?.gt(0)}
            onChange={(e) =>
              onChangeValidatorAmount(
                validator,
                e.target.value || new BigNumber(0)
              )
            }
            className={clsx({
              "[&_input]:!border-pink [&_input]:text-pink": hasNewAmounts,
            })}
          />
        </div>,

        <div
          key={`increment-bonding-new-totals-${validator.address}`}
          className="text-right leading-tight"
        >
          <span className="block text-white">
            <NamCurrency amount={stakedAmount} />
          </span>
          {hasNewAmounts && (
            <span
              className={twMerge(
                clsx("text-orange text-sm", {
                  "text-fail": newAmount.lt(0),
                })
              )}
            >
              =
              <NamCurrency amount={newAmount} />
            </span>
          )}
        </div>,

        // Voting Power
        <div
          className="flex flex-col text-right leading-tight"
          key={`validator-voting-power-${validator.address}`}
        >
          {validator.votingPowerInNAM && (
            <NamCurrency amount={validator.votingPowerInNAM} />
          )}
          <span className="text-neutral-600 text-sm">
            {formatPercentage(BigNumber(validator.votingPowerPercentage || 0))}
          </span>
        </div>,

        // Commission
        <div
          key={`commission-${validator.uuid}`}
          className="text-right leading-tight"
        >
          {formatPercentage(validator.commission)}
        </div>,
      ],
    };
  };

  return (
    <ValidatorsTable
      id="increment-unbonding-table"
      tableClassName="mt-2"
      validatorList={sortedValidators}
      headers={headers}
      renderRow={renderRow}
    />
  );
};
