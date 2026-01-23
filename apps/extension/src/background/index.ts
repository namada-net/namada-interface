import {
  ExtensionKVStore,
  IndexedDBKVStore,
  MemoryKVStore,
  SessionKVStore,
} from "@namada/storage";
import browser from "webextension-polyfill";

// Needed to allow the background script to send messages containing bigints
// e.g. when responding to QueryTxDetailsMsg with a bigint proposal ID
import "@namada/utils/bigint-to-json-polyfill";

import {
  ContentScriptEnv,
  ExtensionBroadcaster,
  ExtensionGuards,
  ExtensionMessenger,
  ExtensionRequester,
  ExtensionRouter,
  getNamadaRouterId,
} from "extension";
import { KVPrefix, Ports } from "router";
import { LocalStorage, VaultStorage } from "storage";
import { ApprovalsService, init as initApprovals } from "./approvals";
import { ChainService, init as initChain } from "./chain";
import { KeyRingService, UtilityStore, init as initKeyRing } from "./keyring";
import { SdkService } from "./sdk/service";
import { VaultService, init as initVault } from "./vault";

// Extension storages
const area = browser.storage.local;

const localStorage = new LocalStorage(
  new ExtensionKVStore(KVPrefix.LocalStorage, {
    get: area.get.bind(area),
    set: area.set.bind(area),
  })
);

//IDB storages
const vaultStorage = new VaultStorage(new IndexedDBKVStore(KVPrefix.IndexedDB));
const utilityStore = new IndexedDBKVStore<UtilityStore>(KVPrefix.Utility);

// Memory/transient storages
const sessionStore = new SessionKVStore(KVPrefix.SessionStorage);
const txStore = new MemoryKVStore(KVPrefix.Memory);
const dataStore = new MemoryKVStore(KVPrefix.Memory);

const messenger = new ExtensionMessenger();
const router = new ExtensionRouter(
  ContentScriptEnv.produceEnv,
  messenger,
  localStorage
);

router.addGuard(ExtensionGuards.checkOriginIsValid);
router.addGuard(ExtensionGuards.checkMessageIsInternal);

const init = new Promise<void>(async (resolve) => {
  const routerId = await getNamadaRouterId(localStorage);
  const requester = new ExtensionRequester(messenger, routerId);
  const broadcaster = new ExtensionBroadcaster(localStorage, requester);
  const sdkService = await SdkService.init();

  await localStorage.clearOldDisposableSigners();

  const vaultService = new VaultService(
    vaultStorage,
    sessionStore,
    sdkService,
    broadcaster
  );
  await vaultService.initialize();
  const chainService = new ChainService(sdkService, localStorage, broadcaster);
  const keyRingService = new KeyRingService(
    vaultService,
    sdkService,
    chainService,
    utilityStore,
    localStorage,
    vaultStorage,
    requester,
    broadcaster
  );
  const approvalsService = new ApprovalsService(
    txStore,
    dataStore,
    localStorage,
    sdkService,
    keyRingService,
    vaultService,
    chainService,
    broadcaster
  );

  // Initialize messages and handlers
  initApprovals(router, approvalsService);
  initChain(router, chainService);
  initKeyRing(router, keyRingService);
  initVault(router, vaultService);
  resolve();
});

router.listen(Ports.Background, init);
