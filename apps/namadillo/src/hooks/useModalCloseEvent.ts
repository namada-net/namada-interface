import { routes } from "App/routes";
import { useLocation, useNavigate } from "react-router-dom";

type useModalCloseEventProps = {
  onCloseModal: () => void;
};

export const useModalCloseEvent = (): useModalCloseEventProps => {
  const navigate = useNavigate();
  const location = useLocation();

  const onCloseModal = (): void => {
    if (location.state?.backgroundLocation) {
      const backgroundLocation = location.state.backgroundLocation as Location;
      navigate(backgroundLocation.pathname + backgroundLocation.search, {
        replace: true,
      });
    } else {
      navigate(routes.root, { replace: true });
    }
  };

  return { onCloseModal };
};
