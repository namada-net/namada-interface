import { Modal, Tooltip } from "@namada/components";
import { ModalContainer } from "App/Common/ModalContainer";
import { NamCurrency } from "App/Common/NamCurrency";
import { MaspRewardCalculator } from "App/Sidebars/MaspRewardCalculator";
import { cachedShieldedRewardsAtom } from "atoms/balance";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { FaCalculator } from "react-icons/fa6";

export const EstimateShieldingRewardsCard = (): JSX.Element => {
  const shieldedRewards = useAtomValue(cachedShieldedRewardsAtom);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
  };

  const handleOpenModal = (): void => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        className={clsx(
          "flex items-center gap-12 text-sm text-yellow bg-neutral-900 rounded-sm px-6 mr-3",
          "py-4"
        )}
      >
        <span className="max-w-[15ch] text-center leading-tight">
          Your Est. Shielding rewards per 24hrs
        </span>
        <span className="text-3xl text-center leading-7 relative top-1">
          {shieldedRewards.amount === undefined ?
            <span>
              --<i className="block text-sm not-italic">NAM</i>
            </span>
          : <div className="flex flex-col items-center">
              <NamCurrency
                amount={shieldedRewards.amount}
                currencySymbolClassName="text-xs block"
                decimalPlaces={2}
              />
            </div>
          }
        </span>
        <div
          className="group group/tooltip relative p-2 bg-black border border-yellow rounded-full cursor-pointer hover:bg-yellow hover:border-yellow transition-colors"
          onClick={handleOpenModal}
        >
          <Tooltip position="top" className="w-[120px] text-center -mt-1">
            Masp Rewards Calculator
          </Tooltip>

          <FaCalculator className="text-3xl text-yellow group-hover:text-black p-1 transition-colors" />
        </div>
      </div>

      {isModalOpen && (
        <Modal onClose={handleCloseModal}>
          <ModalContainer
            header="MASP Rewards Calculator"
            headerProps={{
              className: "text-left",
            }}
            onClose={handleCloseModal}
            containerProps={{
              className:
                "!w-[380px] !h-[auto] bg-black border border-neutral-600 overflow-visible",
            }}
            contentProps={{
              className: "overflow-visible",
            }}
          >
            <MaspRewardCalculator />
          </ModalContainer>
        </Modal>
      )}
    </>
  );
};
