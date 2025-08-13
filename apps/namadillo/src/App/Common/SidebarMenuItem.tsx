import clsx from "clsx";
import { NavLink, useLocation } from "react-router-dom";

type Props = {
  url?: string;
  children: React.ReactNode;
  shouldHighlight?: boolean;
  preventNavigationOnSameRoute?: boolean;
};

export const SidebarMenuItem = ({
  url,
  children,
  shouldHighlight,
  preventNavigationOnSameRoute = false,
}: Props): JSX.Element => {
  const location = useLocation();

  const className = clsx(
    "flex items-center gap-5 text-lg text-white",
    "transition-colors duration-300 ease-out-quad hover:text-cyan",
    {
      "!text-neutral-500 pointer-events-none select-none": !url,
    }
  );

  if (!url) {
    return <span className={className}>{children}</span>;
  }

  const handleClick = (e: React.MouseEvent): void => {
    if (preventNavigationOnSameRoute && location.pathname === url) {
      e.preventDefault();
    }
  };

  return (
    <NavLink
      to={url}
      onClick={handleClick}
      className={({ isActive }) =>
        clsx(className, {
          "text-yellow font-bold": isActive || shouldHighlight,
        })
      }
    >
      {children}
    </NavLink>
  );
};
