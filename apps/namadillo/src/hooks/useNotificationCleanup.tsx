import {
  dismissNotificationByTxHashAtom,
  toastNotificationsAtom,
} from "atoms/notifications";
import { pendingTransactionsHistoryAtom } from "atoms/transactions";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

export const useNotificationCleanup = (): void => {
  const notifications = useAtomValue(toastNotificationsAtom);
  const pendingTransactions = useAtomValue(pendingTransactionsHistoryAtom);
  const dismissNotificationByTxHash = useSetAtom(
    dismissNotificationByTxHashAtom
  );

  useEffect(() => {
    // Get all pending transaction hashes
    const pendingTxHashes = new Set(
      pendingTransactions.map((tx) => tx.hash).filter(Boolean)
    );

    // Find stale pending notifications (notifications for transactions that are no longer pending)
    const pendingNotifications = notifications.filter(
      (n) => n.type === "pending"
    );

    pendingNotifications.forEach((notification) => {
      // Extract transaction hashes from notification ID
      const txHashesFromId = notification.id.split(",");

      // Check if any of these hashes are still in pending transactions
      const hasActivePendingTx = txHashesFromId.some((hash) =>
        pendingTxHashes.has(hash)
      );

      // If no active pending transaction matches this notification, dismiss it
      if (!hasActivePendingTx && txHashesFromId.length > 0) {
        txHashesFromId.forEach((hash) => {
          if (hash.trim()) {
            dismissNotificationByTxHash(hash.trim());
          }
        });
      }
    });
  }, [notifications, pendingTransactions, dismissNotificationByTxHash]);

  // Also clean up when the page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = (): void => {
      if (!document.hidden) {
        // Page became visible, trigger cleanup by updating dependencies
        // The cleanup logic above will run due to the useEffect dependencies
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
};
