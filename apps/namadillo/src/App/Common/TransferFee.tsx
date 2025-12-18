import { Stack } from "@namada/components";
import { namadaRegistryChainAssetsMapAtom } from "atoms/integrations";
import { tokenPricesFamily } from "atoms/prices/atoms";
import BigNumber from "bignumber.js";
import { TransactionFeeProps } from "hooks/useTransactionFee";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { GoInfo } from "react-icons/go";
import { IoIosArrowDown } from "react-icons/io";
import { twMerge } from "tailwind-merge";
import { Address, FrontendFeeEntry } from "types";
import { calculateFrontendFeeAmount } from "utils/frontendFee";
import { getDisplayGasFee } from "utils/gas";
import { GasFeeModal } from "./GasFeeModal";
import { IconTooltip } from "./IconTooltip";

type FrontendFeeInfo = {
  fee: FrontendFeeEntry;
  displayAmount?: BigNumber;
  token?: Address;
};
export const TransferFee = ({
  feeProps,
  inOrOutOfMASP,
  isShieldedTransfer = false,
  frontendFeeInfo,
  showButton = true,
}: {
  feeProps: TransactionFeeProps;
  inOrOutOfMASP: boolean;
  isShieldedTransfer?: boolean;
  frontendFeeInfo?: FrontendFeeInfo;
  showButton?: boolean;
}): JSX.Element => {
  const [modalOpen, setModalOpen] = useState(false);
  const [feeDetailsOpen, setFeeDetailsOpen] = useState(false);

  const chainAssetsMap = useAtomValue(namadaRegistryChainAssetsMapAtom);

  const chainAssetsMapData = chainAssetsMap.data;

  const gasDisplayAmount = useMemo(() => {
    if (!chainAssetsMapData) {
      return;
    }

    return getDisplayGasFee(feeProps.gasConfig, chainAssetsMapData);
  }, [feeProps, chainAssetsMapData]);

  const gasToken = gasDisplayAmount?.asset.address;
  const frontendFeeToken = frontendFeeInfo?.token;
  const tokenAddresses =
    gasToken && frontendFeeToken ? [gasToken, frontendFeeToken] : [];

  const gasDollarMap =
    useAtomValue(tokenPricesFamily(tokenAddresses)).data ?? {};

  const [frontendFeeAmount, frontendFeeFiatAmount, symbol] = useMemo((): [
    BigNumber?,
    BigNumber?,
    string?,
  ] => {
    if (
      frontendFeeInfo &&
      frontendFeeInfo.token &&
      frontendFeeInfo.displayAmount
    ) {
      const feeAmount = calculateFrontendFeeAmount(
        frontendFeeInfo.displayAmount,
        frontendFeeInfo.fee
      );
      const dollarPrice = gasDollarMap[frontendFeeInfo.token];
      const fiatFeeAmount = feeAmount.multipliedBy(dollarPrice);
      const symbol = chainAssetsMapData?.[frontendFeeInfo.token]?.symbol;

      return [feeAmount, fiatFeeAmount, symbol];
    }
    return [];
  }, [gasDollarMap, frontendFeeInfo]);

  const fiatAmount = useMemo(() => {
    if (!gasDisplayAmount || !gasDollarMap || !gasToken) {
      return;
    }
    const dollarPrice = gasDollarMap[gasToken];
    let fiatAmount =
      gasDisplayAmount.totalDisplayAmount.multipliedBy(dollarPrice);

    if (inOrOutOfMASP && frontendFeeFiatAmount) {
      fiatAmount = fiatAmount.plus(frontendFeeFiatAmount);
    }
    return fiatAmount;
  }, [gasDisplayAmount, gasDollarMap, inOrOutOfMASP, gasToken]);

  return (
    <Stack className="w-full text-sm text-neutral-300">
      <Stack direction="horizontal" className="justify-between items-center">
        <div
          className="cursor-pointer select-none underline "
          onClick={() => setFeeDetailsOpen((opened) => !opened)}
        >
          {feeDetailsOpen ? "Hide fee settings" : "Fee settings"}
        </div>
        <div>
          Total Fee {fiatAmount ? `$${fiatAmount.decimalPlaces(6)}` : ""}
        </div>
      </Stack>
      {feeDetailsOpen && (
        <Stack className="w-full">
          <Stack
            direction="horizontal"
            className="justify-between items-center"
          >
            <div>Gas fee:</div>
            <Stack direction="horizontal" gap={2} className="items-center">
              <div>
                {gasDisplayAmount ?
                  gasDisplayAmount.totalDisplayAmount.toString()
                : ""}{" "}
              </div>
              {!showButton && gasDisplayAmount?.asset.symbol}
              {showButton && (
                <div className="flex items-center gap-2">
                  <button
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
              )}
            </Stack>
          </Stack>
          {inOrOutOfMASP && frontendFeeInfo && (
            <Stack
              direction="horizontal"
              className="justify-between items-center"
            >
              <Stack direction="horizontal" gap={2} className="items-center">
                MASP fee
                <div className="flex relative items-center">
                  <IconTooltip
                    className="bg-transparent w-5 h-5"
                    tooltipClassName="text-yellow text-center w-[340px]"
                    icon={<GoInfo className="w-5 h-5 text-yellow" />}
                    text={
                      <div className="w-full">
                        MASP fees are set by the Namadillo Host and may
                        <br /> vary accross Namadillo instances
                      </div>
                    }
                  />
                </div>
              </Stack>

              <div>
                {frontendFeeAmount && symbol ?
                  `${frontendFeeAmount.toString()}  ${symbol}`
                : "0"}
              </div>
            </Stack>
          )}
        </Stack>
      )}
      {modalOpen && (
        <GasFeeModal
          feeProps={feeProps}
          onClose={() => setModalOpen(false)}
          isShielded={isShieldedTransfer}
          chainAssetsMap={chainAssetsMap.data || {}}
        />
      )}
    </Stack>
  );
};
