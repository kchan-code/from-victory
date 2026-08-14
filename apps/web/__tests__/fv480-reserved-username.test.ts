import { describe, it, expect } from "vitest";
import { RESERVED_USERNAMES, validateUsername } from "@/lib/auth/athlete-username";
describe("fvplayreview reservation (FV-480)", () => {
  it("is in the reserved set", () => expect(RESERVED_USERNAMES.has("fvplayreview")).toBe(true));
  it("is rejected by validateUsername", () => expect(validateUsername("fvplayreview").ok).toBe(false));
  it("is rejected case-insensitively", () => expect(validateUsername("FVPlayReview").ok).toBe(false));
});
