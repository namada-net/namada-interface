import { AlphaVersionTopHeader } from "App/Common/AlphaVersionTopHeader";
import { shouldUpdateBalanceAtom } from "atoms/etc";
import { useSetAtom } from "jotai";
import { ReactNode, useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { twMerge } from "tailwind-merge";
import { AppHeader } from "./AppHeader";
import { BurgerButton } from "./BurgerButton";
import { Navigation } from "./Navigation";

export const AppLayout = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  const [displayNavigation, setDisplayNavigation] = useState(false);

  const shouldUpdateBalance = useSetAtom(shouldUpdateBalanceAtom);
  // We have to clear balance update flag on mount in case app was closed before timeout
  // occured in `useTransactionCallback`, otherwise we get infinite loop
  useEffect(() => {
    shouldUpdateBalance(false);
  }, []);

  return (
    <>
      <div className="sticky top-0 bg-neutral-800 z-50">
        <AlphaVersionTopHeader />
        <AppHeader
          burger={
            <span className="sm:px-0 lg:hidden">
              <BurgerButton
                open={displayNavigation}
                onClick={() => setDisplayNavigation(!displayNavigation)}
              />
            </span>
          }
        />
      </div>
      <div className="lg:grid lg:grid-cols-[220px_auto] lg:gap-2 px-6">
        <aside
          onClick={(e) => e.stopPropagation()}
          className={twMerge(
            // mobile, burger, fixed, full height
            "transition-transform duration-500 ease-out-expo",
            "fixed left-0 top-0 bottom-0 z-[9999]",
            !displayNavigation && "-translate-x-full lg:translate-x-0",
            // desktop, left nav, floating panel => 113px = header height + alpha top bar
            "lg:sticky lg:top-[113px] lg:h-[calc(100svh-113px)] lg:pb-2",
            "lg:transition-none lg:z-auto"
          )}
        >
          <div
            className={twMerge(
              "h-full bg-black w-[240px] pt-10",
              "lg:w-auto lg:p-0 lg:rounded-sm overflow-auto"
            )}
          >
            {displayNavigation && (
              <button
                className="absolute top-4 left-4 text-white hover:text-yellow text-2xl lg:hidden"
                onClick={() => setDisplayNavigation(false)}
                aria-label="Close Navigation"
              >
                <IoMdClose />
              </button>
            )}
            <Navigation />
          </div>
        </aside>
        <main className="min-h-full pb-2 flex flex-col flex-1">{children}</main>
      </div>
    </>
  );
};
