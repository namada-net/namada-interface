import { Panel } from "@namada/components";
import { NavigationFooter } from "App/AccountOverview/NavigationFooter";
import { ConnectPanel } from "App/Common/ConnectPanel";
import { PageWithSidebar } from "App/Common/PageWithSidebar";
import { IbcTransfer } from "App/Ibc/IbcTransfer";
import { IbcWithdraw } from "App/Ibc/IbcWithdraw";
import { LearnAboutIbc } from "App/Ibc/LearnAboutIbc";
import { Sidebar } from "App/Layout/Sidebar";
import { LearnAboutMasp } from "App/Masp/LearnAboutMasp";
import { MaspShield } from "App/Masp/MaspShield";
import { MaspUnshield } from "App/Masp/MaspUnshield";
import { LearnAboutTransfer } from "App/NamadaTransfer/LearnAboutTransfer";
import { NamadaTransfer } from "App/NamadaTransfer/NamadaTransfer";
import { MaspAssetRewards } from "App/Sidebars/MaspAssetRewards";
import { allDefaultAccountsAtom, defaultAccountAtom } from "atoms/accounts";
import { shieldedBalanceAtom } from "atoms/balance";
import { useUserHasAccount } from "hooks/useIsAuthenticated";
import { useUrlState, useUrlStateBatch } from "hooks/useUrlState";
import { KeplrWalletManager } from "integrations/Keplr";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { determineTransferType } from "./utils";

export const TransferLayout: React.FC = () => {
  const keplrWalletManager = new KeplrWalletManager();
  const userHasAccount = useUserHasAccount();
  const [sourceAddressUrl, setSourceAddressUrl] = useUrlState("source");
  const [destinationAddressUrl, setDestinationAddressUrl] =
    useUrlState("destination");
  const [assetSymbolUrl, setAssetSymbolUrl] = useUrlState("asset");
  const setUrlBatchParams = useUrlStateBatch();
  const [assetSelectorModalOpen, setAssetSelectorModalOpen] = useState(false);

  const { refetch: refetchShieldedBalance } = useAtomValue(shieldedBalanceAtom);
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const { data: defaultAccount } = useAtomValue(defaultAccountAtom);
  const sourceAddress = sourceAddressUrl ?? "";
  const destinationAddress = destinationAddressUrl ?? "";

  const transferType = determineTransferType({
    sourceAddress,
    destinationAddress,
  });

  // Refetch shielded balance for MASP operations
  useEffect(() => {
    if (transferType === "shield" || transferType === "unshield") {
      refetchShieldedBalance();
    }
  }, [transferType, refetchShieldedBalance]);

  // Reset addresses when account changes in extension
  useEffect(() => {
    setUrlBatchParams({
      source: undefined,
      destination: undefined,
      asset: undefined,
    });
  }, [defaultAccount?.address]);

  if (!userHasAccount) {
    let actionText = "To transfer assets";
    switch (transferType) {
      case "shield":
      case "unshield":
        actionText = "To shield assets";
        break;
      case "ibc-deposit":
      case "ibc-withdraw":
        actionText = "To IBC Transfer";
        break;
    }
    return <ConnectPanel actionText={actionText} />;
  }

  const renderContent = (): JSX.Element => {
    if (transferType === "ibc-deposit") {
      return (
        <Panel className="py-8 rounded-t-none h-full w-full">
          <IbcTransfer
            sourceAddress={sourceAddress}
            setSourceAddress={setSourceAddressUrl}
            destinationAddress={destinationAddress}
            setDestinationAddress={setDestinationAddressUrl}
            keplrWalletManager={keplrWalletManager}
            assetSelectorModalOpen={assetSelectorModalOpen}
            setAssetSelectorModalOpen={setAssetSelectorModalOpen}
          />
        </Panel>
      );
    }

    if (transferType === "ibc-withdraw") {
      return (
        <Panel className="py-8 rounded-t-none h-full w-full">
          <IbcWithdraw
            sourceAddress={sourceAddress}
            setSourceAddress={setSourceAddressUrl}
            destinationAddress={destinationAddress}
            setDestinationAddress={setDestinationAddressUrl}
            keplrWalletManager={keplrWalletManager}
            assetSelectorModalOpen={assetSelectorModalOpen}
            setAssetSelectorModalOpen={setAssetSelectorModalOpen}
          />
        </Panel>
      );
    }

    if (transferType === "shield") {
      return (
        <div className="flex relative flex-col flex-1">
          <MaspShield
            assetSymbol={assetSymbolUrl}
            sourceAddress={sourceAddress}
            setSourceAddress={setSourceAddressUrl}
            destinationAddress={destinationAddress}
            setDestinationAddress={setDestinationAddressUrl}
            assetSelectorModalOpen={assetSelectorModalOpen}
            setAssetSelectorModalOpen={setAssetSelectorModalOpen}
          />
        </div>
      );
    }

    if (transferType === "unshield") {
      return (
        <div className="flex relative flex-col flex-1">
          <MaspUnshield
            sourceAddress={sourceAddress}
            setSourceAddress={setSourceAddressUrl}
            destinationAddress={destinationAddress}
            setDestinationAddress={setDestinationAddressUrl}
            assetSelectorModalOpen={assetSelectorModalOpen}
            setAssetSelectorModalOpen={setAssetSelectorModalOpen}
          />
        </div>
      );
    }

    return (
      <div className="flex relative flex-col flex-1">
        <NamadaTransfer
          sourceAddress={sourceAddress}
          setSourceAddress={setSourceAddressUrl}
          destinationAddress={destinationAddress}
          setDestinationAddress={setDestinationAddressUrl}
          assetSymbol={assetSymbolUrl}
          setAssetSymbol={setAssetSymbolUrl}
          assetSelectorModalOpen={assetSelectorModalOpen}
          setAssetSelectorModalOpen={setAssetSelectorModalOpen}
        />
      </div>
    );
  };

  // Render sidebar based on transfer type
  const renderSidebar = (): JSX.Element => {
    const isIbcTransfer =
      transferType === "ibc-deposit" || transferType === "ibc-withdraw";
    const isMaspTransfer =
      transferType === "shield" || transferType === "unshield";

    if (isIbcTransfer) return <LearnAboutIbc />;
    if (isMaspTransfer) {
      return (
        <>
          <MaspAssetRewards />
          <LearnAboutMasp />
        </>
      );
    }
    return <LearnAboutTransfer />;
  };

  return (
    <PageWithSidebar>
      <div className="flex flex-col min-h-full">
        <div className="flex flex-1">{renderContent()}</div>
        <NavigationFooter className="mt-2 flex-none h-16" />
      </div>
      <Sidebar>{renderSidebar()}</Sidebar>
    </PageWithSidebar>
  );
};
