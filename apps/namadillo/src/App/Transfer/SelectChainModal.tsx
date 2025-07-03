import { Chain } from "@chain-registry/types";
import { Stack } from "@namada/components";
import { Search } from "App/Common/Search";
import { SelectModal } from "App/Common/SelectModal";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { WalletProvider } from "types";
import { ChainCard } from "./ChainCard";
import { ConnectedWalletInfo } from "./ConnectedWalletInfo";

type SelectChainModalProps = {
  onClose: () => void;
  onSelect: (chain: Chain) => void;
  chains: Chain[];
  wallet: WalletProvider;
  walletAddress?: string;
};

export const SelectChainModal = ({
  onClose,
  onSelect,
  walletAddress,
  chains,
}: SelectChainModalProps): JSX.Element => {
  const [filter, setFilter] = useState("");

  const filteredChains = useMemo(() => {
    return chains.filter(
      (chain) =>
        chain.pretty_name &&
        chain.pretty_name.toLowerCase().indexOf(filter.toLowerCase()) >= 0
    );
  }, [chains, filter]);

  return (
    <SelectModal title="Select Source Chain" onClose={onClose}>
      {walletAddress && <ConnectedWalletInfo walletAddress={walletAddress} />}
      <div className="my-4">
        <Search placeholder="Search chain" onChange={setFilter} />
      </div>
      {filteredChains.length > 0 && (
        <Stack
          as="ul"
          gap={0}
          className="max-h-[300px] overflow-auto dark-scrollbar pb-4 mr-[-0.5rem]"
        >
          {filteredChains.map((chain) => (
            <li key={chain.chain_id}>
              <button
                onClick={() => {
                  onSelect(chain);
                  onClose();
                }}
                className={twMerge(
                  clsx(
                    "w-full rounded-sm border border-transparent",
                    "hover:border-neutral-400 transition-colors duration-150"
                  )
                )}
              >
                <ChainCard chain={chain} />
              </button>
            </li>
          ))}
        </Stack>
      )}
      {filteredChains.length === 0 && (
        <p className="py-2 font-light">There are no available chains</p>
      )}
    </SelectModal>
  );
};
