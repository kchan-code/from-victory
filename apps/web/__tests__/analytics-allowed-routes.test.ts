/**
 * Unit tests for lib/analytics/allowed-routes.ts (FV-395).
 *
 * Vercel Web Analytics is scoped STRICTLY to public marketing surfaces.
 * These tests pin the deny-by-default contract: only explicitly allowlisted
 * paths emit an event; everything else — including any future route not yet
 * added to the allowlist — is silently dropped. This is the guarantee that
 * athletes (13-17) see zero analytics on /athlete, /dashboard, /pair,
 * /signup, /signin, /subscribe, and any signed-in surface.
 *
 * Pure function, node env, no mocking — same style as sport-label.test.ts.
 */

import { describe, it, expect } from "vitest";

import {
  isAllowedAnalyticsPath,
  filterAnalyticsEvent,
} from "@/lib/analytics/allowed-routes";

describe("isAllowedAnalyticsPath — public marketing allowlist", () => {
  it("allows the root path exactly", () => {
    expect(isAllowedAnalyticsPath("/")).toBe(true);
  });

  it("allows the top-level marketing routes", () => {
    expect(isAllowedAnalyticsPath("/pricing")).toBe(true);
    expect(isAllowedAnalyticsPath("/parents")).toBe(true);
    expect(isAllowedAnalyticsPath("/teams")).toBe(true);
    expect(isAllowedAnalyticsPath("/about")).toBe(true);
    expect(isAllowedAnalyticsPath("/contact")).toBe(true);
    expect(isAllowedAnalyticsPath("/resources")).toBe(true);
    expect(isAllowedAnalyticsPath("/privacy")).toBe(true);
    expect(isAllowedAnalyticsPath("/terms")).toBe(true);
  });

  it("allows resources article slugs (sub-path)", () => {
    expect(isAllowedAnalyticsPath("/resources/some-slug")).toBe(true);
    expect(isAllowedAnalyticsPath("/resources/pregame-nerves-guide")).toBe(
      true,
    );
  });

  it("does not allow a path that merely starts with an allowed prefix string", () => {
    // "/pricing-secret" is NOT "/pricing" or "/pricing/..." — must not match.
    expect(isAllowedAnalyticsPath("/pricing-secret")).toBe(false);
  });

  it("denies athlete and signed-in surfaces (deny by default)", () => {
    expect(isAllowedAnalyticsPath("/athlete/daily")).toBe(false);
    expect(isAllowedAnalyticsPath("/athlete")).toBe(false);
    expect(isAllowedAnalyticsPath("/dashboard")).toBe(false);
    expect(isAllowedAnalyticsPath("/pair")).toBe(false);
    expect(isAllowedAnalyticsPath("/signup")).toBe(false);
    expect(isAllowedAnalyticsPath("/signin")).toBe(false);
    expect(isAllowedAnalyticsPath("/subscribe")).toBe(false);
  });

  it("denies any unknown or future route (deny by default)", () => {
    expect(isAllowedAnalyticsPath("/some-future-route")).toBe(false);
  });

  it("strips query string and hash before matching", () => {
    expect(isAllowedAnalyticsPath("/pricing?ref=email")).toBe(true);
    expect(isAllowedAnalyticsPath("/dashboard?tab=rhythm")).toBe(false);
  });
});

describe("filterAnalyticsEvent — beforeSend filter", () => {
  it("passes through an event on an allowed path unchanged", () => {
    const event = { type: "pageview" as const, url: "/pricing" };
    expect(filterAnalyticsEvent(event)).toBe(event);
  });

  it("passes through the root path", () => {
    const event = { type: "pageview" as const, url: "/" };
    expect(filterAnalyticsEvent(event)).toBe(event);
  });

  it("passes through a resources slug", () => {
    const event = { type: "pageview" as const, url: "/resources/some-slug" };
    expect(filterAnalyticsEvent(event)).toBe(event);
  });

  it("drops an event on /athlete/daily", () => {
    const event = { type: "pageview" as const, url: "/athlete/daily" };
    expect(filterAnalyticsEvent(event)).toBeNull();
  });

  it("drops an event on /dashboard", () => {
    const event = { type: "pageview" as const, url: "/dashboard" };
    expect(filterAnalyticsEvent(event)).toBeNull();
  });

  it("drops an event on an unknown future route", () => {
    const event = { type: "pageview" as const, url: "/some-future-route" };
    expect(filterAnalyticsEvent(event)).toBeNull();
  });

  // Vercel sends FULL URLs in BeforeSendEvent.url — the production shape.
  it("passes through a full URL on an allowed path", () => {
    const event = {
      type: "pageview" as const,
      url: "https://www.fromvictoryapp.com/pricing?utm_source=chaplain",
    };
    expect(filterAnalyticsEvent(event)).toBe(event);
  });

  it("passes through a full URL for the root path", () => {
    const event = {
      type: "pageview" as const,
      url: "https://www.fromvictoryapp.com/",
    };
    expect(filterAnalyticsEvent(event)).toBe(event);
  });

  it("drops a full URL on an athlete surface", () => {
    const event = {
      type: "pageview" as const,
      url: "https://www.fromvictoryapp.com/athlete/daily",
    };
    expect(filterAnalyticsEvent(event)).toBeNull();
  });
});
