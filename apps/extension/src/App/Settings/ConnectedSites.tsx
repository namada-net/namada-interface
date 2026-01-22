import { ExtensionKVStore } from "@namada/storage";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import browser from "webextension-polyfill";

import { ActionButton, Alert, Stack } from "@namada/components";
import { PageHeader } from "App/Common";
import {
  ApprovedOriginsStore,
  RevokeConnectionMsg,
} from "background/approvals";
import { useRequester } from "hooks/useRequester";
import { GoX } from "react-icons/go";
import { KVPrefix, Ports } from "router";
import { LocalStorage } from "storage";

const area = browser.storage.local;

const localStorage = new LocalStorage(
  new ExtensionKVStore<ApprovedOriginsStore>(KVPrefix.LocalStorage, {
    get: area.get.bind(area),
    set: area.set.bind(area),
    remove: area.remove.bind(area),
    clear: area.clear.bind(area),
  })
);

const DisconnectAllButton: React.FC<{
  connectedSites: string[];
  revokeConnection: (...sites: string[]) => Promise<void>;
}> = ({ connectedSites, revokeConnection }) => {
  const handleRevokeAllConnections = async (): Promise<void> =>
    await revokeConnection(...connectedSites);

  return (
    <ActionButton size="xs" onClick={handleRevokeAllConnections}>
      Disconnect All
    </ActionButton>
  );
};

export const ConnectedSites: React.FC = ({}) => {
  const [connectedSites, setConnectedSites] = useState<ApprovedOriginsStore>();
  const requester = useRequester();

  const fetchConnectedSites = useCallback(() => {
    localStorage
      .getApprovedOrigins()
      .then((origins) => setConnectedSites(origins || []))
      .catch(console.error);
  }, [setConnectedSites]);

  useEffect(fetchConnectedSites);

  const handleRevokeConnection = async (...sites: string[]): Promise<void> => {
    for (const site of sites) {
      await requester.sendMessage(
        Ports.Background,
        new RevokeConnectionMsg(site)
      );
    }
    fetchConnectedSites();
  };

  const hasConnectedSites = connectedSites && connectedSites.length > 0;
  return (
    <Stack gap={6}>
      <PageHeader title="Connected Sites" />
      {!hasConnectedSites && (
        <Alert type="info">No connected sites found.</Alert>
      )}

      {hasConnectedSites && (
        <Stack gap={4}>
          <div>
            <div className="w-36 float-right">
              <DisconnectAllButton
                connectedSites={connectedSites}
                revokeConnection={handleRevokeConnection}
              />
            </div>
          </div>
          {connectedSites.map((site, i) => (
            <li
              key={`connected-site-${i}`}
              className={clsx(
                "bg-black rounded-md flex justify-between items-center text-white",
                "items-center text-base py-4 px-6"
              )}
            >
              <span className="text-ellipsis overflow-hidden" title={site}>
                {site}
              </span>
              <span
                className="p-2 cursor-pointer hover:text-yellow -mr-2"
                onClick={() => handleRevokeConnection(site)}
              >
                <GoX />
              </span>
            </li>
          ))}
        </Stack>
      )}
    </Stack>
  );
};
