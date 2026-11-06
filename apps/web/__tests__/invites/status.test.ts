/**
 * FV-630 — parent dashboard state mapping (not invited / pending / ready).
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { NOT_INVITED_STATUS, toInviteStatus } from "@/lib/invites/status";

const EXP = "2026-11-13T12:00:00.000000+00:00";

describe("toInviteStatus", () => {
  it("no username, no live code → not_invited", () => {
    expect(
      toInviteStatus({ account_ready: false, pending_purpose: null, pending_expires_at: null }),
    ).toEqual(NOT_INVITED_STATUS);
  });

  it("no username, live invite → pending with expiry", () => {
    expect(
      toInviteStatus({ account_ready: false, pending_purpose: "invite", pending_expires_at: EXP }),
    ).toEqual({ state: "pending", expiresAt: EXP, pendingRecovery: false });
  });

  it("username set → ready (recovery flagged when a reset code is out)", () => {
    expect(
      toInviteStatus({ account_ready: true, pending_purpose: null, pending_expires_at: null }),
    ).toEqual({ state: "ready", expiresAt: null, pendingRecovery: false });
    expect(
      toInviteStatus({ account_ready: true, pending_purpose: "recovery", pending_expires_at: EXP }),
    ).toEqual({ state: "ready", expiresAt: EXP, pendingRecovery: true });
  });
});
