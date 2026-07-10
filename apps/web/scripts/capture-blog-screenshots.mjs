// FV-416 one-shot: capture the landing page's phone mockups as blog imagery.
// Element screenshots at 3x scale via Playwright against the local dev server.
// Not part of any build — run manually: node scripts/capture-blog-screenshots.mjs
import { chromium } from "@playwright/test";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3416";
const OUT = "public/images/blog";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1700, height: 1000 },
  deviceScaleFactor: 3,
  colorScheme: "dark",
});
await page.goto(BASE + "/", { waitUntil: "networkidle" });
// Let Reveal animations settle.
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1200);

// Pregame audio phone: the 5th .fv-phone-screen on the page (AppPreview card 03).
const pregame = page.locator(".fv-phone-screen").nth(4);
await pregame.scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await pregame.screenshot({ path: `${OUT}/app-pregame-session.png` });

// Hero front phone (Today dashboard) — the back verse phone is partially
// occluded by this one, so the front phone is the clean capture.
const today = page.locator(".fv-phone.fv-phone-front .fv-phone-screen");
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(900);
await today.screenshot({ path: `${OUT}/app-today-home.png` });

await browser.close();
console.log("captured app-pregame-session.png + app-today-home.png");
