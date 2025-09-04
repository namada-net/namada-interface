import { Alert, Stack } from "@namada/components";
import BigNumber from "bignumber.js";
import { GoCheckCircle } from "react-icons/go";

export type LedgerAmountInfoAlertProps = {
  calculating: boolean;
  displayWarning: boolean;
  amount: BigNumber;
};
export const LedgerAmountInfoAlert = (
  props: LedgerAmountInfoAlertProps
): JSX.Element => {
  const { calculating, displayWarning, amount } = props;
  return (
    <>
      {calculating && (
        <Alert type="warning" className="w-[480px] mx-auto mb-4">
          <Stack direction="horizontal" gap={3} className="items-center">
            <i
              className={
                "block w-6 h-6 border-2 border-transparent border-t-yellow rounded-[50%] animate-loadingSpinner"
              }
            />
            <p>Calculating the maximum amount you can unshield this time... </p>
          </Stack>
        </Alert>
      )}
      {!calculating && displayWarning && (
        <Alert type="warning" className="w-[480px] mx-auto mb-4">
          <p>
            Due to ledger BS we have to limit the amount that you can unshield
            at this time to <b>{amount.toString()}</b>
            <br />
            After tx is successful, you will be able to unshield more
          </p>
        </Alert>
      )}
      {!calculating && !displayWarning && (
        <Alert
          type="success"
          className="w-[480px] mx-auto mb-4 text-black bg-success"
        >
          <Stack direction="horizontal" gap={3} className="items-center">
            <GoCheckCircle className="w-6 h-6" />
            <p>You can unshield all the tokens</p>
          </Stack>
        </Alert>
      )}
    </>
  );
};
