/**
 * @vitest-environment jsdom
 *
 * FV-729 / FV-731: error boundaries report to the first-party endpoint and
 * hard-reload once on a stale server action. The reload itself is mocked so
 * jsdom does not navigate; detection is covered in deploy-skew.test.ts.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const { reloadMock, hardReloadMock, fetchMock } = vi.hoisted(() => ({
  reloadMock: vi.fn(),
  hardReloadMock: vi.fn(),
  fetchMock: vi.fn(async () => new Response(null, { status: 204 })),
}));

vi.mock("@/lib/deploy-skew", async () => {
  const actual = await vi.importActual<typeof import("@/lib/deploy-skew")>(
    "@/lib/deploy-skew",
  );
  return {
    ...actual,
    reloadOnceForStaleDeployment: () => {
      reloadMock();
      return true;
    },
    hardReload: () => {
      hardReloadMock();
    },
  };
});

import RootError from "@/app/error";
import AthleteError from "@/app/athlete/error";
import GlobalError from "@/app/global-error";

beforeEach(() => {
  reloadMock.mockClear();
  hardReloadMock.mockClear();
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
});

function staleError() {
  return Object.assign(new Error('Failed to find Server Action "x"'), {
    digest: "d1",
  });
}

describe("error boundaries (FV-729, FV-731)", () => {
  it("reports a root render error and reloads once when the action is stale", async () => {
    render(<RootError error={staleError()} reset={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const init = call[1];
    expect(call[0]).toBe("/api/client-error");
    const body = JSON.parse(String(init.body)) as { route: string; digest?: string };
    expect(body.route.startsWith("/")).toBe(true);
    expect(body.digest).toBe("d1");
    expect(JSON.stringify(body)).not.toContain("@");
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("does not reload an ordinary athlete error, and still reports it", async () => {
    render(
      <AthleteError error={new Error("network down")} reset={vi.fn()} />,
    );
    expect(screen.getByText(/load your training/i)).toBeTruthy();
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(reloadMock).not.toHaveBeenCalled();
  });

  it("global error is dark, on-brand, and the control reloads", () => {
    const { container } = render(
      <GlobalError error={new Error("layout blew up")} reset={vi.fn()} />,
    );
    const button = screen.getByRole("button", { name: "Reload" });
    const painted = container.querySelector("body")?.getAttribute("style") ?? "";
    expect(painted.toLowerCase()).toMatch(/050505|5,\s*5,\s*5/);
    expect(screen.getByText("From Victory")).toBeTruthy();
    expect(screen.getByText(/your training is safe/i)).toBeTruthy();
    fireEvent.click(button);
    expect(hardReloadMock).toHaveBeenCalledTimes(1);
  });
});
