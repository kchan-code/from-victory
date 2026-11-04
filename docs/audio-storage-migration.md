# FV-559: audio Storage preparation

This command prepares and verifies an unchanged Ash corpus. It does **not** change app URLs, create a bucket, remove local audio, or deploy a release. Runtime/SW/CSP cutover remains a separate reviewed step within FV-559.

From `apps/web`, run `node --experimental-strip-types scripts/publish-pregame-audio.ts` for local dry-run. It validates p6 catalog paths, each file's SHA-256 filename prefix, catalog version, file boundaries and sizes. It prints clip count, byte total and the immutable manifest key. No credentials or network calls are used. Peak memory includes the full corpus (2 GiB safety limit).

Provision a dedicated public bucket through the Supabase Storage API in the verified From Victory project. Limit MIME types to audio/mpeg and application/json and set the file-size limit from the inventory. Keep default denial of anonymous/authenticated writes; no public upload policy is needed. Use an existing administrative credential only in the local process environment. Never use a NEXT_PUBLIC variable or commit secrets.

Set `FV_AUDIO_STORAGE_URL`, `FV_AUDIO_STORAGE_BUCKET` and, for publishing only, `FV_AUDIO_STORAGE_SERVICE_KEY`. After the reviewed production action is authorized, add `--apply`. The command makes serial calls with 30-second request timeouts, no automatic retries and no upserts. It compares existing bytes, uploads missing content-addressed clips, verifies public readback, then uploads the versioned manifest last. Rerunning safely skips identical objects. A conflicting object is an error requiring investigation; do not overwrite it. `--verify` performs public reads and hash comparisons only and needs no credential. A missing bucket causes failure; this tool does not provision infrastructure.

Manifest bytes stay unchanged, including existing local clip URLs. The gated runtime resolver maps those URLs to the bucket's `clips/` prefix. The manifest object name includes both the existing audio manifestVersion and full JSON digest, so metadata-only changes cannot replace old manifests. Keep the committed manifest as the source for deterministic CI. Preserve Ash releases for rollback.

Before cutover, verify CORS GET/HEAD and Range behavior from web and Capacitor origins, actual cache-control/content-type headers, every public URL, offline warm replay, and SW version rotation. Requested cache TTL is one year; actual CDN headers must be measured. The prepared SW gates the exact public audio object allowlist behind the versioned-manifest setting. CSP is Report-Only, not an enforced playback block; media-src now names the exact project origin. Do not claim offline/native acceptance from publisher tests. Update playlist-integrity and cache-bust guards before deleting MP3s from the checkout; deletion does not remove historical git objects.

Rollback: redeploy the prior app URL configuration/manifest; retain existing local assets until cutover verification and retain published Ash objects afterward. No history rewrite, storage deletion, voice generation or user-data migration is part of this command.

References: [Storage access model](https://supabase.com/docs/guides/storage/buckets/fundamentals), [upload and overwrite semantics](https://supabase.com/docs/guides/storage/uploads/standard-uploads), [Storage schema/API boundary](https://supabase.com/docs/guides/storage/schema/design).


## Prepared runtime gate — disabled

`apps/web/lib/audio/hosting.ts` and `apps/web/public/sw.js` pin
`https://kumrgeosgzdlxgljbyju.supabase.co/storage/v1/object/public/pregame-audio`.
`AUDIO_STORAGE_MANIFEST` is null in both files: runtime URLs remain local and
external requests bypass the SW. No bucket/upload is implied.

After verified upload and release approval, set both constants to the publisher's
exact `manifests/<manifestVersion>.<sha256>.json` key in a reviewed change. Verify
its version equals `MANIFEST_VERSION` and the committed catalog; run hosting
parity tests. Never use a mutable URL or put a service key in runtime config.
Invalid keys fail closed. Only hashed `/audio/pregame/clips/` MP3s map externally;
legacy audio and beds stay local.

Hosting-only activation does not alter content-derived `MANIFEST_VERSION`.
The SW and warmer keep their shared cache namespace; local and external full URL
keys are distinct. Content-version updates rotate caches as before. Roll back
both manifest constants to null and deploy. Retain local assets for rollback;
validate rollback online first, because local URLs must be warmed separately
before offline playback. This preparation does not delete bundled clips.

### Still required before activation

- Resolve storage capacity for Ash rollback plus Brock; create/verify bucket;
  publish and verify every object and the versioned manifest.
- Verify actual CORS, GET/HEAD/Range, CDN headers, Safari/PWA and native playback,
  offline warm replay and content-version cache rotation on devices.
- Existing Range semantics are preserved: cached full response on hit, original
  Range request to network on miss; partial 206 and opaque responses never cache.
  Regression tests do not certify Safari seeking or native offline support.
- `NativeCacheStrategy` remains a stub: `window.Capacitor` selects it; warm/check
  throw while resolve returns the URL. This change does not implement native disk
  caching. Native network playback and offline readiness need separate evidence.
