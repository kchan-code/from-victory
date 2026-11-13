"use client";
// client: subscribes to the native StoreKit bridge, visibilitychange, and
// router.refresh() to reconcile late/unfinished Apple transactions (FV-712).

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  isAppleIapBridgeAvailable,
  onTransactionsUpdated,
} from "@/lib/native/apple-iap";
import { syncAppleTransactions } from "@/lib/native/apple-transaction-sync";

/**
 * FV-712: on mount, on StoreKit `transactionsUpdated`, and when the app
 * returns to the foreground, reconcile unfinished Apple transactions with the
 * server. Refreshes Server Components only when entitlement actually changed.
 * Renders nothing and does nothing outside the iOS shell.
 */
export function NativeAppleTransactionSync() {
  const router = useRouter();

  useEffect(() => {
    if (!isAppleIapBridgeAvailable()) return;
    let active = true;

    const sync = () => {
      void syncAppleTransactions().then((result) => {
        if (active && result.status === "synced" && result.applied) router.refresh();
      });
    };

    sync();
    const unsubscribe = onTransactionsUpdated(sync);
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
