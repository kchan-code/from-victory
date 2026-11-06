"use client";
// client: subscribes to the native App plugin (window.Capacitor) for
// universal links delivered to the iOS app, cold and warm.

import { useEffect } from "react";

import {
  INVITE_PATH,
  parseInviteUniversalLink,
} from "@/lib/invites/universal-link";

/**
 * FV-630: route invite universal links into the WebView.
 *
 * The native side already forwards both delivery paths to Capacitor's App
 * plugin (apps/native/ios/App/App/SceneDelegate.swift → ApplicationDelegate
 * Proxy): a COLD launch is retained as the "launch URL"; a WARM open fires
 * `appUrlOpen`. Capacitor does not navigate the WebView by itself, so this
 * component does — but only for URLs that pass the strict
 * parseInviteUniversalLink() check (exact https host + path, no query, a
 * well-formed `#code=` fragment). Everything else is ignored.
 *
 * Dedup: Capacitor keeps returning the last delivered URL from
 * getLaunchUrl() for the life of the process, and this component re-mounts
 * on every full page load. Without dedup, a used invite would re-open after
 * every reload. Each delivered URL is handled once per app process
 * (sessionStorage, which a cold launch starts empty; an in-memory set backs
 * it up if storage throws). Only a sha256 digest of the URL is stored, never
 * the URL itself, because the URL carries a live code. A WARM `appUrlOpen` is an explicit new tap and is
 * always honored.
 *
 * apps/web has no @capacitor/core dependency (same as lib/native/apple-iap.ts);
 * on the web and in the PWA the global is absent and this renders nothing.
 */

type ListenerHandle = { remove: () => Promise<void> | void };
interface AppPluginBridge {
  getLaunchUrl?: () => Promise<{ url?: string } | undefined>;
  addListener?: (
    event: "appUrlOpen",
    cb: (e: { url?: string }) => void,
  ) => Promise<ListenerHandle> | ListenerHandle;
}

const HANDLED_KEY = "fv_handled_invite_links";
const handledInMemory = new Set<string>();

function getAppPlugin(): AppPluginBridge | null {
  if (typeof window === "undefined") return null;
  // reason: window.Capacitor is injected by the native bridge at runtime; no
  // ambient type exists in apps/web (see lib/native/apple-iap.ts).
  const injected = window as unknown as {
    Capacitor?: { Plugins?: { App?: AppPluginBridge } };
  };
  return injected.Capacitor?.Plugins?.App ?? null;
}

function readHandled(): string[] {
  try {
    const raw = window.sessionStorage.getItem(HANDLED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Dedup key for a delivered URL: sha256 hex, so the stored list never holds
 * a live invite code (kids-privacy-officer, FV-630). Null when Web Crypto is
 * unavailable; the caller then dedups in memory only.
 */
export async function linkDigest(url: string): Promise<string | null> {
  try {
    const subtle = window.crypto?.subtle;
    if (!subtle) return null;
    const bytes = new TextEncoder().encode(url);
    const hash = await subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hash), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
  } catch {
    return null;
  }
}

export function wasHandled(key: string): boolean {
  return handledInMemory.has(key) || readHandled().includes(key);
}

export function markHandled(key: string): void {
  handledInMemory.add(key);
  try {
    const next = [...readHandled().filter((k) => k !== key), key].slice(-10);
    window.sessionStorage.setItem(HANDLED_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — the in-memory set still covers this page life.
  }
}

/**
 * Full navigation to the in-app path. Already on /invite, assign() alone would
 * only change the fragment (same-document, no reload), so the page would never
 * read the new code — reload in that case.
 */
function navigateToInvite(path: string): void {
  const onInvite = window.location.pathname === INVITE_PATH;
  window.location.assign(path);
  if (onInvite) window.location.reload();
}

/** Navigate to the in-app invite path for `url`, if it is a valid link. */
export async function routeInviteLink(
  url: unknown,
  opts: { explicit: boolean },
  navigate: (path: string) => void = navigateToInvite,
): Promise<boolean> {
  if (typeof url !== "string") return false;
  const path = parseInviteUniversalLink(url);
  if (!path) return false;
  // Without Web Crypto, fall back to an in-memory-only key that is never
  // written to storage.
  const digest = await linkDigest(url);
  if (digest) {
    if (!opts.explicit && wasHandled(digest)) return false;
    markHandled(digest);
  } else {
    if (!opts.explicit && handledInMemory.has(url)) return false;
    handledInMemory.add(url);
  }
  navigate(path);
  return true;
}

export function NativeInviteLinkHandler({
  navigate,
}: {
  /** Test seam; defaults to a full WebView navigation. */
  navigate?: (path: string) => void;
} = {}) {
  useEffect(() => {
    const app = getAppPlugin();
    if (!app) return;

    let cancelled = false;
    let handle: ListenerHandle | null = null;

    if (typeof app.addListener === "function") {
      Promise.resolve(
        app.addListener("appUrlOpen", (event) => {
          void routeInviteLink(event?.url, { explicit: true }, navigate);
        }),
      )
        .then((h) => {
          if (cancelled) void h.remove();
          else handle = h;
        })
        .catch(() => {
          // Listener registration failed; the code-entry path still works.
        });
    }

    if (typeof app.getLaunchUrl === "function") {
      app
        .getLaunchUrl()
        .then((result) => {
          if (!cancelled) {
            void routeInviteLink(result?.url, { explicit: false }, navigate);
          }
        })
        .catch(() => {
          // No launch URL / bridge error — nothing to route.
        });
    }

    return () => {
      cancelled = true;
      if (handle) void handle.remove();
    };
  }, [navigate]);

  return null;
}
