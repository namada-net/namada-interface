import { mapUndefined } from "@namada/utils";
import { params, routes } from "App/routes";
import { TransferModule } from "App/Transfer/TransferModule";
import { OnSubmitTransferParams } from "App/Transfer/types";
import { allDefaultAccountsAtom } from "atoms/accounts";
import {
  assetBalanceAtomFamily,
  getAvailableChains,
  ibcChannelsFamily,
  namadaChainRegistryAtom,
  SUPPORTED_ASSETS_MAP,
} from "atoms/integrations";
import BigNumber from "bignumber.js";
import { useFathomTracker } from "hooks/useFathomTracker";
import { useUrlState } from "hooks/useUrlState";
import { useWalletManager } from "hooks/useWalletManager";
import { wallets } from "integrations";
import { KeplrWalletManager } from "integrations/Keplr";
import invariant from "invariant";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { generatePath, useNavigate } from "react-router-dom";
import { useTransactionEventListener } from "utils";
import { IbcTabNavigation } from "./IbcTabNavigation";
import { IbcTopHeader } from "./IbcTopHeader";

const keplr = new KeplrWalletManager();
const defaultChainId = "cosmoshub-4";

export const IbcTransfer = (): JSX.Element => {
  const navigate = useNavigate();
  const [completedAt, setCompletedAt] = useState<Date | undefined>();

  const availableChains = useMemo(getAvailableChains, []);

  // Global & Atom states
  const defaultAccounts = useAtomValue(allDefaultAccountsAtom);

  // Wallet & Registry
  const {
    registry,
    walletAddress: sourceAddress,
    connectToChainId,
  } = useWalletManager(keplr);
  const namadaChainRegistry = useAtomValue(namadaChainRegistryAtom);
  const chainRegistry = namadaChainRegistry.data;

  // IBC Channels & Balances
  const {
    data: ibcChannels,
    isError: unknownIbcChannels,
    isLoading: isLoadingIbcChannels,
  } = useAtomValue(ibcChannelsFamily(registry?.chain.chain_name));

  const { data: userAssets, isLoading: isLoadingBalances } = useAtomValue(
    assetBalanceAtomFamily({
      chain: registry?.chain,
      walletAddress: sourceAddress,
    })
  );

  const { trackEvent } = useFathomTracker();
  const [shielded, setShielded] = useState<boolean>(true);
  const [selectedAssetBase, setSelectedAssetBase] = useUrlState(params.asset);
  const [amount, setAmount] = useState<BigNumber | undefined>();
  const [generalErrorMessage, setGeneralErrorMessage] = useState("");
  const [sourceChannel, setSourceChannel] = useState("");
  const [destinationChannel, setDestinationChannel] = useState("");
  const [currentStatus, setCurrentStatus] = useState<string>();
  const [txHash, setTxHash] = useState<string | undefined>();

  const availableDisplayAmount = mapUndefined((baseDenom) => {
    return userAssets ? userAssets[baseDenom]?.amount : undefined;
  }, selectedAssetBase);

  const selectedAsset =
    selectedAssetBase ? userAssets?.[selectedAssetBase]?.asset : undefined;

  const availableAssets = useMemo(() => {
    if (!userAssets || !registry) return undefined;

    //     Object.entries(userAssets).forEach(([key, { asset }]) => {
    //       const namadaAsset = getNamadaAssetByIbcAsset(
    //         asset,
    //         chainRegistry?.assets.assets ?? []
    //       );

    Object.entries(userAssets).forEach(([key, { asset }]) => {
      if (
        SUPPORTED_ASSETS_MAP.get(registry.chain.chain_name)?.includes(
          asset.symbol
        )
      ) {
        output[key] = { ...userAssets[key] };
      }
    });

    return output;
  }, [Object.keys(userAssets || {}).join(""), registry?.chain.chain_name]);

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
        destinationAddress,
        displayAmount,
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

  const onChangeWallet = (): void => {
    if (registry) {
      connectToChainId(registry.chain.chain_id);
      return;
    }
    connectToChainId(defaultChainId);
  };

  return (
    <div className="relative min-h-[600px]">
      <header className="flex flex-col items-center text-center mb-8 gap-6">
        <IbcTopHeader type="ibcToNam" isShielded={shielded} />
      </header>
      <div className="mb-6">{!completedAt && <IbcTabNavigation />}</div>
      <TransferModule
        source={{
          isLoadingAssets: isLoadingBalances,
          selectedAssetAddress: selectedAssetBase,
          availableAmount: availableDisplayAmount,
          availableChains,
          chain: registry?.chain,
          availableWallets: [wallets.keplr],
          wallet: wallets.keplr,
          walletAddress: sourceAddress,
          onChangeWallet,
          onChangeSelectedAsset: setSelectedAssetBase,
          amount,
          onChangeAmount: setAmount,
        }}
        destination={{
          chain: chainRegistry?.chain,
          availableWallets: [wallets.namada],
          wallet: wallets.namada,
          walletAddress: namadaAddress,
          isShieldedAddress: shielded,
          onChangeShielded: setShielded,
        }}
        gasConfig={gasConfig.data}
        changeFeeEnabled={false}
        isSubmitting={
          transferToNamada.isPending ||
          /* isSuccess means that the transaction has been broadcasted, but doesn't take
           * in consideration if it was applied to Namada chain, or releayed successfully.
           * In order to get this confirmation, we poll the RPC endpoint on useTransactionWatcher hook. */
          transferToNamada.isSuccess
        }
        completedAt={completedAt}
        isIbcTransfer={true}
        currentStatus={currentStatus}
        requiresIbcChannels={requiresIbcChannels}
        ibcOptions={{
          sourceChannel,
          onChangeSourceChannel: setSourceChannel,
          destinationChannel,
          onChangeDestinationChannel: setDestinationChannel,
        }}
        errorMessage={generalErrorMessage || transferToNamada.error?.message}
        onSubmitTransfer={onSubmitTransfer}
        onComplete={() => {
          txHash &&
            navigate(generatePath(routes.transaction, { hash: txHash }));
        }}
      />
    </div>
  );
};
