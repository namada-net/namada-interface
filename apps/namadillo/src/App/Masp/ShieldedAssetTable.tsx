import { ActionButton, SkeletonLoading } from "@namada/components";
import { AtomErrorBoundary } from "App/Common/AtomErrorBoundary";
import { routes } from "App/routes";
import { SelectTokenExample } from "App/Transfer/SelectTokenExample";
import {
  shieldedRewardsPerTokenAtom,
  shieldedTokensAtom,
} from "atoms/balance/atoms";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldedFungibleTable } from "./ShieldedFungibleTable";
import { ShieldedNFTTable } from "./ShieldedNFTTable";

const tabs = ["Fungible", "NFT"];

const ShieldAssetCta = (): JSX.Element => {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex-1 flex items-center justify-center">
        <ActionButton
          className="w-fit uppercase"
          onClick={() => navigate(routes.shield)}
        >
          Shield your first assets
        </ActionButton>
      </div>
    </>
  );
};

export const ShieldedAssetTable = (): JSX.Element => {
  const [tab, setTab] = useState(tabs[0]);
  const shieldedTokensQuery = useAtomValue(shieldedTokensAtom);
  const shielededTokensRewardsEstQuery = useAtomValue(
    shieldedRewardsPerTokenAtom
  );

  if (shieldedTokensQuery.data === undefined) {
    return <SkeletonLoading height="125px" width="100%" />;
  }

  if (!shieldedTokensQuery.data.length) {
    return (
      <>
        <div className="bg-gray p-6 rounded-sm text-center font-medium mb-8">
          You currently have no shielded assets
        </div>
        <ShieldAssetCta />
      </>
    );
  }

  // TODO implement NFT balances
  const isNftEnabled = false;

  return (
    <AtomErrorBoundary
      result={shieldedTokensQuery}
      niceError="Unable to load your shielded balance"
      containerProps={{ className: "pb-16 flex-1 flex flex-col" }}
    >
      <SelectTokenExample />;
      {isNftEnabled && (
        <div className="flex mb-6">
          {tabs.map((name) => {
            const selected = name == tab;
            return (
              <ActionButton
                key={name}
                backgroundColor={selected ? "black" : "gray"}
                outlineColor={selected ? "yellow" : undefined}
                textColor={selected ? "yellow" : "white"}
                backgroundHoverColor="yellow"
                onClick={() => setTab(name)}
              >
                {name}
              </ActionButton>
            );
          })}
        </div>
      )}
      <>
        {tab === "Fungible" && (
          <ShieldedFungibleTable
            data={shieldedTokensQuery.data}
            rewards={shielededTokensRewardsEstQuery.data}
          />
        )}
        {tab === "NFT" && <ShieldedNFTTable />}
      </>
    </AtomErrorBoundary>
  );
};
