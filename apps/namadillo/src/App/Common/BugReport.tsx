import { ActionButton, Panel } from "@namada/components";
import { Sdk } from "@namada/sdk-multicore";
import { defaultAccountAtom } from "atoms/accounts";
import {
  isShieldedSyncCompleteAtom,
  lastCompletedShieldedSyncAtom,
} from "atoms/balance";
import { chainStatusAtom } from "atoms/chain";
import {
  indexerCrawlersInfoAtom,
  indexerHeartbeatAtom,
  maspIndexerHeartbeatAtom,
  settingsAtom,
} from "atoms/settings";
import { useKeychainVersion } from "hooks/useKeychainVersion";
import { useAtomValue } from "jotai";
import { useRef } from "react";
import { FaBug } from "react-icons/fa6";
import { bugReportUrl } from "urls";
import { version as namadilloVersion } from "../../../package.json";

export const BugReport = (): JSX.Element => {
  const keychainVersion = useKeychainVersion();
  const indexerHealth = useAtomValue(indexerHeartbeatAtom);
  const maspIndexerHealth = useAtomValue(maspIndexerHeartbeatAtom);
  const crawlerInfo = useAtomValue(indexerCrawlersInfoAtom);
  const chainStatus = useAtomValue(chainStatusAtom);
  const currentDate = useRef(new Date().toString());
  const account = useAtomValue(defaultAccountAtom);
  const lastSyncInfo = useAtomValue(lastCompletedShieldedSyncAtom);
  const isShieldedSyncComplete = useAtomValue(isShieldedSyncCompleteAtom);
  const settings = useAtomValue(settingsAtom);
  const lastShieldedSyncForAccount =
    account.data?.address ? lastSyncInfo[account.data.address] : "?";

  const yesOrNo = (bool: unknown): string => (!!bool ? "Yes" : "No");

  const sep = "\n------------------";
  const debugInfo = `## Navigator${sep}
User Agent: ${navigator.userAgent}
Screen Resolution: ${window.innerWidth}px x ${window.innerHeight}px / DPI: ${window.devicePixelRatio}
${currentDate.current}

## Version Info${sep}
Namadillo Version: ${namadilloVersion}
SDK Version: ${Sdk.version}
Keychain Version: ${keychainVersion ?? "?"}
Indexer Version: ${indexerHealth.data?.version}
Masp Indexer Version: ${maspIndexerHealth.data?.version}

## MASP Status${sep}
MASP Indexer URL: ${settings.maspIndexerUrl}
Last Shielded Sync: ${lastShieldedSyncForAccount?.toString()}
Is Shielded Sync complete? ${yesOrNo(isShieldedSyncComplete)}

## Indexer Status${sep}
Indexer URL: ${settings.indexerUrl}
Epoch: ${chainStatus?.epoch}
Block height: ${chainStatus?.height}
Crawler Info: ${JSON.stringify(crawlerInfo.data)}

## Other Info${sep}
RPC Url: ${settings.rpcUrl}
Account type: ${account.data?.type}
`;

  return (
    <Panel className="mb-12 min-h-full flex items-center justify-center flex-col text-yellow gap-8">
      <div className="flex justify-center">
        <i className="text-[80px]">
          <FaBug />
        </i>
      </div>
      <p className="max-w-[550px] text-center">
        If you have found a bug with Namadillo or have suggestions for
        improvements, please use the button below and fill out the form.
      </p>
      <footer>
        <ActionButton
          href={bugReportUrl + `&debug=${encodeURIComponent(debugInfo)}`}
          size="sm"
          target="_blank"
          rel="noreferrer nofollow"
        >
          Report Bug
        </ActionButton>
      </footer>
    </Panel>
  );
};
