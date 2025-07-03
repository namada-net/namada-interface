import { ActionButton, Stack } from "@namada/components";
import { IconTooltip } from "App/Common/IconTooltip";
import { InlineError } from "App/Common/InlineError";
import { params, routes } from "App/routes";
import { allDefaultAccountsAtom } from "atoms/accounts";
import {
  namadaShieldedAssetsAtom,
  namadaTransparentAssetsAtom,
} from "atoms/balance";
import { chainAssetsMapAtom, chainParametersAtom } from "atoms/chain";
import { ledgerStatusDataAtom } from "atoms/ledger";
import { rpcUrlAtom } from "atoms/settings";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { trackEvent } from "fathom-client";
import { useKeychainVersion } from "hooks/useKeychainVersion";
import { useTransactionActions } from "hooks/useTransactionActions";
import { useTransfer } from "hooks/useTransfer";
import { useUrlState } from "hooks/useUrlState";
import invariant from "invariant";
import { useAtom, useAtomValue } from "jotai";
import { createTransferDataFromNamada } from "lib/transactions";
import { useEffect, useMemo, useState } from "react";
import { BsQuestionCircleFill } from "react-icons/bs";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AddressWithAssetAndAmountMap } from "types";
import { filterAvailableAssetsWithBalance } from "utils/assets";
import { getDisplayGasFee } from "utils/gas";
import {
  isShieldedAddress,
  isTransparentAddress,
  parseChainInfo,
} from "./common";
import { CurrentStatus } from "./CurrentStatus";
import { IbcChannels } from "./IbcChannels";
import { SelectToken } from "./SelectToken";
import { SuccessAnimation } from "./SuccessAnimation";
import { TransferArrow } from "./TransferArrow";
import { TransferDestination } from "./TransferDestination";
import { TransferSource } from "./TransferSource";
import {
  OnSubmitTransferParams,
  TransferModuleProps,
  ValidationResult,
} from "./types";
import { getButtonText, validateTransferForm } from "./utils";

