import { Chain } from "@chain-registry/types";
import { AmountInput } from "@namada/components";
import { TabSelector } from "App/Common/TabSelector";
import { MaspSyncIndicator } from "App/Layout/MaspSyncIndicator";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { Asset, WalletProvider } from "types";
import { AvailableAmountFooter } from "./AvailableAmountFooter";
import { ConnectProviderButton } from "./ConnectProviderButton";
import { SelectedAsset } from "./SelectedAsset";
import { SelectedChain } from "./SelectedChain";
import { SelectedWallet } from "./SelectedWallet";
import { TokenAmountCard } from "./TokenAmountCard";

export type TransferSourceProps = {
  isConnected: boolean;
  wallet?: WalletProvider;
  walletAddress?: string;
  asset?: Asset;
  isLoadingAssets?: boolean;
  isSubmitting?: boolean;
  isSyncingMasp?: boolean;
  chain?: Chain;
  openChainSelector?: () => void;
  openAssetSelector?: () => void;
  openProviderSelector?: () => void;
  amount?: BigNumber;
  availableAmount?: BigNumber;
  maxAmount?: BigNumber;
  availableAmountMinusFees?: BigNumber;
  onChangeAmount?: (amount: BigNumber | undefined) => void;
  isShieldedAddress?: boolean;
  onChangeShielded?: (isShielded: boolean) => void;
  disabled?: boolean;
};

const amountMaxDecimalPlaces = (asset?: Asset): number | undefined => {
  if (typeof asset !== "undefined") {
    for (const { denom, exponent } of asset.denom_units) {
      if (denom === asset.display) {
        return exponent;
      }
    }
  }
  return undefined;
};

export const TransferSource = ({
  chain,
  asset,
  isLoadingAssets,
  wallet,
  walletAddress,
  openProviderSelector,
  openChainSelector,
  openAssetSelector,
  availableAmount,
  maxAmount,
  availableAmountMinusFees,
  amount,
  onChangeAmount,
  isShieldedAddress,
  isSyncingMasp,
  onChangeShielded,
  isSubmitting,
  disabled,
}: TransferSourceProps): JSX.Element => {
  return (
    <div className="relative bg-neutral-800 rounded-lg px-4 py-5">
      {/** Intro header - Ex: "IBC To Namada" */}
      {onChangeShielded && chain?.chain_name === "namada" && !isSubmitting && (
        <nav className="relative z-10 mb-6">
          <TabSelector
            active={isShieldedAddress ? "shielded" : "transparent"}
            items={[
              {
                id: "shielded",
                text: (
                  <span className="relative flex gap-4 items-center justify-center">
                    Shielded{" "}
                    {isSyncingMasp && (
                      <span className="relative flex items-center">
                        <MaspSyncIndicator
                          pulsingRingSize="7px"
                          ringClassName="!text-yellow/50"
                          syncingChildren={
                            <div className="text-white text-xs text-left">
                              Shielded transfers are disabled until sync is
                              complete.
                            </div>
                          }
                          syncedChildren={<div>Shielded sync completed</div>}
                        />
                      </span>
                    )}
                  </span>
                ),
                className:
                  isShieldedAddress ? "text-yellow" : (
                    clsx("text-yellow/50", {
                      "hover:text-yellow/80": !isSyncingMasp,
                    })
                  ),
                buttonProps: { disabled: isSyncingMasp },
              },
              {
                id: "transparent",
                text: "Transparent",
                className:
                  !isShieldedAddress ? "text-white" : (
                    "text-white/50 hover:text-white/80"
                  ),
              },
            ]}
            onChange={() => onChangeShielded(!isShieldedAddress)}
          />
        </nav>
      )}

      {/** Chain selector / chain indicator */}
      <header className="relative flex justify-between">
        <SelectedChain
          onClick={openChainSelector}
          chain={chain}
          wallet={wallet}
        />
        {!walletAddress && (
          <ConnectProviderButton onClick={openProviderSelector} />
        )}
        {walletAddress && wallet && (
          <SelectedWallet
            wallet={wallet}
            address={walletAddress}
            onClick={openProviderSelector}
          />
        )}
      </header>
      <hr className="mt-4 mb-2.5 mx-2 border-white opacity-[5%]" />

      {/** Asset selector */}
      {!isSubmitting && (
        <div className="grid grid-cols-[max-content_auto] gap-5 mb-3">
          <SelectedAsset
            asset={asset}
            isLoading={isLoadingAssets}
            isDisabled={!chain || !walletAddress || disabled}
            onClick={openAssetSelector}
          />
          <AmountInput
            className={clsx(
              "text-right [&_input]:text-right [&_input]:text-3xl [&_input]:bg-transparent",
              "[&_input]:!border-0 [&_input]:px-0"
            )}
            disabled={!chain || !asset || disabled}
            value={amount}
            onChange={(e) => onChangeAmount?.(e.target.value)}
            placeholder="Amount"
            maxDecimalPlaces={amountMaxDecimalPlaces(asset)}
          />
        </div>
      )}

      {/** Available amount footer */}
      {!isSubmitting && asset && availableAmountMinusFees && (
        <footer>
          <AvailableAmountFooter
            availableAmount={availableAmount}
            maxAmount={maxAmount}
            availableAmountMinusFees={availableAmountMinusFees}
            asset={asset}
            onClickMax={() =>
              onChangeAmount &&
              onChangeAmount(maxAmount || availableAmountMinusFees)
            }
          />
        </footer>
      )}

      {isSubmitting && asset && amount && (
        <div className="pt-1.5 pb-3">
          <TokenAmountCard asset={asset} displayAmount={amount} />
        </div>
      )}
    </div>
  );
};
