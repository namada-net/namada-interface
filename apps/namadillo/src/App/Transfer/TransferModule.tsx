import { ActionButton, Stack } from "@namada/components";
import { CurrentStatus } from "App/Common/CurrentStatus";
import { IconTooltip } from "App/Common/IconTooltip";
import { InlineError } from "App/Common/InlineError";
import { params, routes } from "App/routes";
import {
  namadaShieldedAssetsAtom,
  namadaTransparentAssetsAtom,
} from "atoms/balance";
import { namadaRegistryChainAssetsMapAtom } from "atoms/integrations";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useAssetsWithAmounts } from "hooks/useAssetsWithAmounts";
import { useKeychainVersion } from "hooks/useKeychainVersion";
import { useAtomValue } from "jotai";
import { useEffect, useMemo } from "react";
import { BsQuestionCircleFill } from "react-icons/bs";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { AssetWithAmountAndChain } from "types";
import { filterAvailableAssetsWithBalance } from "utils/assets";
import { getDisplayGasFee } from "utils/gas";
import { isIbcAddress, isShieldedAddress } from "./common";
import { IbcChannels } from "./IbcChannels";
import { SelectToken } from "./SelectToken";
import { SuccessAnimation } from "./SuccessAnimation";
import { TransferArrow } from "./TransferArrow";
import { TransferDestination } from "./TransferDestination";
import { TransferSource } from "./TransferSource";
import { TransferModuleProps, ValidationResult } from "./types";
import { getButtonText, validateTransferForm } from "./utils";

