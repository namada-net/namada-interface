import { ActionButton, Stack } from "@namada/components";
import { IconTooltip } from "App/Common/IconTooltip";
import { InlineError } from "App/Common/InlineError";
import { params, routes } from "App/routes";
import { allDefaultAccountsAtom, disposableSignerAtom } from "atoms/accounts";
import {
  namadaShieldedAssetsAtom,
  namadaTransparentAssetsAtom,
} from "atoms/balance";
import { chainParametersAtom } from "atoms/chain";
import {
  ibcChannelsFamily,
  namadaRegistryChainAssetsMapAtom,
} from "atoms/integrations";
import { ledgerStatusDataAtom } from "atoms/ledger";
import { rpcUrlAtom } from "atoms/settings";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useKeychainVersion } from "hooks/useKeychainVersion";
import { useTransactionActions } from "hooks/useTransactionActions";
import { useTransactionResolver } from "hooks/useTransactionResolver";
import { useUrlState } from "hooks/useUrlState";
import { useWalletManager } from "hooks/useWalletManager";
import { KeplrWalletManager } from "integrations/Keplr";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { BsQuestionCircleFill } from "react-icons/bs";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AssetWithAmount } from "types";
import { filterAvailableAssetsWithBalance } from "utils/assets";
import { getDisplayGasFee } from "utils/gas";
import {
  isIbcAddress,
  isShieldedAddress,
  isTransparentAddress,
} from "./common";
import { CurrentStatus } from "./CurrentStatus";
import { IbcChannels } from "./IbcChannels";
import { SelectToken } from "./SelectToken";
import { SuccessAnimation } from "./SuccessAnimation";
import { TransferArrow } from "./TransferArrow";
import { TransferDestination } from "./TransferDestination";
import { TransferSource } from "./TransferSource";
import { ValidationResult } from "./types";
import {
  determineTransferType,
  getButtonText,
  validateTransferForm,
} from "./utils";

