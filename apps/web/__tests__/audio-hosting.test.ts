import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { AUDIO_STORAGE_BASE, AUDIO_STORAGE_MANIFEST, hostedClipUrl, hostedManifestUrl, isHostedAudioUrl, shouldCacheHostedAudio } from "@/lib/audio/hosting";
import { bustUrl, manifestUrl } from "@/components/pregame/audio-playlist";

const sw = fs.readFileSync(path.resolve(process.cwd(), "public/sw.js"), "utf8");
const key = `manifests/fd0b4d17.${"a".repeat(64)}.json`;
const local = "/audio/pregame/clips/arrival.1234abcd.mp3";
const remote = `${AUDIO_STORAGE_BASE}/clips/arrival.1234abcd.mp3`;
function extract(name: string): string {
  const start = sw.indexOf(`function ${name}(`);
  const end = sw.indexOf("\n}", start);
  if (start < 0 || end < 0) throw new Error(`Missing SW function ${name}`);
  return sw.slice(start, end + 2);
}
const constants = ["AUDIO_STORAGE_BASE", "AUDIO_STORAGE_MANIFEST"].map(name => {
  const line = sw.match(new RegExp(`const ${name} = [^;]+;`));
  if (!line) throw new Error(`Missing ${name}`);
  return line[0];
}).join("\n");
const swContract = new Function(`${constants}\n${extract("isHostedAudioUrl")}\n${extract("shouldCacheHostedAudio")}\nreturn {base:AUDIO_STORAGE_BASE, manifest:AUDIO_STORAGE_MANIFEST, allow:isHostedAudioUrl, route:shouldCacheHostedAudio};`)() as {
  base: string; manifest: string | null; allow: (url: string) => boolean; route: (url: string, key?: string | null) => boolean;
};

describe("disabled public audio hosting contract", () => {
  it("keeps local runtime and SW defaults in sync", () => {
    expect(AUDIO_STORAGE_MANIFEST).toBeNull();
    expect(swContract.base).toBe(AUDIO_STORAGE_BASE);
    expect(swContract.manifest).toBe(AUDIO_STORAGE_MANIFEST);
    expect(manifestUrl()).toMatch(/^\/audio\/pregame\/clips\/manifest.json\?mv=/);
    expect(bustUrl(local)).toBe(local);
    expect(shouldCacheHostedAudio(remote)).toBe(false);
    expect(swContract.route(remote)).toBe(false);
    expect(sw).toContain("const strategy = shouldCacheHostedAudio(request.url)");
  });
  it("maps immutable clips only when a valid versioned manifest is configured", () => {
    expect(hostedManifestUrl(key)).toBe(`${AUDIO_STORAGE_BASE}/${key}`);
    expect(hostedClipUrl(local, key)).toBe(remote);
    for (const url of ["/audio/pregame/arrival.mp3?v=17", "/audio/beds/calm.mp3", local + "?x=1", "/audio/pregame/clips/../arrival.1234abcd.mp3"]) expect(hostedClipUrl(url, key)).toBe(url);
    expect(hostedManifestUrl("manifest.json")).toBeNull();
    expect(hostedClipUrl(local, "manifest.json")).toBe(local);
  });
  it.each([
    [remote, true], [`${AUDIO_STORAGE_BASE}/${key}`, true],
    [remote + "?token=secret", false], [remote + "#fragment", false],
    [remote.replace(".supabase.co", ".supabase.co.evil.test"), false],
    [remote.replace("pregame-audio/", "other-bucket/"), false],
    [remote.replace("/public/", "/sign/"), false],
    [`${AUDIO_STORAGE_BASE}/clips/../arrival.1234abcd.mp3`, false],
    [`${AUDIO_STORAGE_BASE}/clips/%2e%2e/arrival.1234abcd.mp3`, false],
    [`${AUDIO_STORAGE_BASE}/manifest.json`, false],
    [local, false],
  ])("exact allowlist and SW parity: %s", (url, allowed) => {
    expect(isHostedAudioUrl(url)).toBe(allowed);
    expect(swContract.allow(url)).toBe(allowed);
    expect(shouldCacheHostedAudio(url, key)).toBe(allowed);
    expect(swContract.route(url, key)).toBe(allowed);
    expect(swContract.route(url, "invalid")).toBe(false);
  });
});

function audioHandler(cached: Response | undefined, network: () => Promise<Response>) {
  const put = vi.fn().mockResolvedValue(undefined);
  const caches = { match: vi.fn().mockResolvedValue(cached), open: vi.fn().mockResolvedValue({ put }) };
  const fetch = vi.fn(network);
  const handle = new Function("caches", "fetch", "AUDIO_CACHE", `return async ${extract("audioCacheFirst")};`)(caches, fetch, "test-audio") as (request: Request) => Promise<Response>;
  return { handle, fetch, put };
}

describe("hosted audio keeps existing offline and range semantics", () => {
  it("serves a cached GET and a bodyless HEAD offline", async () => {
    for (const method of ["GET", "HEAD"]) {
      const h = audioHandler(new Response("audio"), async () => { throw new Error("offline"); });
      const response = await h.handle(new Request(remote, { method }));
      expect(response.status).toBe(200);
      expect(await response.text()).toBe(method === "HEAD" ? "" : "audio");
      expect(h.fetch).not.toHaveBeenCalled();
    }
  });
  it("keeps full cached response for Range; passes Range through on miss without caching 206", async () => {
    const request = new Request(remote, { headers: { Range: "bytes=0-1" } });
    const warm = audioHandler(new Response("audio"), async () => { throw new Error("offline"); });
    expect(await (await warm.handle(request)).text()).toBe("audio");
    const cold = audioHandler(undefined, async () => new Response("au", { status: 206 }));
    expect((await cold.handle(request)).status).toBe(206);
    expect(cold.fetch).toHaveBeenCalledWith(request);
    expect(cold.put).not.toHaveBeenCalled();
  });
  it("caches a full network response but never an opaque response", async () => {
    const full = audioHandler(undefined, async () => new Response("audio"));
    await full.handle(new Request(remote));
    expect(full.put).toHaveBeenCalledOnce();
    const opaque = new Response("audio");
    Object.defineProperty(opaque, "type", { value: "opaque" });
    const hidden = audioHandler(undefined, async () => opaque);
    await hidden.handle(new Request(remote));
    expect(hidden.put).not.toHaveBeenCalled();
  });
  it("returns 503 for an uncached offline clip", async () => {
    const h = audioHandler(undefined, async () => { throw new Error("offline"); });
    expect((await h.handle(new Request(remote))).status).toBe(503);
  });
});
