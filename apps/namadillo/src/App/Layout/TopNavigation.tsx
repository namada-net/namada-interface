import { AccountType } from "@namada/types";
import { ConnectExtensionButton } from "App/Common/ConnectExtensionButton";
import { TransactionInProgressSpinner } from "App/Common/TransactionInProgressSpinner";
import { UnshieldAssetsModal } from "App/Common/UnshieldAssetsModal";
import { routes } from "App/routes";
import { defaultAccountAtom } from "atoms/accounts";
import { signArbitraryEnabledAtom } from "atoms/settings";
import { useUserHasAccount } from "hooks/useIsAuthenticated";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { AiOutlineMessage } from "react-icons/ai";
import { IoSettingsOutline } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import { KeplrAccount } from "./KeplrAccount";
import { NamadaAccount } from "./NamadaAccount";
import { SyncIndicator } from "./SyncIndicator";

export const TopNavigation = (): JSX.Element => {
  const [unshieldingModalOpen, setUnshieldingModalOpen] = useState(false);

  const userHasAccount = useUserHasAccount();
  const signArbitraryEnabled = useAtomValue(signArbitraryEnabledAtom);
  const defaultAccount = useAtomValue(defaultAccountAtom);
  const location = useLocation();
  const navigate = useNavigate();

  if (!userHasAccount) {
    return (
      <div className="w-fit justify-self-end">
        <div className="flex gap-6">
          <button
            className="text-2xl text-yellow hover:text-cyan"
            onClick={() =>
              navigate(routes.settings, {
                state: { backgroundLocation: location },
              })
            }
          >
            <IoSettingsOutline />
          </button>
          <ConnectExtensionButton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center gap-4 sm:gap-6">
      <div className="flex-1" />
      {defaultAccount.data?.type !== AccountType.Ledger &&
        signArbitraryEnabled && (
          <button
            className="text-2xl text-yellow hover:text-cyan"
            title="Sign Message"
            onClick={() =>
              navigate(routes.signMessages, {
                state: { backgroundLocation: location },
              })
            }
          >
            <AiOutlineMessage />
          </button>
        )}

      <TransactionInProgressSpinner />
      <SyncIndicator />
      <button
        className="text-2xl text-yellow hover:text-cyan"
        onClick={() =>
          navigate(routes.settings, {
            state: { backgroundLocation: location },
          })
        }
      >
        <IoSettingsOutline />
      </button>
      <div className="h-[50px] flex gap-1">
        <NamadaAccount />
        <KeplrAccount />
      </div>

      {unshieldingModalOpen && (
        <UnshieldAssetsModal onClose={() => setUnshieldingModalOpen(false)} />
      )}
    </div>
  );
};
