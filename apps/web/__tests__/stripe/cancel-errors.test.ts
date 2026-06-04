/**
 * Unit tests for `lib/stripe/cancel-errors.ts` → `isBenignCancelError`.
 *
 * No DB, no network, no `server-only` imports — pure classification logic.
 * Stripe error instances are constructed directly from the SDK to match real
 * runtime objects rather than using plain-object fakes.
 */

import Stripe from "stripe";
import { describe, it, expect } from "vitest";

import { isBenignCancelError } from "@/lib/stripe/cancel-errors";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a real `StripeInvalidRequestError` with the given error code.
 * This matches what the SDK throws at runtime for 400-level API responses.
 */
function makeInvalidRequestError(
  code: string,
): Stripe.errors.StripeInvalidRequestError {
  return new Stripe.errors.StripeInvalidRequestError({
    type: "invalid_request_error",
    message: `Error: ${code}`,
    code,
  });
}

// ---------------------------------------------------------------------------
// Benign errors — subscription already gone, safe to proceed with deletion
// ---------------------------------------------------------------------------

describe("isBenignCancelError — benign cases (should return true)", () => {
  it("returns true for resource_missing (sub ID does not exist in Stripe)", () => {
    const err = makeInvalidRequestError("resource_missing");
    expect(isBenignCancelError(err)).toBe(true);
  });

  it("returns true for subscription_canceled (sub already in terminal state)", () => {
    const err = makeInvalidRequestError("subscription_canceled");
    expect(isBenignCancelError(err)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Fatal errors — unexpected; abort the deletion so no live sub is orphaned
// ---------------------------------------------------------------------------

describe("isBenignCancelError — fatal cases (should return false)", () => {
  it("returns false for a generic Error (not a Stripe error at all)", () => {
    expect(isBenignCancelError(new Error("network failure"))).toBe(false);
  });

  it("returns false for a plain object (not a Stripe error)", () => {
    expect(isBenignCancelError({ code: "resource_missing" })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isBenignCancelError(null)).toBe(false);
  });

  it("returns false for a StripeConnectionError (network/TLS failure)", () => {
    // StripeConnectionError does not extend StripeInvalidRequestError — it is a
    // peer subclass of StripeError — so it must be treated as fatal.
    const err = new Stripe.errors.StripeConnectionError({
      type: "api_error",
      message: "Could not connect to Stripe.",
    });
    expect(isBenignCancelError(err)).toBe(false);
  });

  it("returns false for a StripeAPIError (Stripe 5xx / internal error)", () => {
    const err = new Stripe.errors.StripeAPIError({
      type: "api_error",
      message: "An error occurred internally.",
    });
    expect(isBenignCancelError(err)).toBe(false);
  });

  it("returns false for a StripeAuthenticationError (bad secret key)", () => {
    const err = new Stripe.errors.StripeAuthenticationError({
      type: "authentication_error",
      message: "No API key provided.",
    });
    expect(isBenignCancelError(err)).toBe(false);
  });

  it("returns false for a StripeRateLimitError", () => {
    const err = new Stripe.errors.StripeRateLimitError({
      type: "rate_limit_error",
      message: "Too many requests.",
    });
    expect(isBenignCancelError(err)).toBe(false);
  });

  it("returns false for a StripeInvalidRequestError with an unrecognised code", () => {
    // An invalid-request error we don't recognise should abort — something
    // unexpected prevented the cancel and we cannot confirm the sub is gone.
    const err = makeInvalidRequestError("parameter_invalid_integer");
    expect(isBenignCancelError(err)).toBe(false);
  });

  it("returns false for a StripeInvalidRequestError with no code", () => {
    const err = new Stripe.errors.StripeInvalidRequestError({
      type: "invalid_request_error",
      message: "An unknown invalid request occurred.",
    });
    expect(isBenignCancelError(err)).toBe(false);
  });
});
