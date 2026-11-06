/**
 * FV-630 — parent dashboard state mapping
 * (not invited / needs username / pending / ready).
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { NOT_INVITED_STATUS, toInviteStatus } from "@/lib/invites/status";

const EXP = "2026-11-13T12:00:00.000000+00:00";
const row = (over: Partial<Parameters<typeof toInviteStatus>[0]>) => ({
  account_ready: false,
  signed_in_before: false,
  pending_purpose: null,
  pending_expires_at: null,
  ...over,
});

describe("toInviteStatus", () => {
  it("no username, never signed in, no live code → not_invited", () => {
    expect(toInviteStatus(row({}))).toEqual(NOT_INVITED_STATUS);
  });

  it("legacy account (signed in before, no username) → needs_username, not 'not invited'", () => {
    expect(toInviteStatus(row({ signed_in_before: true }))).toEqual({
      state: "needs_username",
      expiresAt: null,
      pendingRecovery: false,
    });
  });

  it("no username, live invite → pending with expiry (legacy or new)", () => {
    for (const signed_in_before of [false, true]) {
      expect(
        toInviteStatus(row({ signed_in_before, pending_purpose: "invite", pending_expires_at: EXP })),
      ).toEqual({ state: "pending", expiresAt: EXP, pendingRecovery: false });
    }
  });

  it("username set → ready (recovery flagged when a reset code is out)", () => {
    expect(toInviteStatus(row({ account_ready: true, signed_in_before: true }))).toEqual({
      state: "ready",
      expiresAt: null,
      pendingRecovery: false,
    });
    expect(
      toInviteStatus(
        row({ account_ready: true, pending_purpose: "recovery", pending_expires_at: EXP }),
      ),
    ).toEqual({ state: "ready", expiresAt: EXP, pendingRecovery: true });
  });
});
