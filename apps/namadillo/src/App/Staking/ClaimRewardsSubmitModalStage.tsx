import { ActionButton, Stack } from "@namada/components";
import { ClaimRewardsProps } from "@namada/sdk-multicore";
import { InlineError } from "App/Common/InlineError";
import { NamCurrency } from "App/Common/NamCurrency";
import { TransactionFeeButton } from "App/Common/TransactionFeeButton";
import { allValidatorsAtom } from "atoms/validators";
import { TransactionFeeProps } from "hooks/useTransactionFee";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { AddressBalance } from "types";
import { sumBigNumberArray } from "utils";
import claimAndStakeImage from "./assets/claim-and-stake-rewards.svg";
import claimImage from "./assets/claim-rewards.svg";
import { ValidatorCard } from "./ValidatorCard";

type ClaimRewardsPanelProps = {
  rewards: AddressBalance;
  rewardsToClaim: ClaimRewardsProps[];
  isClaimAndStake: boolean;
  feeProps: TransactionFeeProps;
  onClaim: () => Promise<void>;
  isClaiming: boolean;
  isEnabled: boolean;
  error?: string;
};

export const ClaimRewardsSubmitModalStage = ({
  rewards,
  rewardsToClaim,
  isClaimAndStake,
  feeProps,
  onClaim,
  isClaiming,
  isEnabled,
  error,
}: ClaimRewardsPanelProps): JSX.Element => {
  const validators = useAtomValue(allValidatorsAtom);
  const availableRewards = sumBigNumberArray(
    rewardsToClaim.map((r) => rewards[r.validator]).filter(Boolean)
  );
  const allRewards = rewardsToClaim.length === Object.keys(rewards).length;
  const image = isClaimAndStake ? claimAndStakeImage : claimImage;

  const buttonCaption = useMemo(() => {
    if (isClaiming) return "Processing...";
    if (isClaimAndStake) {
      return allRewards ? "Claim & Stake All" : "Claim & Stake";
    }
    return allRewards ? "Claim All" : "Claim";
  }, [rewards, rewardsToClaim, isClaimAndStake]);

  // Only shows validator card if we're claiming an individual validator's rewards
  const shouldDisplayValidatorCard =
    validators.data?.length && rewardsToClaim.length === 1;

  const validator =
    shouldDisplayValidatorCard &&
    validators.data!.find((v) => v.address === rewardsToClaim[0].validator);

  return (
    <>
      <Stack
        gap={5}
        className="bg-black py-6 px-6 rounded-md flex-1 max-w-full"
      >
        <Stack gap={10}>
          <header className="text-center mt-10 flex flex-col gap-2">
            <img src={image} className="max-w-[120px] mx-auto" />
            <NamCurrency amount={availableRewards} className="text-5xl" />
            {validator && (
              <div className="flex justify-center">
                <ValidatorCard validator={validator} showAddress={false} />
              </div>
            )}
          </header>
          <div>
            <ActionButton
              backgroundColor={isClaimAndStake ? "cyan" : "white"}
              onClick={onClaim}
              disabled={availableRewards.eq(0) || isClaiming || !isEnabled}
            >
              {buttonCaption}
            </ActionButton>
            {error && (
              <div className="mt-2 text-center">
                <InlineError errorMessage={error} />
              </div>
            )}
          </div>
          <TransactionFeeButton feeProps={feeProps} />
        </Stack>
      </Stack>
    </>
  );
};
