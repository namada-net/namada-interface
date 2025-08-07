import { Panel, SkeletonLoading, Tooltip } from "@namada/components";
import { copyToClipboard } from "@namada/utils";
import { TabSelector } from "App/Common/TabSelector";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { GoCheck, GoCopy } from "react-icons/go";
import QRCode from "react-qr-code";
import NamadaLogo from "../Assets/NamadaLogo.svg";
import NamadaLogoYellow from "../Assets/NamadaLogoYellow.svg";
import { isShieldedAddress, isTransparentAddress } from "./common";

export const ReceiveCard = (): JSX.Element => {
  const { data: accounts, isFetching } = useAtomValue(allDefaultAccountsAtom);
  const [isShielded, setIsShielded] = useState(true);
  const [copied, setCopied] = useState(false);

  const transparentAddress = accounts?.find((acc) =>
    isTransparentAddress(acc.address)
  )?.address;

  const shieldedAddress = accounts?.find((acc) =>
    isShieldedAddress(acc.address)
  )?.address;

  const address = isShielded ? shieldedAddress : transparentAddress;

  const handleCopy = (): void => {
    if (!copied && address) {
      copyToClipboard(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Panel className="relative min-h-full rounded-none">
      <header className="flex flex-col items-center text-center mb-8 gap-6">
        <h1 className="mt-6 text-lg">Receive</h1>
        <h2 className="text-sm -mt-4">
          Receive funds from external wallets and exchanges
        </h2>
      </header>
      {isFetching ?
        <SkeletonLoading
          height="420px" // see what I did there? ;)
          width="400px"
          className="rounded-md m-auto"
        />
      : <div
          className={`flex flex-col items-center gap-6 bg-gray w-[400px] py-[50px] rounded-md m-auto mb-10 ${isShielded ? "border-2 border-yellow" : ""}`}
        >
          <div className="w-full max-w-[250px]">
            <TabSelector
              active={isShielded ? "shielded" : "transparent"}
              items={[
                { id: "shielded", text: "Shielded", className: "text-yellow" },
                {
                  id: "transparent",
                  text: "Transparent",
                  className: "text-white",
                },
              ]}
              onChange={() => setIsShielded(!isShielded)}
            />
          </div>

          <div
            className={`p-4 rounded-md relative ${isShielded ? "bg-yellow" : "bg-white"}`}
          >
            <QRCode
              size={180}
              value={address || ""}
              bgColor={isShielded ? "#FFE816" : "#FFFFFF"}
              fgColor="#000000"
              level="H"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={isShielded ? NamadaLogoYellow : NamadaLogo}
                alt="Namada Logo"
                width={45}
                height={45}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900 rounded-sm w-full max-w-[350px] group/tooltip relative">
            <p
              className={`text-sm font-mono text-gray-400 truncate flex-grow ${isShielded ? "text-yellow" : "text-white"}`}
            >
              {address || "No address available"}
            </p>
            <Tooltip position="top">
              {address || "No address available"}
            </Tooltip>
            <button
              onClick={handleCopy}
              className={`text-lg text-white p-1 hover:text-yellow transition-colors  ${isShielded ? "text-yellow" : "text-white"}`}
            >
              {copied ?
                <GoCheck />
              : <GoCopy />}
            </button>
          </div>
        </div>
      }
    </Panel>
  );
};
