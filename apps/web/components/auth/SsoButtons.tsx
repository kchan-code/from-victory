"use client";
// client: OAuth/native-sheet flows need window, crypto, the Capacitor bridge and busy state

import { useEffect, useState } from "react";

import { appleHandoffComplete, appleNativeSignIn } from "@/lib/actions/apple-auth";
import {
  androidChallengeFor,
  APP_CALLBACK_URL,
  parseAppCallback,
  randomBase64Url,
  sha256Hex,
} from "@/lib/auth/sso-client";
import type { SsoEntry } from "@/lib/auth/sso-visibility";
import { signInWithApple, startSession } from "@/lib/native/auth";
import { createClient } from "@/lib/supabase/client";

type Provider = "apple" | "google";

type Props = {
  entry: SsoEntry;
  /** Divider copy sits between the buttons and the email form. */
  withEmailDivider?: boolean;
};

const FLOW_ERROR = "That sign-in didn’t go through. Try again, or use your email.";

const buttonClass =
  "flex w-full items-center justify-center gap-3 min-h-[48px] rounded-pill border bg-white px-6 font-heading font-semibold text-[15px] text-[#1f1f1f] border-white transition-colors duration-fast ease-out hover:bg-[#f2f2f2] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal";

function AppleMark() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="#000">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export function SsoButtons({ entry, withEmailDivider = true }: Props) {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A flow that navigated away leaves `busy` set; if the browser restores this
  // page from the back/forward cache (Back on iOS Safari), re-enable buttons.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setBusy(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  if (entry.browserHint) {
    return (
      <p
        data-testid="sso-browser-hint"
        className="mb-6 font-body text-[14px] text-cream/70"
      >
        Open in Safari or Chrome to use Apple or Google.
      </p>
    );
  }
  if (!entry.show) return null;

  const inApp = entry.surface !== "web";

  const fail = () => {
    setError(FLOW_ERROR);
    setBusy(null);
  };

  // Run a flow; a user dismissing the sheet resets quietly, anything else is
  // one generic message (never provider detail).
  const run = async (provider: Provider, flow: () => Promise<void>) => {
    if (busy) return;
    setBusy(provider);
    setError(null);
    try {
      await flow();
    } catch {
      fail();
    }
  };

  // The native wrapper never throws: {ok:false,error}. A cancel is a quiet reset.
  const nativeFailed = (r: { ok: false; error: string }) => {
    if (r.error === "cancelled") setBusy(null);
    else fail();
  };

  const goto = (path: string) => window.location.assign(path);

  const google = () =>
    run("google", async () => {
      const supabase = createClient();
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: inApp
            ? APP_CALLBACK_URL
            : `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: inApp,
          scopes: "openid email",
        },
      });
      if (oauthError || !data?.url) return fail();
      if (!inApp) return; // Supabase navigates the page; keep the button busy.

      const result = await startSession(data.url);
      if (!result.ok) return nativeFailed(result);
      const params = parseAppCallback(result.url);
      const code = params?.get("code");
      if (!code || params?.has("error")) return fail();
      // The exchange must run in THIS WebView: its cookies hold the PKCE verifier.
      goto(`/auth/callback?code=${encodeURIComponent(code)}`);
    });

  const apple = () =>
    run("apple", async () => {
      if (entry.surface === "web") return goto("/auth/apple/start");

      if (entry.surface === "ios") {
        const rawNonce = randomBase64Url(32);
        const nonceHash = await sha256Hex(rawNonce);
        const sheet = await signInWithApple(nonceHash);
        if (!sheet.ok) return nativeFailed(sheet);
        const res = await appleNativeSignIn({
          identityToken: sheet.identityToken,
          authorizationCode: sheet.authorizationCode,
          rawNonce,
        });
        if (!res.ok) return fail();
        return goto(res.path);
      }

      // Android: the verifier never leaves this closure (JS memory).
      const verifier = randomBase64Url(32);
      const challenge = await androidChallengeFor(verifier);
      const result = await startSession(
        `${window.location.origin}/auth/apple/start?app=android&challenge=${challenge}`,
      );
      if (!result.ok) return nativeFailed(result);
      const handoff = parseAppCallback(result.url)?.get("handoff");
      if (!handoff) return fail();
      const res = await appleHandoffComplete({ handoff, verifier });
      if (!res.ok) return fail();
      goto(res.path);
    });

  return (
    <div data-testid="sso-buttons" className="mb-2">
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={apple}
          disabled={busy !== null}
          aria-busy={busy === "apple"}
          data-testid="sso-apple"
          className={buttonClass}
        >
          <AppleMark />
          Continue with Apple
        </button>
        <button
          type="button"
          onClick={google}
          disabled={busy !== null}
          aria-busy={busy === "google"}
          data-testid="sso-google"
          className={buttonClass}
        >
          <GoogleMark />
          Continue with Google
        </button>
      </div>
      {error ? (
        <p role="alert" data-testid="sso-error" className="mt-4 font-body text-[14px] text-red-400">
          {error}
        </p>
      ) : null}
      {withEmailDivider ? (
        <div className="my-6 flex items-center gap-3 font-body text-[13px] text-cream/70">
          <span aria-hidden="true" className="h-px flex-1 bg-hairline" />
          or use email
          <span aria-hidden="true" className="h-px flex-1 bg-hairline" />
        </div>
      ) : null}
    </div>
  );
}
