import { Asset } from "@chain-registry/types";
import { Stack } from "@namada/components";
import { AccountType } from "@namada/types";
import { shortenAddress } from "@namada/utils";
import { TransactionFee } from "App/Common/TransactionFee";
import { TransactionFeeButton } from "App/Common/TransactionFeeButton";
import { routes } from "App/routes";
import { isNamadaAddress, isTransparentAddress } from "App/Transfer/common";
import { allDefaultAccountsAtom } from "atoms/accounts";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { TransactionFeeProps } from "hooks/useTransactionFee";
import { useWalletManager } from "hooks/useWalletManager";
import { wallets } from "integrations";
import { KeplrWalletManager } from "integrations/Keplr";
import { getChainFromAddress, getChainImageUrl } from "integrations/utils";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { GoChevronDown } from "react-icons/go";
import { useLocation } from "react-router-dom";
import { Address } from "types";
import { SelectedChain } from ".";
import namadaShieldedIcon from "./assets/namada-shielded.svg";
import namadaTransparentIcon from "./assets/namada-transparent.svg";
import shieldedEye from "./assets/shielded-eye.svg";
import { ConnectProviderButton } from "./ConnectProviderButton";
import { CustomAddressForm } from "./CustomAddressForm";
import { DestinationAddressModal } from "./DestinationAddressModal";
import { SelectedWallet } from "./SelectedWallet";
import { ShieldedPropertiesTooltip } from "./ShieldedPropertiesTooltip";
import { TokenAmountCard } from "./TokenAmountCard";

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
  onChangeAddress?: (address: Address) => void;
  onChangeMemo?: (address: string) => void;
  setDestinationAddress?: (address: string) => void;
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
  setDestinationAddress,
  onChangeMemo,
}: TransferDestinationProps): JSX.Element => {
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  const isIbcTransfer =
    !isNamadaAddress(destinationAddress ?? "") ||
    !isNamadaAddress(sourceAddress ?? "");
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

  const handleSelectAddress = async (
    selectedAddress: Address
  ): Promise<void> => {
    const isIbcAsset = !isNamadaAddress(selectedAddress);
    if (isIbcAsset) {
      const chain = getChainFromAddress(selectedAddress);
      await connectToChainId(chain?.chain_id ?? "");
    }
    setDestinationAddress?.(selectedAddress);
  };
  const keplr = new KeplrWalletManager();

  const { connectToChainId } = useWalletManager(keplr);

  const isShieldingTransaction = routes.maspShield === location.pathname;
  const isIbcAddress = (address: string): boolean => {
    return !isShieldedAddress && !isTransparentAddress(address);
  };

  // Make sure destination address is pre-filled if it's a shielding transaction
  useEffect(() => {
    if (destinationAddress) return;
    if (isShieldingTransaction && shieldedAccount?.address) {
      setDestinationAddress?.(shieldedAccount?.address ?? "");
    }
  }, [
    isShieldingTransaction,
    shieldedAccount?.address,
    destinationAddress,
    setDestinationAddress,
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

  const sourceWallet =
    isNamadaAddress(destinationAddress || "") ? wallets.namada : wallets.keplr;
  const chain = getChainFromAddress(destinationAddress ?? "");
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
            <div className="flex justify-between items-center mb-2">
              <span className="ml-2 text-neutral-500 mb-0.5 font-normal">
                Destination
              </span>
              {isShieldingTransaction && (
                <div className="relative w-fit group/tooltip">
                  <img
                    src={shieldedEye}
                    alt="Shielded Logo"
                    className="w-5 mb-2 select-none cursor-pointer"
                  />
                  <ShieldedPropertiesTooltip />
                </div>
              )}
            </div>

            <div className="mt-3">
              <button
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
                  {destinationAddress && (
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
                      className="w-7"
                    />
                  )}
                  <div className="flex flex-col ml-4">
                    {destinationAddress ?
                      <div className="flex flex-col">
                        <span className="text-neutral-500 text-left font-normal text-xs">
                          {isIbcAddress(destinationAddress) ? "Keplr" : alias}
                        </span>
                        <span className="text-white text-sm font-normal">
                          {shortenAddress(destinationAddress, 15, 15)}
                        </span>
                      </div>
                    : <span className="text-neutral-500 font-normal">
                        Select address
                      </span>
                    }
                  </div>
                </div>
                {!destinationAddress ?
                  <>
                    <ConnectProviderButton onClick={handleOpenModal} />
                  </>
                : !isShieldingTransaction && (
                    <GoChevronDown
                      className={clsx(
                        "mr-3 transition-transform text-neutral-400 text-xs"
                      )}
                    />
                  )
                }
              </button>
            </div>

            {customAddress && (
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
              {chain && (
                <SelectedChain
                  chain={chain}
                  wallet={sourceWallet}
                  iconSize="36px"
                />
              )}
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
          isShieldedTx={isShieldedTx}
          onClose={handleCloseModal}
          onSelectAddress={handleSelectAddress}
          selectedAddress={destinationAddress}
        />
      )}
    </>
  );
};
