import { ActionButton, Stack } from "@namada/components";
import { requestLedgerDevice } from "@namada/sdk-multicore";

export const SettingsLedger = (): JSX.Element => {
  const onInvalidateShieldedContext = async (): Promise<void> => {
    requestLedgerDevice();
  };

  return (
    <Stack as="footer" className="px-5" gap={3}>
      <h2 className="text-base">Ledger</h2>
      <p className="text-sm">
        To use a Ledger device with Namadillo, you must register it first. This
        only needs to be done once. If you ever need to unregister a device, go
        to your browser settings and remove it from the list of registered
        devices.
      </p>
      <p className="text-sm">
        It is normal to see the <b>Register Ledger Device</b> button after
        registering due to limitations of Ledger registration detection in
        browser.
      </p>

      <ActionButton onClick={onInvalidateShieldedContext} className="shrink-0">
        Register ledger device
      </ActionButton>
    </Stack>
  );
};