export const TransferModule = (): JSX.Element => {
  const { data: accounts, isLoading: isLoadingAccounts } = useAtomValue(
    allDefaultAccountsAtom
  );
  const shieldedAccount = accounts?.find((acc) =>
    isShieldedAddress(acc.address)
  );
  const transparentAccount = accounts?.find((acc) =>
    isTransparentAddress(acc.address)
  );
  const { storeTransaction } = useTransactionActions();
  const transparentAddress = accounts?.find((acc) =>
    isTransparentAddress(acc.address)
  )?.address;
  const [displayAmount, setDisplayAmount] = useState<BigNumber | undefined>();
  const [generalErrorMessage, setGeneralErrorMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [currentStatusExplanation, setCurrentStatusExplanation] = useState("");
  const [sourceChannel, setSourceChannel] = useState("");
  const [destinationChannel, setDestinationChannel] = useState("");
  const [assetSelectorModalOpen, setAssetSelectorModalOpen] = useState(false);
  const [sourceAddress, setSourceAddress] = useState<string | undefined>(
    transparentAddress ?? ""
  );
  const [ledgerStatus, setLedgerStatus] = useAtom(ledgerStatusDataAtom);
  const isShieldedTx = isShieldedAddress(sourceAddress ?? "");
  const [destinationAddress, setDestinationAddress] = useState<string>("");
  const [memo, setMemo] = useState<undefined | string>();
  const [selectedAssetAddress, setSelectedAssetAddress] = useUrlState(
    params.asset
  );
  const [selectedAssetWithAmount, setSelectedAssetWithAmount] = useState<
    AssetWithAmount | undefined
  >();
  const { refetch: genDisposableSigner } = useAtomValue(disposableSignerAtom);

  const keplr = new KeplrWalletManager();
  const { registry: keplrRegistry, walletAddress: activeKeplrWalletAddress } =
    useWalletManager(keplr);

  const ledgerAccountInfo = ledgerStatus && {
    deviceConnected: ledgerStatus.connected,
    errorMessage: ledgerStatus.errorMessage,
  };
  const chainParameters = useAtomValue(chainParametersAtom);
  const chainAssetsMap = useAtomValue(namadaRegistryChainAssetsMapAtom);
  const chainId = chainParameters.data?.chainId;
  const rpcUrl = useAtomValue(rpcUrlAtom);

  const { data: usersAssets, isLoading: isLoadingUsersAssets } = useAtomValue(
    isShieldedAddress(sourceAddress ?? "") ?
      namadaShieldedAssetsAtom
    : namadaTransparentAssetsAtom
  );
  const {
    data: ibcChannels,
    isError: unknownIbcChannels,
    isLoading: isLoadingIbcChannels,
  } = useAtomValue(ibcChannelsFamily(keplrRegistry?.chain.chain_name));

  // Find selected asset from users assets or use the one set from SelectToken
  const selectedAsset =
    selectedAssetWithAmount ||
    Object.values(usersAssets ?? {}).find(
      (item) => item.asset?.address === selectedAssetAddress
    );

  const navigate = useNavigate();
  const location = useLocation();
  const keychainVersion = useKeychainVersion();

  const selectedTokenType: "shielded" | "transparent" | "keplr" =
    useMemo(() => {
      if (isTransparentAddress(sourceAddress ?? "")) return "transparent";
      if (isShieldedAddress(sourceAddress ?? "")) return "shielded";
      return "keplr";
    }, [sourceAddress]);

  const availableAmount = selectedAsset?.amount;
  const availableAssets = useMemo(() => {
    return filterAvailableAssetsWithBalance(usersAssets);
  }, [usersAssets]);

  const isTargetShielded = isShieldedAddress(destinationAddress ?? "");
  const isSourceShielded = isShieldedAddress(sourceAddress ?? "");
  const isShielding =
    isShieldedAddress(destinationAddress ?? "") &&
    (isTransparentAddress(sourceAddress ?? "") ||
      isIbcAddress(sourceAddress ?? ""));
  const isUnshielding =
    isShieldedAddress(sourceAddress ?? "") &&
    (isTransparentAddress(destinationAddress ?? "") ||
      isIbcAddress(destinationAddress ?? ""));
  const buttonColor = isTargetShielded || isSourceShielded ? "yellow" : "white";

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

  const gasConfig = feeProps?.gasConfig;
  const displayGasFee = useMemo(() => {
    return gasConfig ?
        getDisplayGasFee(gasConfig, chainAssetsMap.data ?? {})
      : undefined;
  }, [gasConfig]);

  const availableAmountMinusFees = useMemo(() => {
    if (
      typeof selectedAssetAddress === "undefined" ||
      typeof availableAmount === "undefined" ||
      typeof availableAssets === "undefined"
    ) {
      return undefined;
    }

    if (
      !displayGasFee?.totalDisplayAmount ||
      // Don't subtract if the gas token is different than the selected asset:
      gasConfig?.gasToken !== selectedAssetAddress
    ) {
      return availableAmount;
    }

    const amountMinusFees = availableAmount
      .minus(displayGasFee.totalDisplayAmount)
      .decimalPlaces(6);

    return BigNumber.max(amountMinusFees, 0);
  }, [selectedAssetAddress, availableAmount, displayGasFee]);

  const validationResult = useMemo((): ValidationResult => {
    return validateTransferForm({
      source: {
        walletAddress: sourceAddress,
        isShieldedAddress: isShieldedAddress(sourceAddress ?? ""),
        selectedAssetAddress: selectedAssetAddress,
        amount: displayAmount,
        ledgerAccountInfo,
      },
      destination: {
        walletAddress: destinationAddress,
        isShieldedAddress: isShieldedAddress(destinationAddress ?? ""),
        chain: undefined,
      },
      gasConfig,
      availableAmountMinusFees,
      keychainVersion,
      availableAssets,
      displayGasFeeAmount: displayGasFee?.totalDisplayAmount,
    });
  }, [
    sourceAddress,
    selectedAssetAddress,
    displayAmount,
    ledgerAccountInfo,
    gasConfig,
    availableAmountMinusFees,
    keychainVersion,
    availableAssets,
    displayGasFee,
  ]);

  const {
    submitTransfer,
    isPending: isPerformingTransfer,
    isSuccess,
    error,
    feeProps,
  } = useTransactionResolver({
    selectedAsset,
    chainId,
    rpcUrl,
    sourceAddress,
    destinationAddress,
    customAddress,
    shieldedAccount,
    transparentAccount,
    activeKeplrWalletAddress,
    keplrRegistry,
    sourceChannel,
    destinationChannel,
    displayAmount,
    isTargetShielded,
    isSourceShielded,
    isShielding,
    isUnshielding,
    setCurrentStatus,
    setCurrentStatusExplanation,
    setStatusExplanation,
    setGeneralErrorMessage,
    setTxHash,
    setRefundTarget,
    setLedgerStatusStop,
    determineTransferType,
  });

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!displayAmount) throw new Error("Amount is not valid");
    if (!sourceAddress || !destinationAddress)
      throw new Error("Address is not provided");
    if (!selectedAsset) throw new Error("Asset is not selected");

    submitTransfer({
      displayAmount: displayAmount.toString(),
      destinationAddress,
      sourceAddress,
      memo,
    });
  };

  useEffect(() => {
    if (!sourceAddress && transparentAddress) {
      setSourceAddress(transparentAddress);
    }
  }, [transparentAddress]);

  useEffect(() => {
    if (isPerformingTransfer) setLedgerStatus(isPerformingTransfer);
  }, [isPerformingTransfer]);

  useEffect(() => {
    setSourceChannel(ibcChannels?.ibcChannel || "");
    setDestinationChannel(ibcChannels?.namadaChannel || "");
  }, [ibcChannels]);

  const isSubmitting = isPerformingTransfer || isSuccess;
  const requiresIbcChannels = !isLoadingIbcChannels && unknownIbcChannels;
  const customAddress =
    (
      isIbcAddress(destinationAddress ?? "") &&
      destinationAddress &&
      destinationAddress !== activeKeplrWalletAddress
    ) ?
      destinationAddress
    : undefined;

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
            isLoadingAssets={isLoadingAccounts || isLoadingUsersAssets}
            isShieldingTxn={isTargetShielded}
            availableAmount={availableAmount}
            availableAmountMinusFees={availableAmountMinusFees}
            amount={displayAmount}
            selectedTokenType={selectedTokenType}
            openAssetSelector={
              !isSubmitting ? () => setAssetSelectorModalOpen(true) : undefined
            }
            onChangeAmount={setDisplayAmount}
            onChangeWalletAddress={setSourceAddress}
            isSubmitting={isSubmitting}
          />
          <i className="flex items-center justify-center w-11 mx-auto -my-8 relative z-10">
            <TransferArrow
              color={
                isShieldedAddress(destinationAddress ?? "") ? "#FF0" : "#FFF"
              }
              isAnimating={isSubmitting}
            />
          </i>
          <TransferDestination
            setDestinationAddress={setDestinationAddress}
            isShieldedAddress={isShieldedAddress(destinationAddress ?? "")}
            isShieldedTx={isShieldedTx}
            customAddress={customAddress}
            address={destinationAddress}
            onChangeAddress={setDestinationAddress}
            memo={memo}
            onChangeMemo={setMemo}
            feeProps={feeProps}
            gasDisplayAmount={displayGasFee?.totalDisplayAmount}
            gasAsset={displayGasFee?.asset}
            destinationAsset={selectedAsset?.asset}
            amount={displayAmount}
            isSubmitting={isSubmitting}
          />
          {isIbcAddress(sourceAddress ?? "") ||
            (isIbcAddress(destinationAddress) && requiresIbcChannels && (
              <IbcChannels
                isShielded={Boolean(
                  isShieldedAddress(sourceAddress ?? "") ||
                    isShieldedAddress(destinationAddress ?? "")
                )}
                sourceChannel={sourceChannel}
                onChangeSource={setSourceChannel}
                destinationChannel={destinationChannel}
                onChangeDestination={setDestinationChannel}
              />
            ))}
          {!isSubmitting && <InlineError errorMessage={generalErrorMessage} />}
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
        {completedAt && selectedAsset?.asset && displayAmount && (
          <SuccessAnimation
            asset={selectedAsset.asset}
            amount={displayAmount}
            onCompleteAnimation={redirectToTransactionPage}
          />
        )}
      </section>
      <SelectToken
        sourceAddress={sourceAddress || ""}
        setSourceAddress={setSourceAddress}
        isOpen={assetSelectorModalOpen}
        onClose={() => setAssetSelectorModalOpen(false)}
        onSelect={(selectedAssetWithAmount) => {
          setDisplayAmount(undefined);
          setSelectedAssetAddress(selectedAssetWithAmount.asset.address);
          setSelectedAssetWithAmount(selectedAssetWithAmount);
          setAssetSelectorModalOpen(false);
        }}
      />
    </>
  );
};
