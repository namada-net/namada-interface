import { Panel } from "@namada/components";
import { AccountType } from "@namada/types";
import { params, routes } from "App/routes";
import { TransferModule } from "App/Transfer/TransferModule";
import { OnSubmitTransferParams } from "App/Transfer/types";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { chainParametersAtom } from "atoms/chain/atoms";
import { ledgerStatusDataAtom } from "atoms/ledger";
import { rpcUrlAtom } from "atoms/settings";
import { transferAmountAtom } from "atoms/transfer/atoms";
import BigNumber from "bignumber.js";
import { useTransactionActions } from "hooks/useTransactionActions";
import { useTransfer } from "hooks/useTransfer";
import invariant from "invariant";
import { useAtom, useAtomValue } from "jotai";
import { createTransferDataFromNamada } from "lib/transactions";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AssetWithAmountAndChain } from "types";
interface MaspShieldProps {
  sourceAddress: string;
  setSourceAddress: (address?: string) => void;
  destinationAddress: string;
  setDestinationAddress: (address?: string) => void;
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
  const [displayAmount, setDisplayAmount] = useAtom(transferAmountAtom);
  const [selectedAssetWithAmount, setSelectedAssetWithAmount] = useState<
    AssetWithAmountAndChain | undefined
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
  const [ledgerStatus, setLedgerStatusStop] = useAtom(ledgerStatusDataAtom);
  // DERIVED VALUES
  const transparentAddress = defaultAccounts.data?.find(
    (account) => account.type !== AccountType.ShieldedKeys
  )?.address;
  const shieldedAddress = defaultAccounts.data?.find(
    (account) => account.type === AccountType.ShieldedKeys
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
      <header className="text-yellow text-center mb-8 gap-6">Shield</header>
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
      <div className="flex flex-row font-normal justify-center mt-10 gap-2">
        <h4>Looking to Unshield tokens?</h4>
        <Link
          className="text-yellow underline"
          to={`${routes.transfer}?${params.source}=${shieldedAddress || ""}&${params.destination}=${transparentAddress}`}
          title={`View pending transactions`}
        >
          Click here.
        </Link>
      </div>
    </Panel>
  );
};
