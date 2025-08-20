import { ActionButton, ToggleButton } from "@namada/components";
import { IconTooltip } from "App/Common/IconTooltip";
import { routes } from "App/routes";
import { chainParametersAtom } from "atoms/chain";
import {
  indexerHeartbeatAtom,
  maspIndexerHeartbeatAtom,
  settingsAtom,
  updateIndexerUrlAtom,
  updateMaspIndexerUrlAtom,
  updateRpcUrlAtom,
  updateSettingsProps,
} from "atoms/settings";
import { useAtomValue } from "jotai";
import { FaInfo } from "react-icons/fa6";
import { GoLinkExternal } from "react-icons/go";
// TODO: use Sdk.version after its changed to static
import { version as sdkVersion } from "../../../../../node_modules/@namada/sdk/package.json";
import { version } from "../../../package.json";
import { SettingsPanelMenuItem } from "./SettingsPanelMenuItem";

type DefaultInfraProviders = {
  housefire: {
    rpc: string;
    indexer: string;
    masp: string;
  };
  mainnet: {
    rpc: string;
    indexer: string;
    masp: string;
  };
};

const { VITE_REVISION: revision = "" } = import.meta.env;
const DEFAULT_INFRA_PROVIDERS_URL =
  "https://raw.githubusercontent.com/anoma/namada-chain-registry/main/default_infra_providers.json";

export const SettingsMain = (): JSX.Element => {
  const indexerHealth = useAtomValue(indexerHeartbeatAtom);
  const maspIndexerHealth = useAtomValue(maspIndexerHeartbeatAtom);
  const settingsMutation = useAtomValue(updateSettingsProps);
  const settings = useAtomValue(settingsAtom);
  const { data: chainParameters } = useAtomValue(chainParametersAtom);
  const rpcMutation = useAtomValue(updateRpcUrlAtom);
  const indexerMutation = useAtomValue(updateIndexerUrlAtom);
  const maspIndexerMutation = useAtomValue(updateMaspIndexerUrlAtom);

  const handleUseDefaultInfra = async (): Promise<void> => {
    try {
      // Fetch the default infrastructure providers from GitHub
      const response = await fetch(DEFAULT_INFRA_PROVIDERS_URL);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch default infrastructure providers: ${response.statusText}`
        );
      }

      const providers: DefaultInfraProviders = await response.json();

      // Determine which network we're on based on chainId
      const chainId = chainParameters?.chainId;

      if (!chainId) {
        throw new Error("Chain parameters not loaded");
      }

      let networkProviders;

      if (chainId.includes("housefire")) {
        networkProviders = providers.housefire;
      } else if (chainId === "namada.5f5de2dd1b88cba30586420") {
        // This is the mainnet chain ID based on the useRegistryFeatures mapping
        networkProviders = providers.mainnet;
      }

      if (!networkProviders) {
        throw new Error("No network providers found");
      }

      await Promise.all([
        rpcMutation.mutateAsync(networkProviders.rpc),
        indexerMutation.mutateAsync(networkProviders.indexer),
        maspIndexerMutation.mutateAsync(networkProviders.masp),
      ]);
    } catch (error) {
      console.error("Failed to set default infrastructure:", error);
    }
  };

  return (
    <div className="flex flex-1 justify-between flex-col w-full">
      <ul className="flex flex-col gap-2">
        {settings.advancedMode && (
          <SettingsPanelMenuItem
            url={routes.settingsAdvanced}
            text="Advanced"
          />
        )}
        {settings.advancedMode && (
          <SettingsPanelMenuItem
            url={routes.settingsSignArbitrary}
            text="Sign Arbitrary"
          />
        )}
        <SettingsPanelMenuItem url={routes.settingsMASP} text="MASP" />
        <SettingsPanelMenuItem url={routes.settingsLedger} text="Ledger" />
        <ActionButton
          onClick={handleUseDefaultInfra}
          className="my-2 cursor-pointer"
          disabled={
            rpcMutation.isPending ||
            indexerMutation.isPending ||
            maspIndexerMutation.isPending
          }
        >
          {(
            rpcMutation.isPending ||
            indexerMutation.isPending ||
            maspIndexerMutation.isPending
          ) ?
            "Setting Default Infra..."
          : "Use Alternate Infra"}
        </ActionButton>
      </ul>
      <div className="text-xs">
        <div className="relative mb-4 flex items-center gap-2 max-w-full">
          <ToggleButton
            onChange={() => {
              settingsMutation.mutateAsync({
                key: "advancedMode",
                value: !settings.advancedMode,
              });
            }}
            label="DEV mode"
            checked={settings.advancedMode}
            activeColor="yellow"
            color="white"
            containerProps={{ className: "[&_span]:order-3 gap-3" }}
          />
          <span className="text-yellow relative group/tooltip py-3 -my-1.5">
            <IconTooltip
              icon={<FaInfo />}
              text={
                <>
                  DEV mode unlocks more technically advanced features in
                  Namadillo that replicates the UX of the CLI. You can learn
                  more about these features{" "}
                  <a
                    href="https://docs.namada.net/users"
                    target="_blank"
                    rel="nofollow noreferrer"
                    className="hover:text-yellow underline"
                  >
                    here
                  </a>
                </>
              }
              tooltipPosition="top"
              className="bg-transparent border border-yellow"
              tooltipClassName="block left-2 top-0"
            />
          </span>
        </div>
        <div>
          Namadillo Version:{" "}
          {version && (
            <a
              href={`https://github.com/anoma/namada-interface/releases/tag/namadillo%40v${version}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {version ?? "-"}{" "}
              <GoLinkExternal className="inline h-2.5 w-2.5 -mt-0.5" />
            </a>
          )}
        </div>
        <div>
          Indexer Version:{" "}
          {indexerHealth?.data?.version && (
            <a
              href={`https://github.com/anoma/namada-indexer/releases/tag/v${indexerHealth?.data?.version}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {indexerHealth?.data?.version ?? "-"}{" "}
              <GoLinkExternal className="inline h-2.5 w-2.5 -mt-0.5" />
            </a>
          )}
        </div>
        <div>
          Masp Indexer Version:{" "}
          {maspIndexerHealth?.data?.version && (
            <a
              href={`https://github.com/anoma/namada-masp-indexer/releases/tag/v${maspIndexerHealth?.data?.version}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {maspIndexerHealth?.data?.version ?? "-"}{" "}
              <GoLinkExternal className="inline h-2.5 w-2.5 -mt-0.5" />
            </a>
          )}
        </div>
        <div>
          SDK Version:{" "}
          <a
            href="https://www.npmjs.com/package/@namada/sdk-multicore"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {sdkVersion ?? "-"}{" "}
            <GoLinkExternal className="inline h-2.5 w-2.5 -mt-0.5" />
          </a>
        </div>
        <div>
          <span>Revision: </span>
          <a
            href={`https://github.com/anoma/namada-interface/commit/${revision}`}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {revision.substring(0, 8)}{" "}
            <GoLinkExternal className="inline h-2.5 w-2.5 -mt-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
