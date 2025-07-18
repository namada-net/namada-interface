import { NamadaTransfer } from "App/NamadaTransfer/NamadaTransfer";
import { routes } from "App/routes";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { useUrlState } from "hooks/useUrlState";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isTransparentAddress } from ".";
import { determineTransferType } from "./utils";

export const TransferSwitcher = (): JSX.Element => {
  const [sourceAddress] = useUrlState("source");
  const [destinationAddress] = useUrlState("destination");
  const navigate = useNavigate();
  const location = useLocation();

  const transferType = determineTransferType({
    sourceAddress,
    destinationAddress,
  });

  const { data: accounts } = useAtomValue(allDefaultAccountsAtom);
  const transparentAddress =
    accounts?.find((acc) => isTransparentAddress(acc.address))?.address ?? "";

  // Navigate to appropriate route based on transfer type
  useEffect(() => {
    const currentPath = location.pathname;
    let targetRoute = "";

    switch (transferType) {
      case "ibc-deposit":
        targetRoute = routes.ibc;
        break;
      case "ibc-withdraw":
        targetRoute = routes.ibcWithdraw;
        break;
      case "shield":
        targetRoute = routes.maspShield;
        break;
      case "unshield":
        targetRoute = routes.maspUnshield;
        break;
      default:
        // Stay on current transfer route for namada-transfer
        targetRoute = routes.transfer;
    }

    // Only navigate if we're not already on the correct route
    if (currentPath !== targetRoute) {
      const searchParams = new URLSearchParams(location.search);
      console.log("targetRoute", targetRoute);
      navigate(`${targetRoute}?${searchParams.toString()}`, {
        replace: true,
      });
    } else if (transferType === "namada-transfer") {
      // For default case, ensure source parameter is set only if none exists
      const searchParams = new URLSearchParams(location.search);
      if (!sourceAddress && transparentAddress) {
        searchParams.set("source", transparentAddress);
        navigate(`${currentPath}?${searchParams.toString()}`, {
          replace: true,
        });
      }
    }
  }, [
    transferType,
    sourceAddress,
    destinationAddress,
    navigate,
    location,
    transparentAddress,
  ]);

  // Default to NamadaTransfer component
  return <NamadaTransfer />;
};
