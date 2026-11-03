// FV-559: administrative, local-only publishing. Never import from app runtime.
import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

export const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

export interface AudioObject {
  key: string;
  bytes: Uint8Array;
  contentType: "audio/mpeg" | "application/json";
}

export interface AudioPlan {
  manifestVersion: string;
  clips: AudioObject[];
  manifest: AudioObject;
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function createAudioPlan(manifestPath: string): Promise<AudioPlan> {
  const source = await readFile(manifestPath);
  const manifest: unknown = JSON.parse(source.toString("utf8"));
  if (!record(manifest) || manifest.version !== "p6" || typeof manifest.manifestVersion !== "string" ||
      !/^[a-f0-9]{8}$/.test(manifest.manifestVersion) || !record(manifest.clips)) {
    throw new Error("Invalid clip manifest");
  }
  const entries = Object.entries(manifest.clips);
  if (entries.length === 0 || entries.length > 5000) throw new Error("Invalid clip count");
  const root = await realpath(dirname(resolve(manifestPath)));
  const clips: AudioObject[] = [];
  const hashes: Record<string, string> = {};
  let totalBytes = 0;
  for (const [slug, entry] of entries.sort(([a], [b]) => a.localeCompare(b))) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !record(entry) ||
        typeof entry.url !== "string" || typeof entry.durationSec !== "number" ||
        !Number.isFinite(entry.durationSec) || entry.durationSec <= 0) {
      throw new Error("Invalid clip entry");
    }
    const match = /^\/audio\/pregame\/clips\/([a-z0-9-]+)\.([a-f0-9]{8})\.mp3$/.exec(entry.url);
    if (!match || match[1] !== slug) throw new Error("Invalid content-addressed clip path");
    const filename = `${slug}.${match[2]}.mp3`;
    const path = await realpath(join(root, filename));
    if (relative(root, path) !== filename) throw new Error("Clip escapes manifest directory");
    const bytes = await readFile(path);
    if (bytes.length === 0 || bytes.length > 50 * 1024 * 1024 ||
        sha256(bytes).slice(0, 8) !== match[2]) throw new Error("Clip content hash or size mismatch");
    totalBytes += bytes.length;
    if (totalBytes > 2 * 1024 * 1024 * 1024) throw new Error("Corpus exceeds 2 GiB safety limit");
    hashes[slug] = match[2]!;
    clips.push({ key: `clips/${filename}`, bytes, contentType: "audio/mpeg" });
  }
  if (sha256(Buffer.from(JSON.stringify(hashes))).slice(0, 8) !== manifest.manifestVersion) {
    throw new Error("Manifest version does not match catalog");
  }
  // Include the full manifest digest: metadata-only changes must never overwrite
  // an existing manifest even when the audio-only manifestVersion is unchanged.
  return {
    manifestVersion: manifest.manifestVersion,
    clips,
    manifest: {
      key: `manifests/${manifest.manifestVersion}.${sha256(source)}.json`,
      bytes: source,
      contentType: "application/json",
    },
  };
}

export interface ObjectStore {
  read(key: string): Promise<Uint8Array | null>;
  create(object: AudioObject): Promise<void>;
}

export async function publishAudio(plan: AudioPlan, store: ObjectStore, apply = false) {
  if (!apply) return { uploaded: 0, existing: 0, planned: plan.clips.length + 1 };
  let uploaded = 0;
  let existing = 0;
  // Manifest is deliberately last; a failure cannot expose an incomplete release.
  for (const object of [...plan.clips, plan.manifest]) {
    const current = await store.read(object.key);
    if (current !== null) {
      if (sha256(current) !== sha256(object.bytes)) throw new Error(`Existing object differs: ${object.key}`);
      existing++;
      continue;
    }
    await store.create(object);
    const published = await store.read(object.key);
    if (published === null || sha256(published) !== sha256(object.bytes)) {
      throw new Error(`Published object verification failed: ${object.key}`);
    }
    uploaded++;
  }
  return { uploaded, existing, planned: plan.clips.length + 1 };
}

export async function verifyAudio(plan: AudioPlan, store: ObjectStore) {
  for (const object of [...plan.clips, plan.manifest]) {
    const remote = await store.read(object.key);
    if (remote === null || sha256(remote) !== sha256(object.bytes)) {
      throw new Error(`Remote object missing or different: ${object.key}`);
    }
  }
  return { verified: plan.clips.length + 1 };
}

export function storageTarget(projectUrl: string, bucket: string): URL {
  const url = new URL(projectUrl);
  if (url.protocol !== "https:" || !/^[a-z0-9]+\.supabase\.co$/.test(url.hostname) ||
      url.port || url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(bucket)) throw new Error("Invalid hosted Supabase target");
  return new URL(`/storage/v1/object/public/${bucket}/`, url);
}

async function isMissingPublicObject(response: Response): Promise<boolean> {
  // Supabase's public renderer maps upstream 404 to HTTP 400 + NoSuchKey.
  // Do not classify missing buckets, auth errors, or arbitrary 400s as absence.
  if (response.status !== 400 || !response.body) return false;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > 4096) return false;
      chunks.push(next.value);
    }
    const error: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return record(error) && error.code === "NoSuchKey" && error.statusCode === "404";
  } catch {
    return false;
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

export function createStorageStore(projectUrl: string, bucket: string, secret?: string): ObjectStore {
  const publicBase = storageTarget(projectUrl, bucket);
  const request = async (url: URL, init: RequestInit) => {
    try {
      return await fetch(url, { ...init, redirect: "error", signal: AbortSignal.timeout(30_000) });
    } catch {
      throw new Error("Storage request failed or timed out");
    }
  };
  const safeKey = (key: string) => {
    if (!/^(clips\/[a-z0-9-]+\.[a-f0-9]{8}\.mp3|manifests\/[a-f0-9]{8}\.[a-f0-9]{64}\.json)$/.test(key)) {
      throw new Error("Invalid object key");
    }
    return key;
  };
  return {
    async read(key) {
      const response = await request(new URL(safeKey(key), publicBase), { method: "GET", cache: "no-store" });
      if (response.status === 404) return null;
      if (await isMissingPublicObject(response)) return null;
      if (!response.ok || response.status === 206) throw new Error(`Storage read failed (${response.status})`);
      if (!response.body) throw new Error("Storage response has no body");
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      try {
        while (true) {
          const next = await reader.read();
          if (next.done) break;
          length += next.value.byteLength;
          if (length > 50 * 1024 * 1024) throw new Error("Remote object exceeds size limit");
          chunks.push(next.value);
        }
      } finally {
        await reader.cancel().catch(() => undefined);
      }
      return Buffer.concat(chunks);
    },
    async create(object) {
      if (!secret) throw new Error("Server-side Storage credential required for apply");
      const url = new URL(`/storage/v1/object/${bucket}/${safeKey(object.key)}`, projectUrl);
      const response = await request(url, {
        method: "POST",
        headers: {
          apikey: secret,
          Authorization: `Bearer ${secret}`,
          "Content-Type": object.contentType,
          "Cache-Control": "max-age=31536000",
          "x-upsert": "false",
        },
        body: new Uint8Array(object.bytes),
      });
      if (!response.ok) throw new Error(`Storage create failed (${response.status}); no overwrite attempted`);
    },
  };
}
