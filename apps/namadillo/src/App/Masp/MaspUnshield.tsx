import { Alert, Panel, Stack } from "@namada/components";
import { AccountType } from "@namada/types";
import { MaspSyncCover } from "App/Common/MaspSyncCover";
import { NamadaTransferTopHeader } from "App/NamadaTransfer/NamadaTransferTopHeader";
import { params } from "App/routes";
import {
  OnSubmitTransferParams,
  TransferModule,
} from "App/Transfer/TransferModule";
import { allDefaultAccountsAtom } from "atoms/accounts";
import {
  estimateMaxMaspTxAmountAtom2,
  lastCompletedShieldedSyncAtom,
  namadaShieldedAssetsAtom,
} from "atoms/balance/atoms";
import { chainParametersAtom } from "atoms/chain/atoms";
import {
  namadaChainRegistryAtom,
  namadaRegistryChainAssetsMapAtom,
} from "atoms/integrations";
import { ledgerStatusDataAtom } from "atoms/ledger/atoms";
import { rpcUrlAtom } from "atoms/settings";
import BigNumber from "bignumber.js";
import { useRequiresNewShieldedSync } from "hooks/useRequiresNewShieldedSync";
import { useTransactionActions } from "hooks/useTransactionActions";
import { useTransfer } from "hooks/useTransfer";
import { useUrlState } from "hooks/useUrlState";
import { wallets } from "integrations";
import invariant from "invariant";
import { useAtom, useAtomValue } from "jotai";
import { createTransferDataFromNamada } from "lib/transactions";
import { useMemo, useState } from "react";
import { GoCheckCircle } from "react-icons/go";
import { toDisplayAmount } from "utils";
import { getDisplayGasFee } from "utils/gas";

