import { Panel } from "@namada/components";
import { AccountType } from "@namada/types";
import { NamadaTransferTopHeader } from "App/NamadaTransfer/NamadaTransferTopHeader";
import { TransferModule } from "App/Transfer/TransferModule";
import { OnSubmitTransferParams } from "App/Transfer/types";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { namadaTransparentAssetsAtom } from "atoms/balance";
import { chainParametersAtom } from "atoms/chain/atoms";
import { ledgerStatusDataAtom } from "atoms/ledger";
import { rpcUrlAtom } from "atoms/settings";
import BigNumber from "bignumber.js";
import { useTransactionActions } from "hooks/useTransactionActions";
import { useTransfer } from "hooks/useTransfer";
import invariant from "invariant";
import { useAtom, useAtomValue } from "jotai";
import { createTransferDataFromNamada } from "lib/transactions";
import { useEffect, useState } from "react";
import { AssetWithAmount } from "types";

interface MaspShieldProps {
  sourceAddress: string | undefined;
  setSourceAddress: (address: string | undefined) => void;
  destinationAddress: string | undefined;
  setDestinationAddress: (address: string | undefined) => void;
  assetSelectorModalOpen?: boolean;
  setAssetSelectorModalOpen?: (open: boolean) => void;
}

export const MaspShield = ({
  sourceAddress,
  setSourceAddress,
  destinationAddress,
  setDestinationAddress,
  assetSelectorModalOpen,
  setAssetSelectorModalOpen,
}: MaspShieldProps): JSX.Element => {
  //  COMPONENT STATE
  const [displayAmount, setDisplayAmount] = useState<BigNumber | undefined>();
  const [selectedAssetWithAmount, setSelectedAssetWithAmount] = useState<
    AssetWithAmount | undefined
  >();
  //  ERROR & STATUS STATE
  const [generalErrorMessage, setGeneralErrorMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [currentStatusExplanation, setCurrentStatusExplanation] = useState("");
  //  GLOBAL STATE
  const { storeTransaction } = useTransactionActions();
  const rpcUrl = useAtomValue(rpcUrlAtom);
  const chainParameters = useAtomValue(chainParametersAtom);
  const defaultAccounts = useAtomValue(allDefaultAccountsAtom);
  const { data: transparentAssets } = useAtomValue(namadaTransparentAssetsAtom);
  const [ledgerStatus, setLedgerStatusStop] = useAtom(ledgerStatusDataAtom);
  // DERIVED VALUES
  const transparentAddress = defaultAccounts.data?.find(
    (account) => account.type !== AccountType.ShieldedKeys
  )?.address;
  const ledgerAccountInfo = ledgerStatus && {
    deviceConnected: ledgerStatus.connected,
    errorMessage: ledgerStatus.errorMessage,
  };

  useEffect(() => {
    if (sourceAddress) return;
    if (transparentAddress) {
      setSourceAddress(transparentAddress);
    }
  }, [transparentAddress, sourceAddress, setSourceAddress]);

  const {
    execute: performTransfer,
    isPending: isPerformingTransfer,
    isSuccess,
    error,
    txKind,
    feeProps,
    completedAt,
    redirectToTransactionPage,
  } = useTransfer({
    source: sourceAddress ?? "",
    target: destinationAddress ?? "",
    token: selectedAssetWithAmount?.asset.address ?? "",
    displayAmount: displayAmount ?? new BigNumber(0),
    onUpdateStatus: setCurrentStatus,
    onBeforeBuildTx: () => {
      setCurrentStatus("Generating MASP Parameters...");
      setCurrentStatusExplanation(
        "Generating MASP parameters can take a few seconds. Please wait..."
      );
    },
    onBeforeSign: () => {
      setCurrentStatus("Waiting for signature...");
    },
    onBeforeBroadcast: async () => {
      setCurrentStatus("Broadcasting Shielding transaction...");
    },
    onError: async (originalError) => {
      setCurrentStatus("");
      setCurrentStatusExplanation("");
      setGeneralErrorMessage((originalError as Error).message);
    },
    asset: selectedAssetWithAmount?.asset,
  });

  const onSubmitTransfer = async ({
    memo,
  }: OnSubmitTransferParams): Promise<void> => {
    try {
      setGeneralErrorMessage("");
      setCurrentStatus("");

      invariant(sourceAddress, "Source address is not defined");
      invariant(chainParameters.data?.chainId, "Chain ID is undefined");
      invariant(selectedAssetWithAmount, "No asset is selected");

      const txResponse = await performTransfer({ memo });

      if (txResponse) {
        const txList = createTransferDataFromNamada(
          txKind,
          selectedAssetWithAmount.asset,
          rpcUrl,
          true,
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
    }
  };

  // We stop the ledger status check when the transfer is in progress
  setLedgerStatusStop(isPerformingTransfer);

  return (
    <Panel className="rounded-sm flex flex-col flex-1 py-9">
      <header className="flex flex-col items-center text-center mb-8 gap-6">
        <NamadaTransferTopHeader
          isSourceShielded={false}
          isDestinationShielded={true}
        />
      </header>
      <TransferModule
        source={{
          address: sourceAddress,
          selectedAssetWithAmount,
          availableAmount: selectedAssetWithAmount?.amount,
          amount: displayAmount,
          ledgerAccountInfo,
          onChangeSelectedAsset: setSelectedAssetWithAmount,
          onChangeAmount: setDisplayAmount,
          onChangeAddress: setSourceAddress,
        }}
        destination={{
          address: destinationAddress,
          isShieldedAddress: true,
          onChangeAddress: setDestinationAddress,
        }}
        feeProps={feeProps}
        isSubmitting={isPerformingTransfer || isSuccess}
        errorMessage={generalErrorMessage || error?.message}
        currentStatus={currentStatus}
        currentStatusExplanation={currentStatusExplanation}
        onSubmitTransfer={onSubmitTransfer}
        completedAt={completedAt}
        onComplete={redirectToTransactionPage}
        assetSelectorModalOpen={assetSelectorModalOpen}
        setAssetSelectorModalOpen={setAssetSelectorModalOpen}
      />
    </Panel>
  );
};
