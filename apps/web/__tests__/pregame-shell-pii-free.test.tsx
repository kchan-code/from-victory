/**
 * FV-754 — the "PII-free Pregame shell" claim, enforced.
 *
 * public/sw.js caches /athlete/pregame for offline use on the strength of one
 * invariant: the server-rendered page is identical for every request and
 * carries no athlete data (first name, sport). Nothing failed if someone later
 * rendered athlete data there. This does.
 *
 * Two layers, both runnable without a server:
 *  1. Behavioural: render the real page with React's server renderer while
 *     every server data source (cookies, headers, Supabase server/service
 *     clients) is mocked to hand back a seeded athlete. The HTML must contain
 *     neither the name nor ANY live sport, and must be byte-identical to a
 *     render with different seeded data.
 *  2. Structural: the page and root layout must not import the server-data
 *     modules at all, and the page must pass no props to the shell.
 *
 * What this catches: server-side reads of cookies/headers/Supabase in the page
 * (or its server-rendered children) that reach the HTML; props added to the
 * shell; the page or root layout importing a server data source.
 * What it misses: a leak introduced by a mechanism not mocked here (a new
 * module reading some other server source, a fetch to an internal API), the
 * RSC flight payload itself (renderToString emits HTML only; the page passes no
 * props, and layer 2 guards that, but a leak added inside a layout nested
 * between root and page is only covered by the import guard on the files
 * listed), and the real response headers (Set-Cookie). Pair with E2E for the
 * wire format.
 */
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

vi.mock("server-only", () => ({}));

const ATHLETE = { first_name: "Zephyrine", sport: "lacrosse" } as const;
const ATHLETE_B = { first_name: "Quillon", sport: "golf" } as const;
const current = { value: ATHLETE as { first_name: string; sport: string } };

// Every server data source seeded with the athlete. If the page ever reads any
// of them and renders the result, the assertions below fail.
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: () => ({ value: JSON.stringify(current.value) }),
    getAll: () => [{ name: "x", value: JSON.stringify(current.value) }],
  }),
  headers: () => ({ get: () => JSON.stringify(current.value) }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: current.value }),
          maybeSingle: async () => ({ data: current.value }),
        }),
      }),
    }),
  }),
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: current.value }) }) }),
    }),
  }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }),
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

import PregamePage from "@/app/athlete/pregame/page";
import { SUPPORTED_SPORTS } from "@/lib/sports";

const root = path.resolve(__dirname, "..");
const read = (f: string) => readFileSync(path.join(root, f), "utf8");

describe("Pregame server render is PII-free (FV-754)", () => {
  it("contains neither the athlete's first name nor any sport, whatever the server could read", () => {
    current.value = ATHLETE;
    const html = renderToString(<PregamePage />);

    expect(html.length).toBeGreaterThan(0);
    expect(html).not.toContain(ATHLETE.first_name);
    for (const sport of SUPPORTED_SPORTS) {
      expect(html.toLowerCase(), `sport "${sport}" leaked into SSR HTML`).not.toContain(sport);
    }
  });

  it("is identical for two different athletes (no per-user server output)", () => {
    current.value = ATHLETE;
    const a = renderToString(<PregamePage />);
    current.value = ATHLETE_B;
    const b = renderToString(<PregamePage />);
    expect(a).toBe(b);
  });

  it("takes no data: PregamePage has no parameters and passes no props to the shell", () => {
    expect(PregamePage.length).toBe(0);
    const src = read("app/athlete/pregame/page.tsx");
    expect(src).toMatch(/<PregameClientShell\s*\/>/);
    expect(src).not.toMatch(/<PregameClientShell\s+[^/>]/);
  });
});

describe("server-data imports are kept out of the Pregame shell route (FV-754)", () => {
  const FORBIDDEN =
    /from\s+["'](next\/headers|@\/lib\/supabase\/(server|service)|@\/lib\/auth\/[^"']*|@\/lib\/actions\/[^"']*)["']|\b(cookies|headers)\(|requireAthlete|requireParent|getUser\(/;

  const files = ["app/athlete/pregame/page.tsx", "app/layout.tsx"];
  // A layout between root and page would also be server-rendered into the shell.
  for (const extra of ["app/athlete/layout.tsx", "app/athlete/pregame/layout.tsx"]) {
    if (existsSync(path.join(root, extra))) files.push(extra);
  }

  for (const f of files) {
    it(`${f} reads no cookies/headers/Supabase server client or auth guard`, () => {
      // Strip comments: the page's header documents these names on purpose.
      const code = read(f)
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      expect(code).not.toMatch(FORBIDDEN);
    });
  }
});
