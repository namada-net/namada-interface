import { Chain } from "@chain-registry/types";
import { IbcTransferProps } from "@namada/sdk-multicore";
import { AccountType } from "@namada/types";
import { mapUndefined } from "@namada/utils";
import { routes } from "App/routes";
import { isShieldedAddress, isTransparentAddress } from "App/Transfer/common";
import { TransferModule } from "App/Transfer/TransferModule";
import { OnSubmitTransferParams } from "App/Transfer/types";
import {
  allDefaultAccountsAtom,
  defaultAccountAtom,
  disposableSignerAtom,
} from "atoms/accounts";
import {
  namadaShieldedAssetsAtom,
  namadaTransparentAssetsAtom,
} from "atoms/balance";
import { chainAtom } from "atoms/chain";
import {
  getChainRegistryByChainName,
  ibcChannelsFamily,
} from "atoms/integrations";
import { ledgerStatusDataAtom } from "atoms/ledger";
import { createIbcTxAtom } from "atoms/transfer/atoms";
import {
  clearDisposableSigner,
  persistDisposableSigner,
} from "atoms/transfer/services";
import BigNumber from "bignumber.js";
import * as osmosis from "chain-registry/mainnet/osmosis";
import { useFathomTracker } from "hooks/useFathomTracker";
import { useTransaction } from "hooks/useTransaction";
import { useTransactionActions } from "hooks/useTransactionActions";
import { useWalletManager } from "hooks/useWalletManager";
import { KeplrWalletManager } from "integrations/Keplr";
import invariant from "invariant";
import { useAtom, useAtomValue } from "jotai";
import { TransactionPair } from "lib/query";
import { useEffect, useState } from "react";
import { generatePath, useNavigate } from "react-router-dom";
import {
  Asset,
  AssetWithAmount,
  IbcTransferTransactionData,
  TransferStep,
} from "types";
import {
  isNamadaAsset,
  toBaseAmount,
  toDisplayAmount,
  useTransactionEventListener,
} from "utils";
import { IbcTabNavigation } from "./IbcTabNavigation";
import { IbcTopHeader } from "./IbcTopHeader";

const keplr = new KeplrWalletManager();

