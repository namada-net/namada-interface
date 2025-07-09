import { accountBalanceAtom, defaultAccountAtom } from "atoms/accounts";
import { shieldedBalanceAtom } from "atoms/balance/atoms";
import { shouldUpdateBalanceAtom, shouldUpdateProposalAtom } from "atoms/etc";
import { claimableRewardsAtom } from "atoms/staking";
import { useAtomValue, useSetAtom } from "jotai";
import { TransferStep, TransferTransactionData } from "types";
import { useTransactionEventListener } from "utils";
import { useTransactionActions } from "./useTransactionActions";

export const useTransactionCallback = (): void => {
  const { refetch: refetchBalances } = useAtomValue(accountBalanceAtom);
  const { refetch: refetchShieldedBalance } = useAtomValue(shieldedBalanceAtom);
  const { refetch: refetchRewards } = useAtomValue(claimableRewardsAtom);

  const { data: account } = useAtomValue(defaultAccountAtom);
  const { changeTransaction } = useTransactionActions();
  const shouldUpdateProposal = useSetAtom(shouldUpdateProposalAtom);
  const shouldUpdateBalance = useSetAtom(shouldUpdateBalanceAtom);

  const onBalanceUpdate = (): void => {
    // TODO: refactor this after event subscription is enabled on indexer
    shouldUpdateBalance(true);
    refetchBalances();

    const timePolling = 6 * 1000;
    setTimeout(() => shouldUpdateBalance(false), timePolling);

    if (account?.address) {
      refetchRewards();
      setTimeout(() => refetchRewards(), timePolling);
    }
  };

  useTransactionEventListener("Bond.Success", onBalanceUpdate);
  useTransactionEventListener("Unbond.Success", onBalanceUpdate);
  useTransactionEventListener("Withdraw.Success", onBalanceUpdate);
  useTransactionEventListener("Redelegate.Success", onBalanceUpdate);
  useTransactionEventListener("ClaimRewards.Success", onBalanceUpdate);

  useTransactionEventListener("VoteProposal.Success", () => {
    shouldUpdateProposal(true);

    // This does not guarantee that the proposal will be updated,
    // but because this is temporary solution(don't quote me on this), it should be fine :)
    const timePolling = 12 * 1000;
    setTimeout(() => shouldUpdateProposal(false), timePolling);
  });

  const onTransferSuccess = (e: CustomEvent<TransferTransactionData>): void => {
    if (!e.detail.hash) return;
    changeTransaction(e.detail.hash, {
      status: "success",
      currentStep: TransferStep.Complete,
    });
    shouldUpdateBalance(true);
    refetchBalances();
    refetchShieldedBalance();
  };

  const onPartialTransferSuccess = (e: unknown): void => {};

  const onTransferError = (e: CustomEvent<TransferTransactionData>): void => {
    if (!e.detail.hash) return;
    changeTransaction(e.detail.hash, {
      status: "error",
      currentStep: TransferStep.Complete,
      errorMessage: String(e.detail.errorMessage),
    });
  };

  useTransactionEventListener("TransparentTransfer.Success", onTransferSuccess);
  useTransactionEventListener("ShieldedTransfer.Success", onTransferSuccess);
  useTransactionEventListener("ShieldingTransfer.Success", onTransferSuccess);
  useTransactionEventListener("UnshieldingTransfer.Success", onTransferSuccess);
  useTransactionEventListener(
    "UnshieldingTransfer.PartialSuccess",
    onPartialTransferSuccess
  );
  useTransactionEventListener("IbcTransfer.Success", onTransferSuccess);
  useTransactionEventListener("IbcWithdraw.Success", onTransferSuccess);
  useTransactionEventListener("ShieldedIbcWithdraw.Success", onTransferSuccess);

  useTransactionEventListener("TransparentTransfer.Error", onTransferError);
  useTransactionEventListener("ShieldedTransfer.Error", onTransferError);
  useTransactionEventListener("ShieldingTransfer.Error", onTransferError);
  useTransactionEventListener("UnshieldingTransfer.Error", onTransferError);
  useTransactionEventListener("IbcTransfer.Error", onTransferError);
  useTransactionEventListener("IbcWithdraw.Error", onTransferError);
  useTransactionEventListener("ShieldedIbcWithdraw.Error", onTransferError);
};
