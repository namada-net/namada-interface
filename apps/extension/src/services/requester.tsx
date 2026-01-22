import {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useState,
} from "react";
import browser from "webextension-polyfill";

import { ExtensionKVStore } from "@namada/storage";
import {
  ExtensionMessenger,
  ExtensionRequester,
  getNamadaRouterId,
} from "extension";
import { KVPrefix } from "router";
import { LocalStorage } from "storage";

const area = browser.storage.local;

const localStorage = new LocalStorage(
  new ExtensionKVStore(KVPrefix.LocalStorage, {
    get: area.get.bind(area),
    set: area.set.bind(area),
    remove: area.remove.bind(area),
    clear: area.clear.bind(area),
  })
);
const messenger = new ExtensionMessenger();

export const RequesterContext = createContext<ExtensionRequester | null>(null);

export const RequesterProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => {
  const [requester, setRequester] = useState<ExtensionRequester>();

  useEffect(() => {
    const getRequester = async (): Promise<void> => {
      const routerId = await getNamadaRouterId(localStorage);
      const requester = new ExtensionRequester(messenger, routerId);
      setRequester(requester);
    };
    void getRequester();
  }, []);

  return (
    <>
      {requester ?
        <RequesterContext.Provider value={requester}>
          {children}
        </RequesterContext.Provider>
      : null}
    </>
  );
};
