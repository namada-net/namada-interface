import {
  ActionButton,
  Heading,
  SkeletonLoading,
  Stack,
} from "@namada/components";
import svgImg from "App/Assets/ShieldedParty.svg";
import { SelectedWallet } from "App/Transfer/SelectedWallet";
import { useEffect, useMemo, useState } from "react";
import { Asset, AssetWithAmount, ChainRegistryEntry } from "types";
import {
  SelectableAddressWithAssetAndAmount,
  ShieldAllAssetList,
} from "./ShieldAllAssetList";
import { ShieldAllContainer } from "./ShieldAllContainer";
import ibcTransferImageBlack from "./assets/ibc-transfer-black.png";

type ShieldAllPanelProps = {
  registry: ChainRegistryEntry;
  walletAddress: string;
  isLoading: boolean;
  assetList: AssetWithAmount[];
  onShieldAll: (assets: Asset[]) => void;
};

export const ShieldAllPanel = ({
  walletAddress,
  isLoading,
  assetList,
  onShieldAll,
}: ShieldAllPanelProps): JSX.Element => {
  const [selectableAssets, setSelectableAssets] = useState<
    SelectableAddressWithAssetAndAmount[]
  >([]);

  useEffect(() => {
    if (!isLoading && selectableAssets.length === 0) {
      setSelectableAssets(
        assetList.map((asset) => ({ ...asset, checked: true }))
      );
    }
  }, [isLoading, assetList]);

  const onToggleAsset = (asset: Asset): void => {
    setSelectableAssets((selectableAssets) => {
      return selectableAssets.map((current) =>
        current.asset === asset ?
          { ...current, checked: !current.checked }
        : current
      );
    });
  };

  const getSelectedAssets = (): Asset[] => {
    return selectableAssets
      .filter((current) => current.checked)
      .map((current) => current.asset);
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onShieldAll(getSelectedAssets());
  };

  const hasAssetsSelected = useMemo(
    () => selectableAssets.some((current) => current.checked),
    [selectableAssets]
  );

  //const gasConfig = getIbcGasConfig(registry);

  return (
    <ShieldAllContainer>
      <form
        className="flex flex-col flex-1 justify-between"
        onSubmit={onSubmit}
      >
        <Stack gap={3} className="text-center h-full">
          <img
            className="w-[120px] mx-auto select-none"
            src={`${svgImg}`}
            alt=""
          />
          <header>
            <Heading className="text-black uppercase text-3xl" level="h2">
              Shield All
            </Heading>
            <p>Review and confirm assets to shield</p>
          </header>
          <SelectedWallet
            address={walletAddress}
            className="text-black px-2 py-1.5 border rounded-sm"
            displayFullAddress={true}
            displayTooltip={false}
          />
          {isLoading ?
            <SkeletonLoading
              width="100%"
              height="70px"
              className="bg-yellow-600"
            />
          : <ShieldAllAssetList
              assets={selectableAssets}
              onToggleAsset={onToggleAsset}
            />
          }
        </Stack>
        <Stack as="footer" gap={4}>
          <footer className="flex justify-between items-center">
            <img src={ibcTransferImageBlack} className="w-20" />
            {/*gasConfig && <TransactionFee gasConfig={gasConfig} />*/}
          </footer>
          <ActionButton
            backgroundColor="black"
            backgroundHoverColor="cyan"
            textColor="yellow"
            textHoverColor="black"
            disabled={!hasAssetsSelected}
            className="w-auto mx-auto"
          >
            Shield all my Assets
          </ActionButton>
        </Stack>
      </form>
    </ShieldAllContainer>
  );
};
