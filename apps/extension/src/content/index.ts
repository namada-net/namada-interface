import { ExtensionKVStore } from "@namada/storage";
import {
  ContentScriptEnv,
  ContentScriptGuards,
  ExtensionMessenger,
  ExtensionRequester,
  ExtensionRouter,
  getNamadaRouterId,
} from "extension";
import { Namada, Proxy } from "provider";
import { KVPrefix, Ports } from "router/types";
import { LocalStorage } from "storage";
import browser from "webextension-polyfill";
import { initEvents } from "./events";

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

const router = new ExtensionRouter(
  ContentScriptEnv.produceEnv,
  messenger,
  localStorage
);

const init = new Promise<void>(async (resolve) => {
  // Start proxying messages from Namada to InjectedNamada
  const routerId = await getNamadaRouterId(localStorage);
  const packageVersion = process.env.npm_package_version || "";
  Proxy.start(
    new Namada(packageVersion, new ExtensionRequester(messenger, routerId)),
    localStorage
  );
  resolve();
});

router.listen(Ports.WebBrowser, init);
router.addGuard(ContentScriptGuards.checkMessageIsInternal);

initEvents(router, localStorage);

// Insert a script element to load injection script
const container = document.head || document.documentElement;
const scriptElement = document.createElement("script");

scriptElement.src = browser.runtime.getURL("injected.namada.js");
scriptElement.type = "text/javascript";
container.insertBefore(scriptElement, container.children[0]);
scriptElement.remove();
