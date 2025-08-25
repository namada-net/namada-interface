import { SidebarMenuItem } from "App/Common/SidebarMenuItem";
import { ShieldIcon } from "App/Icons/ShieldIcon";
import { routes } from "App/routes";
import { applicationFeaturesAtom } from "atoms/settings";
import { useAtomValue } from "jotai";
import { AiFillHome } from "react-icons/ai";
import { BsDiscord, BsTwitterX } from "react-icons/bs";
import { FaVoteYea } from "react-icons/fa";
import { FaBug } from "react-icons/fa6";
import { GoStack } from "react-icons/go";
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import { DISCORD_URL, TWITTER_URL } from "urls";
import receiveIcon from "./assets/receive-icon.svg";
import transferIcon from "./assets/transfer-icon.svg";

export const Navigation = (): JSX.Element => {
  const features = useAtomValue(applicationFeaturesAtom);
  const location = useLocation();

  const menuItems: { label: string; icon: React.ReactNode; url?: string }[] = [
    {
      label: "Manage Assets",
      icon: <AiFillHome />,
      url: routes.root,
    },
    {
      label: "Staking",
      icon: <GoStack />,
      url: routes.staking,
    },
    {
      label: "Governance",
      icon: <FaVoteYea />,
      url: routes.governance,
    },
    {
      label: "Shield",
      icon: <ShieldIcon />,
      url: routes.maspShield,
    },
    {
      label: "Transfer",
      icon: <img src={transferIcon} alt="Transfer" />,
      url:
        features.maspEnabled || features.namTransfersEnabled ?
          routes.transfer
        : undefined,
    },
    {
      label: "Receive",
      icon: <img src={receiveIcon} alt="Receive" />,
      url: routes.receive,
    },
    {
      label: "History",
      icon: <MdOutlineKeyboardBackspace />,
      url:
        features.namTransfersEnabled || features.ibcTransfersEnabled ?
          routes.history
        : undefined,
    },
  ];

  return (
    <div className="min-h-full flex flex-col justify-between gap-10 p-6 pb-8">
      <ul className="flex flex-col gap-4">
        {menuItems.map((item) => {
          const shieldingRoute = item.label === "Shield";

          const highlightShieldItem =
            item.label === "Shield" &&
            ([routes.maspShield, routes.ibc] as string[]).includes(
              location.pathname
            );

          const highlightTransferItem =
            item.label === "Transfer" &&
            (
              [
                routes.maspUnshield,
                routes.ibcWithdraw,
                routes.transfer,
              ] as string[]
            ).includes(location.pathname);

          const historyRoute = item.label === "History";
          return (
            <>
              <li key={item.label}>
                {shieldingRoute && (
                  <>
                    <hr className="border-neutral-300 border-t-1 w-full mb-2" />
                    <h5 className="text-neutral-500 text-xs mb-2">
                      Move Assets
                    </h5>
                  </>
                )}
                <SidebarMenuItem
                  url={item.url}
                  shouldHighlight={
                    !!highlightTransferItem || !!highlightShieldItem
                  }
                  preventNavigationOnSameRoute={
                    (item.label === "Shield" && highlightShieldItem) ||
                    (item.label === "Transfer" && highlightTransferItem)
                  }
                >
                  {item.icon}
                  {item.label}
                </SidebarMenuItem>
                {historyRoute && (
                  <hr className="border-neutral-300 border-t-1 w-full mt-3" />
                )}
              </li>
            </>
          );
        })}
      </ul>
      <footer className="flex flex-col gap-10">
        <ul className="flex flex-col gap-1 text-neutral-300 text-sm">
          <li>
            <Link
              to={routes.bugReport}
              className="inline-flex items-center gap-2 hover:text-cyan"
            >
              <FaBug />
              Bug Report
            </Link>
          </li>
          <li>
            <a
              href={DISCORD_URL}
              className="hover:text-cyan"
              target="_blank"
              rel="noreferrer"
            >
              Community Help
            </a>
          </li>
        </ul>
        <ul className="flex items-center gap-4 text-yellow text-2xl">
          <li>
            <a
              href={TWITTER_URL}
              target="_blank"
              rel="noreferrer"
              className="transition-colors duration-300 hover:text-cyan"
            >
              <BsTwitterX />
            </a>
          </li>
          <li>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noreferrer"
              className="transition-colors duration-300 hover:text-cyan"
            >
              <BsDiscord />
            </a>
          </li>
        </ul>
      </footer>
    </div>
  );
};
