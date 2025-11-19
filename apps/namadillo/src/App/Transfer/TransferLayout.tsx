import { Panel } from "@namada/components";
import { NavigationFooter } from "App/AccountOverview/NavigationFooter";
import { ConnectPanel } from "App/Common/ConnectPanel";
import { IbcTransfer } from "App/Ibc/IbcTransfer";
import { IbcWithdraw } from "App/Ibc/IbcWithdraw";
import { MaspShield } from "App/Masp/MaspShield";
import { MaspUnshield } from "App/Masp/MaspUnshield";
import { NamadaTransfer } from "App/NamadaTransfer/NamadaTransfer";
import { allDefaultAccountsAtom, defaultAccountAtom } from "atoms/accounts";
import { shieldedBalanceAtom } from "atoms/balance";
import { connectedWalletsAtom } from "atoms/integrations";
import { useUserHasAccount } from "hooks/useIsAuthenticated";
import { useUrlState, useUrlStateBatch } from "hooks/useUrlState";
import { KeplrWalletManager } from "integrations/Keplr";
import { getChainFromAddress } from "integrations/utils";
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import { isNamadaAddress } from "./common";
import { determineTransferType } from "./utils";

export const TransferLayout: React.FC = () => {
  const keplrWalletManager = new KeplrWalletManager();

  const userHasAccount = useUserHasAccount();
  const [sourceAddressUrl, setSourceAddressUrl] = useUrlState("source");
  const [destinationAddressUrl, setDestinationAddressUrl] =
    useUrlState("destination");
  const [assetSelectorModalOpen, setAssetSelectorModalOpen] = useState(false);
  const setUrlBatchParams = useUrlStateBatch();

  const { refetch: refetchShieldedBalance } = useAtomValue(shieldedBalanceAtom);
  const { data: defaultAccount } = useAtomValue(defaultAccountAtom);
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const connectedWallets = useAtomValue(connectedWalletsAtom);
  const sourceAddress = sourceAddressUrl ?? "";
  const destinationAddress = destinationAddressUrl ?? "";
  const previousAccountAddressRef = useRef<string | undefined>(
    defaultAccount?.address
  );

  const transferType = determineTransferType({
    sourceAddress,
    destinationAddress,
  });

  // Reset addresses when account changes in extension
  useEffect(() => {
    if (
      previousAccountAddressRef.current &&
      previousAccountAddressRef.current !== defaultAccount?.address
    ) {
      setUrlBatchParams({
        source: undefined,
        destination: undefined,
        asset: undefined,
      });
    }
    previousAccountAddressRef.current = defaultAccount?.address;
  }, [defaultAccount?.address]);

  // Refetch shielded balance for MASP operations
  useEffect(() => {
    if (["shield", "unshield"].includes(transferType)) refetchShieldedBalance();
  }, [transferType, refetchShieldedBalance]);

  // Validate source address - check if it's from keyring or Keplr
  // If not it means the address is invalid at best, poisoned at worst.
  useEffect(() => {
    const validateSourceAddress = async (): Promise<void> => {
      if (!sourceAddressUrl || !userHasAccount || !accounts) return;

      // Check if address is from keyring accounts
      const isFromKeyring = accounts?.some(
        (account) => account.address === sourceAddressUrl
      );
      if (isFromKeyring) return;

      // Check if address is from Keplr
      if (connectedWallets?.keplr && !isNamadaAddress(sourceAddressUrl)) {
        try {
          const keplrInstance = await keplrWalletManager.get();
          if (!keplrInstance) return setSourceAddressUrl(undefined);
          // Get the chain from the address
          const chain = getChainFromAddress(sourceAddressUrl);
          if (!chain) return setSourceAddressUrl(undefined);

          // Try to get the key for this chain
          try {
            const key = await keplrInstance.getKey(chain.chain_id);
            // Check if the address matches the connected Keplr address
            if (key.bech32Address === sourceAddressUrl) return; // Valid Keplr address
          } catch (error) {
            // Chain not connected or error getting key
            console.warn("Failed to validate Keplr address:", error);
          }
        } catch (error) {
          console.error("Error validating Keplr address:", error);
        }
      }

      // If we reach here, the address is not valid - clear it
      setUrlBatchParams({
        source: undefined,
        destination: undefined,
        asset: undefined,
      });
    };

    validateSourceAddress();
  }, [
    sourceAddressUrl,
    accounts,
    connectedWallets,
    userHasAccount,
    keplrWalletManager,
    setSourceAddressUrl,
  ]);

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
          assetSelectorModalOpen={assetSelectorModalOpen}
          setAssetSelectorModalOpen={setAssetSelectorModalOpen}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex flex-1">{renderContent()}</div>
      <NavigationFooter className="mt-2 flex-none h-16" />
    </div>
  );
};
