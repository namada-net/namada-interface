import { WindowWithNamada } from "@namada/types";
import { chainParametersAtom } from "atoms/chain";
import {
  namadaExtensionAttachStatus,
  namadaExtensionConnectionStatus,
} from "atoms/settings";
import { Wallet } from "integrations/types";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useState } from "react";

type InjectedNamada = WindowWithNamada["namada"];

const notAvailableError = "Namada Keychain is not available.";

export class NamadaKeychain implements Wallet {
  // TODO: Should we use this, or keep our existing download buttons?
  install(): void {
    console.warn(
      "Namada is not available. Redirecting to the Namada download page..."
    );
    window.open("https://www.namada.net/extension", "_blank");
  }

  private async _get(): Promise<InjectedNamada | undefined> {
    if ((window as WindowWithNamada).namada) {
      return (window as WindowWithNamada).namada;
    }

    if (document.readyState === "complete") {
      return (window as WindowWithNamada).namada;
    }

    return new Promise<InjectedNamada | undefined>((resolve) => {
      const documentStateChange = (event: Event): void => {
        if (
          event.target &&
          (event.target as Document).readyState === "complete"
        ) {
          resolve((window as WindowWithNamada).namada);
          document.removeEventListener("readystatechange", documentStateChange);
        }
      };

      document.addEventListener("readystatechange", documentStateChange);
    });
  }

  async get(): Promise<InjectedNamada | undefined> {
    const namada = await this._get();
    return namada;
  }

  async connect(chainId: string): Promise<void> {
    const namada = await this.get();
    if (!namada) {
      throw new Error(notAvailableError);
    }
    await namada.connect(chainId);
  }
}

export const useNamadaKeychain = (): {
  connect: () => Promise<void>;
  namadaKeychain: NamadaKeychain;
  error?: string;
} => {
  const [connectStatus, setConnectStatus] = useAtom(
    namadaExtensionConnectionStatus
  );
  const attachStatus = useAtomValue(namadaExtensionAttachStatus);
  const { data: chain } = useAtomValue(chainParametersAtom);

  const [error, setError] = useState<string>();
  const namadaKeychain = new NamadaKeychain();
  const chainId = chain?.chainId;

  const connect = useCallback(async (): Promise<void> => {
    if (
      !chainId ||
      attachStatus !== "attached" ||
      connectStatus === "connected"
    ) {
      return;
    }
    setConnectStatus("connecting");
    namadaKeychain
      .connect(chainId)
      .then(() => setConnectStatus("connected"))
      .catch((e) => {
        setConnectStatus("error");
        setError(e);
      });
  }, [chainId, attachStatus, connectStatus]);

  return { connect, namadaKeychain, error };
};