export const IbcWithdraw = (): JSX.Element => {
  const defaultAccounts = useAtomValue(allDefaultAccountsAtom);
  const shieldedAccount = defaultAccounts.data?.find(
    (account) => account.type === AccountType.ShieldedKeys
  );
  const {
    walletAddress: keplrAddress,
    connectToChainId,
    chainId,
    loadWalletAddress,
  } = useWalletManager(keplr);
  const transparentAccount = useAtomValue(defaultAccountAtom);
  const namadaChain = useAtomValue(chainAtom);
  const [ledgerStatus, setLedgerStatusStop] = useAtom(ledgerStatusDataAtom);
  const [currentStatus, setCurrentStatus] = useState("");
  const [statusExplanation, setStatusExplanation] = useState("");
  const [completedAt, setCompletedAt] = useState<Date | undefined>();
  const [txHash, setTxHash] = useState<string | undefined>();
  const [generalErrorMessage, setGeneralErrorMessage] = useState("");
  const [selectedAssetWithAmount, setSelectedAssetWithAmount] = useState<
    AssetWithAmount | undefined
  >();
  const [refundTarget, setRefundTarget] = useState<string>();
  const [amount, setAmount] = useState<BigNumber | undefined>();
  const [destinationAddress, setDestinationAddress] = useState<string>("");
  const [customAddress, setCustomAddress] = useState<string>("");
  const [sourceChannel, setSourceChannel] = useState("");
  const [destinationChain, setDestinationChain] = useState<Chain | undefined>();
  const { refetch: genDisposableSigner } = useAtomValue(disposableSignerAtom);
  const alias = shieldedAccount?.alias ?? transparentAccount.data?.alias;

  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);

  const transparentAddress = accounts?.find((acc) =>
    isTransparentAddress(acc.address)
  )?.address;
  const shieldedAddress = accounts?.find((acc) =>
    isShieldedAddress(acc.address)
  )?.address;

  const [sourceAddress, setSourceAddress] = useState<string>(
    shieldedAddress ?? transparentAddress ?? ""
  );
  const shielded = isShieldedAddress(sourceAddress);
  const { data: availableAssets, isLoading: isLoadingAssets } = useAtomValue(
    shielded ? namadaShieldedAssetsAtom : namadaTransparentAssetsAtom
  );

  const { storeTransaction } = useTransactionActions();
  const { trackEvent } = useFathomTracker();
  const navigate = useNavigate();

  const ledgerAccountInfo = ledgerStatus && {
    deviceConnected: ledgerStatus.connected,
    errorMessage: ledgerStatus.errorMessage,
  };

  const availableAmount = mapUndefined(
    (address) => availableAssets?.[address]?.amount,
    selectedAssetWithAmount?.asset.address
  );

  const selectedAsset =
    selectedAssetWithAmount?.asset.address ?
      availableAssets?.[selectedAssetWithAmount?.asset.address]
    : undefined;

  useTransactionEventListener(
    ["IbcWithdraw.Success", "ShieldedIbcWithdraw.Success"],
    async (e) => {
      if (txHash && e.detail.hash === txHash) {
        setCompletedAt(new Date());
        // We are clearing the disposable signer only if the transaction was successful on the target chain
        if (shielded && refundTarget) {
          await clearDisposableSigner(refundTarget);
        }
        trackEvent(`${shielded ? "Shielded " : ""}IbcWithdraw: tx complete`);
      }
    }
  );

  useTransactionEventListener(
    ["IbcWithdraw.Error", "ShieldedIbcWithdraw.Error"],
    () => {
      trackEvent(`${shielded ? "Shielded " : ""}IbcWithdraw: tx error`);
    }
  );

  const redirectToTimeline = (): void => {
    if (txHash) {
      navigate(generatePath(routes.transaction, { hash: txHash }));
    }
  };

  const updateDestinationChainAndAddress = async (
    chain: Chain | undefined
  ): Promise<void> => {
    setDestinationChain(chain);
    if (customAddress) {
      setCustomAddress("");
    }
    if (chain) {
      await connectToChainId(chain.chain_id);
      await loadWalletAddress(chain.chain_id);
    }
  };

  const {
    data: ibcChannels,
    isError: unknownIbcChannels,
    isLoading: isLoadingIbcChannels,
  } = useAtomValue(ibcChannelsFamily(destinationChain?.chain_name));

  useEffect(() => {
    setSourceChannel(ibcChannels?.namadaChannel || "");
  }, [ibcChannels]);

  // Search for original chain. We don't want to enable users to transfer Namada assets
  // to other chains different than the original one. Ex: OSMO should only be withdrew to Osmosis,
  // ATOM to Cosmoshub, etc.
  useEffect(() => {
    (async () => {
      if (!selectedAsset) {
        await updateDestinationChainAndAddress(undefined);
        return;
      }

      let chain: Chain | undefined;

      if (isNamadaAsset(selectedAsset.asset)) {
        chain = osmosis.chain; // for now, NAM uses the osmosis chain
      } else if (selectedAsset.asset.traces) {
        const trace = selectedAsset.asset.traces.find(
          (trace) => trace.type === "ibc"
        );

        if (trace) {
          const chainName = trace.counterparty.chain_name;
          chain = getChainRegistryByChainName(chainName)?.chain;
        }
      }

      await updateDestinationChainAndAddress(chain);
    })();
  }, [selectedAsset]);

  const {
    execute: performWithdraw,
    feeProps,
    error,
    isPending,
    isSuccess,
  } = useTransaction({
    eventType: "IbcTransfer",
    createTxAtom: createIbcTxAtom,
    params: [],
    useDisposableSigner: shielded,
    parsePendingTxNotification: () => ({
      title: "IBC withdrawal transaction in progress",
      description: "Your IBC transaction is being processed",
    }),
    parseErrorTxNotification: () => ({
      title: "IBC withdrawal failed",
      description: "",
    }),
    onBeforeBuildTx: () => {
      setCurrentStatus("Creating IBC transaction...");
    },
    onBeforeSign: () => {
      setCurrentStatus("Waiting for signature...");
    },
    onBeforeBroadcast: async (tx) => {
      const props = tx.encodedTxData.meta?.props[0];
      if (shielded && props) {
        const refundTarget = props.refundTarget;
        invariant(refundTarget, "Refund target is not provided");

        await persistDisposableSigner(refundTarget);
        setRefundTarget(refundTarget);
      }

      setCurrentStatus("Broadcasting transaction to Namada...");
    },
    onBroadcasted: (tx) => {
      setCurrentStatus("Waiting for confirmation from target chain...");
      setStatusExplanation(
        "This step may take a few minutes, depending on the current workload of the IBC relayers."
      );

      const props = tx.encodedTxData.meta?.props[0];
      invariant(props, "EncodedTxData not provided");
      invariant(selectedAsset, "Selected asset is not defined");
      invariant(chainId, "Chain ID is not provided");
      const displayAmount = toDisplayAmount(
        selectedAsset.asset,
        props.amountInBaseDenom
      );
      const ibcTxData = storeTransferTransaction(
        tx,
        displayAmount,
        chainId,
        selectedAsset.asset
      );
      setTxHash(ibcTxData.hash);
      trackEvent(`${shielded ? "Shielded " : ""}IbcWithdraw: tx submitted`);
    },
    onError: async (err, context) => {
      setGeneralErrorMessage(String(err));
      setCurrentStatus("");
      setStatusExplanation("");

      // Clear disposable signer if the transaction failed on Namada side
      // We do not want to clear the disposable signer if the transaction failed on the target chain
      const refundTarget = context?.encodedTxData.meta?.props[0].refundTarget;
      if (shielded && refundTarget) {
        await clearDisposableSigner(refundTarget);
      }
    },
  });

  const storeTransferTransaction = (
    tx: TransactionPair<IbcTransferProps>,
    displayAmount: BigNumber,
    destinationChainId: string,
    asset: Asset
  ): IbcTransferTransactionData => {
    // We have to use the last element from lists in case we revealPK
    const props = tx.encodedTxData.meta?.props.pop();
    const lastTx = tx.encodedTxData.txs.pop();
    invariant(props && lastTx, "Invalid transaction data");
    const lastInnerTxHash = lastTx.innerTxHashes.pop();
    invariant(lastInnerTxHash, "Inner tx not found");

    const transferTransaction: IbcTransferTransactionData = {
      hash: lastTx.hash,
      innerHash: lastInnerTxHash.toLowerCase(),
      currentStep: TransferStep.WaitingConfirmation,
      rpc: "",
      type: shielded ? "ShieldedToIbc" : "TransparentToIbc",
      status: "pending",
      sourcePort: "transfer",
      asset,
      chainId: namadaChain.data?.chainId || "",
      destinationChainId,
      memo: tx.encodedTxData.wrapperTxProps.memo || props.memo,
      displayAmount,
      shielded,
      sourceAddress: shielded ? `${alias} - shielded` : props.source,
      sourceChannel: props.channelId,
      destinationAddress: props.receiver,
      createdAt: new Date(),
      updatedAt: new Date(),
      sequence: new BigNumber(0),
    };

    storeTransaction(transferTransaction);
    return transferTransaction;
  };

  const submitIbcTransfer = async ({
    displayAmount,
    destinationAddress,
    memo,
  }: OnSubmitTransferParams): Promise<void> => {
    invariant(selectedAsset, "No asset is selected");
    invariant(sourceChannel, "No channel ID is set");
    invariant(chainId, "No chain is selected");
    invariant(keplrAddress, "No address is selected");
    invariant(shieldedAccount, "No shielded account is found");
    invariant(transparentAccount.data, "No transparent account is found");

    const amountInBaseDenom = toBaseAmount(
      selectedAsset.asset,
      BigNumber(displayAmount ?? 0)
    );
    const source =
      shielded ?
        shieldedAccount.pseudoExtendedKey!
      : transparentAccount.data.address;
    const gasSpendingKey =
      shielded ? shieldedAccount.pseudoExtendedKey : undefined;

    const refundTarget =
      shielded ? (await genDisposableSigner()).data?.address : undefined;

    setLedgerStatusStop(true);
    try {
      await performWithdraw({
        signer: {
          publicKey: transparentAccount.data.publicKey!,
          address: transparentAccount.data.address!,
        },
        params: [
          {
            amountInBaseDenom,
            channelId: sourceChannel.trim(),
            portId: "transfer",
            token: selectedAsset.asset.address,
            source,
            receiver: destinationAddress ?? "",
            gasSpendingKey,
            memo,
            refundTarget,
          },
        ],
      });
    } finally {
      setLedgerStatusStop(false);
    }
  };

  const requiresIbcChannels = !isLoadingIbcChannels && unknownIbcChannels;

  return (
    <div className="relative min-h-[600px]">
      <header className="flex flex-col items-center text-center mb-8 gap-6">
        <IbcTopHeader type="namToIbc" isShielded={shielded} />
      </header>
      <div className="mb-6">{!completedAt && <IbcTabNavigation />}</div>
      <TransferModule
        source={{
          address: sourceAddress,
          onChangeAddress: setSourceAddress,
          availableAmount,
          selectedAssetWithAmount,
          onChangeSelectedAsset: setSelectedAssetWithAmount,
          amount,
          onChangeAmount: setAmount,
          ledgerAccountInfo,
        }}
        destination={{
          customAddress,
          address: destinationAddress,
          onChangeAddress:
            customAddress ? setCustomAddress : setDestinationAddress,
          isShieldedAddress: false,
        }}
        errorMessage={generalErrorMessage || error?.message || ""}
        currentStatus={currentStatus}
        currentStatusExplanation={statusExplanation}
        isSubmitting={
          isPending ||
          /*Before the transaction was successfully broadcasted (isSuccess) we need to wait
           * from the confirmation event from target chain */
          isSuccess
        }
        requiresIbcChannels={requiresIbcChannels}
        ibcChannels={{
          sourceChannel,
          onChangeSourceChannel: setSourceChannel,
        }}
        onSubmitTransfer={submitIbcTransfer}
        feeProps={feeProps}
        onComplete={redirectToTimeline}
        completedAt={completedAt}
      />
    </div>
  );
};
