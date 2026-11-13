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
  cachedIdTokenVerifier = null;
}

// ---------------------------------------------------------------------------
// Pub/Sub push authentication (FV-662; record 7.3)
// ---------------------------------------------------------------------------
//
// Google signs every push with an OIDC token in `Authorization: Bearer <JWT>`.
// We accept a push only when ALL hold: the signature verifies against Google's
// certs, the audience equals GOOGLE_PLAY_PUBSUB_AUDIENCE, the issuer is
// Google, `email` equals GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT, and
// `email_verified` is true. Missing config rejects (fail closed). The JWT and
// its claims are never logged or returned.

/**
 * Verifies a Google-signed ID token (signature, expiry, audience) and returns
 * its claims; throws when invalid. Injectable so tests never need the library.
 */
export type VerifyGoogleIdToken = (
  idToken: string,
  audience: string,
) => Promise<Record<string, unknown> | undefined>;

export type PushAuthFailure =
  | "not_configured"
  | "missing_token"
  | "invalid_token"
  | "wrong_issuer"
  | "wrong_identity"
  | "email_unverified";

export type PushAuthResult =
  | { ok: true }
  /** 401: no/invalid credential. 403: a valid Google token for the wrong party, or no config. */
  | { ok: false; status: 401 | 403; reason: PushAuthFailure };

export interface PushAuthDeps {
  readonly verifyIdToken?: VerifyGoogleIdToken;
  /** Override env for tests. */
  readonly audience?: string;
  readonly serviceAccount?: string;
}

const GOOGLE_ISSUERS: ReadonlySet<string> = new Set([
  "https://accounts.google.com",
  "accounts.google.com",
]);
const MAX_JWT_LENGTH = 8192;

let cachedIdTokenVerifier: VerifyGoogleIdToken | null = null;

const defaultVerifyIdToken: VerifyGoogleIdToken = async (idToken, audience) => {
  if (!cachedIdTokenVerifier) {
    // Lazy import, same rule as buildAuth(): never at module load.
    // reason: narrow structural view of the one class/method we use.
    const { OAuth2Client } = (await import("google-auth-library")) as unknown as {
      OAuth2Client: new () => {
        verifyIdToken(opts: {
          idToken: string;
          audience: string;
        }): Promise<{ getPayload(): Record<string, unknown> | undefined }>;
      };
    };
    const client = new OAuth2Client();
    cachedIdTokenVerifier = async (token, aud) => {
      const ticket = await client.verifyIdToken({ idToken: token, audience: aud });
      return ticket.getPayload();
    };
  }
  return cachedIdTokenVerifier(idToken, audience);
};

/**
 * Authenticates a Pub/Sub push from its `Authorization` header value. Never
 * throws; every failure is a static reason code (no JWT, claim or library
 * message is carried out).
 */
export async function verifyPubSubPush(
  authorization: string | null,
  deps: PushAuthDeps = {},
): Promise<PushAuthResult> {
  const audience = deps.audience ?? process.env.GOOGLE_PLAY_PUBSUB_AUDIENCE;
  const serviceAccount = deps.serviceAccount ?? process.env.GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT;
  if (!audience || !serviceAccount) {
    return { ok: false, status: 403, reason: "not_configured" };
  }

  const match = /^Bearer (\S+)$/i.exec(authorization ?? "");
  const jwt = match?.[1];
  if (!jwt || jwt.length > MAX_JWT_LENGTH) {
    return { ok: false, status: 401, reason: "missing_token" };
  }

  let claims: Record<string, unknown> | undefined;
  try {
    claims = await (deps.verifyIdToken ?? defaultVerifyIdToken)(jwt, audience);
  } catch {
    return { ok: false, status: 401, reason: "invalid_token" };
  }
  if (!claims) return { ok: false, status: 401, reason: "invalid_token" };

  if (typeof claims.iss !== "string" || !GOOGLE_ISSUERS.has(claims.iss)) {
    return { ok: false, status: 401, reason: "wrong_issuer" };
  }
  if (claims.email_verified !== true) {
    return { ok: false, status: 403, reason: "email_unverified" };
  }
  if (typeof claims.email !== "string" || claims.email.toLowerCase() !== serviceAccount.toLowerCase()) {
    return { ok: false, status: 403, reason: "wrong_identity" };
  }
  return { ok: true };
}
