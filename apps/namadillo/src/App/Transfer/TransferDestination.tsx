import { Asset, Chain } from "@chain-registry/types";
import { Stack } from "@namada/components";
import { AccountType } from "@namada/types";
import { shortenAddress } from "@namada/utils";
import { TransactionFee } from "App/Common/TransactionFee";
import { TransactionFeeButton } from "App/Common/TransactionFeeButton";
import { routes } from "App/routes";
import { isNamadaAddress, isTransparentAddress } from "App/Transfer/common";
import { allDefaultAccountsAtom } from "atoms/accounts";
import BigNumber from "bignumber.js";
import { chains } from "chain-registry";
import clsx from "clsx";
import { TransactionFeeProps } from "hooks/useTransactionFee";
import { useWalletManager } from "hooks/useWalletManager";
import { KeplrWalletManager } from "integrations/Keplr";
import { getChainImageUrl } from "integrations/utils";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { GoChevronDown } from "react-icons/go";
import { Address } from "types";
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
  changeFeeEnabled?: boolean;
  customAddressActive?: boolean;
  destinationAsset?: Asset;
  amount?: BigNumber;
  address?: string;
  memo?: string;
  onChangeAddress?: (address: Address) => void;
  onChangeMemo?: (address: string) => void;
  setDestinationAddress?: (address: string) => void;
};

export const TransferDestination = ({
  isShieldedAddress,
  isShieldedTx = false,
  isSubmitting,
  walletAddress,
  gasDisplayAmount,
  gasAsset,
  feeProps,
  changeFeeEnabled = true,
  customAddressActive,
  destinationAsset,
  amount,
  address,
  memo,
  setDestinationAddress,
  onChangeAddress,
  onChangeMemo,
}: TransferDestinationProps): JSX.Element => {
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    const isIbcAsset =
      !isShieldedAddress && !isTransparentAddress(selectedAddress);
    if (isIbcAsset) {
      const chain = getChain(selectedAddress);
      await connectToChainId(chain?.chain_id ?? "");
    }
    onChangeAddress?.(selectedAddress);
  };
  const keplr = new KeplrWalletManager();

  const { connectToChainId } = useWalletManager(keplr);

  const getChain = (destinationAddress: string): Chain | undefined => {
    if (isShieldedAddress || isTransparentAddress(destinationAddress)) {
      return chains.find((chain) => chain.chain_name === "namada") as Chain;
    } else {
      // Connect to IBC chain and then return the registered chain
      const chain = chains.find(
        (chain) =>
          chain.bech32_prefix &&
          destinationAddress.startsWith(chain.bech32_prefix)
      );
      return chain as Chain | undefined;
    }
  };

  const isShieldingTransaction = routes.maspShield === location.pathname;
  const isIbcAddress = (address: string): boolean => {
    return !isShieldedAddress && !isTransparentAddress(address);
  };

  // Make sure destination address is pre-filled if it's a shielding transaction
  useEffect(() => {
    if (isShieldingTransaction && shieldedAccount?.address) {
      setDestinationAddress?.(shieldedAccount?.address ?? "");
    }
  }, [isShieldingTransaction, shieldedAccount?.address]);

  return (
    <>
      <div
        className={clsx("relative bg-neutral-800 rounded-lg px-4 pt-8 pb-4", {
          "border border-yellow transition-colors duration-200":
            isShieldedAddress,
          "border border-white transition-colors duration-200":
            isNamadaAddress(walletAddress ?? "") && !isShieldedAddress,
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

            {!customAddressActive && (
              <div className="mt-3">
                <button
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
                    {walletAddress && (
                      <img
                        src={getChainImageUrl(getChain(walletAddress ?? ""))}
                        alt={chain?.pretty_name}
                        className="w-7"
                      />
                    )}
                    <div className="flex flex-col ml-4">
                      {address ?
                        <div className="flex flex-col">
                          <span className="text-neutral-500 text-left font-normal text-xs">
                            {isIbcAddress(address) ? "Keplr" : alias}
                          </span>
                          <span className="text-white text-sm font-normal">
                            {shortenAddress(address, 15, 15)}
                          </span>
                        </div>
                      : <span className="text-neutral-500 font-normal">
                          Select address
                        </span>
                      }
                    </div>
                  </div>
                  {!walletAddress ?
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
            )}

            {customAddressActive && (
              <Stack gap={8}>
                <CustomAddressForm
                  memo={memo}
                  onChangeMemo={onChangeMemo}
                  customAddress={address}
                  onChangeAddress={onChangeAddress}
                />
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
              {walletAddress && (
                <SelectedWallet
                  address={customAddressActive ? address : walletAddress}
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
          selectedAddress={address}
        />
      )}
    </>
  );
};
