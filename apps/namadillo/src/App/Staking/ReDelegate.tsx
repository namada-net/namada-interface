import { ActionButton, Alert, Modal, Panel } from "@namada/components";
import { RedelegateProps } from "@namada/sdk-multicore";
import { Info } from "App/Common/Info";
import { ModalContainer } from "App/Common/ModalContainer";
import { routes } from "App/routes";
import { defaultAccountAtom } from "atoms/accounts";
import { createReDelegateTxAtom } from "atoms/staking";
import { allValidatorsAtom } from "atoms/validators";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useStakeModule } from "hooks/useStakeModule";
import { useTransaction } from "hooks/useTransaction";
import { useAtomValue } from "jotai";
import { getAmountDistribution } from "lib/staking";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { AddressBalance, Validator } from "types";
import { BondingAmountOverview } from "./BondingAmountOverview";
import { ReDelegateAssignStake } from "./ReDelegateAssignStake";
import { ReDelegateRemoveStake } from "./ReDelegateRemoveStake";

export const ReDelegate = (): JSX.Element => {
  const [step, setStep] = useState<"remove" | "assign">("remove");
  const [amountsToAssignByAddress, setAmountToAssignByAddress] =
    useState<AddressBalance>({});
  const { data: account } = useAtomValue(defaultAccountAtom);
  const validators = useAtomValue(allValidatorsAtom);
  const navigate = useNavigate();

  const {
    totalStakedAmount,
    stakedAmountByAddress,
    totalUpdatedAmount: totalToRedelegate,
    updatedAmountByAddress: amountsRemovedByAddress,
    onChangeValidatorAmount,
    myValidators,
  } = useStakeModule({ account });

  const parseRedelegateParams = (): RedelegateProps[] => {
    if (!account?.address) return [];
    return getAmountDistribution(
      amountsRemovedByAddress,
      amountsToAssignByAddress
    ).map(
      (distribution) =>
        ({
          ...distribution,
          owner: account?.address,
        }) as RedelegateProps
    );
  };

  const onCloseModal = (): void => navigate(routes.staking);

  const {
    execute: performRedelegate,
    isPending: isCreatingTx,
    feeProps,
  } = useTransaction({
    createTxAtom: createReDelegateTxAtom,
    eventType: "Redelegate",
    params: parseRedelegateParams(),
    parsePendingTxNotification: () => ({
      title: "Staking redelegation in progress",
      description: <>Your redelegation transaction is being processed</>,
    }),
    onBroadcasted: () => {
      onCloseModal();
    },
  });

  const onAssignAmount = (
    validator: Validator,
    amount: BigNumber | undefined
  ): void => {
    setAmountToAssignByAddress((amounts) => {
      if (amount === undefined) {
        delete amounts[validator.address];
        return { ...amounts };
      }

      return {
        ...amounts,
        [validator.address]: amount,
      };
    });
  };

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    // Go to next page or do nothing
    if (step === "remove" && totalToRedelegate) {
      if (totalToRedelegate.gt(0)) {
        setStep("assign");
      }
      return;
    }
    await performRedelegate();
  };

  const totalAssignedAmounts = BigNumber.sum(
    new BigNumber(0),
    ...Object.values(amountsToAssignByAddress)
  );

  const stepTitle = {
    remove: "Step 1 - Remove NAM from current Validators",
    assign: "Step 2 - Assign Redelegating NAM",
  };

  const totalUpdatedAmount = totalToRedelegate.minus(totalAssignedAmounts);

  return (
    <Modal onClose={onCloseModal}>
      <ModalContainer
        header={
          <span className="flex items-center gap-4">
            {stepTitle[step]}
            <Info>
              You can edit the amounts between validators. You can&apos;t
              increase or reduce the total staked amount, so pay attention to
              the correct distribution.
            </Info>
          </span>
        }
        onClose={onCloseModal}
      >
        <form
          onSubmit={onSubmit}
          className="grid grid-rows-[max-content_auto_max-content] gap-2 h-full"
        >
          <header className="grid grid-cols-[repeat(auto-fit,_minmax(8rem,_1fr))] gap-1.5">
            <BondingAmountOverview
              title="Total amount to redelegate"
              className="col-span-2"
              amountInNam={0}
              updatedAmountInNam={totalUpdatedAmount}
              updatedValueClassList={twMerge(
                clsx("text-yellow", {
                  "text-fail": totalUpdatedAmount.lt(0),
                })
              )}
              extraContent={
                step === "assign" && (
                  <>
                    <Alert
                      type="warning"
                      className="absolute py-3 right-3 top-4 max-w-[50%] text-xs rounded-sm"
                    >
                      To proceed, all redelegated value must be assigned
                    </Alert>
                  </>
                )
              }
            />
            <BondingAmountOverview
              title="Current Stake"
              amountInNam={totalStakedAmount}
            />
            <Panel className="flex items-center h-full justify-center rounded-md">
              <ActionButton
                type="button"
                className="w-32 mx-auto"
                backgroundColor="white"
                backgroundHoverColor="pink"
                size="sm"
                href={routes.stakingBondingUnstake}
              >
                Unstake
              </ActionButton>
            </Panel>
          </header>

          {step === "remove" && (
            <ReDelegateRemoveStake
              onChangeValidatorAmount={onChangeValidatorAmount}
              amountsRemovedByAddress={amountsRemovedByAddress}
              stakedAmountByAddress={stakedAmountByAddress}
              onProceed={() => setStep("assign")}
            />
          )}

          {step === "assign" &&
            validators.isSuccess &&
            myValidators.isSuccess && (
              <ReDelegateAssignStake
                validators={validators.data}
                amountsRemovedByAddress={amountsRemovedByAddress}
                assignedAmountsByAddress={amountsToAssignByAddress}
                stakedAmountByAddress={stakedAmountByAddress}
                totalToRedelegate={totalToRedelegate}
                totalAssignedAmounts={totalAssignedAmounts}
                onChangeAssignedAmount={onAssignAmount}
                isPerformingRedelegation={isCreatingTx}
                redelegateChanges={parseRedelegateParams()}
                feeProps={feeProps}
              />
            )}
        </form>
      </ModalContainer>
    </Modal>
  );
};
