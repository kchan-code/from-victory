import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm, writeFile, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAudioPlan, publishAudio, verifyAudio, sha256, storageTarget, createStorageStore, type ObjectStore } from "../scripts/lib/audio-storage";

const dirs: string[] = [];
afterEach(async () => { vi.unstubAllGlobals(); await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true }))); });
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), "fv-storage-")); dirs.push(dir);
  const bytes = Buffer.from("fixture audio");
  const hash = sha256(bytes).slice(0, 8);
  const filename = `shared-opening.${hash}.mp3`;
  const version = sha256(Buffer.from(JSON.stringify({ "shared-opening": hash }))).slice(0, 8);
  const manifest = { version: "p6", manifestVersion: version, clips: { "shared-opening": { url: `/audio/pregame/clips/${filename}`, durationSec: 1 } } };
  await writeFile(join(dir, filename), bytes);
  const path = join(dir, "manifest.json"); await writeFile(path, JSON.stringify(manifest));
  return { dir, filename, manifest, path, plan: await createAudioPlan(path) };
}
function memoryStore() {
  const objects = new Map<string, Uint8Array>();
  const writes: string[] = [];
  const store: ObjectStore = {
    read: vi.fn(async (key) => objects.get(key) ?? null),
    create: vi.fn(async (object) => { writes.push(object.key); objects.set(object.key, object.bytes); }),
  };
  return { objects, writes, store };
}
describe("FV559 publication", () => {
  it("defaults to no remote calls", async () => {
    const { plan } = await fixture(); const { store } = memoryStore();
    await publishAudio(plan, store);
    expect(store.read).not.toHaveBeenCalled(); expect(store.create).not.toHaveBeenCalled();
  });
  it("publishes manifest last, verifies bytes, and resumes without overwrites", async () => {
    const { plan } = await fixture(); const { store, writes } = memoryStore();
    expect(await publishAudio(plan, store, true)).toMatchObject({ uploaded: 2 });
    expect(writes).toEqual([plan.clips[0]!.key, plan.manifest.key]);
    expect(await publishAudio(plan, store, true)).toMatchObject({ uploaded: 0, existing: 2 });
    expect(await verifyAudio(plan, store)).toEqual({ verified: 2 });
  });
  it("stops on conflicting existing content without publishing manifest", async () => {
    const { plan } = await fixture(); const { store, objects, writes } = memoryStore();
    objects.set(plan.clips[0]!.key, Buffer.from("wrong"));
    await expect(publishAudio(plan, store, true)).rejects.toThrow("Existing object differs");
    expect(writes).toEqual([]);
  });
  it("fails closed when upload fails or readback differs", async () => {
    const { plan } = await fixture(); const { store, writes } = memoryStore();
    store.create = vi.fn(async () => { throw new Error("failed"); });
    await expect(publishAudio(plan, store, true)).rejects.toThrow("failed");
    store.create = vi.fn(async (o) => { writes.push(o.key); });
    await expect(publishAudio(plan, store, true)).rejects.toThrow("verification failed");
    expect(writes).toEqual([plan.clips[0]!.key]);
  });
  it("verification never uploads missing objects", async () => {
    const { plan } = await fixture(); const { store } = memoryStore();
    await expect(verifyAudio(plan, store)).rejects.toThrow("missing or different");
    expect(store.create).not.toHaveBeenCalled();
  });
  it("rejects traversal, tampering, and stale manifest version", async () => {
    const f = await fixture();
    f.manifest.clips["shared-opening"].url = "/audio/pregame/clips/../escape.mp3";
    await writeFile(f.path, JSON.stringify(f.manifest));
    await expect(createAudioPlan(f.path)).rejects.toThrow("clip path");
    f.manifest.clips["shared-opening"].url = `/audio/pregame/clips/${f.filename}`;
    f.manifest.manifestVersion = "00000000";
    await writeFile(f.path, JSON.stringify(f.manifest));
    await expect(createAudioPlan(f.path)).rejects.toThrow("version");
    await writeFile(join(f.dir, f.filename), "tampered");
    await expect(createAudioPlan(f.path)).rejects.toThrow("hash or size");
  });
  it("rejects symlinks outside corpus", async () => {
    const f = await fixture(); const other = await fixture();
    await rm(join(f.dir, f.filename)); await symlink(join(other.dir, other.filename), join(f.dir, f.filename));
    await expect(createAudioPlan(f.path)).rejects.toThrow("escapes");
  });
  it("restricts target and prevents credential-bearing redirects", async () => {
    expect(() => storageTarget("https://evil.example/", "audio")).toThrow();
    expect(() => storageTarget("https://abc.supabase.co/", "../other")).toThrow();
    const fetchMock = vi.fn(async () => new Response(null, { status: 500 })); vi.stubGlobal("fetch", fetchMock);
    const { plan } = await fixture();
    const store = createStorageStore("https://abc.supabase.co", "audio", "test-secret");
    await expect(store.create(plan.clips[0]!)).rejects.toThrow("500");
    expect(fetchMock.mock.calls[0]).toBeDefined();
    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ redirect: "error", headers: expect.objectContaining({ "x-upsert": "false" }) }));
  });
  it("public reads send no credentials, recognize 404, and reject partial responses", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response("partial", { status: 206 }))
      .mockResolvedValueOnce(new Response("complete", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { plan } = await fixture();
    const store = createStorageStore("https://abc.supabase.co", "audio", "secret");
    expect(await store.read(plan.clips[0]!.key)).toBeNull();
    await expect(store.read(plan.clips[0]!.key)).rejects.toThrow("206");
    expect(Buffer.from((await store.read(plan.clips[0]!.key))!).toString()).toBe("complete");
    for (const [, init] of fetchMock.mock.calls) expect(init.headers).toBeUndefined();
  });
  it("recognizes Supabase public renderer's HTTP 400 NoSuchKey response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ statusCode: "404", code: "NoSuchKey", message: "The resource was not found" }), { status: 400 })));
    const { plan } = await fixture();
    const store = createStorageStore("https://abc.supabase.co", "audio");
    expect(await store.read(plan.clips[0]!.key)).toBeNull();
  });
  it.each([
    JSON.stringify({ statusCode: "404", code: "NoSuchBucket" }),
    JSON.stringify({ statusCode: "403", code: "AccessDenied" }),
    JSON.stringify({ statusCode: "400", code: "NoSuchKey" }),
    JSON.stringify({ statusCode: "404" }),
    "not json",
    " ".repeat(4096) + JSON.stringify({ statusCode: "404", code: "NoSuchKey" }),
  ])("does not treat other/malformed/oversized HTTP 400 bodies as missing objects (%#)", async (body) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status: 400 })));
    const { plan } = await fixture();
    const store = createStorageStore("https://abc.supabase.co", "audio");
    await expect(store.read(plan.clips[0]!.key)).rejects.toThrow("Storage read failed (400)");
  });
});
