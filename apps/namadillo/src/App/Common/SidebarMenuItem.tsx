import clsx from "clsx";
import { NavLink } from "react-router-dom";

type Props = {
  url?: string;
  children: React.ReactNode;
};

export const SidebarMenuItem = ({ url, children }: Props): JSX.Element => {
  const className = clsx(
    "flex items-center gap-4 text-lg text-white",
    "transition-colors duration-300 ease-out-quad hover:text-cyan",
    {
      "!text-neutral-500 pointer-events-none select-none": !url,
    }
  );

  if (!url) {
    return <span className={className}>{children}</span>;
  }

  return (
    <NavLink
      to={url}
      className={({ isActive }) =>
        clsx(className, {
          "text-yellow font-bold pointer-events-none select-none": isActive,
        })
      }
    >
      {children}
    </NavLink>
  );
};
