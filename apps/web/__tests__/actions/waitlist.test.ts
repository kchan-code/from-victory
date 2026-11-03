/**
 * Unit tests for submitWaitlist (FV-517).
 *
 * FV-517 scope:
 *   - `name` and `note` are no longer read from formData / validated — the
 *     insert still writes an empty-string `name` placeholder (the
 *     waitlist_signups.name column is NOT NULL with no default, and this
 *     issue is scoped to not add a migration) and simply omits `note`
 *     (nullable, no column-constraint workaround needed).
 *   - A `name`/`note` value present in the submitted FormData (e.g. a stale
 *     client, or a scripted POST) is ignored — it never reaches the DB
 *     insert.
 *   - The honeypot (`website`) field's behavior is preserved byte-for-byte
 *     from before this issue — these tests document its ACTUAL behavior
 *     (see the "pre-existing" cases below; flagged as a finding, not fixed,
 *     since the `website` field is untouched by this issue's scope).
 *
 * Mocking strategy mirrors __tests__/actions/create-athlete-direct.test.ts:
 *   - vi.mock() hoists before imports.
 *   - "server-only" is mocked so importing the lib/supabase/server and
 *     lib/email/resend chain doesn't throw outside a Next.js "react-server"
 *     bundling context.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks (declared before any import of the module under test)
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

const { insertMock, fromMock } = vi.hoisted(() => {
  const insertMock = vi.fn();
  const fromMock = vi.fn(() => ({ insert: insertMock }));
  return { insertMock, fromMock };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ from: fromMock }),
}));

vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: (p: Promise<unknown>) => {
    void p.catch(() => {});
  },
}));

const { sendNotificationMock } = vi.hoisted(() => ({
  sendNotificationMock: vi.fn(),
}));

vi.mock("@/lib/email/waitlist-notification", () => ({
  sendWaitlistNotification: sendNotificationMock,
}));

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------

import { submitWaitlist } from "@/lib/actions/waitlist";

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value);
  }
  return fd;
}

const validBase = {
  email: "athlete@example.com",
  role: "athlete",
  sport: "Swimming",
  consent: "on",
};

beforeEach(() => {
  vi.clearAllMocks();
  insertMock.mockResolvedValue({ error: null });
  sendNotificationMock.mockResolvedValue({ ok: true });
});

describe("submitWaitlist — name/note removal (FV-517)", () => {
  it("accepts a submission with only email + role + sport + consent", async () => {
    const fd = makeFormData(validBase);
    const result = await submitWaitlist(null, fd);
    expect(result).toEqual({ ok: true, alreadyOnList: false });
  });

  it("writes an empty-string name placeholder (NOT NULL column, no migration in this issue)", async () => {
    const fd = makeFormData(validBase);
    await submitWaitlist(null, fd);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "" }),
    );
  });

  it("omits note from the insert entirely (nullable column)", async () => {
    const fd = makeFormData(validBase);
    await submitWaitlist(null, fd);
    const insertedRow = insertMock.mock.calls[0]?.[0];
    expect(insertedRow).not.toHaveProperty("note");
  });

  it("ignores a name/note value present in formData — never reaches the DB insert", async () => {
    const fd = makeFormData({
      ...validBase,
      name: "Jordan",
      note: "Hoping this helps with focus.",
    });
    await submitWaitlist(null, fd);
    const insertedRow = insertMock.mock.calls[0]?.[0];
    expect(insertedRow).toMatchObject({ name: "" });
    expect(insertedRow).not.toHaveProperty("note");
  });

  it("no longer sends name/note to the admin notification email", async () => {
    const fd = makeFormData(validBase);
    await submitWaitlist(null, fd);
    expect(sendNotificationMock).toHaveBeenCalledTimes(1);
    const payload = sendNotificationMock.mock.calls[0]?.[0];
    expect(payload).not.toHaveProperty("name");
    expect(payload).not.toHaveProperty("note");
    expect(payload).toMatchObject({ email: validBase.email, role: "athlete", sport: "Swimming" });
  });
});

describe("submitWaitlist — sport is still required", () => {
  it("rejects a missing sport with a field error", async () => {
    const fd = makeFormData({ ...validBase, sport: "" });
    const result = await submitWaitlist(null, fd);
    expect(result?.ok).toBe(false);
    if (result && !result.ok) {
      expect(result.field).toBe("sport");
    }
    expect(insertMock).not.toHaveBeenCalled();
  });
});

describe("submitWaitlist — honeypot (website field) — pre-existing behavior", () => {
  // These document ACTUAL current behavior of the `website` field, which is
  // untouched by FV-517. Flagged as a finding for the lead: the Zod schema
  // (`z.string().max(0).optional().or(z.literal(""))`) rejects any non-empty
  // `website` value as a validation error BEFORE the function's own
  // "pretend success" branch (`if (data.website && data.website.length > 0)`)
  // can ever run — that branch is unreachable dead code today. A bot that
  // fills the honeypot sees a validation error, not a faked success.

  it("an untouched (empty) honeypot submits normally", async () => {
    const fd = makeFormData({ ...validBase, website: "" });
    const result = await submitWaitlist(null, fd);
    expect(result).toEqual({ ok: true, alreadyOnList: false });
    expect(insertMock).toHaveBeenCalledTimes(1);
  });

  it("a filled honeypot fails validation (does not reach the DB or the notification)", async () => {
    const fd = makeFormData({ ...validBase, website: "http://spam.example" });
    const result = await submitWaitlist(null, fd);
    expect(result?.ok).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();
    expect(sendNotificationMock).not.toHaveBeenCalled();
  });
});

describe("submitWaitlist — duplicate email is idempotent", () => {
  it("treats a unique-violation as 'already on the list'", async () => {
    insertMock.mockResolvedValueOnce({ error: { code: "23505", message: "duplicate" } });
    const fd = makeFormData(validBase);
    const result = await submitWaitlist(null, fd);
    expect(result).toEqual({ ok: true, alreadyOnList: true });
  });
});
