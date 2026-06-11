/**
 * Unit tests for lib/monitoring/deliver.ts (FV-189).
 *
 * resolveWaitUntil() calls require("@vercel/functions") per invocation so a
 * vi.mock getter can flip waitUntil in/out between branches without reloading
 * the module.
 *
 * Branch 1 — waitUntil available: delegates the promise to the platform fn.
 * Branch 2 — waitUntil absent:   voids the promise without throwing.
 */

import { vi, describe, it, expect, afterEach } from "vitest";
import { deliverInBackground } from "@/lib/monitoring/deliver";

const mockWaitUntil = vi.fn();
let waitUntilImpl: typeof mockWaitUntil | undefined = mockWaitUntil;

vi.mock("@vercel/functions", () => ({
  get waitUntil() {
    return waitUntilImpl;
  },
}));

describe("deliverInBackground — waitUntil available", () => {
  afterEach(() => {
    mockWaitUntil.mockReset();
    waitUntilImpl = mockWaitUntil;
  });

  it("calls waitUntil with the promise", () => {
    const p = Promise.resolve();
    deliverInBackground(p);
    expect(mockWaitUntil).toHaveBeenCalledOnce();
    expect(mockWaitUntil).toHaveBeenCalledWith(p);
  });
});

describe("deliverInBackground — waitUntil unavailable", () => {
  afterEach(() => {
    mockWaitUntil.mockReset();
    waitUntilImpl = mockWaitUntil; // restore for other suites
  });

  it("does not throw when waitUntil is absent", () => {
    waitUntilImpl = undefined;
    const p = Promise.resolve();
    expect(() => deliverInBackground(p)).not.toThrow();
  });

  it("returns void and does not call waitUntil", () => {
    waitUntilImpl = undefined;
    const result = deliverInBackground(Promise.resolve());
    expect(result).toBeUndefined();
    expect(mockWaitUntil).not.toHaveBeenCalled();
  });
});
