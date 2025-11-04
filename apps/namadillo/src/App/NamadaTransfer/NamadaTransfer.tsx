import { Panel } from "@namada/components";
import { params } from "App/routes";
import { isShieldedAddress } from "App/Transfer/common";
import { TransferModule } from "App/Transfer/TransferModule";
import { OnSubmitTransferParams } from "App/Transfer/types";
import { chainParametersAtom } from "atoms/chain/atoms";
import { namadaRegistryChainAssetsMapAtom } from "atoms/integrations";
import { ledgerStatusDataAtom } from "atoms/ledger";
import { rpcUrlAtom } from "atoms/settings";
import { transferAmountAtom } from "atoms/transfer/atoms";
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
import { Asset } from "types";
import { NamadaTransferTopHeader } from "./NamadaTransferTopHeader";

interface NamadaTransferProps {
  sourceAddress: string;
  setSourceAddress: (address?: string) => void;
  destinationAddress: string;
  setDestinationAddress: (address?: string) => void;
  assetSelectorModalOpen?: boolean;
  setAssetSelectorModalOpen?: (open: boolean) => void;
  assetSymbol?: string;
  setAssetSymbol: (symbol: string) => void;
}

export const NamadaTransfer = ({
  sourceAddress,
  setSourceAddress,
  destinationAddress,
  setDestinationAddress,
  assetSelectorModalOpen,
  setAssetSelectorModalOpen,
  assetSymbol,
}: NamadaTransferProps): JSX.Element => {
  //  URL STATE
  const [searchParams] = useSearchParams();
  const shieldedParam = searchParams.get(params.shielded);
  //  COMPONENT STATE
  const [displayAmount, setDisplayAmount] = useAtom(transferAmountAtom);
  const [customAddress] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const chainAssets = useAtomValue(namadaRegistryChainAssetsMapAtom);
  const asset = Object.values(chainAssets.data || {})?.find(
    (a) => a.symbol === assetSymbol
  );
  const [selectedAsset, setSelectedAsset] = useState<Asset | undefined>(asset);
  //  ERROR & STATUS STATE
  const [generalErrorMessage, setGeneralErrorMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [currentStatusExplanation, setCurrentStatusExplanation] = useState("");
  //  GLOBAL STATE
  const requiresNewShieldedSync = useRequiresNewShieldedSync();
  const chainParameters = useAtomValue(chainParametersAtom);
  const rpcUrl = useAtomValue(rpcUrlAtom);
  const [ledgerStatus, setLedgerStatusStop] = useAtom(ledgerStatusDataAtom);
  const { trackEvent } = useFathomTracker();
  const { storeTransaction } = useTransactionActions();
  // DERIVED VALUES
  const shielded = useMemo(() => {
    if (requiresNewShieldedSync) {
      return false;
    }
    return shieldedParam ? shieldedParam === "1" : true;
  }, [shieldedParam, requiresNewShieldedSync]);
  const ledgerAccountInfo = ledgerStatus && {
    deviceConnected: ledgerStatus.connected,
    errorMessage: ledgerStatus.errorMessage,
  };

  const {
    execute: performTransfer,
    isPending: isPerformingTransfer,
    isSuccess: isTransferSuccessful,
    txKind,
    feeProps,
    completedAt,
    redirectToTransactionPage,
  } = useTransfer({
    source: sourceAddress ?? "",
    target: destinationAddress ?? "",
    token: asset?.address ?? "",
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
    asset,
  });

  const isSourceShielded = isShieldedAddress(sourceAddress ?? "");
  const isTargetShielded = isShieldedAddress(destinationAddress ?? "");

  const onSubmitTransfer = async ({
    memo,
  }: OnSubmitTransferParams): Promise<void> => {
    try {
      setGeneralErrorMessage("");
      invariant(sourceAddress, "Source address is not defined");
      invariant(chainParameters.data?.chainId, "Chain ID is undefined");
      invariant(asset, "No asset is selected");
      invariant(
        sourceAddress !== customAddress,
        "The recipient address must differ from the sender address"
      );

      const txResponse = await performTransfer({ memo });
      if (txResponse) {
        const txList = createTransferDataFromNamada(
          txKind,
          asset,
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
          isDestinationShielded={
            destinationAddress ? isTargetShielded : undefined
          }
        />
      </header>
      <TransferModule
        source={{
          address: sourceAddress,
          selectedAsset,
          amount: displayAmount,
          ledgerAccountInfo,
          onChangeAddress: setSourceAddress,
          onChangeSelectedAsset: setSelectedAsset,
          onChangeAmount: setDisplayAmount,
        }}
        destination={{
          customAddress: destinationAddress,
          onChangeAddress: setDestinationAddress,
          address: destinationAddress,
          isShieldedAddress: isShieldedAddress(destinationAddress ?? ""),
          memo,
          onChangeMemo: setMemo,
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
        assetSelectorModalOpen={assetSelectorModalOpen}
        setAssetSelectorModalOpen={setAssetSelectorModalOpen}
      />
    </Panel>
  );
};
