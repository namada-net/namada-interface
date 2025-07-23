import { ActionButton, Stack } from "@namada/components";
import { IconTooltip } from "App/Common/IconTooltip";
import { InlineError } from "App/Common/InlineError";
import { routes } from "App/routes";
import {
  namadaShieldedAssetsAtom,
  namadaTransparentAssetsAtom,
} from "atoms/balance";
import { namadaRegistryChainAssetsMapAtom } from "atoms/integrations";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useKeychainVersion } from "hooks/useKeychainVersion";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { BsQuestionCircleFill } from "react-icons/bs";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AssetWithAmount } from "types";
import { filterAvailableAssetsWithBalance } from "utils/assets";
import { getDisplayGasFee } from "utils/gas";
import { isIbcAddress, isShieldedAddress } from "./common";
import { CurrentStatus } from "./CurrentStatus";
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
}: TransferModuleProps): JSX.Element => {
  const { data: usersAssets, isLoading: isLoadingUsersAssets } = useAtomValue(
    isShieldedAddress(source.address ?? "") ?
      namadaShieldedAssetsAtom
    : namadaTransparentAssetsAtom
  );
  const selectedAsset = source.selectedAssetWithAmount;
  const availableAmount = selectedAsset?.amount;
  const availableAssets = useMemo(() => {
    return filterAvailableAssetsWithBalance(usersAssets);
  }, [usersAssets]);
  const chainAssetsMap = useAtomValue(namadaRegistryChainAssetsMapAtom);
  const [assetSelectorModalOpen, setAssetSelectorModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const keychainVersion = useKeychainVersion();
  const isTargetShielded = isShieldedAddress(destination.address ?? "");
  const isSourceShielded = isShieldedAddress(source.address ?? "");
  const isShielding =
    isShieldedAddress(destination.address ?? "") &&
    !isShieldedAddress(source.address ?? "");
  const isUnshielding =
    isShieldedAddress(source.address ?? "") &&
    !isShieldedAddress(destination.address ?? "");
  const isShieldedTx = isShieldedAddress(source.address ?? "");
  const buttonColor = isTargetShielded || isSourceShielded ? "yellow" : "white";
  const ibcTransfer =
    isIbcAddress(destination.address ?? "") ||
    isIbcAddress(source.address ?? "");

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
        getDisplayGasFee(gasConfig, chainAssetsMap.data ?? {})
      : undefined;
  }, [gasConfig]);

  const availableAmountMinusFees = useMemo(() => {
    if (!selectedAsset?.asset.address || !availableAmount || !availableAssets)
      return undefined;
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
        address: source.address,
        isShieldedAddress: isShieldedAddress(source.address ?? ""),
        selectedAssetAddress: selectedAsset?.asset.address,
        amount: source.amount,
        ledgerAccountInfo: source.ledgerAccountInfo,
      },
      destination: {
        address: destination.address,
        isShieldedAddress: isShieldedAddress(destination.address ?? ""),
        chain: undefined,
      },
      gasConfig,
      availableAmountMinusFees,
      keychainVersion,
      availableAssets,
      displayGasFeeAmount: displayGasFee?.totalDisplayAmount,
    });
  }, [
    source.address,
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
      displayAmount: source.amount?.toString() ?? "",
      destinationAddress: destination.address,
      sourceAddress: source.address,
      memo: destination.memo,
    });
  };

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
            sourceAddress={source.address}
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
              color={
                isShieldedAddress(destination.address ?? "") ? "#FF0" : "#FFF"
              }
              isAnimating={isSubmitting}
            />
          </i>
          <TransferDestination
            setDestinationAddress={destination.onChangeAddress}
            isShieldedAddress={isShieldedAddress(destination.address ?? "")}
            isShieldedTx={isShieldedTx}
            address={destination.address}
            sourceAddress={source.address}
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
                isShieldedAddress(source.address ?? "") ||
                  isShieldedAddress(destination.address ?? "")
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
        sourceAddress={source.address || ""}
        destinationAddress={destination.address || ""}
        setSourceAddress={source.onChangeAddress}
        isOpen={assetSelectorModalOpen}
        onClose={() => setAssetSelectorModalOpen(false)}
        onSelect={(selectedAssetWithAmount: AssetWithAmount) => {
          source.onChangeAmount(undefined);
          source.onChangeSelectedAsset(selectedAssetWithAmount);
          setAssetSelectorModalOpen(false);
        }}
      />
    </>
  );
};