export const MaspUnshield: React.FC = () => {
  const [displayAmount, setDisplayAmount] = useState<BigNumber | undefined>();
  const [generalErrorMessage, setGeneralErrorMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [currentStatusExplanation, setCurrentStatusExplanation] = useState("");
  const requiresNewSync = useRequiresNewShieldedSync();

  const rpcUrl = useAtomValue(rpcUrlAtom);
  const chainParameters = useAtomValue(chainParametersAtom);
  const defaultAccounts = useAtomValue(allDefaultAccountsAtom);
  const [ledgerStatus, setLedgerStatusStop] = useAtom(ledgerStatusDataAtom);
  const { data: availableAssets, isLoading: isLoadingAssets } = useAtomValue(
    namadaShieldedAssetsAtom
  );
  const namadaChainRegistry = useAtomValue(namadaChainRegistryAtom);
  const chain = namadaChainRegistry.data?.chain;
  const chainAssetsMap = useAtomValue(namadaRegistryChainAssetsMapAtom);

  const { storeTransaction } = useTransactionActions();

  const ledgerAccountInfo = ledgerStatus && {
    deviceConnected: ledgerStatus.connected,
    errorMessage: ledgerStatus.errorMessage,
  };
  const chainId = chainParameters.data?.chainId;
  const account = defaultAccounts.data?.find(
    (account) => account.type === AccountType.ShieldedKeys
  );
  const sourceAddress = account?.address;
  const destinationAddress = defaultAccounts.data?.find(
    (account) => account.type !== AccountType.ShieldedKeys
  )?.address;

  const [selectedAssetAddress, setSelectedAssetAddress] = useUrlState(
    params.asset
  );
  const lastSync = useAtomValue(lastCompletedShieldedSyncAtom);
  const selectedAsset =
    selectedAssetAddress ? availableAssets?.[selectedAssetAddress] : undefined;

  const {
    execute: performTransfer,
    isPending: isPerformingTransfer,
    isSuccess,
    txKind,
    feeProps,
    completedAt,
    redirectToTransactionPage,
  } = useTransfer({
    source: sourceAddress ?? "",
    target: destinationAddress ?? "",
    token: selectedAsset?.asset.address ?? "",
    displayAmount: displayAmount ?? new BigNumber(0),
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
      setCurrentStatus("Broadcasting unshielding transaction...");
    },
    onError: async (originalError) => {
      setCurrentStatus("");
      setCurrentStatusExplanation("");
      setGeneralErrorMessage((originalError as Error).message);
    },
    asset: selectedAsset?.asset,
  });

  const onSubmitTransfer = async ({
    memo,
  }: OnSubmitTransferParams): Promise<void> => {
    try {
      setGeneralErrorMessage("");

      invariant(sourceAddress, "Source address is not defined");
      invariant(chainId, "Chain ID is undefined");
      invariant(selectedAsset, "No asset is selected");

      const txResponse = await performTransfer({ memo });

      if (txResponse) {
        const txList = createTransferDataFromNamada(
          txKind,
          selectedAsset.asset,
          rpcUrl,
          false,
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

  const maxAmount = useMemo(() => {
    if (!selectedAsset) {
      return BigNumber(0);
    }
    const { gasToken } = feeProps.gasConfig;
    const token = selectedAsset.asset.address;

    const displayGas = getDisplayGasFee(
      feeProps.gasConfig,
      chainAssetsMap.data || {}
    );
    const amount =
      token === gasToken ?
        selectedAsset.amount.minus(displayGas.totalDisplayAmount)
      : selectedAsset.amount;

    return amount;
  }, [selectedAsset?.asset.address]);

  // const maxMaspTxAmountAtom = useMemo(() => {
  //   let props: MaxMaspTxAmountProps | null;
  //   if (!account || !destinationAddress || !selectedAsset) {
  //     props = null;
  //   } else {
  //     props = {
  //       maxNotes: 6,
  //       source: account.pseudoExtendedKey!,
  //       target: destinationAddress,
  //       token: selectedAsset.asset.address,
  //       feeToken: feeProps.gasConfig.gasToken,
  //       amount:
  //         isNamadaAsset(selectedAsset.asset) ?
  //           maxAmount.toString()
  //         : toBaseAmount(selectedAsset.asset, maxAmount).toString(),
  //       feeAmount: feeProps.gasConfig.gasPriceInMinDenom
  //         .times(feeProps.gasConfig.gasLimit)
  //         .toString(),
  //     };
  //   }

  //   return estimateMaxMaspTxAmountAtom(props);
  // }, [
  //   selectedAsset?.asset.address,
  //   feeProps.gasConfig.gasToken,
  //   feeProps?.gasConfig.gasLimit.toString(),
  //   account?.pseudoExtendedKey,
  //   destinationAddress,
  // ]);

  // const maxMaspTxAmountQuery = useAtomValue(maxMaspTxAmountAtom);
  const maxMaspTxAmountQuery = useAtomValue(
    estimateMaxMaspTxAmountAtom2({
      token: selectedAsset?.asset.address,
      feeToken: feeProps.gasConfig.gasToken,
    })
  );

  const [maxMASPAmount, displayWarning] = useMemo(() => {
    const { data } = maxMaspTxAmountQuery;
    if (!data || !selectedAsset) {
      return [BigNumber(0), false];
    }
    const max = toDisplayAmount(selectedAsset.asset, data);

    return [max, max.lt(maxAmount)];
  }, [
    maxMaspTxAmountQuery.data?.toString(),
    maxAmount,
    selectedAsset?.asset.address,
  ]);

  // We stop the ledger status check when the transfer is in progress
  setLedgerStatusStop(isPerformingTransfer);

  return (
    <Panel className="relative rounded-sm flex flex-col flex-1 pt-9">
      <header className="flex flex-col items-center text-center mb-8 gap-6">
        <NamadaTransferTopHeader
          isSourceShielded={true}
          isDestinationShielded={false}
        />
      </header>
      {maxMaspTxAmountQuery.isPending && (
        <Alert type="warning" className="w-[480px] mx-auto mb-4">
          <Stack direction="horizontal" gap={3} className="items-center">
            <i
              className={
                "block w-6 h-6 border-2 border-transparent border-t-yellow rounded-[50%] animate-loadingSpinner"
              }
            />
            <p>Calculating the maximum amount you can unshield this time... </p>
          </Stack>
        </Alert>
      )}
      {!maxMaspTxAmountQuery.isPending && displayWarning && (
        <Alert type="warning" className="w-[480px] mx-auto mb-4">
          <p>
            Due to ledger BS we have to limit the amount that you can unshield
            at this time to <b>{maxMASPAmount.toString()}</b>
            <br />
            After tx is successful, you will be able to unshield more
          </p>
        </Alert>
      )}
      {!displayWarning && !maxMaspTxAmountQuery.isPending && (
        <Alert
          type="success"
          className="w-[480px] mx-auto mb-4 text-black bg-success"
        >
          <Stack direction="horizontal" gap={3} className="items-center">
            <GoCheckCircle className="w-6 h-6" />
            <p>You can unshield all the tokens</p>
          </Stack>
        </Alert>
      )}
      <TransferModule
        source={{
          isLoadingAssets: isLoadingAssets,
          availableAssets,
          selectedAssetAddress,
          availableAmount: selectedAsset?.amount,
          maxAmount:
            displayWarning && !maxMaspTxAmountQuery.isFetching ?
              maxMASPAmount
            : undefined,
          chain,
          availableWallets: [wallets.namada],
          wallet: wallets.namada,
          walletAddress: sourceAddress,
          isShieldedAddress: true,
          onChangeSelectedAsset: setSelectedAssetAddress,
          amount: displayAmount,
          onChangeAmount: setDisplayAmount,
          ledgerAccountInfo,
        }}
        destination={{
          chain,
          availableWallets: [wallets.namada],
          wallet: wallets.namada,
          walletAddress: destinationAddress,
          isShieldedAddress: false,
        }}
        feeProps={feeProps}
        isShieldedTx={true}
        isSubmitting={isPerformingTransfer || isSuccess}
        errorMessage={generalErrorMessage}
        onSubmitTransfer={onSubmitTransfer}
        currentStatus={currentStatus}
        currentStatusExplanation={currentStatusExplanation}
        completedAt={completedAt}
        onComplete={redirectToTransactionPage}
        buttonTextErrors={{
          NoAmount: "Define an amount to unshield",
        }}
      />
      {requiresNewSync && <MaspSyncCover longSync={lastSync === undefined} />}
    </Panel>
  );
};
