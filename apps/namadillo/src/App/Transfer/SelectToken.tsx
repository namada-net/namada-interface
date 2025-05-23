import { Modal, Stack } from "@namada/components";
import { AccountType } from "@namada/types";
import { shortenAddress } from "@namada/utils";
import { ModalTransition } from "App/Common/ModalTransition";
import { Search } from "App/Common/Search";
import { routes } from "App/routes";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { namadaTransparentAssetsAtom } from "atoms/balance";
import { chainAssetsMapAtom } from "atoms/chain";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import { AddressWithAssetAndAmount } from "types";
import namadaTransparentSvg from "./assets/namada-transparent.svg";

type Network = {
  name: string | undefined;
  icon?: string;
};

type SelectTokenProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: AddressWithAssetAndAmount) => void;
};

export const SelectToken = ({
  isOpen,
  onClose,
  onSelect,
}: SelectTokenProps): JSX.Element | null => {
  const [filter, setFilter] = useState("");
  const transparentAssets = useAtomValue(namadaTransparentAssetsAtom);
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const location = useLocation();
  const navigate = useNavigate();
  const chainAssetsMap = Object.values(useAtomValue(chainAssetsMapAtom));

  const allNetworks: Network[] = useMemo(() => {
    return chainAssetsMap
      .map((chainAsset) => {
        return {
          name: chainAsset?.name ?? "",
          icon: chainAsset?.logo_URIs?.png || chainAsset?.logo_URIs?.svg,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [chainAssetsMap]);

  // Your tokens
  const tokens = useMemo(() => {
    const result: AddressWithAssetAndAmount[] = [];

    // Process transparent assets
    if (transparentAssets.data) {
      Object.values(transparentAssets.data).forEach(
        (item: AddressWithAssetAndAmount) => {
          if (item.asset && item.originalAddress) {
            result.push(item);
          }
        }
      );
    }

    return result;
  }, [transparentAssets.data]);

  const filteredTokens = useMemo(() => {
    return tokens
      .filter(
        (token) =>
          token.asset.name.toLowerCase().includes(filter.toLowerCase()) ||
          token.asset.symbol.toLowerCase().includes(filter.toLowerCase())
      )
      .sort((a, b) => Number(b.amount) - Number(a.amount));
  }, [tokens, filter]);

  const hasDefaultAccount = !!accounts?.length;
  const transparentAccount = accounts?.find(
    (account) => account.type !== AccountType.ShieldedKeys
  );
  const accountAddress = transparentAccount?.address;

  const handleConnectWallet = (): void => {
    navigate(routes.switchAccount, {
      state: { backgroundLocation: location },
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal onClose={onClose} className="py-20">
        <ModalTransition>
          <div className="flex h-[600px] rounded-xl border border-neutral-700 overflow-hidden">
            {/* Left panel */}
            <div className="w-[300px] bg-neutral-800 p-6 flex flex-col overflow-auto">
              <h2 className="text-white text-xl font-medium mb-6">
                Your account
              </h2>

              {hasDefaultAccount ?
                <div className="flex items-center gap-3 mb-8 p-3">
                  <div className="rounded-full bg-neutral-800">
                    <img
                      src={namadaTransparentSvg}
                      alt="namada"
                      className="w-6 h-6"
                    />
                  </div>
                  <div className="font-mono text-white">
                    {shortenAddress(accountAddress || "", 10)}
                  </div>
                </div>
              : <button
                  onClick={handleConnectWallet}
                  className="mb-8 p-3 border border-yellow text-yellow rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Connect
                </button>
              }

              <h2 className="text-white text-xl font-medium mb-4">Networks</h2>
              <Stack
                as="ul"
                gap={2}
                className="flex-1 overflow-auto dark-scrollbar"
              >
                {allNetworks.map((network) => (
                  <li key={network.name}>
                    <button className="flex items-center gap-3 p-2 w-full hover:bg-neutral-800 rounded-lg transition-colors">
                      <div className="w-8 h-8 overflow-hidden rounded-full bg-neutral-800 flex items-center justify-center">
                        {network.icon ?
                          <img
                            src={network.icon}
                            alt={network.name}
                            className="w-6 h-6"
                          />
                        : <span className="text-white">
                            {network.name?.charAt(0)}
                          </span>
                        }
                      </div>
                      <span className="text-white">{network.name}</span>
                    </button>
                  </li>
                ))}
              </Stack>
            </div>

            {/* Right panel */}
            <div className="bg-black border-l border-neutral-700 w-[500px] p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-white text-xl font-medium">Select Token</h2>
                <button
                  onClick={onClose}
                  className="text-white hover:text-yellow"
                >
                  <IoClose size={24} />
                </button>
              </div>

              <div className="mb-6">
                <Search
                  placeholder="Paste token address or search by name"
                  onChange={setFilter}
                />
              </div>

              <div className="mb-6">
                <h3 className="text-white text-lg mb-3">Your tokens</h3>
                <div className="h-[400px] overflow-auto dark-scrollbar">
                  <Stack as="ul" gap={2} className="pb-2">
                    {filteredTokens.length > 0 ?
                      filteredTokens.map((token) => (
                        <li key={token.originalAddress}>
                          <button
                            onClick={() => {
                              onSelect(token);
                              onClose();
                            }}
                            className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-neutral-800 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center">
                                {(
                                  token.asset.logo_URIs?.png ||
                                  token.asset.logo_URIs?.svg
                                ) ?
                                  <img
                                    src={
                                      token.asset.logo_URIs?.png ||
                                      token.asset.logo_URIs?.svg
                                    }
                                    alt={token.asset.symbol}
                                    className="w-8 h-8"
                                  />
                                : <span className="text-white text-lg">
                                    {token.asset.symbol.charAt(0)}
                                  </span>
                                }
                              </div>
                              <span className="text-white font-medium">
                                {token.asset.symbol}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-white">
                                {token.amount.toString()}
                              </div>
                              <div className="text-neutral-400 text-sm">
                                {`$${token.amount.toFixed(2)}`}
                              </div>
                            </div>
                          </button>
                        </li>
                      ))
                    : <p className="text-neutral-400">No tokens found</p>}
                  </Stack>
                </div>
              </div>
            </div>
          </div>
        </ModalTransition>
      </Modal>
    </>
  );
};
