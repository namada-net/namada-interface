import { routes } from "App/routes";
import { BsQuestionCircleFill } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import { IconTooltip } from "./IconTooltip";

export const LedgerDeviceTooltip = (): JSX.Element => {
  const navigate = useNavigate();
  return (
    <IconTooltip
      className="absolute w-4 h-4 top-0 right-0 mt-4 mr-5"
      icon={<BsQuestionCircleFill className="w-4 h-4 text-yellow" />}
      text={
        <span>
          If your device is connected and the app is open, please go to{" "}
          <Link
            onClick={(e) => {
              e.preventDefault();
              navigate(routes.settingsLedger, {
                state: { backgroundLocation: location },
              });
            }}
            to={routes.settingsLedger}
            className="text-yellow"
          >
            Settings
          </Link>{" "}
          and pair your device with Namadillo.
        </span>
      }
    />
  );
};
