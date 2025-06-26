import { SidebarMenuItem } from "App/Common/SidebarMenuItem";
import { routes } from "App/routes";
import { applicationFeaturesAtom } from "atoms/settings";
import { useAtomValue } from "jotai";
import { AiFillHome } from "react-icons/ai";
import { BsDiscord, BsTwitterX } from "react-icons/bs";
import { FaVoteYea } from "react-icons/fa";
import { FaBug } from "react-icons/fa6";
import { GoHistory, GoStack } from "react-icons/go";
import { IoSwapHorizontal } from "react-icons/io5";
import { TbVectorTriangle } from "react-icons/tb";
import { Link } from "react-router-dom";
import { DISCORD_URL, TWITTER_URL } from "urls";

export const Navigation = (): JSX.Element => {
  const features = useAtomValue(applicationFeaturesAtom);

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
      icon: <TbVectorTriangle />,
      url: routes.shield,
    },
    {
      label: "Transfer",
      icon: <IoSwapHorizontal />,
      url:
        features.maspEnabled || features.namTransfersEnabled ?
          routes.transfer
        : undefined,
    },
    {
      label: "Receive",
      icon: <IoSwapHorizontal />,
      url:
        features.maspEnabled || features.namTransfersEnabled ?
          routes.transfer
        : undefined,
    },
    {
      label: "History",
      icon: <GoHistory />,
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
          return (
            <>
              <li key={item.label}>
                {shieldingRoute && (
                  <>
                    <hr className="border-neutral-300 border-t-1 w-full mb-3" />
                    <h5 className="text-neutral-500 text-sm mb-2">
                      Move Assets
                    </h5>
                  </>
                )}
                <SidebarMenuItem url={item.url}>
                  {item.icon}
                  {item.label}
                </SidebarMenuItem>
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
