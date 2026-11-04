#!/usr/bin/env node
// Local administrative command. No credentials or network access in dry-run mode.
import { resolve } from "node:path";
import { createAudioPlan, createStorageStore, publishAudio, storageTarget, verifyAudio } from "./lib/audio-storage.ts";

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("From apps/web: node --experimental-strip-types scripts/publish-pregame-audio.ts [--apply | --verify] [--manifest PATH]\nDefault: local dry-run. Remote modes require FV_AUDIO_STORAGE_URL and FV_AUDIO_STORAGE_BUCKET. Apply additionally requires FV_AUDIO_STORAGE_SERVICE_KEY. No bucket creation or deletion.");
    return;
  }
  let mode: "dry-run" | "apply" | "verify" = "dry-run";
  let manifest = resolve("public/audio/pregame/clips/manifest.json");
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--apply" || arg === "--verify") {
      if (mode !== "dry-run") throw new Error("Choose exactly one remote mode");
      mode = arg === "--apply" ? "apply" : "verify";
    } else if (arg === "--manifest" && args[i + 1] && !args[i + 1]!.startsWith("--")) {
      manifest = resolve(args[++i]!);
    } else throw new Error("Unknown or incomplete argument; use --help");
  }
  const plan = await createAudioPlan(manifest);
  console.log(JSON.stringify({ mode, clips: plan.clips.length, bytes: plan.clips.reduce((n, x) => n + x.bytes.length, 0), manifestVersion: plan.manifestVersion, manifestKey: plan.manifest.key }));
  if (mode === "dry-run") return;
  const url = process.env.FV_AUDIO_STORAGE_URL;
  const bucket = process.env.FV_AUDIO_STORAGE_BUCKET;
  if (!url || !bucket) throw new Error("Storage target environment variables required");
  storageTarget(url, bucket);
  const secret = mode === "apply" ? process.env.FV_AUDIO_STORAGE_SERVICE_KEY : undefined;
  if (mode === "apply" && !secret) throw new Error("Apply requires server-side Storage credential");
  const store = createStorageStore(url, bucket, secret);
  console.log(JSON.stringify(mode === "apply" ? await publishAudio(plan, store, true) : await verifyAudio(plan, store)));
}

main().catch((error: unknown) => {
  // Do not print request objects, headers, environment values or provider bodies.
  console.error(error instanceof Error ? error.message : "Audio publication failed");
  process.exitCode = 1;
});
