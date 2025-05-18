import { Asset } from "@chain-registry/types";
import { Modal, Panel, Stack } from "@namada/components";
import { ModalTransition } from "App/Common/ModalTransition";
import { Search } from "App/Common/Search";
import { TokenCard } from "App/Common/TokenCard";
import { namadaTransparentAssetsAtom, shieldedTokensAtom } from "atoms/balance";
import { chainAssetsMapAtom } from "atoms/chain";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import { twMerge } from "tailwind-merge";
import { Address, AddressWithAssetAndAmount } from "types";

type Token = {
  address: Address;
  symbol: string;
  name: string;
  amount: string;
  value: string;
  icon?: string;
};

type SelectTokenProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
};

export const SelectToken = ({
  isOpen,
  onClose,
  onSelect,
}: SelectTokenProps): JSX.Element | null => {
  const [filter, setFilter] = useState("");
  const chainAssetsMap = useAtomValue(chainAssetsMapAtom);
  const transparentAssets = useAtomValue(namadaTransparentAssetsAtom);
  const shieldedTokens = useAtomValue(shieldedTokensAtom);

  // Convert assets map to tokens array
  const tokens = useMemo(() => {
    const result: Token[] = [];

    // Process transparent assets
    if (transparentAssets.data) {
      Object.values(transparentAssets.data).forEach(
        (item: AddressWithAssetAndAmount) => {
          if (item.asset && item.originalAddress) {
            result.push({
              address: item.originalAddress,
              symbol: item.asset.symbol,
              name: item.asset.name,
              amount: item.amount?.toString() || "0",
              value:
                item.amount ?
                  `$${item.amount.multipliedBy(1).toFixed(2)}`
                : "$0.00",
              icon: item.asset.logo_URIs?.png || item.asset.logo_URIs?.svg,
            });
          }
        }
      );
    }

    // Process shielded tokens
    if (shieldedTokens.data) {
      shieldedTokens.data.forEach((item) => {
        // Check if this token is already in the result (from transparent assets)
        const existingTokenIndex = result.findIndex(
          (t) => t.address === item.originalAddress
        );

        if (existingTokenIndex >= 0) {
          // Add the shielded amount to the existing token
          const existingAmount = new BigNumber(
            result[existingTokenIndex].amount
          );
          result[existingTokenIndex].amount = existingAmount
            .plus(item.amount || 0)
            .toString();

          // Update the value if dollar amount is available
          if (item.dollar) {
            const existingValue = new BigNumber(
              result[existingTokenIndex].value.replace("$", "")
            );
            result[existingTokenIndex].value =
              `$${existingValue.plus(item.dollar).toFixed(2)}`;
          }
        } else if (item.asset && item.originalAddress) {
          // Add new token
          result.push({
            address: item.originalAddress,
            symbol: item.asset.symbol,
            name: item.asset.name,
            amount: item.amount?.toString() || "0",
            value: item.dollar ? `$${item.dollar.toFixed(2)}` : "$0.00",
            icon: item.asset.logo_URIs?.png || item.asset.logo_URIs?.svg,
          });
        }
      });
    }

    // If there are no tokens from the assets, create tokens from the chain assets map
    if (result.length === 0 && Object.keys(chainAssetsMap).length > 0) {
      Object.entries(chainAssetsMap).forEach(([address, asset]) => {
        if (asset) {
          result.push({
            address,
            symbol: asset.symbol,
            name: asset.name,
            amount: "0",
            value: "$0.00",
            icon: asset.logo_URIs?.png || asset.logo_URIs?.svg,
          });
        }
      });
    }

    return result;
  }, [chainAssetsMap, transparentAssets.data, shieldedTokens.data]);

  const filteredTokens = useMemo(() => {
    return tokens.filter(
      (token) =>
        token.name.toLowerCase().includes(filter.toLowerCase()) ||
        token.symbol.toLowerCase().includes(filter.toLowerCase())
    );
  }, [tokens, filter]);

  const createTokenAsset = (token: Token): Asset => {
    return {
      symbol: token.symbol,
      name: token.name,
      logo_URIs: token.icon ? { png: token.icon } : {},
      // Required fields from Asset type
      denom_units: [
        {
          denom: token.symbol.toLowerCase(),
          exponent: 0,
        },
        {
          denom: token.symbol.toLowerCase(),
          exponent: 6,
        },
      ],
      base: token.symbol.toLowerCase(),
      display: token.symbol.toLowerCase(),
    };
  };

  // Get top tokens by value for "Most traded" section
  const topTokens = useMemo(() => {
    return [...tokens]
      .sort((a, b) => {
        const aValue = parseFloat(a.value.replace("$", "")) || 0;
        const bValue = parseFloat(b.value.replace("$", "")) || 0;
        return bValue - aValue;
      })
      .slice(0, 3);
  }, [tokens]);

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <ModalTransition>
        <div
          className={twMerge(
            clsx(
              "px-8 pt-3 pb-6 bg-black max-w-[480px] min-h-[120px]",
              "w-screen rounded-xl border border-neutral-700"
            )
          )}
        >
          <header className="flex w-full justify-center items-center relative mb-6 text-light leading-8">
            Select Token
            <i
              className="cursor-pointer text-white absolute -right-2.5 text-xl p-1.5 hover:text-yellow z-50"
              onClick={onClose}
            >
              <IoClose />
            </i>
          </header>

          <div className="my-4">
            <Search
              placeholder="Paste token address or search by name"
              onChange={setFilter}
            />
          </div>

          <Panel className="p-4">
            <h4 className="text-white text-base mb-3">Your tokens</h4>
            <Stack
              as="ul"
              gap={0}
              className="max-h-[400px] overflow-auto dark-scrollbar pb-4 mr-[-0.5rem]"
            >
              {filteredTokens.map((token) => (
                <li key={token.address} className="text-sm">
                  <button
                    onClick={() => {
                      onSelect(token);
                      onClose();
                    }}
                    className={twMerge(
                      clsx(
                        "text-left px-4 py-2.5",
                        "w-full rounded-sm border border-transparent",
                        "hover:border-neutral-400 transition-colors duration-150"
                      )
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <TokenCard
                        asset={createTokenAsset(token)}
                        address={token.address}
                      />
                      <div className="text-right">
                        <div className="text-white">{token.amount}</div>
                        <div className="text-neutral-400 text-xs">
                          {token.value}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
              {filteredTokens.length === 0 && (
                <p className="py-2 font-light">No tokens found</p>
              )}
            </Stack>
          </Panel>

          {topTokens.length > 0 && (
            <Panel className="p-4 mt-4">
              <h4 className="text-white text-base mb-3">Most traded</h4>
              <Stack
                as="ul"
                gap={0}
                className="max-h-[200px] overflow-auto dark-scrollbar pb-4 mr-[-0.5rem]"
              >
                {topTokens.map((token) => (
                  <li key={token.address} className="text-sm">
                    <button
                      onClick={() => {
                        onSelect(token);
                        onClose();
                      }}
                      className={twMerge(
                        clsx(
                          "text-left px-4 py-2.5",
                          "w-full rounded-sm border border-transparent",
                          "hover:border-neutral-400 transition-colors duration-150"
                        )
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <TokenCard
                          asset={createTokenAsset(token)}
                          address={token.address}
                        />
                      </div>
                    </button>
                  </li>
                ))}
              </Stack>
            </Panel>
          )}
        </div>
      </ModalTransition>
    </Modal>
  );
};
