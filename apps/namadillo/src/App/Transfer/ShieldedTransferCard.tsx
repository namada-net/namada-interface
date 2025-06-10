import { AccountType } from "@namada/types";
import { shortenAddress } from "@namada/utils";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { namadaTransparentAssetsAtom } from "atoms/balance";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { GoChevronDown } from "react-icons/go";
import { AddressWithAssetAndAmount } from "types";
import NamadaLogo from "../Assets/NamadaLogo.svg";
import { isTransparentAddress } from "./common";
import { SelectToken } from "./SelectToken";
import { TransferArrow } from "./TransferArrow";

export const ShieldTransferCard = (): JSX.Element => {
  const transparentAssets = useAtomValue(namadaTransparentAssetsAtom);
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const transparentAddress = accounts?.find((acc) =>
    isTransparentAddress(acc.address)
  )?.address;

  const transparentAccount = accounts?.find(
    (account) => account.type !== AccountType.ShieldedKeys
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMode] = useState("transparent");
  const [selectedToken, setSelectedToken] = useState<
    AddressWithAssetAndAmount | undefined
  >(undefined);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  useEffect(() => {
    setSelectedToken(Object.values(transparentAssets.data || {})[0]);
  }, [transparentAssets.data]);

  const [amount, setAmount] = useState("0");

  // const mockBalance = "0.00";
  const dollarValue = "$0.00";

  const handleConnectWallet = (): void => {
    // Mock Keplr connection
    setIsDropdownOpen(false);
  };

  const handleSelectToken = (token: AddressWithAssetAndAmount): void => {
    setSelectedToken(token);
  };

  const truncateAddress = (address: string): string => {
    if (!address) return "";
    return `${address.slice(0, 10)}...${address.slice(-6)}`;
  };

  return (
    <div className="w-full max-w-[500px] mx-auto pt-10">
      {/* Header text based on mode */}
      <div className="text-center mb-4 text-yellow-400 text-sm">
        {selectedMode === "shielded" ?
          "Shield assets into Namada's Shieldpool."
        : "Transfer to Namada transparent address"}
      </div>

      {/* Main card */}
      <div className="bg-neutral-800 rounded-xl p-4 border hover:border-yellow-400">
        {/* Top row */}
        <div className="flex justify-between items-center mb-8">
          {/* Token selector - now clickable */}
          <button
            onClick={() => setIsTokenModalOpen(true)}
            className="flex items-center gap-2 py-2 hover:opacity-90 transition-colors text-white"
          >
            <div className="aspect-square h-8 w-8">
              <img
                src={
                  selectedToken?.asset.logo_URIs?.png ||
                  selectedToken?.asset.logo_URIs?.svg
                }
                alt={selectedToken?.asset.symbol ?? ""}
              />
            </div>
            <span className="text-white font-medium">
              {selectedToken?.asset.symbol ?? ""}
            </span>
            <GoChevronDown className="text-sm" />
          </button>

          {/* Shield/Transparent toggle and wallet */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 py-2  transition-colors text-white"
            >
              {/* {isConnected && ( */}
              <span className="text-white text-sm">
                {shortenAddress(transparentAddress ?? "", 6)}
              </span>
              {/* //   )} */}
              <img src={NamadaLogo} alt="Namada Logo" className="w-7 h-7" />
              <GoChevronDown className="text-sm text-white" />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-neutral-900 rounded-lg shadow-xl border-2 border-neutral-700 overflow-hidden z-10">
                <div className="border-t border-neutral-700" />

                {/* Wallet options */}
                <div className="p-2">
                  {/* {isConnected ? */}
                  <button className="w-full flex items-center gap-3 pl-2 mb-2 rounded-sm hover:bg-neutral-700 transition-colors">
                    <img
                      src={NamadaLogo}
                      alt="Namada Logo"
                      className="w-8 h-8"
                    />
                    <div className="text-left">
                      <div className="text-white font-medium">
                        {transparentAccount?.alias}
                      </div>
                      <div className="text-neutral-500 text-sm">
                        {truncateAddress(transparentAddress ?? "")}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={handleConnectWallet}
                    className="w-full flex items-center gap-3 p-3 rounded-sm bg-neutral-700 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
                      <span className="text-black text-lg font-bold">+</span>
                    </div>
                    <span className="text-white font-medium pl-1">
                      Connect new wallet
                    </span>
                  </button>
                  {/* } */}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Amount input */}
        <div className="mb-8">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent text-white text-5xl font-light text-center outline-none placeholder-gray-600"
            placeholder="0"
          />
        </div>

        {/* Bottom row */}
        <div className="flex justify-between items-center">
          <span className="text-neutral-400">{dollarValue}</span>
          <span className="text-neutral-400">
            {selectedToken?.amount?.toString() ?? "No Balance"}
          </span>
        </div>
      </div>

      {/* Transfer arrow */}
      <div className="flex justify-center my-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center -mt-7 bg-yellow-400`}
        >
          <i className="flex items-center justify-center w-11 mx-auto -my-8 relative z-10">
            <TransferArrow
              color="#FF0"
              // isAnimating={isSubmitting}
            />
          </i>
        </div>
      </div>

      {/* Token selection modal */}
      <SelectToken
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onSelect={handleSelectToken}
      />
    </div>
  );
};
