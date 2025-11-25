import { Asset } from "@chain-registry/types";
import { Stack } from "@namada/components";
import { AccountType } from "@namada/types";
import { shortenAddress } from "@namada/utils";
import { ConnectProviderButton } from "App/Common/ConnectProviderButton";
import { TokenAmountCard } from "App/Common/TokenAmountCard";
import { TransactionFee } from "App/Common/TransactionFee";
import { TransactionFeeButton } from "App/Common/TransactionFeeButton";
import { routes } from "App/routes";
import {
  isIbcAddress,
  isNamadaAddress,
  isShieldedAddress as isShieldedNamAddress,
  isTransparentAddress,
} from "App/Transfer/common";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { getAddressLabel } from "atoms/transfer/functions";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { TransactionFeeProps } from "hooks/useTransactionFee";
import { wallets } from "integrations";
import { getChainFromAddress, getChainImageUrl } from "integrations/utils";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { GoChevronDown } from "react-icons/go";
import { useLocation } from "react-router-dom";
import { Address } from "types";
import namadaShieldedIcon from "./assets/namada-shielded.svg";
import namadaTransparentIcon from "./assets/namada-transparent.svg";
import semiTransparentEye from "./assets/semi-transparent-eye.svg";
import shieldedEye from "./assets/shielded-eye.svg";
import transparentEye from "./assets/transparent-eye.svg";
import { CustomAddressForm } from "./CustomAddressForm";
import { DestinationAddressModal } from "./DestinationAddressModal";
import { SelectedWallet } from "./SelectedWallet";
import { ShieldedPropertiesTooltip } from "./ShieldedPropertiesTooltip";

type TransferDestinationProps = {
  isShieldedAddress?: boolean;
  isShieldedTx?: boolean;
  isSubmitting?: boolean;
  walletAddress?: string;
  gasDisplayAmount?: BigNumber;
  gasAsset?: Asset;
  feeProps?: TransactionFeeProps;
  destinationAsset?: Asset;
  amount?: BigNumber;
  destinationAddress?: string;
  sourceAddress?: string;
  memo?: string;
  sourceAsset: Asset | undefined;
  onChangeAddress?: (address: Address) => void;
  onChangeMemo?: (address: string) => void;
  isShielding?: boolean;
  isUnshielding?: boolean;
};

