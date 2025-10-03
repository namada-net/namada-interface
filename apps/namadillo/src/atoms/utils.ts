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

// import { atom, SetStateAction } from "jotai";

// // From jotai utils example
// export const atomWithDebounce = <T>(
//   initialValue: T,
//   delayMilliseconds = 500,
//   shouldDebounceOnReset = false
// ): {
//   currentValueAtom: Atom<T>;
//   isDebouncingAtom: Atom<boolean>;
//   clearTimeoutAtom: Atom<void>;
//   debouncedValueAtom: Atom<T>;
// } => {
//   const prevTimeoutAtom = atom<ReturnType<typeof setTimeout> | undefined>(
//     undefined
//   );

//   // DO NOT EXPORT currentValueAtom as using this atom to set state can cause
//   // inconsistent state between currentValueAtom and debouncedValueAtom
//   const _currentValueAtom = atom(initialValue);
//   const isDebouncingAtom = atom(false);

//   const debouncedValueAtom = atom(
//     initialValue,
//     (get, set, update: SetStateAction<T>) => {
//       clearTimeout(get(prevTimeoutAtom));

//       const prevValue = get(_currentValueAtom);
//       const nextValue =
//         typeof update === "function" ?
//           (update as (prev: T) => T)(prevValue)
//         : update;

//       const onDebounceStart = (): void => {
//         set(_currentValueAtom, nextValue);
//         set(isDebouncingAtom, true);
//       };

//       const onDebounceEnd = (): void => {
//         set(debouncedValueAtom, nextValue);
//         set(isDebouncingAtom, false);
//       };

//       onDebounceStart();

//       if (!shouldDebounceOnReset && nextValue === initialValue) {
//         onDebounceEnd();
//         return;
//       }

//       const nextTimeoutId = setTimeout(() => {
//         onDebounceEnd();
//       }, delayMilliseconds);

//       // set previous timeout atom in case it needs to get cleared
//       set(prevTimeoutAtom, nextTimeoutId);
//     }
//   );

//   // exported atom setter to clear timeout if needed
//   const clearTimeoutAtom = atom(null, (get, set, _arg) => {
//     clearTimeout(get(prevTimeoutAtom));
//     set(isDebouncingAtom, false);
//   });

//   return {
//     currentValueAtom: atom((get) => get(_currentValueAtom)),
//     isDebouncingAtom,
//     clearTimeoutAtom,
//     debouncedValueAtom,
//   };
// };