export const TransferModule = ({
  source,
  destination,
  feeProps,
  isSubmitting,
  errorMessage,
  currentStatus,
  currentStatusExplanation,
  gasConfig: gasConfigProp,
  onSubmitTransfer,
  completedAt,
  onComplete,
  ibcChannels,
  requiresIbcChannels,
  keplrWalletManager,
  assetSelectorModalOpen = false,
  setAssetSelectorModalOpen = () => {},
}: TransferModuleProps): JSX.Element => {
  const sourceAddress = source.address ?? "";
  const destinationAddress = destination.address ?? "";
  const { data: usersAssets, isLoading: isLoadingUsersAssets } = useAtomValue(
    isShieldedAddress(sourceAddress) ?
      namadaShieldedAssetsAtom
    : namadaTransparentAssetsAtom
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const asset = searchParams.get(params.asset) || "";
  const assetsWithAmounts = useAssetsWithAmounts(sourceAddress);
  const selectedAsset = assetsWithAmounts.find(
    (assetWithAmount) => assetWithAmount.asset.symbol === asset
  );

  const availableAmount = selectedAsset?.amount;
  const availableAssets = useMemo(() => {
    return filterAvailableAssetsWithBalance(usersAssets);
  }, [usersAssets]);
  const chainAssets = useAtomValue(namadaRegistryChainAssetsMapAtom);

  const navigate = useNavigate();
  const location = useLocation();
  const keychainVersion = useKeychainVersion();
  const isTargetShielded = isShieldedAddress(destinationAddress);
  const isSourceShielded = isShieldedAddress(sourceAddress);
  const isShielding =
    isShieldedAddress(destinationAddress) && !isShieldedAddress(sourceAddress);
  const isUnshielding =
    isShieldedAddress(sourceAddress) && !isShieldedAddress(destinationAddress);
  const isShieldedTx = isShieldedAddress(sourceAddress);
  const buttonColor = isTargetShielded || isSourceShielded ? "yellow" : "white";
  const ibcTransfer =
    isIbcAddress(destinationAddress) || isIbcAddress(sourceAddress);

  const getButtonTextFromValidation = (): string => {
    const buttonTextErrors =
      isShielding || isUnshielding ?
        {
          NoAmount:
            isShielding ? "Define an amount to shield"
            : isUnshielding ? "Define an amount to unshield"
            : "",
        }
      : {};

    return getButtonText({
      isSubmitting,
      validationResult,
      availableAmountMinusFees,
      buttonTextErrors,
    });
  };

  const gasConfig = gasConfigProp ?? feeProps?.gasConfig;

  const displayGasFee = useMemo(() => {
    return gasConfig ?
        getDisplayGasFee(gasConfig, chainAssets.data ?? {})
      : undefined;
  }, [gasConfig]);

  const availableAmountMinusFees = useMemo(() => {
    if (!availableAmount || !availableAssets) return;

    if (
      !displayGasFee?.totalDisplayAmount ||
      // Don't subtract if the gas token is different than the selected asset:
      gasConfig?.gasToken !== selectedAsset?.asset.address
    ) {
      return availableAmount;
    }

    const amountMinusFees = availableAmount
      .minus(displayGasFee.totalDisplayAmount)
      .decimalPlaces(6);

    return BigNumber.max(amountMinusFees, 0);
  }, [selectedAsset?.asset.address, availableAmount, displayGasFee]);

  const validationResult = useMemo((): ValidationResult => {
    return validateTransferForm({
      source: {
        asset: selectedAsset?.asset,
        address: sourceAddress,
        isShieldedAddress: isShieldedAddress(sourceAddress),
        selectedAssetSymbol: selectedAsset?.asset.symbol,
        amount: source.amount,
        ledgerAccountInfo: source.ledgerAccountInfo,
      },
      destination: {
        address: destinationAddress,
        isShieldedAddress: isShieldedAddress(destinationAddress),
      },
      gasConfig,
      availableAmountMinusFees,
      keychainVersion,
      availableAssets,
      displayGasFeeAmount: displayGasFee?.totalDisplayAmount,
    });
  }, [
    sourceAddress,
    selectedAsset?.asset.address,
    source.amount,
    source.ledgerAccountInfo,
    gasConfig,
    availableAmountMinusFees,
    keychainVersion,
    availableAssets,
    displayGasFee,
  ]);

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onSubmitTransfer({
      displayAmount: source.amount,
      destinationAddress,
      sourceAddress,
      memo: destination.memo,
    });
  };

  // Set the selected asset in the parent component from the URL state if it's not set
  useEffect(() => {
    if (!source.selectedAssetWithAmount && selectedAsset) {
      source.onChangeSelectedAsset(selectedAsset);
    }
  }, [selectedAsset]);

  return (
    <>
      <section className="max-w-[480px] mx-auto" role="widget">
        <Stack
          className={clsx({
            "opacity-0 transition-all duration-300 pointer-events-none":
              completedAt,
          })}
          as="form"
          onSubmit={onSubmit}
        >
          <TransferSource
            sourceAddress={sourceAddress}
            asset={selectedAsset?.asset}
            originalAddress={selectedAsset?.asset?.address}
            isLoadingAssets={isLoadingUsersAssets}
            isShieldingTxn={isShielding}
            availableAmount={availableAmount}
            availableAmountMinusFees={availableAmountMinusFees}
            amount={source.amount}
            openAssetSelector={
              !isSubmitting ? () => setAssetSelectorModalOpen(true) : undefined
            }
            onChangeAmount={source.onChangeAmount}
            isSubmitting={isSubmitting}
          />
          <i className="flex items-center justify-center w-11 mx-auto -my-8 relative z-10">
            <TransferArrow
              color={isShieldedAddress(destinationAddress) ? "#FF0" : "#FFF"}
              isAnimating={isSubmitting}
            />
          </i>
          <TransferDestination
            isShieldedAddress={isShieldedAddress(destinationAddress)}
            isShieldedTx={isShieldedTx}
            destinationAddress={destinationAddress}
            sourceAsset={selectedAsset?.asset}
            sourceAddress={sourceAddress}
            onChangeAddress={destination.onChangeAddress}
            memo={destination.memo}
            onChangeMemo={destination.onChangeMemo}
            feeProps={feeProps}
            gasDisplayAmount={displayGasFee?.totalDisplayAmount}
            gasAsset={displayGasFee?.asset}
            destinationAsset={selectedAsset?.asset}
            amount={source.amount}
            isSubmitting={isSubmitting}
          />
          {ibcTransfer && requiresIbcChannels && ibcChannels && (
            <IbcChannels
              isShielded={Boolean(
                isShieldedAddress(sourceAddress) ||
                  isShieldedAddress(destinationAddress)
              )}
              sourceChannel={ibcChannels.sourceChannel}
              onChangeSource={ibcChannels.onChangeSourceChannel}
              destinationChannel={ibcChannels.destinationChannel}
              onChangeDestination={ibcChannels.onChangeDestinationChannel}
            />
          )}
          {!isSubmitting && <InlineError errorMessage={errorMessage} />}
          {currentStatus && isSubmitting && (
            <CurrentStatus
              status={currentStatus}
              explanation={currentStatusExplanation}
            />
          )}
          {!isSubmitting && (
            <div className="relative">
              <ActionButton
                outlineColor={buttonColor}
                backgroundColor={buttonColor}
                backgroundHoverColor="transparent"
                textColor="black"
                textHoverColor={buttonColor}
                disabled={validationResult !== "Ok" || isSubmitting}
              >
                {getButtonTextFromValidation()}
              </ActionButton>
              {validationResult === "NoLedgerConnected" && (
                <IconTooltip
                  className="absolute w-4 h-4 top-0 right-0 mt-4 mr-5"
                  icon={
                    <BsQuestionCircleFill className="w-4 h-4 text-yellow" />
                  }
                  text={
                    <span>
                      If your device is connected and the app is open, please go
                      to{" "}
                      <Link
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(routes.settingsLedger, {
                            state: { backgroundLocation: location },
                          });
                        }}
                        to={routes.settingsLedger}
                        className="text-yellow"
                      >
                        Settings
                      </Link>{" "}
                      and pair your device with Namadillo.
                    </span>
                  }
                />
              )}
            </div>
          )}
          {validationResult === "KeychainNotCompatibleWithMasp" && (
            <div className="text-center text-fail text-xs selection:bg-fail selection:text-white mb-12">
              Please update your Namada Keychain in order to make shielded
              transfers
            </div>
          )}
        </Stack>
        {completedAt && selectedAsset?.asset && source.amount && (
          <SuccessAnimation
            asset={selectedAsset.asset}
            amount={source.amount}
            onCompleteAnimation={onComplete}
          />
        )}
      </section>
      <SelectToken
        keplrWalletManager={keplrWalletManager}
        sourceAddress={sourceAddress}
        destinationAddress={destinationAddress}
        setSourceAddress={source.onChangeAddress}
        isOpen={assetSelectorModalOpen}
        onClose={() => setAssetSelectorModalOpen(false)}
        assetsWithAmounts={assetsWithAmounts}
        onSelect={(
          selectedAssetWithAmount: AssetWithAmountAndChain,
          newSourceAddress?: string
        ) => {
          // Batch both URL updates together
          setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            if (newSourceAddress) {
              newParams.set("source", newSourceAddress);
            }
            newParams.set(params.asset, selectedAssetWithAmount.asset.symbol);
            return newParams;
          });

          source.onChangeAmount(undefined);
          source.onChangeSelectedAsset(selectedAssetWithAmount);
          setAssetSelectorModalOpen(false);
        }}
      />
    </>
  );
};
