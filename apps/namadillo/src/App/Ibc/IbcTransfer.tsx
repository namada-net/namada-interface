import { AccountType } from "@namada/types";
import { mapUndefined } from "@namada/utils";
import { routes } from "App/routes";
import { isShieldedAddress } from "App/Transfer/common";
import { TransferModule } from "App/Transfer/TransferModule";
import { OnSubmitTransferParams } from "App/Transfer/types";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { assetBalanceAtomFamily, ibcChannelsFamily } from "atoms/integrations";
import { transferAmountAtom } from "atoms/transfer/atoms";
import BigNumber from "bignumber.js";
import { useFathomTracker } from "hooks/useFathomTracker";
import { useIbcTransaction } from "hooks/useIbcTransaction";
import { useTransactionActions } from "hooks/useTransactionActions";
import { useWalletManager } from "hooks/useWalletManager";
import { KeplrWalletManager } from "integrations/Keplr";
import invariant from "invariant";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { generatePath, useNavigate } from "react-router-dom";
import { AssetWithAmountAndChain } from "types";
import { useTransactionEventListener } from "utils";

interface IbcTransferProps {
  sourceAddress: string;
  setSourceAddress: (address?: string) => void;
  destinationAddress: string;
  setDestinationAddress: (address?: string) => void;
  keplrWalletManager: KeplrWalletManager;
  assetSelectorModalOpen?: boolean;
  setAssetSelectorModalOpen?: (open: boolean) => void;
}

export const IbcTransfer = ({
  sourceAddress,
  setSourceAddress,
  destinationAddress,
  setDestinationAddress,
  keplrWalletManager,
  assetSelectorModalOpen,
  setAssetSelectorModalOpen,
}: IbcTransferProps): JSX.Element => {
  //  COMPONENT STATE
  const [completedAt, setCompletedAt] = useState<Date | undefined>();
  const [sourceChannel, setSourceChannel] = useState("");
  const [destinationChannel, setDestinationChannel] = useState("");
  const [selectedAssetWithAmount, setSelectedAssetWithAmount] = useState<
    AssetWithAmountAndChain | undefined
  >();
  const [amount, setAmount] = useAtom(transferAmountAtom);
  const [txHash, setTxHash] = useState<string | undefined>();
  //  ERROR & STATUS STATE
  const [generalErrorMessage, setGeneralErrorMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState<string>();
  //  GLOBAL STATE
  const navigate = useNavigate();
  const defaultAccounts = useAtomValue(allDefaultAccountsAtom);
  const { registry } = useWalletManager(keplrWalletManager);
  const {
    data: ibcChannels,
    isError: unknownIbcChannels,
    isLoading: isLoadingIbcChannels,
  } = useAtomValue(ibcChannelsFamily(registry?.chain.chain_name));
  const { data: userAssets } = useAtomValue(
    assetBalanceAtomFamily({
      chain: registry?.chain,
      walletAddress: sourceAddress,
    })
  );
  const { trackEvent } = useFathomTracker();
  const { storeTransaction } = useTransactionActions();

  const { transferToNamada, gasConfig } = useIbcTransaction({
    registry,
    sourceAddress,
    sourceChannel,
    destinationChannel,
    shielded: isShieldedAddress(destinationAddress ?? ""),
    selectedAsset: selectedAssetWithAmount?.asset,
  });

  // DERIVED VALUES
  const shielded = isShieldedAddress(destinationAddress ?? "");
  const availableDisplayAmount = mapUndefined((baseDenom) => {
    return userAssets ? userAssets[baseDenom]?.amount : undefined;
  }, selectedAssetWithAmount?.asset?.address);
  const namadaAddress = useMemo(() => {
    return (
      defaultAccounts.data?.find(
        (account) => (account.type === AccountType.ShieldedKeys) === shielded
      )?.address || ""
    );
  }, [defaultAccounts, shielded]);
  const requiresIbcChannels = Boolean(
    !isLoadingIbcChannels &&
      (unknownIbcChannels ||
        (shielded && ibcChannels && !ibcChannels?.namadaChannel))
  );

  // Set source and destination channels based on IBC channels data
  useEffect(() => {
    setSourceChannel(ibcChannels?.ibcChannel || "");
    setDestinationChannel(ibcChannels?.namadaChannel || "");
  }, [ibcChannels]);

  useTransactionEventListener("IbcTransfer.Success", (e) => {
    if (txHash && e.detail.hash === txHash) {
      setCompletedAt(new Date());
      trackEvent(
        `${shielded ? "Shielded " : ""}IbcTransfer: tx complete (${e.detail.asset.symbol})`
      );
    }
  });

  useTransactionEventListener("IbcTransfer.Error", (e) => {
    trackEvent(
      `${shielded ? "Shielded " : ""}IbcTransfer: tx error (${e.detail.asset.symbol})`
    );
  });

  const onSubmitTransfer = async ({
    displayAmount,
    destinationAddress,
    memo,
  }: OnSubmitTransferParams): Promise<void> => {
    try {
      invariant(registry?.chain, "Error: Chain not selected");
      setGeneralErrorMessage("");
      setCurrentStatus("Submitting...");
      const result = await transferToNamada.mutateAsync({
        destinationAddress: destinationAddress ?? "",
        displayAmount: new BigNumber(displayAmount ?? "0"),
        memo,
        onUpdateStatus: setCurrentStatus,
      });
      storeTransaction(result);
      setTxHash(result.hash);
      trackEvent(
        `${shielded ? "Shielded " : ""}IbcTransfer: tx submitted (${result.asset.symbol})`
      );
    } catch (err) {
      setGeneralErrorMessage(err + "");
      setCurrentStatus(undefined);
    }
  };

  return (
    <div className="relative min-h-[600px]">
      <header className="text-center mb-8 gap-6">IBC Deposit</header>
      <TransferModule
        source={{
          selectedAssetWithAmount,
          availableAmount: availableDisplayAmount,
          address: sourceAddress,
          amount,
          onChangeSelectedAsset: setSelectedAssetWithAmount,
          onChangeAddress: setSourceAddress,
          onChangeAmount: setAmount,
        }}
        destination={{
          address: namadaAddress,
          isShieldedAddress: shielded,
          onChangeAddress: setDestinationAddress,
        }}
        gasConfig={gasConfig.data}
        isSubmitting={
          transferToNamada.isPending ||
          /* isSuccess means that the transaction has been broadcasted, but doesn't take
           * in consideration if it was applied to Namada chain, or releayed successfully.
           * In order to get this confirmation, we poll the RPC endpoint on useTransactionWatcher hook. */
          transferToNamada.isSuccess
        }
        completedAt={completedAt}
        currentStatus={currentStatus ?? ""}
        requiresIbcChannels={requiresIbcChannels}
        ibcChannels={{
          sourceChannel,
          destinationChannel,
          onChangeSourceChannel: setSourceChannel,
          onChangeDestinationChannel: setDestinationChannel,
        }}
        errorMessage={generalErrorMessage || transferToNamada.error?.message}
        onSubmitTransfer={onSubmitTransfer}
        onComplete={() => {
          if (txHash) {
            setAmount(undefined);
            navigate(generatePath(routes.transaction, { hash: txHash }));
          }
        }}
        keplrWalletManager={keplrWalletManager}
        assetSelectorModalOpen={assetSelectorModalOpen}
        setAssetSelectorModalOpen={setAssetSelectorModalOpen}
      />
    </div>
  );
};
