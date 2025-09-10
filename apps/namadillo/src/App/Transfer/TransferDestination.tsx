import { Chain } from "@chain-registry/types";
import { Stack } from "@namada/components";
import { TabSelector } from "App/Common/TabSelector";
import { TransactionFee } from "App/Common/TransactionFee";
import { TransactionFeeButton } from "App/Common/TransactionFeeButton";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { TransactionFeeProps } from "hooks/useTransactionFee";
import { Address, Asset, WalletProvider } from "types";
import { ConnectProviderButton } from "./ConnectProviderButton";
import { CustomAddressForm } from "./CustomAddressForm";
import { SelectedChain } from "./SelectedChain";
import { SelectedWallet } from "./SelectedWallet";
import { TokenAmountCard } from "./TokenAmountCard";

type TransferDestinationProps = {
  isShieldedAddress?: boolean;
  isShieldedTx?: boolean;
  onChangeShielded?: (isShielded: boolean) => void;
  chain?: Chain;
  wallet?: WalletProvider;
  walletAddress?: string;
  className?: string;
  gasDisplayAmount?: BigNumber;
  gasAsset?: Asset;
  feeProps?: TransactionFeeProps;
  changeFeeEnabled?: boolean;
  customAddressActive?: boolean;
  isSubmitting?: boolean;
  destinationAsset?: Asset;
  amount?: BigNumber;
  openChainSelector?: () => void;
  openProviderSelector?: () => void;
  onToggleCustomAddress?: (isActive: boolean) => void;
  onChangeAddress?: (address: Address) => void;
  address?: string;
  memo?: string;
  onChangeMemo?: (address: string) => void;
  disabled?: boolean;
};

export const TransferDestination = ({
  chain,
  wallet,
  walletAddress,
  isShieldedAddress,
  isShieldedTx = false,
  onChangeShielded,
  gasDisplayAmount,
  gasAsset,
  isSubmitting,
  feeProps,
  changeFeeEnabled = true,
  customAddressActive,
  onToggleCustomAddress,
  address,
  amount,
  destinationAsset,
  onChangeAddress,
  memo,
  onChangeMemo,
  openChainSelector,
  openProviderSelector,
  disabled = false,
}: TransferDestinationProps): JSX.Element => {
  return (
    <div
      className={clsx("relative bg-neutral-800 rounded-lg px-4 pt-8 pb-4", {
        "border border-yellow transition-colors duration-200":
          isShieldedAddress,
        "border border-white transition-colors duration-200":
          chain?.chain_name === "namada" && !isShieldedAddress,
      })}
    >
      {!isSubmitting && (
        <div>
          {onChangeShielded && chain?.chain_name.includes("namada") && (
            <nav className="mb-6">
              <TabSelector
                active={isShieldedAddress ? "shielded" : "transparent"}
                items={[
                  {
                    id: "shielded",
                    text: "Shielded",
                    className: "text-yellow",
                  },
                  {
                    id: "transparent",
                    text: "Transparent",
                    className: "text-white",
                  },
                ]}
                onChange={() => onChangeShielded(!isShieldedAddress)}
              />
            </nav>
          )}
          {onToggleCustomAddress && (
            <nav className="mb-6">
              <TabSelector
                active={customAddressActive ? "custom" : "my-address"}
                onChange={() => onToggleCustomAddress(!customAddressActive)}
                items={[
                  {
                    id: "my-address",
                    text: "My Address",
                    className: "text-white",
                  },
                  {
                    id: "custom",
                    text: "Custom Address",
                    className: "text-white",
                  },
                ]}
              />
            </nav>
          )}
          {!customAddressActive && (
            <div className="flex justify-between items-center">
              <SelectedChain
                chain={chain}
                wallet={wallet}
                onClick={openChainSelector}
                iconSize="42px"
              />
              {!walletAddress && (
                <ConnectProviderButton onClick={openProviderSelector} />
              )}
              {wallet && walletAddress && (
                <SelectedWallet wallet={wallet} address={walletAddress} />
              )}
            </div>
          )}

          {customAddressActive && (
            <Stack gap={8}>
              {onToggleCustomAddress && (
                <SelectedChain
                  chain={chain}
                  wallet={wallet}
                  onClick={openChainSelector}
                  iconSize="42px"
                />
              )}
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
            <SelectedChain chain={chain} wallet={wallet} iconSize="36px" />
            {wallet && walletAddress && (
              <SelectedWallet
                wallet={wallet}
                address={customAddressActive ? address : walletAddress}
                displayFullAddress={false}
              />
            )}
          </div>
        </footer>
      )}

      {!isSubmitting && (
        <footer className="flex items-center mt-10">
          {changeFeeEnabled ?
            feeProps && (
              <TransactionFeeButton
                disabled={disabled}
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
  );
};
