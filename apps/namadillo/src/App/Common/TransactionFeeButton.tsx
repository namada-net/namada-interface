import { namadaRegistryChainAssetsMapAtom } from "atoms/integrations";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { TransactionFeeProps } from "hooks/useTransactionFee";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { twMerge } from "tailwind-merge";
import { getDisplayGasFee } from "utils/gas";
import { GasFeeModal } from "./GasFeeModal";
import { TransactionFee } from "./TransactionFee";

export const TransactionFeeButton = ({
  feeProps,
  className,
  isShieldedTransfer = false,
  disabled = false,
}: {
  feeProps: TransactionFeeProps;
  className?: string;
  isShieldedTransfer?: boolean;
  disabled?: boolean;
}): JSX.Element => {
  const [modalOpen, setModalOpen] = useState(false);

  const chainAssetsMap = useAtomValue(namadaRegistryChainAssetsMapAtom);

  const gasDisplayAmount = useMemo(() => {
    if (!chainAssetsMap.data) {
      return undefined;
    }

    return getDisplayGasFee(feeProps.gasConfig, chainAssetsMap.data);
  }, [feeProps, chainAssetsMap.data]);

  return (
    <>
      <div
        className={twMerge(
          "flex items-center justify-between gap-5 flex-1",
          className
        )}
      >
        <TransactionFee
          displayAmount={gasDisplayAmount?.totalDisplayAmount || BigNumber(0)}
          symbol={gasDisplayAmount?.asset.symbol || ""}
        />
        <div
          className={clsx("flex items-center gap-2", {
            "pointer-events-none opacity-30": disabled,
          })}
        >
          <div className="text-neutral-500 text-xs">Fee Options:</div>
          <button
            disabled={disabled}
            type="button"
            className={twMerge(
              "flex items-center gap-1",
              "border rounded-sm px-2 py-1 text-xs",
              "transition-all cursor-pointer hover:text-yellow"
            )}
            onClick={() => setModalOpen(true)}
          >
            <span className="text- font-medium">
              {gasDisplayAmount?.asset.symbol || ""}
            </span>
            <IoIosArrowDown />
          </button>
        </div>
      </div>
      {modalOpen && (
        <GasFeeModal
          feeProps={feeProps}
          onClose={() => setModalOpen(false)}
          isShielded={isShieldedTransfer}
          chainAssetsMap={chainAssetsMap.data || {}}
        />
      )}
    </>
  );
};
