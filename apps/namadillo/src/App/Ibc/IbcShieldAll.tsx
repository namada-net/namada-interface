import { Chain } from "@chain-registry/types";
import { Panel } from "@namada/components";
import { useAssetAmount } from "hooks/useAssetAmount";
import { useWalletManager } from "hooks/useWalletManager";
import { KeplrWalletManager } from "integrations/Keplr";
import { useState } from "react";
import { Asset } from "types";
import { ShieldAllIntro } from "./ShieldAllIntro";
import { ShieldAllPanel } from "./ShieldAllPanel";

const keplr = new KeplrWalletManager();

export const IbcShieldAll: React.FC = () => {
  const [chainSelected, setChainSelected] = useState(false);
  const { registry, walletAddress, connectToChainId } = useWalletManager(keplr);
  const { assetsBalances, isLoading: isLoadingBalances } = useAssetAmount({
    registry,
    walletAddress,
  });

  const onSelectChain = (chain: Chain): void => {
    connectToChainId(chain.chain_id);
    setChainSelected(true);
  };

  const onShieldAll = async (_assets: Asset[]): Promise<void> => {
    //TODO: not implemented
  };

  const connected = chainSelected && registry && walletAddress;

  // TODO: this should be true when the form is submitted
  const isSuccess = false;

  return (
    <Panel className="flex items-center">
      {!connected && !isSuccess && (
        <ShieldAllIntro onSelectChain={onSelectChain} />
      )}
      {connected && !isSuccess && (
        <ShieldAllPanel
          registry={registry}
          walletAddress={walletAddress}
          assetList={Object.values(assetsBalances || [])}
          isLoading={isLoadingBalances}
          onShieldAll={onShieldAll}
        />
      )}
    </Panel>
  );
};
