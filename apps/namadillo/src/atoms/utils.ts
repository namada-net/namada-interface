import {
  dismissToastNotificationAtom,
  dispatchToastNotificationAtom,
} from "atoms/notifications";
import { useSetAtom } from "jotai";
import { AtomWithQueryResult } from "jotai-tanstack-query";
import { useEffect } from "react";
import { ToastNotification } from "types";

export const atomsAreFetching = (...args: AtomWithQueryResult[]): boolean => {
  return args.reduce((prev, current) => prev || current.isPending, false);
};

export const atomsAreLoaded = (...args: AtomWithQueryResult[]): boolean => {
  return args.reduce((prev, current) => prev && current.isSuccess, true);
};

export const atomsAreError = (...args: AtomWithQueryResult[]): boolean => {
  return args.reduce((prev, current) => prev || current.isError, false);
};

export const atomsAreLoading = (...args: AtomWithQueryResult[]): boolean => {
  return args.reduce((prev, current) => prev || current.isLoading, false);
};

export const getFirstError = (
  ...args: AtomWithQueryResult[]
): Error | null | undefined => {
  return args.find((arg) => arg.isError)?.error;
};

export const atomsAreNotInitialized = (
  ...args: AtomWithQueryResult[]
): boolean => {
  return args.reduce(
    (prev, current) =>
      prev ||
      (current.fetchStatus === "idle" &&
        current.isPending &&
        !current.isFetched),
    false
  );
};

export const queryDependentFn = <T>(
  queryFn: () => Promise<T>,
  dependencies: (AtomWithQueryResult | boolean)[]
): { queryFn: () => Promise<T>; enabled: boolean } => {
  const atomDependencies: AtomWithQueryResult[] = [];
  let booleanDependencies: boolean = true;

  dependencies.forEach((dep) => {
    if (typeof dep === "boolean") {
      booleanDependencies = booleanDependencies && dep;
    } else {
      atomDependencies.push(dep);
    }
  });

  const atomHasError = atomsAreError(...atomDependencies);
  const atomsLoaded = atomsAreLoaded(...atomDependencies);

  return {
    enabled: atomHasError || (atomsLoaded && booleanDependencies),
    queryFn: async () => {
      if (atomHasError) {
        throw getFirstError(...atomDependencies);
      }
      return queryFn();
    },
  };
};

export const useNotifyOnAtomError = (
  atoms: AtomWithQueryResult[],
  deps: React.DependencyList
): void => {
  const dispatchNotification = useSetAtom(dispatchToastNotificationAtom);
  const dismissNotification = useSetAtom(dismissToastNotificationAtom);

  const toast: ToastNotification = {
    id: "something-went-wrong",
    title: "Something went wrong",
    description: "Try checking your network settings and refreshing the page",
    type: "error",
  };

  useEffect(() => {
    if (atomsAreError(...atoms)) {
      dismissNotification(toast.id);
      dispatchNotification(toast);
    }
  }, deps);
};
