import { Alert, Panel } from "@namada/components";
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
  lastCompletedShieldedSyncAtom,
  maspNotesAtom,
  namadaShieldedAssetsAtom,
} from "atoms/balance/atoms";
import { chainParametersAtom } from "atoms/chain/atoms";
import { namadaChainRegistryAtom } from "atoms/integrations";
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
import { useEffect, useState } from "react";
import { toDisplayAmount } from "utils";

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

  const { storeTransaction } = useTransactionActions();

  const ledgerAccountInfo = ledgerStatus && {
    deviceConnected: ledgerStatus.connected,
    errorMessage: ledgerStatus.errorMessage,
  };
  const chainId = chainParameters.data?.chainId;
  const account = defaultAccounts.data?.find(
    (account) => account.type === AccountType.ShieldedKeys
  );
  const isLedgerAccount = defaultAccounts.data?.some(
    (account) => account.type === AccountType.Ledger
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

  const notesAtom = useAtomValue(maspNotesAtom);
  const [notes, setNotes] = useState([] as [string, BigNumber][]);
  const [availableToSpend, setAvailableToSpend] = useState<BigNumber | null>();

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

  useEffect(() => {
    if (
      !isLedgerAccount ||
      !selectedAsset ||
      !notesAtom.isSuccess ||
      !feeProps
    ) {
      setNotes([]);
      return;
    }

    const www = notesAtom.data
      .filter(([token]) => token === selectedAsset.asset.address)
      .map(
        ([token, balance]) =>
          [token, toDisplayAmount(selectedAsset.asset, BigNumber(balance))] as [
            string,
            BigNumber,
          ]
      )
      .sort((a, b) => b[1].minus(a[1]).toNumber());

    const kappa = www.slice(0, 4).reduce((acc, [_, amount]) => {
      return acc.plus(amount);
    }, BigNumber(0));
    const gas = feeProps.gasConfig.gasLimit.times(
      feeProps.gasConfig.gasPriceInMinDenom
    );

    setNotes(www);
    setAvailableToSpend(kappa.minus(gas));
    // TODO: Check if not called to often
  }, [selectedAsset, notesAtom.data, account, feeProps]);

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
      {notes.length > 4 && (
        <Alert
          type="warning"
          title="Info!"
          className="max-w-[480px] mx-auto mb-4"
        >
          <p>
            Due to ledger BS we have to limit the amount that you can unshield
            at this time to <b>{availableToSpend?.toString()}</b>
            <br />
            After tx is successful, you will be able to unshield more
          </p>
        </Alert>
      )}
      <TransferModule
        source={{
          isLoadingAssets: isLoadingAssets,
          availableAssets,
          selectedAssetAddress,
          availableAmount: selectedAsset?.amount,
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
