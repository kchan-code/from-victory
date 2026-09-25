/**
 * Real-fixture regression proof for FV-598.
 *
 * Every other apple-server test mocks `@apple/app-store-server-library`
 * entirely (no real crypto, no real certs). This file is the deliberate
 * exception: it uses a REAL Apple-signed Sandbox App Store Server
 * Notification (`__tests__/fixtures/apple/test-notification-sandbox.signedPayload.txt`,
 * captured 2026-09-22, notificationType TEST) and the real Apple Root CA G2/G3
 * certificates to prove, with real cryptographic verification, that:
 *
 *   1. The defect was real: verifying the Sandbox fixture against a
 *      PRODUCTION-configured `SignedDataVerifier` throws
 *      `INVALID_APP_IDENTIFIER` (status 3) — NOT `INVALID_ENVIRONMENT` — so
 *      the old Production-first-then-INVALID_ENVIRONMENT-only fallback could
 *      never have recovered it.
 *   2. The fix's premise holds: verifying the SAME fixture against a
 *      SANDBOX-configured verifier succeeds and decodes
 *      `notificationType: "TEST"`, `data.environment: "Sandbox"`.
 *   3. A wrong bundleId is rejected under BOTH environment configurations —
 *      picking the "right" verifier via the environment claim never
 *      bypasses the bundleId check.
 *   4. (FV-603) The same real fixture verifies when the root certs come from
 *      a base64 round trip of these exact files (the `APPLE_ROOT_CA_BASE64`
 *      route `loadRootCertificates()` uses in production) instead of a raw
 *      file read (the `APPLE_ROOT_CA_PATHS` route used in beta/local dev) —
 *      proving the two configuration sources are cryptographically
 *      equivalent, not just superficially interchangeable.
 *
 * This file imports `@apple/app-store-server-library` directly (real
 * `SignedDataVerifier`, not `apple-server.ts`'s wrapper) for one reason:
 * `apple-server.ts` hard-codes `enableOnlineChecks: true` in production
 * (revocation/OCSP checks against Apple's live endpoints, by design — see
 * `buildVerifier`), which is inappropriate for a deterministic, offline unit
 * test. `enableOnlineChecks: false` here uses the payload's own `signedDate`
 * (2026-09-22, embedded in the fixture) as the effective date instead of
 * "now" for certificate-validity checks, and skips OCSP/CRL network calls —
 * documenting exactly why this test constructs `SignedDataVerifier` directly
 * rather than going through the app's cached, online-checks-on verifiers (the
 * "mock at the verifier boundary instead and document why" fallback called
 * for in FV-598's acceptance criteria, applied here as "construct our own
 * offline verifier instance" rather than a jest/vi mock, since the point is
 * to prove REAL verification succeeds).
 *
 * The app's own `verifyAndDecodeNotification` peek-and-select logic (picking
 * Sandbox vs Production from the payload's own claim, then running a single
 * verification pass) is covered with full branch coverage — including this
 * exact bundleId + environment matrix — via mocks in `apple-server.test.ts`.
 * This file only needs to prove the real-world crypto facts those mocks
 * stand in for are actually true.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  SignedDataVerifier,
  Environment,
  VerificationException,
  VerificationStatus,
} from "@apple/app-store-server-library";

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures", "apple");

const REAL_SANDBOX_SIGNED_PAYLOAD = readFileSync(
  path.join(FIXTURES_DIR, "test-notification-sandbox.signedPayload.txt"),
  "utf8",
).trim();

const ROOT_CERTIFICATES = [
  readFileSync(path.join(FIXTURES_DIR, "AppleRootCA-G3.cer")),
  readFileSync(path.join(FIXTURES_DIR, "AppleRootCA-G2.cer")),
];

const REAL_BUNDLE_ID = "com.fromvictoryapp.app"; // baked into the fixture's signed body.
const WRONG_BUNDLE_ID = "com.example.wrong-app";
const FAKE_APP_APPLE_ID = 123456789; // never checked for a Sandbox-target verifier.

function statusOf(err: unknown): number | undefined {
  return err instanceof VerificationException ? err.status : undefined;
}

describe("FV-598 real-fixture regression proof (real crypto, no SDK mocks)", () => {
  it("REPRODUCES THE DEFECT: a Production-configured verifier rejects the real Sandbox fixture with INVALID_APP_IDENTIFIER, not INVALID_ENVIRONMENT", async () => {
    const productionVerifier = new SignedDataVerifier(
      ROOT_CERTIFICATES,
      false, // enableOnlineChecks — see file header.
      Environment.PRODUCTION,
      REAL_BUNDLE_ID,
      FAKE_APP_APPLE_ID,
    );

    let caught: unknown;
    try {
      await productionVerifier.verifyAndDecodeNotification(REAL_SANDBOX_SIGNED_PAYLOAD);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(VerificationException);
    expect(statusOf(caught)).toBe(VerificationStatus.INVALID_APP_IDENTIFIER);
    expect(statusOf(caught)).not.toBe(VerificationStatus.INVALID_ENVIRONMENT);
  });

  it("PROVES THE FIX: a Sandbox-configured verifier verifies + decodes the real fixture (notificationType TEST, environment Sandbox)", async () => {
    const sandboxVerifier = new SignedDataVerifier(
      ROOT_CERTIFICATES,
      false, // enableOnlineChecks — see file header.
      Environment.SANDBOX,
      REAL_BUNDLE_ID,
    );

    const decoded = await sandboxVerifier.verifyAndDecodeNotification(REAL_SANDBOX_SIGNED_PAYLOAD);

    expect(decoded.notificationType).toBe("TEST");
    expect(decoded.data?.environment).toBe("Sandbox");
    expect(decoded.data?.bundleId).toBe(REAL_BUNDLE_ID);
  });

  it("a wrong bundleId is rejected under the Sandbox verifier too — picking the right environment never waives identity checks", async () => {
    const sandboxVerifierWrongBundle = new SignedDataVerifier(
      ROOT_CERTIFICATES,
      false,
      Environment.SANDBOX,
      WRONG_BUNDLE_ID,
    );

    let caught: unknown;
    try {
      await sandboxVerifierWrongBundle.verifyAndDecodeNotification(REAL_SANDBOX_SIGNED_PAYLOAD);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(VerificationException);
    expect(statusOf(caught)).toBe(VerificationStatus.INVALID_APP_IDENTIFIER);
  });

  it("FV-603: the same real fixture verifies when the root certs are base64-decoded (APPLE_ROOT_CA_BASE64 route) instead of read from disk (APPLE_ROOT_CA_PATHS route)", async () => {
    // Simulates exactly what loadRootCertificates() does for
    // APPLE_ROOT_CA_BASE64: base64-encode each DER cert (as an operator
    // would when populating the env var), then decode back to a Buffer —
    // proving the round trip preserves the real Apple root CA bytes closely
    // enough for SignedDataVerifier to accept the real signed fixture.
    const base64EncodedCertificates = ROOT_CERTIFICATES.map((cert) =>
      cert.toString("base64"),
    ).join(",");
    const decodedCertificates = base64EncodedCertificates
      .split(",")
      .map((entry) => Buffer.from(entry, "base64"));

    const sandboxVerifierFromBase64Roots = new SignedDataVerifier(
      decodedCertificates,
      false, // enableOnlineChecks — see file header.
      Environment.SANDBOX,
      REAL_BUNDLE_ID,
    );

    const decoded = await sandboxVerifierFromBase64Roots.verifyAndDecodeNotification(
      REAL_SANDBOX_SIGNED_PAYLOAD,
    );

    expect(decoded.notificationType).toBe("TEST");
    expect(decoded.data?.environment).toBe("Sandbox");
    expect(decoded.data?.bundleId).toBe(REAL_BUNDLE_ID);
  });

  it("a wrong bundleId is ALSO rejected under the Production verifier — rejected in both environments", async () => {
    const productionVerifierWrongBundle = new SignedDataVerifier(
      ROOT_CERTIFICATES,
      false,
      Environment.PRODUCTION,
      WRONG_BUNDLE_ID,
      FAKE_APP_APPLE_ID,
    );

    let caught: unknown;
    try {
      await productionVerifierWrongBundle.verifyAndDecodeNotification(REAL_SANDBOX_SIGNED_PAYLOAD);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(VerificationException);
    expect(statusOf(caught)).toBe(VerificationStatus.INVALID_APP_IDENTIFIER);
  });
});
