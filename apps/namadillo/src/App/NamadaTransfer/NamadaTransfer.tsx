import { Panel } from "@namada/components";
import { params } from "App/routes";
import { isShieldedAddress, isTransparentAddress } from "App/Transfer/common";
import { TransferModule } from "App/Transfer/TransferModule";
import { OnSubmitTransferParams } from "App/Transfer/types";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { chainParametersAtom } from "atoms/chain/atoms";
import { ledgerStatusDataAtom } from "atoms/ledger";
import { rpcUrlAtom } from "atoms/settings";
import BigNumber from "bignumber.js";
import { useFathomTracker } from "hooks/useFathomTracker";
import { useRequiresNewShieldedSync } from "hooks/useRequiresNewShieldedSync";
import { useTransactionActions } from "hooks/useTransactionActions";
import { useTransfer } from "hooks/useTransfer";
import invariant from "invariant";
import { useAtom, useAtomValue } from "jotai";
import { createTransferDataFromNamada } from "lib/transactions";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AssetWithAmount } from "types";
import { NamadaTransferTopHeader } from "./NamadaTransferTopHeader";

export const NamadaTransfer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [displayAmount, setDisplayAmount] = useState<BigNumber | undefined>();
  const [customAddress, setCustomAddress] = useState<string>("");
  const [generalErrorMessage, setGeneralErrorMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [currentStatusExplanation, setCurrentStatusExplanation] = useState("");
  const shieldedParam = searchParams.get(params.shielded);
  const requiresNewShieldedSync = useRequiresNewShieldedSync();

  const shielded = useMemo(() => {
    if (requiresNewShieldedSync) {
      return false;
    }
    return shieldedParam ? shieldedParam === "1" : true;
  }, [shieldedParam, requiresNewShieldedSync]);
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const chainParameters = useAtomValue(chainParametersAtom);
  const transparentAddress = accounts?.find((acc) =>
    isTransparentAddress(acc.address)
  )?.address;
  const shieldedAddress = accounts?.find((acc) =>
    isShieldedAddress(acc.address)
  )?.address;

  const [selectedAssetWithAmount, setSelectedAssetWithAmount] = useState<
    AssetWithAmount | undefined
  >();

  const [sourceAddress, setSourceAddress] = useState<string>(
    shielded ? (shieldedAddress ?? "") : (transparentAddress ?? "")
  );

  const rpcUrl = useAtomValue(rpcUrlAtom);
  const [ledgerStatus, setLedgerStatusStop] = useAtom(ledgerStatusDataAtom);
  const { trackEvent } = useFathomTracker();

  const { storeTransaction } = useTransactionActions();

  const ledgerAccountInfo = ledgerStatus && {
    deviceConnected: ledgerStatus.connected,
    errorMessage: ledgerStatus.errorMessage,
  };

  const source = sourceAddress ?? "";
  const target = customAddress ?? "";

  const {
    execute: performTransfer,
    isPending: isPerformingTransfer,
    isSuccess: isTransferSuccessful,
    txKind,
    feeProps,
    completedAt,
    redirectToTransactionPage,
  } = useTransfer({
    source,
    target,
    token: selectedAssetWithAmount?.asset.address ?? "",
    displayAmount: displayAmount ?? new BigNumber(0),
    onBeforeBuildTx: () => {
      if (isSourceShielded) {
        setCurrentStatus("Generating MASP Parameters...");
        setCurrentStatusExplanation(
          "Generating MASP parameters can take a few seconds. Please wait..."
        );
      } else {
        setCurrentStatus("Preparing transaction...");
      }
    },
    onBeforeSign: () => {
      setCurrentStatus("Waiting for signature...");
      setCurrentStatusExplanation("");
    },
    onBeforeBroadcast: async () => {
      setCurrentStatus("Broadcasting transaction to Namada...");
    },
    onError: async (originalError) => {
      setCurrentStatus("");
      setCurrentStatusExplanation("");
      setGeneralErrorMessage((originalError as Error).message);
    },
    asset: selectedAssetWithAmount?.asset,
  });

  const isSourceShielded = isShieldedAddress(source);
  const isTargetShielded = isShieldedAddress(target);

  // TODO: Add this back in when we have a way to change the shielded param
  // const onChangeShielded = (isShielded: boolean): void => {
  //   setSearchParams(
  //     (currentParams) => {
  //       const newParams = new URLSearchParams(currentParams);
  //       newParams.set(params.shielded, isShielded ? "1" : "0");
  //       return newParams;
  //     },
  //     { replace: true }
  //   );
  // };

  const onSubmitTransfer = async ({
    memo,
  }: OnSubmitTransferParams): Promise<void> => {
    try {
      setGeneralErrorMessage("");
      invariant(sourceAddress, "Source address is not defined");
      invariant(chainParameters.data?.chainId, "Chain ID is undefined");
      invariant(selectedAssetWithAmount, "No asset is selected");
      invariant(
        sourceAddress !== customAddress,
        "The recipient address must differ from the sender address"
      );

      const txResponse = await performTransfer({ memo });
      if (txResponse) {
        const txList = createTransferDataFromNamada(
          txKind,
          selectedAssetWithAmount.asset,
          rpcUrl,
          isTargetShielded,
          txResponse,
          memo
        );

        // Currently we don't have the option of batching transfer transactions
        if (txList.length === 0) {
          throw "Couldn't create TransferData object";
        }

        // We have to use the last element from list in case we revealPK
        const tx = txList.pop()!;
        storeTransaction(tx);
        trackEvent(
          `${shielded ? "Shielded" : "Transparent"} Transfer: complete`
        );
      } else {
        throw "Invalid transaction response";
      }
    } catch (err) {
      // We only set the general error message if it is not already set by onError
      if (generalErrorMessage === "") {
        setGeneralErrorMessage(
          err instanceof Error ? err.message : String(err)
        );
      }
      trackEvent(`${shielded ? "Shielded" : "Transparent"} Transfer: error`);
    }
  };

  // We stop the ledger status check when the transfer is in progress
  setLedgerStatusStop(isPerformingTransfer);

  return (
    <Panel className="min-h-[600px] rounded-sm flex flex-col flex-1 py-9">
      <header className="flex flex-col items-center text-center mb-8 gap-6">
        <NamadaTransferTopHeader
          isSourceShielded={isSourceShielded}
          isDestinationShielded={target ? isTargetShielded : undefined}
        />
      </header>
      <TransferModule
        source={{
          availableAmount: selectedAssetWithAmount?.amount,
          address: sourceAddress,
          onChangeAddress: setSourceAddress,
          selectedAssetWithAmount,
          onChangeSelectedAsset: setSelectedAssetWithAmount,
          amount: displayAmount,
          onChangeAmount: setDisplayAmount,
          ledgerAccountInfo,
        }}
        destination={{
          customAddress,
          onChangeAddress: setCustomAddress,
          address: customAddress,
          isShieldedAddress: isShieldedAddress(customAddress),
        }}
        feeProps={feeProps}
        currentStatus={currentStatus}
        currentStatusExplanation={currentStatusExplanation}
        isSubmitting={
          isPerformingTransfer || isTransferSuccessful || Boolean(completedAt)
        }
        errorMessage={generalErrorMessage}
        onSubmitTransfer={onSubmitTransfer}
        completedAt={completedAt}
        onComplete={redirectToTransactionPage}
      />
    </Panel>
  );
};
