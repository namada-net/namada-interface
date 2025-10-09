import { useMemo } from "react";

export const useSwapReviewValidation = ({
  walletAddress,
  ledgerAccountInfo,
}: {
  walletAddress?: string;
  ledgerAccountInfo?: { deviceConnected: boolean; errorMessage: string };
}): string => {
  return useMemo(() => {
    if (!walletAddress) {
      return "NoWalletConnected";
    } else if (ledgerAccountInfo && !ledgerAccountInfo.deviceConnected) {
      return "LedgerDeviceNotConnected";
    } else {
      return "Ok";
    }
  }, [
    walletAddress,
    ledgerAccountInfo?.deviceConnected,
    ledgerAccountInfo?.errorMessage,
  ]);
};
