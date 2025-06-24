import { AccountType } from "@namada/types";
import { shortenAddress } from "@namada/utils";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { namadaTransparentAssetsAtom } from "atoms/balance";
import { connectedWalletsAtom } from "atoms/integrations";
import { wallets } from "integrations";
import { KeplrWalletManager } from "integrations/Keplr";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { GoChevronDown } from "react-icons/go";
import { IoMdCheckmark } from "react-icons/io";
import { AddressWithAssetAndAmount } from "types";
import NamadaLogo from "../Assets/NamadaLogo.svg";
import { isTransparentAddress } from "./common";
import { SelectToken } from "./SelectToken";
import { SelectWalletModal } from "./SelectWalletModal";
import { TransferArrow } from "./TransferArrow";

export const ShieldTransferCard = (): JSX.Element => {
  const transparentAssets = useAtomValue(namadaTransparentAssetsAtom);
  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const [connectedWallets, setConnectedWallets] = useAtom(connectedWalletsAtom);

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
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<"namada" | "keplr">(
    "namada"
  );

  const isKeplrConnected = connectedWallets.keplr || false;

  useEffect(() => {
    setSelectedToken(Object.values(transparentAssets.data || {})[0]);
  }, [transparentAssets.data]);

  const [amount, setAmount] = useState("0");

  // const mockBalance = "0.00";
  const dollarValue = "$0.00";

  const handleConnectWallet = (): void => {
    if (!isKeplrConnected) {
      setIsWalletModalOpen(true);
    }
    setIsDropdownOpen(false);
  };

  const handleWalletConnect = async (wallet: { id: string }): Promise<void> => {
    if (wallet.id === "keplr") {
      const keplrWallet = new KeplrWalletManager();
      try {
        await keplrWallet.get();
        setConnectedWallets((obj) => ({ ...obj, [keplrWallet.key]: true }));
      } catch (error) {
        console.error("Failed to connect to Keplr:", error);
      }
    }
    setIsWalletModalOpen(false);
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
              {selectedWallet === "namada" && (
                <>
                  <span className="text-white text-sm">
                    {shortenAddress(transparentAddress ?? "", 6)}
                  </span>
                  <img src={NamadaLogo} alt="Namada Logo" className="w-7 h-7" />
                </>
              )}
              {selectedWallet === "keplr" && isKeplrConnected && (
                <>
                  <span className="text-white text-sm">Keplr</span>
                  <img
                    src={wallets.keplr.iconUrl}
                    alt="Keplr"
                    className="w-7 h-7"
                  />
                </>
              )}
              <GoChevronDown className="text-sm text-white" />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-neutral-900 rounded-lg shadow-xl border-2 border-neutral-700 overflow-hidden z-10">
                <div className="border-t border-neutral-700" />

                {/* Wallet options */}
                <div className="p-2">
                  {/* Namada wallet option */}
                  <button
                    onClick={() => {
                      setSelectedWallet("namada");
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 pl-2 mb-2 rounded-sm hover:bg-neutral-700 transition-colors"
                  >
                    <img
                      src={NamadaLogo}
                      alt="Namada Logo"
                      className="w-8 h-8"
                    />
                    <div className="text-left flex-1">
                      <div className="text-white font-medium">
                        {transparentAccount?.alias}
                      </div>
                      <div className="text-neutral-500 text-sm">
                        {truncateAddress(transparentAddress ?? "")}
                      </div>
                    </div>
                    {selectedWallet === "namada" && (
                      <IoMdCheckmark className="text-green-400 text-lg" />
                    )}
                  </button>
                  {/* Keplr wallet connection */}
                  {isKeplrConnected ?
                    <button
                      onClick={() => {
                        setSelectedWallet("keplr");
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-sm bg-neutral-700 hover:bg-neutral-600 transition-colors"
                    >
                      <img
                        src={wallets.keplr.iconUrl}
                        alt="Keplr"
                        className="w-6 h-6"
                      />
                      <span className="text-white font-medium pl-1 flex-1 text-left">
                        {wallets.keplr.name}
                      </span>
                      {selectedWallet === "keplr" && (
                        <IoMdCheckmark className="text-green-400 text-lg" />
                      )}
                    </button>
                  : <button
                      onClick={handleConnectWallet}
                      className="w-full flex items-center gap-3 p-3 rounded-sm bg-neutral-700 hover:bg-neutral-600 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
                        <span className="text-black text-lg font-bold">+</span>
                      </div>
                      <span className="text-white font-medium pl-1">
                        Connect Keplr
                      </span>
                    </button>
                  }
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

      {/* Wallet connection modal */}
      {isWalletModalOpen && (
        <SelectWalletModal
          availableWallets={[wallets.keplr]}
          onClose={() => setIsWalletModalOpen(false)}
          onConnect={handleWalletConnect}
        />
      )}
    </div>
  );
};
