import { ledgerUSBList } from "@namada/sdk-multicore";
import { LedgerError } from "@zondax/ledger-namada";
import { isLedgerAccountAtom } from "atoms/accounts";
import { atom } from "jotai";

import { atomWithQuery } from "jotai-tanstack-query";
import { getSdkInstance } from "utils/sdk";

export type LedgerStatus = {
  connected: boolean;
  errorMessage: string;
};

const ledgerStatusStopAtom = atom(false);

export const ledgerStatusAtom = atomWithQuery<LedgerStatus | undefined>(() => {
  return {
    refetchInterval: 1000,
    queryKey: ["ledger-status"],
    queryFn: async () => {
      const devices = await ledgerUSBList();

      if (devices.length > 0) {
        try {
          // Disable console.warn to prevent the warning from showing up in the UI in the loop
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (console as any).warnOld = console.warn;
          console.warn = () => {};

          const sdk = await getSdkInstance();
          const ledger = await sdk.initLedger();
          const {
            version: { returnCode, errorMessage },
          } = await ledger.status();

          const connected = returnCode === LedgerError.NoErrors;

          await ledger.closeTransport();

          return {
            connected,
            errorMessage,
          };
        } catch (e) {
          return {
            connected: false,
            errorMessage: `${e}`,
          };
        } finally {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          console.warn = (console as any).warnOld;
        }
      }

      return {
        connected: false,
        errorMessage: "Ledger device not detected",
      };
    },
  };
});

export const ledgerStatusDataAtom = atom(
  (get) => {
    const isLedgerAccount = get(isLedgerAccountAtom);
    const ledgetStatusStop = get(ledgerStatusStopAtom);

    if (isLedgerAccount && !ledgetStatusStop) {
      return get(ledgerStatusAtom).data;
    }
  },
  (_, set, stop: boolean) => {
    set(ledgerStatusStopAtom, stop);
  }
);
