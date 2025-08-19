import { Modal } from "@namada/components";
import { ClaimRewardsProps } from "@namada/sdk-multicore";
import { BackButton } from "App/Common/BackButton";
import { ModalContainer } from "App/Common/ModalContainer";
import { defaultAccountAtom } from "atoms/accounts";
import {
  claimableRewardsAtom,
  claimAndStakeRewardsAtom,
  claimRewardsAtom,
} from "atoms/staking";
import { useModalCloseEvent } from "hooks/useModalCloseEvent";
import { useTransaction } from "hooks/useTransaction";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { AddressBalance } from "types";
import { ClaimableRewardsModalStage } from "./ClaimableRewardsModalStage";
import { ClaimRewardsSubmitModalStage } from "./ClaimRewardsSubmitModalStage";

export const StakingRewards = (): JSX.Element => {
  const { data: account } = useAtomValue(defaultAccountAtom);
  const [rewardsToClaim, setRewardsToClaim] = useState<ClaimRewardsProps[]>([]);

  const [shouldClaimAndStake, setShouldClaimAndStake] = useState(false);
  const {
    isLoading: isLoadingRewards,
    data: rewards,
    isSuccess: successfullyLoadedRewards,
  } = useAtomValue(claimableRewardsAtom);
  const { onCloseModal } = useModalCloseEvent();

  const parseStakingRewardsParams = (
    rewards: AddressBalance
  ): ClaimRewardsProps[] => {
    if (!rewards || Object.values(rewards).length === 0 || !account) return [];
    return Object.keys(rewards).map((validatorAddress) => {
      return {
        validator: validatorAddress,
        source: account.address,
      };
    });
  };

  const {
    execute: claimRewards,
    isEnabled: claimRewardsTxEnabled,
    isPending: claimRewardsPending,
    error: claimError,
    feeProps: claimFeeProps,
  } = useTransaction({
    createTxAtom: claimRewardsAtom,
    params: rewardsToClaim,
    eventType: "ClaimRewards",
    parsePendingTxNotification: () => ({
      title: "Claim rewards transaction is in progress",
      description: <>Your rewards claim is being processed</>,
    }),
    onBroadcasted: () => {
      onCloseModal();
    },
  });

  const {
    execute: claimRewardsAndStake,
    isEnabled: claimAndStakeTxEnabled,
    isPending: claimAndStakePending,
    error: claimAndStakeError,
    feeProps: claimAndStakeFeeProps,
  } = useTransaction({
    createTxAtom: claimAndStakeRewardsAtom,
    params: rewardsToClaim,
    eventType: ["ClaimRewards", "Bond"],
    parsePendingTxNotification: () => ({
      title: "Claim and stake rewards transaction is in progress",
      description: (
        <>
          Your rewards claim is being processed and will be staked to the same
          validators afterward.
        </>
      ),
    }),
    onBroadcasted: () => {
      onCloseModal();
    },
  });

  const modalTitle = useMemo(() => {
    if (!rewardsToClaim) return "Claimable Staking Rewards";
    if (shouldClaimAndStake) return "Confirm Claim & Stake";
    return "Confirm Claim";
  }, [shouldClaimAndStake, rewardsToClaim]);

  const onSubmitClaim = async (): Promise<void> => {
    if (shouldClaimAndStake) {
      await claimRewardsAndStake();
    } else {
      await claimRewards();
    }
  };

  const isSubmitting = claimRewardsPending || claimAndStakePending;
  const error = claimError || claimAndStakeError;

  return (
    <Modal onClose={onCloseModal}>
      <>
        {rewardsToClaim.length > 0 && (
          <header className="absolute z-50 top-5 left-6">
            <BackButton onClick={() => setRewardsToClaim([])} />
          </header>
        )}
        <ModalContainer
          header={modalTitle}
          onClose={onCloseModal}
          containerProps={{
            className: "md:!w-[640px] md:!h-[auto] overflow-hidden",
          }}
          contentProps={{ className: "flex" }}
        >
          {rewardsToClaim.length === 0 && (
            <ClaimableRewardsModalStage
              rewards={rewards}
              isLoadingRewards={isLoadingRewards}
              isEnabled={
                successfullyLoadedRewards &&
                Object.keys(rewards || {}).length > 0
              }
              onClaim={(balances: AddressBalance) => {
                setRewardsToClaim(parseStakingRewardsParams(balances));
                setShouldClaimAndStake(false);
              }}
              onClaimAndStake={(balances: AddressBalance) => {
                setRewardsToClaim(parseStakingRewardsParams(balances));
                setShouldClaimAndStake(true);
              }}
            />
          )}
          {rewardsToClaim.length > 0 && rewards && (
            <ClaimRewardsSubmitModalStage
              rewards={rewards}
              rewardsToClaim={rewardsToClaim}
              isClaimAndStake={shouldClaimAndStake}
              onClaim={onSubmitClaim}
              isClaiming={isSubmitting}
              error={error?.message}
              isEnabled={claimRewardsTxEnabled || claimAndStakeTxEnabled}
              feeProps={
                shouldClaimAndStake ? claimAndStakeFeeProps : claimFeeProps
              }
            />
          )}
        </ModalContainer>
      </>
    </Modal>
  );
};
