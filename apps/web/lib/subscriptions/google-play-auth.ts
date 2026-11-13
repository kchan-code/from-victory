/**
 * google-play-auth.ts — the ONE module that touches `google-auth-library`
 * (FV-661; record 7.6, decision G7).
 *
 * Everything else depends on the `GetPlayAccessToken` function type, so tests
 * inject a fake and the real library is never needed to run them. A static test
 * asserts this is the only importer of the package and that no client file
 * imports this module.
 *
 * Credentials (decision G7 is not final): today a service-account key JSON in
 * the server env var `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`. If KC picks keyless
 * federation, only `buildAuth()` below changes.
 *
 * NEVER log or put in an error: the credential JSON, any part of it, or an
 * access token. Every error thrown here is a static string; the underlying
 * library error is intentionally dropped, because it can echo request detail.
 */
import "server-only";

/** Returns a short-lived OAuth access token for the Android Publisher API. */
export type GetPlayAccessToken = () => Promise<string>;

export const ANDROID_PUBLISHER_SCOPE = "https://www.googleapis.com/auth/androidpublisher";

export class PlayAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlayAuthError";
  }
}

// Minimal structural type for the part of GoogleAuth we use, so this file does
// not need the package's types in scope to stay readable.
interface TokenSource {
  getAccessToken(): Promise<string | null | undefined>;
}

let cachedSource: TokenSource | null = null;

async function buildAuth(): Promise<TokenSource> {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new PlayAuthError("Play credentials are not configured.");
  }

  let credentials: unknown;
  try {
    credentials = JSON.parse(raw);
  } catch {
    // Do not include the parse error: it can quote the credential text.
    throw new PlayAuthError("Play credentials are not valid JSON.");
  }
  if (typeof credentials !== "object" || credentials === null) {
    throw new PlayAuthError("Play credentials are not a JSON object.");
  }

  // Lazy import: the library is only loaded when a token is actually needed,
  // never at module load (and never in a client bundle: see the header).
  // reason: narrow structural view of the one constructor we use; the library
  // validates the credential shape itself, and this keeps our code independent
  // of its exported credential types.
  const { GoogleAuth } = (await import("google-auth-library")) as unknown as {
    GoogleAuth: new (opts: { credentials: object; scopes: string[] }) => TokenSource;
  };
  return new GoogleAuth({
    credentials,
    scopes: [ANDROID_PUBLISHER_SCOPE],
  });
}

/** The default token provider used by the Play API module. */
export const getPlayAccessToken: GetPlayAccessToken = async () => {
  try {
    cachedSource ??= await buildAuth();
    const token = await cachedSource.getAccessToken();
    if (!token) throw new PlayAuthError("Play returned no access token.");
    return token;
  } catch (err) {
    if (err instanceof PlayAuthError) throw err;
    throw new PlayAuthError("Could not obtain a Play access token.");
  }
};

/** Test hook: drop the cached auth client. */
export function resetPlayAuthCacheForTests(): void {
  cachedSource = null;
}