export const TransferDestination = ({
  isShieldedAddress,
  isShieldedTx = false,
  isSubmitting,
  gasDisplayAmount,
  gasAsset,
  feeProps,
  destinationAsset,
  amount,
  destinationAddress,
  sourceAddress,
  memo,
  sourceAsset,
  onChangeAddress,
  onChangeMemo,
  isShielding = false,
  isUnshielding = false,
}: TransferDestinationProps): JSX.Element => {
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  const isIbcTransfer = isIbcAddress(sourceAddress ?? "");
  const changeFeeEnabled = !isIbcTransfer;
  const transparentAccount = accounts?.find(
    (account) => account.type !== AccountType.ShieldedKeys
  );
  const shieldedAccount = accounts?.find(
    (account) => account.type === AccountType.ShieldedKeys
  );

  const alias =
    isShieldedTx && shieldedAccount?.alias ?
      shieldedAccount?.alias
    : transparentAccount?.alias;

  const handleOpenModal = (): void => {
    setIsModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
  };

  const handleSelectAddress = useCallback(
    (selectedAddress: Address): void => onChangeAddress?.(selectedAddress),
    [onChangeAddress]
  );

  const isShieldingTransaction =
    routes.shield === location.pathname || routes.ibc === location.pathname;

  // Make sure destination address is pre-filled if it's a shielding transaction
  useEffect(() => {
    if (destinationAddress) return;
    if (isShieldingTransaction && shieldedAccount?.address) {
      onChangeAddress?.(shieldedAccount?.address ?? "");
    }
  }, [
    isShieldingTransaction,
    shieldedAccount?.address,
    destinationAddress,
    onChangeAddress,
  ]);

  // Write a customAddress variable that checks if the address doesn't come from our transparent or shielded accounts
  const customAddress =
    (
      [shieldedAccount?.address, transparentAccount?.address].includes(
        destinationAddress
      )
    ) ?
      undefined
    : destinationAddress;

  // Check if it's an internal shielding or unshielding transaction
  const isInternalShieldingOrUnshielding =
    (isShielding || isUnshielding) &&
    isNamadaAddress(sourceAddress ?? "") &&
    isNamadaAddress(destinationAddress ?? "");

  const sourceWallet =
    isNamadaAddress(destinationAddress || "") ? wallets.namada : wallets.keplr;
  const addressType =
    isShieldedAddress ? "shielded"
    : isTransparentAddress(destinationAddress ?? "") ? "transparent"
    : "ibc";

  const getDestinationAddressLabel = (): string => {
    if (!destinationAddress) return "";
    if (isIbcAddress(destinationAddress ?? "")) return "Keplr";
    const shieldedAddress = shieldedAccount?.address;
    const transparentAddress = transparentAccount?.address;
    if ([shieldedAddress, transparentAddress].includes(destinationAddress))
      return alias ?? "";
    return "Custom";
  };
  // Determine transaction type for eye icon
  const isSourceShielded = isShieldedNamAddress(sourceAddress ?? "");
  const isDestShielded = isShieldedNamAddress(destinationAddress ?? "");
  const transactionType =
    isSourceShielded && isDestShielded ? "shielded"
    : !isSourceShielded && !isDestShielded ? "transparent"
    : "semi-transparent";

  const eyeIcon =
    transactionType === "shielded" ? shieldedEye
    : transactionType === "semi-transparent" ? semiTransparentEye
    : transparentEye;

  return (
    <>
      <div
        className={clsx("relative bg-neutral-800 rounded-lg px-4 pt-8 pb-4", {
          "border border-yellow transition-colors duration-200":
            isShieldedAddress,
          "border border-white transition-colors duration-200":
            isNamadaAddress(destinationAddress ?? "") && !isShieldedAddress,
        })}
      >
        {!isSubmitting && (
          <div>
            <div className="flex justify-between items-center mb-5">
              <h4 className="text-neutral-500">Destination</h4>
              {sourceAddress && destinationAddress && (
                <div className="relative w-fit group/tooltip ml-auto">
                  <img
                    src={eyeIcon}
                    alt="Privacy Info"
                    className="w-5 mb-2 select-none cursor-pointer"
                  />
                  <ShieldedPropertiesTooltip
                    sourceAddress={sourceAddress}
                    destinationAddress={destinationAddress}
                  />
                </div>
              )}
            </div>

            <div className="mt-3">
              {!destinationAddress ?
                <div className="flex justify-between items-center bg-neutral-900 p-2 rounded-sm w-full">
                  <div className="flex">
                    <div className="flex flex-col ml-4">
                      <span className="text-neutral-500 font-normal">
                        Destination address
                      </span>
                    </div>
                  </div>
                  <ConnectProviderButton
                    onClick={handleOpenModal}
                    disabled={!sourceAsset}
                  />
                </div>
              : <button
                  type="button"
                  disabled={isShieldingTransaction || isSubmitting}
                  onClick={handleOpenModal}
                  className={clsx(
                    "flex justify-between items-center bg-neutral-900 p-2 rounded-sm w-full",
                    {
                      "hover:bg-neutral-700 transition-colors":
                        !isShieldingTransaction,
                    }
                  )}
                >
                  <div className="flex">
                    <img
                      src={
                        isShieldedAddress ? namadaShieldedIcon
                        : isTransparentAddress(destinationAddress) ?
                          namadaTransparentIcon
                        : getChainImageUrl(
                            getChainFromAddress(destinationAddress ?? "")
                          )

                      }
                      alt={
                        getChainFromAddress(destinationAddress ?? "")
                          ?.pretty_name
                      }
                      className="w-10"
                    />
                    <div className="flex flex-col ml-4">
                      <div className="flex flex-col">
                        <span className="text-neutral-500 text-left font-normal text-xs">
                          {getDestinationAddressLabel()}
                        </span>
                        <span className="text-white text-sm font-normal">
                          {shortenAddress(destinationAddress, 15, 15)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isShieldingTransaction && (
                    <GoChevronDown
                      className={clsx(
                        "mr-3 transition-transform text-neutral-400 text-xs"
                      )}
                    />
                  )}
                </button>
              }
            </div>
            {(customAddress || isInternalShieldingOrUnshielding) && (
              <Stack gap={8}>
                <CustomAddressForm memo={memo} onChangeMemo={onChangeMemo} />
              </Stack>
            )}
          </div>
        )}

        {isSubmitting && amount && destinationAsset && (
          <div>
            <TokenAmountCard asset={destinationAsset} displayAmount={amount} />
          </div>
        )}

        {isSubmitting && (
          <footer>
            <hr className="mt-4 mb-2.5 mx-2 border-white opacity-[5%]" />
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src={
                    sourceWallet === wallets.keplr ?
                      getChainImageUrl(
                        getChainFromAddress(destinationAddress ?? "")
                      )
                    : isTransparentAddress(destinationAddress ?? "") ?
                      namadaTransparentIcon
                    : namadaShieldedIcon
                  }
                  alt={sourceWallet.name}
                  className="w-8"
                />
                <span className="max-w-[200px] font-normal">
                  {getAddressLabel(destinationAddress ?? "", addressType)}
                </span>
              </div>
              {destinationAddress && (
                <SelectedWallet
                  address={customAddress ? customAddress : destinationAddress}
                  displayFullAddress={false}
                />
              )}
            </div>
          </footer>
        )}

        {!isSubmitting && (
          <footer className="flex mt-10">
            {changeFeeEnabled ?
              feeProps && (
                <TransactionFeeButton
                  feeProps={feeProps}
                  isShieldedTransfer={isShieldedTx}
                />
              )
            : gasDisplayAmount &&
              gasAsset && (
                <TransactionFee
                  displayAmount={gasDisplayAmount}
                  symbol={gasAsset.symbol}
                />
              )
            }
          </footer>
        )}
      </div>

      {isModalOpen && (
        <DestinationAddressModal
          onClose={handleCloseModal}
          onSelectAddress={handleSelectAddress}
          sourceAsset={sourceAsset}
          sourceAddress={sourceAddress ?? ""}
        />
      )}
    </>
  );
};
