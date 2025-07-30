import { Panel, SkeletonLoading, Stack, Tooltip } from "@namada/components";
import { FiatCurrency } from "App/Common/FiatCurrency";
import { NamCurrency } from "App/Common/NamCurrency";
import { UnclaimedRewardsCard } from "App/Staking/UnclaimedRewardsCard";
import { tokenPricesFamily } from "atoms/prices/atoms";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useAmountsInFiat } from "hooks/useAmountsInFiat";
import { useBalances } from "hooks/useBalances";
import { useAtomValue } from "jotai";
import { FaInfo } from "react-icons/fa6";
import { namadaAsset } from "utils";

export const TotalStakeBanner = (): JSX.Element => {
  const { stakingAmountInFiat, isLoading: fiatLoading } = useAmountsInFiat();
  const {
    bondedAmount,
    unbondedAmount,
    withdrawableAmount,
    isLoading: bondedAmountIsLoading,
  } = useBalances();
  const nativeAsset = namadaAsset();
  const tokenPrices = useAtomValue(tokenPricesFamily([nativeAsset.address!]));
  const namPrice = tokenPrices.data?.[nativeAsset.address!] ?? BigNumber(0);
  const isLoading = fiatLoading || bondedAmountIsLoading;
  const totalStakingAmount = BigNumber.sum(
    bondedAmount,
    unbondedAmount,
    withdrawableAmount
  );

  return (
    <Panel className="py-4 min-w-full">
      <Stack
        direction="horizontal"
        className="min-w-full overflow-hidden flex-col md:flex-row justify-between px-4"
      >
        <div className="text-cyan">
          <header className="text-sm">
            <div className="flex items-start mb-4 gap-2">
              Total Staked NAM
              <div className="group group/tooltip relative w-3.5 h-3.5 bg-yellow rounded-full flex items-center justify-center cursor-pointer hover:bg-yellow/80">
                <Tooltip
                  position="bottom"
                  className="w-[175px] text-center z-50"
                >
                  This is the total bonded, unbonded and withdrawable NAM.
                </Tooltip>
                <FaInfo className="text-black text-[8px]" />
              </div>
            </div>
          </header>
          {isLoading && (
            <SkeletonLoading height="1em" width="200px" className="text-5xl" />
          )}
          {!isLoading && (
            <>
              <div className={clsx("flex items-center text-5xl leading-none")}>
                <NamCurrency amount={totalStakingAmount} decimalPlaces={2} />
              </div>
              {Number(namPrice) > 0 && (
                <div
                  className={clsx(
                    "flex items-center text-2xl leading-none mt-8"
                  )}
                >
                  <FiatCurrency amount={stakingAmountInFiat} />
                </div>
              )}
            </>
          )}
        </div>
        <aside className="-mr-6 flex-wrap mt-4 md:mt-0">
          <UnclaimedRewardsCard />
        </aside>
      </Stack>
    </Panel>
  );
};
