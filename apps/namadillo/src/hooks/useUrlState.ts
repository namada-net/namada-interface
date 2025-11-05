import { params } from "App/routes";
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export const useUrlState = (
  paramName: keyof typeof params
): [string | undefined, (newValue?: string) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();

  const value = searchParams.get(paramName) || undefined;

  const setValue = useCallback(
    (value?: string): void => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          if (value === undefined) {
            newParams.delete(paramName);
          } else {
            newParams.set(paramName, value);
          }
          return newParams;
        },
        { replace: true }
      );
    },
    [paramName, setSearchParams]
  );

  return [value, setValue];
};

export const useUrlStateBatch = (): ((
  updates: Record<string, string | undefined>
) => void) => {
  const [, setSearchParams] = useSearchParams();

  const setBatchParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined) {
              newParams.delete(key);
            } else {
              newParams.set(key, value);
            }
          });
          return newParams;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return setBatchParams;
};
