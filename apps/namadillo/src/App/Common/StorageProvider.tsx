import { queryClient } from "App/Common/QueryProvider";
import { getDefaultStore } from "jotai";
import { queryClientAtom } from "jotai-tanstack-query";
import { Provider as JotaiProvider } from "jotai/react";
import { useHydrateAtoms } from "jotai/utils";

type StorageProviderProps = { children: JSX.Element };

const HydrateAtoms = (props: { children: JSX.Element }): JSX.Element => {
  useHydrateAtoms([[queryClientAtom, queryClient]]);
  return props.children;
};

const defaultStore = getDefaultStore();

export const StorageProvider = ({
  children,
}: StorageProviderProps): JSX.Element => {
  return (
    <JotaiProvider store={defaultStore}>
      <HydrateAtoms>{children}</HydrateAtoms>
    </JotaiProvider>
  );
};
