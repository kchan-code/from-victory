import { describe, it, expect } from "vitest";
import { RESERVED_USERNAMES, validateUsername } from "@/lib/auth/athlete-username";
describe("fvapplereview reservation (FV-752)", () => {
  it("is in the reserved set", () => expect(RESERVED_USERNAMES.has("fvapplereview")).toBe(true));
  it("is rejected by validateUsername", () => expect(validateUsername("fvapplereview").ok).toBe(false));
  it("is rejected case-insensitively", () => expect(validateUsername("FVAppleReview").ok).toBe(false));
});
