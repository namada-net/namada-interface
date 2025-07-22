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
import { routes } from "App/routes";
import { MaspAssetRewards } from "App/Sidebars/MaspAssetRewards";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { shieldedBalanceAtom } from "atoms/balance";
import { applicationFeaturesAtom } from "atoms/settings";
import { useUserHasAccount } from "hooks/useIsAuthenticated";
import { useUrlState } from "hooks/useUrlState";
import { KeplrWalletManager } from "integrations/Keplr";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isTransparentAddress } from ".";
import { determineTransferType } from "./utils";

export const TransferLayout: React.FC = () => {
  const keplrWalletManager = new KeplrWalletManager();
  const userHasAccount = useUserHasAccount();
  const features = useAtomValue(applicationFeaturesAtom);
  const [sourceAddress, setSourceAddress] = useUrlState("source");
  const [destinationAddress, setDestinationAddress] =
    useUrlState("destination");

  const navigate = useNavigate();
  const location = useLocation();

  const { refetch: refetchShieldedBalance } = useAtomValue(shieldedBalanceAtom);
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);

  const transferType = determineTransferType({
    sourceAddress,
    destinationAddress,
  });

  const transparentAddress =
    accounts?.find((acc) => isTransparentAddress(acc.address))?.address ?? "";

  // Initialize source address
  useEffect(() => {
    if (!sourceAddress && transparentAddress) {
      setSourceAddress(transparentAddress);
    }
  }, [location.pathname, sourceAddress, transparentAddress, setSourceAddress]);

  // Refetch shielded balance for MASP operations
  useEffect(() => {
    if (transferType === "shield" || transferType === "unshield") {
      refetchShieldedBalance();
    }
  }, [transferType, refetchShieldedBalance]);

  // Only navigate if the addresses suggest a different transfer type than the current route
  useEffect(() => {
    const currentPath = location.pathname;
    let targetRoute = "";

    switch (transferType) {
      case "ibc-deposit":
        targetRoute = routes.ibc;
        break;
      case "ibc-withdraw":
        targetRoute = routes.ibcWithdraw;
        break;
      case "shield":
        targetRoute = routes.maspShield;
        break;
      case "unshield":
        targetRoute = routes.maspUnshield;
        break;
      case "namada-transfer":
        targetRoute = routes.transfer;
        break;
      default:
        targetRoute = routes.transfer;
    }

    // Don't redirect if user is already on a shield/unshield route and transferType is default
    // This prevents sidebar navigation from being overridden
    const isOnShieldRoute =
      currentPath === routes.maspShield || currentPath === routes.maspUnshield;
    const isDefaultTransferType = transferType === "namada-transfer";

    if (
      currentPath !== targetRoute &&
      !(isOnShieldRoute && isDefaultTransferType)
    ) {
      const searchParams = new URLSearchParams(location.search);
      navigate(`${targetRoute}?${searchParams.toString()}`, {
        replace: true,
      });
    }
  }, [
    transferType,
    sourceAddress,
    destinationAddress,
    navigate,
    location,
    transparentAddress,
    transferType,
  ]);

  if (!userHasAccount) {
    const actionText = (() => {
      switch (transferType) {
        case "shield":
        case "unshield":
          return "To shield assets";
        case "ibc-deposit":
        case "ibc-withdraw":
          return "To IBC Transfer";
        default:
          return "To transfer assets";
      }
    })();
    return <ConnectPanel actionText={actionText} />;
  }

  const renderContent = (): JSX.Element => {
    if (transferType === "ibc-deposit") {
      return (
        <Panel className="py-8 rounded-t-none h-full w-full">
          <IbcTransfer
            sourceAddress={sourceAddress}
            setSourceAddress={setSourceAddress}
            destinationAddress={destinationAddress}
            setDestinationAddress={setDestinationAddress}
            keplrWalletManager={keplrWalletManager}
          />
        </Panel>
      );
    }

    if (transferType === "ibc-withdraw") {
      return (
        <Panel className="py-8 rounded-t-none h-full w-full">
          <IbcWithdraw
            sourceAddress={sourceAddress}
            setSourceAddress={setSourceAddress}
            destinationAddress={destinationAddress}
            setDestinationAddress={setDestinationAddress}
            keplrWalletManager={keplrWalletManager}
          />
        </Panel>
      );
    }

    if (transferType === "shield") {
      return (
        <div className="flex relative flex-col flex-1">
          <MaspShield
            sourceAddress={sourceAddress}
            setSourceAddress={setSourceAddress}
            destinationAddress={destinationAddress}
            setDestinationAddress={setDestinationAddress}
          />
        </div>
      );
    }

    if (transferType === "unshield") {
      return (
        <div className="flex relative flex-col flex-1">
          <MaspUnshield
            sourceAddress={sourceAddress}
            setSourceAddress={setSourceAddress}
            destinationAddress={destinationAddress}
            setDestinationAddress={setDestinationAddress}
          />
        </div>
      );
    }

    return (
      <NamadaTransfer
        sourceAddress={sourceAddress}
        setSourceAddress={setSourceAddress}
        destinationAddress={destinationAddress}
        setDestinationAddress={setDestinationAddress}
      />
    );
  };

  // Render sidebar based on transfer type
  const renderSidebar = (): JSX.Element => {
    const isIbcTransfer =
      transferType === "ibc-deposit" || transferType === "ibc-withdraw";
    const isMaspTransfer =
      transferType === "shield" || transferType === "unshield";

    if (isIbcTransfer) {
      return <LearnAboutIbc />;
    }

    if (isMaspTransfer) {
      return (
        <>
          {features.shieldingRewardsEnabled && <MaspAssetRewards />}
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