export const TransferModule = ({
  source,
  destination,
  changeFeeEnabled,
  submittingText,
  isIbcTransfer,
  ibcOptions,
  requiresIbcChannels,
  buttonTextErrors = {},
}: TransferModuleProps): JSX.Element => {
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const { storeTransaction } = useTransactionActions();
  const transparentAddress = accounts?.find((acc) =>
    isTransparentAddress(acc.address)
  )?.address;
  const [displayAmount, setDisplayAmount] = useState<BigNumber | undefined>();
  const [generalErrorMessage, setGeneralErrorMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [currentStatusExplanation, setCurrentStatusExplanation] = useState("");
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
  const ledgerAccountInfo = ledgerStatus && {
    deviceConnected: ledgerStatus.connected,
    errorMessage: ledgerStatus.errorMessage,
  };
  const chainParameters = useAtomValue(chainParametersAtom);
  const chainAssetsMap = useAtomValue(chainAssetsMapAtom);
  const chainId = chainParameters.data?.chainId;
  const rpcUrl = useAtomValue(rpcUrlAtom);

  const { data: usersAssets } = useAtomValue(
    isShieldedAddress(sourceAddress ?? "") ?
      namadaShieldedAssetsAtom
    : namadaTransparentAssetsAtom
  );
  const navigate = useNavigate();
  const location = useLocation();
  const keychainVersion = useKeychainVersion();

  const selectedAsset =
    selectedAssetAddress ? usersAssets?.[selectedAssetAddress] : undefined;

  const selectedTokenType: "shielded" | "transparent" | "keplr" =
    useMemo(() => {
      if (isTransparentAddress(sourceAddress ?? "")) return "transparent";
      if (isShieldedAddress(sourceAddress ?? "")) return "shielded";
      return "keplr";
    }, [sourceAddress]);

  const availableAmount = selectedAsset?.amount;
  const availableAssets: AddressWithAssetAndAmountMap = useMemo(() => {
    return filterAvailableAssetsWithBalance(usersAssets);
  }, [usersAssets]);

  const isTargetShielded = isShieldedAddress(destinationAddress ?? "");
  const isSourceShielded = isShieldedAddress(sourceAddress ?? "");
  const buttonColor = isTargetShielded || isSourceShielded ? "yellow" : "white";

  const getButtonTextFromValidation = (): string =>
    getButtonText({
      isSubmitting,
      submittingText,
      validationResult,
      availableAmountMinusFees,
      buttonTextErrors,
    });

  const {
    execute: performTransfer,
    isPending: isPerformingTransfer,
    isSuccess,
    // error,
    // txHash,
    txKind,
    feeProps,
    completedAt,
    redirectToTransactionPage,
  } = useTransfer({
    source: sourceAddress ?? "",
    target: destinationAddress ?? "",
    token: selectedAsset?.originalAddress ?? "",
    displayAmount: displayAmount ?? new BigNumber(0),
    onUpdateStatus: setCurrentStatus,
    onBeforeBuildTx: () => {
      if (isShieldedAddress(sourceAddress ?? "")) {
        setCurrentStatus("Generating MASP Parameters...");
        setCurrentStatusExplanation(
          "Generating MASP parameters can take a few seconds. Please wait..."
        );
      } else {
        setCurrentStatus("Preparing transaction...");
        setCurrentStatusExplanation("");
      }
    },
    onBeforeSign: () => {
      setCurrentStatus("Waiting for signature...");
      setCurrentStatusExplanation("");
    },
    onBeforeBroadcast: async () => {
      const transferType =
        isTargetShielded ? "Shielding"
        : isSourceShielded ? "unshielding"
        : "";
      setCurrentStatus(`Broadcasting ${transferType} transaction...`);
    },
    onError: async () => {
      setCurrentStatus("");
      setCurrentStatusExplanation("");
    },
    asset: selectedAsset?.asset,
  });

  const gasConfig = feeProps?.gasConfig;
  const displayGasFee = useMemo(() => {
    return gasConfig ? getDisplayGasFee(gasConfig, chainAssetsMap) : undefined;
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
        chain: source.chain,
        selectedAssetAddress: selectedAssetAddress,
        amount: displayAmount,
        ledgerAccountInfo,
      },
      destination,
      gasConfig,
      availableAmountMinusFees,
      keychainVersion,
      availableAssets,
      displayGasFeeAmount: displayGasFee?.totalDisplayAmount,
    });
  }, [
    source,
    destination,
    gasConfig,
    availableAmountMinusFees,
    keychainVersion,
    availableAssets,
    displayGasFee,
  ]);

  const onSubmitTransfer = async ({
    memo,
  }: OnSubmitTransferParams): Promise<void> => {
    try {
      setGeneralErrorMessage("");
      setCurrentStatus("");

      // Enhanced validation
      invariant(sourceAddress, "Source address is not defined");
      invariant(chainId, "Chain ID is undefined");
      invariant(selectedAsset, "No asset is selected");

      // Prevent self-transfers when target validation is available
      if (destinationAddress && sourceAddress === destinationAddress) {
        invariant(
          false,
          "The recipient address must differ from the sender address"
        );
      }

      const txResponse = await performTransfer({ memo });

      if (txResponse) {
        const txList = createTransferDataFromNamada(
          txKind,
          selectedAsset.asset,
          rpcUrl,
          isTargetShielded ?? false, // Use dynamic value with fallback
          txResponse,
          memo
        );

        if (txList.length === 0) {
          throw "Couldn't create TransferData object";
        }

        const tx = txList[0];
        storeTransaction(tx);

        // Optional: Track success event if tracking is available
        if (typeof trackEvent === "function") {
          const transferType = determineTransferType(
            isSourceShielded,
            isTargetShielded
          );
          trackEvent(`${transferType} Transfer: complete`);
        }
      } else {
        throw "Invalid transaction response";
      }
    } catch (err) {
      setGeneralErrorMessage(err + "");

      // Optional: Track error event if tracking is available
      if (typeof trackEvent === "function") {
        const transferType = determineTransferType(
          isSourceShielded,
          isTargetShielded
        );
        trackEvent(`${transferType} Transfer: error`);
      }
    }
  };

  const determineTransferType = (
    isSourceShielded?: boolean,
    isTargetShielded?: boolean
  ): string => {
    if (isSourceShielded || isTargetShielded) {
      return "Shielded";
    }
    return "Transparent";
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const address = destination.customAddress || destination.walletAddress;
    if (!displayAmount) throw new Error("Amount is not valid");
    if (!address) throw new Error("Address is not provided");
    if (!selectedAssetAddress) throw new Error("Asset is not selected");

    const params: OnSubmitTransferParams = {
      displayAmount: displayAmount ?? new BigNumber(0),
      destinationAddress: address.trim(),
      sourceAddress: sourceAddress ?? "",
      memo,
    };

    onSubmitTransfer(params);
  };

  useEffect(() => {
    if (!sourceAddress && transparentAddress) {
      setSourceAddress(transparentAddress);
    }
  }, [transparentAddress]);

  useEffect(() => {
    if (isPerformingTransfer) setLedgerStatus(isPerformingTransfer);
  }, [isPerformingTransfer]);

  const isSubmitting = isPerformingTransfer || isSuccess;

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
            originalAddress={selectedAsset?.originalAddress}
            isLoadingAssets={source.isLoadingAssets}
            isShieldingTxn={isTargetShielded}
            chain={parseChainInfo(
              source.chain,
              isShieldedAddress(sourceAddress ?? "")
            )}
            availableAmount={availableAmount}
            availableAmountMinusFees={availableAmountMinusFees}
            amount={displayAmount}
            selectedTokenType={selectedTokenType}
            openAssetSelector={
              source.onChangeSelectedAsset && !isSubmitting ?
                () => setAssetSelectorModalOpen(true)
              : undefined
            }
            onChangeAmount={setDisplayAmount}
            onChangeWalletAddress={setSourceAddress}
            isSubmitting={isSubmitting}
          />
          <i className="flex items-center justify-center w-11 mx-auto -my-8 relative z-10">
            <TransferArrow
              color={destination.isShieldedAddress ? "#FF0" : "#FFF"}
              isAnimating={isSubmitting}
            />
          </i>
          <TransferDestination
            walletAddress={destinationAddress}
            chain={parseChainInfo(
              destination.chain,
              destination.isShieldedAddress
            )}
            setDestinationAddress={setDestinationAddress}
            isShieldedAddress={isShieldedAddress(destinationAddress ?? "")}
            isShieldedTx={isShieldedTx}
            address={destinationAddress}
            onChangeAddress={setDestinationAddress}
            memo={memo}
            onChangeMemo={setMemo}
            feeProps={feeProps}
            changeFeeEnabled={changeFeeEnabled}
            gasDisplayAmount={displayGasFee?.totalDisplayAmount}
            gasAsset={displayGasFee?.asset}
            destinationAsset={selectedAsset?.asset}
            amount={displayAmount}
            isSubmitting={isSubmitting}
          />
          {isIbcTransfer && requiresIbcChannels && (
            <IbcChannels
              isShielded={Boolean(
                isShieldedAddress(sourceAddress ?? "") ||
                  destination.isShieldedAddress
              )}
              sourceChannel={ibcOptions.sourceChannel}
              onChangeSource={ibcOptions.onChangeSourceChannel}
              destinationChannel={ibcOptions.destinationChannel}
              onChangeDestination={ibcOptions.onChangeDestinationChannel}
            />
          )}
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
        {completedAt && selectedAsset?.asset && source.amount && (
          <SuccessAnimation
            asset={selectedAsset.asset}
            amount={source.amount}
            onCompleteAnimation={redirectToTransactionPage}
          />
        )}
      </section>
      <SelectToken
        sourceAddress={sourceAddress || ""}
        setSourceAddress={setSourceAddress}
        isOpen={assetSelectorModalOpen}
        onClose={() => setAssetSelectorModalOpen(false)}
        onSelect={(asset) => {
          source.onChangeAmount?.(undefined);
          setSelectedAssetAddress(asset);
          setAssetSelectorModalOpen(false);
        }}
      />
    </>
  );
};
