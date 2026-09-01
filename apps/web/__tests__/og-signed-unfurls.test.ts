import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const webRoot = resolve(__dirname, "..");

describe("Kinny-signed OG unfurls", () => {
  it("wires the website card on marketing/site metadata", () => {
    const layout = readFileSync(resolve(webRoot, "app/layout.tsx"), "utf8");
    expect(layout).toContain(`/og-website-1200x630.png`);
    expect(layout).toContain('type: "image/png"');
    expect(layout).not.toContain("from-victory-social-preview.jpg");
    expect(layout).not.toContain("/og-app-1200x630.png");

    const parents = readFileSync(resolve(webRoot, "app/parents/page.tsx"), "utf8");
    const resources = readFileSync(
      resolve(webRoot, "app/resources/page.tsx"),
      "utf8",
    );
    expect(parents).toContain(`/og-website-1200x630.png`);
    expect(resources).toContain(`/og-website-1200x630.png`);
    expect(parents).not.toContain("/og-app-1200x630.png");
  });

  it("wires the app card on the texted session door (/pair) and /signin", () => {
    const pair = readFileSync(resolve(webRoot, "app/pair/page.tsx"), "utf8");
    const signin = readFileSync(resolve(webRoot, "app/signin/page.tsx"), "utf8");
    expect(pair).toContain(`/og-app-1200x630.png`);
    expect(signin).toContain(`/og-app-1200x630.png`);
    expect(pair).not.toContain("/og-website-1200x630.png");
    expect(signin).not.toContain("/og-website-1200x630.png");
  });
});
