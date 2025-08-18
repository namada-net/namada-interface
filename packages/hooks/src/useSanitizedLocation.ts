import dompurify from "isomorphic-dompurify";
import { Location, useLocation } from "react-router-dom";

export const useSanitizedLocation = (): Location => {
  const location = useLocation();
  return {
    ...location,
    pathname: dompurify.sanitize(location.pathname),
    search: dompurify.sanitize(location.search),
    hash: dompurify.sanitize(location.hash),
  };
};
