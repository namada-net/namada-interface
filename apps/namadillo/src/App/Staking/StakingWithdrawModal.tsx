import {
  ActionButton,
  Modal,
  SkeletonLoading,
  Stack,
} from "@namada/components";
import { WithdrawProps } from "@namada/sdk-multicore";
import { InlineError } from "App/Common/InlineError";
import { ModalContainer } from "App/Common/ModalContainer";
import { NamCurrency } from "App/Common/NamCurrency";
import { TransactionFeeButton } from "App/Common/TransactionFeeButton";
import { defaultAccountAtom } from "atoms/accounts";
import { createWithdrawTxAtom } from "atoms/staking";
import { myValidatorsAtom } from "atoms/validators";
import BigNumber from "bignumber.js";
import { useModalCloseEvent } from "hooks/useModalCloseEvent";
import { useTransaction } from "hooks/useTransaction";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { MyValidator } from "types";
import withdrawalSvg from "./assets/withdrawal.svg";

export const StakingWithdrawModal = (): JSX.Element => {
  const { data: account } = useAtomValue(defaultAccountAtom);
  const { onCloseModal } = useModalCloseEvent();
  const {
    data: myValidators,
    isLoading: isFetchingValidators,
    isSuccess: validatorsDataLoaded,
  } = useAtomValue(myValidatorsAtom);

  const filterWithdrawableValidators = (): MyValidator[] => {
    return (
      myValidators?.filter(
        (entry) =>
          entry.unbondItems.length > 0 && entry.withdrawableAmount?.gt(0)
      ) || []
    );
  };

  const parseWithdrawParams = (): WithdrawProps[] => {
    if (!account?.address) return [];

    const withdrawableValidators = filterWithdrawableValidators();
    if (withdrawableValidators.length === 0) return [];

    return withdrawableValidators.map((myValidator) => {
      return {
        validator: myValidator.validator.address,
        source: account?.address,
      };
    });
  };

  const {
    execute: withdraw,
    isEnabled: withdrawTxEnabled,
    isPending: withdrawIsPending,
    error: withdrawError,
    feeProps: withdrawFees,
  } = useTransaction({
    params: parseWithdrawParams(),
    createTxAtom: createWithdrawTxAtom,
    eventType: "Withdraw",
    parsePendingTxNotification: () => ({
      title: "Withdrawal transaction is in progress",
      description: <>Your unbonded amount withdrawal is being processed</>,
    }),
    onBroadcasted: () => {
      onCloseModal();
    },
  });

  const totalWithdrawableAmount = useMemo(() => {
    const validators = filterWithdrawableValidators();
    return validators.reduce((acc, validator) => {
      return acc.plus(validator.withdrawableAmount || BigNumber(0));
    }, BigNumber(0));
  }, [myValidators]);

  return (
    <Modal onClose={onCloseModal}>
      <ModalContainer
        header="Withdraw Unbonded NAM"
        onClose={onCloseModal}
        containerProps={{ className: "md:!w-[540px] md:!h-[auto]" }}
        contentProps={{ className: "flex" }}
      >
        <Stack
          gap={8}
          className="bg-black pt-14 pb-12 px-8 rounded-md flex-1 max-w-full"
        >
          <Stack gap={2} className="items-center ">
            <img src={withdrawalSvg} alt="" className="w-22 mx-auto" />
            <div>
              {isFetchingValidators && (
                <SkeletonLoading width="200px" height="40px" />
              )}
              {validatorsDataLoaded && (
                <NamCurrency
                  className="text-4xl"
                  amount={totalWithdrawableAmount}
                />
              )}
            </div>
          </Stack>
          <Stack gap={3}>
            <ActionButton
              outlineColor="pink"
              textColor="pink"
              onClick={async () => await withdraw()}
              disabled={
                totalWithdrawableAmount.eq(0) ||
                !withdrawTxEnabled ||
                withdrawIsPending
              }
              type="button"
            >
              {withdrawIsPending ? "Processing..." : "Withdraw"}
            </ActionButton>
            <TransactionFeeButton feeProps={withdrawFees} />
            {withdrawError && (
              <div className="text-center mt-4 max-w-full whitespace-break-spaces">
                <InlineError errorMessage={withdrawError?.message} />
              </div>
            )}
          </Stack>
        </Stack>
      </ModalContainer>
    </Modal>
  );
};
