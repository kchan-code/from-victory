# FV-559: audio Storage preparation

This command prepares and verifies an unchanged Ash corpus. It does **not** change app URLs, create a bucket, remove local audio, or deploy a release. Runtime/SW/CSP cutover remains a separate reviewed step within FV-559.

From `apps/web`, run `node --experimental-strip-types scripts/publish-pregame-audio.ts` for local dry-run. It validates p6 catalog paths, each file's SHA-256 filename prefix, catalog version, file boundaries and sizes. It prints clip count, byte total and the immutable manifest key. No credentials or network calls are used. Peak memory includes the full corpus (2 GiB safety limit).

Provision a dedicated public bucket through the Supabase Storage API in the verified From Victory project. Limit MIME types to audio/mpeg and application/json and set the file-size limit from the inventory. Keep default denial of anonymous/authenticated writes; no public upload policy is needed. Use an existing administrative credential only in the local process environment. Never use a NEXT_PUBLIC variable or commit secrets.

Set `FV_AUDIO_STORAGE_URL`, `FV_AUDIO_STORAGE_BUCKET` and, for publishing only, `FV_AUDIO_STORAGE_SERVICE_KEY`. After the reviewed production action is authorized, add `--apply`. The command makes serial calls with 30-second request timeouts, no automatic retries and no upserts. It compares existing bytes, uploads missing content-addressed clips, verifies public readback, then uploads the versioned manifest last. Rerunning safely skips identical objects. A conflicting object is an error requiring investigation; do not overwrite it. `--verify` performs public reads and hash comparisons only and needs no credential. A missing bucket causes failure; this tool does not provision infrastructure.

Manifest bytes stay unchanged, including existing local clip URLs. The future runtime resolver must map those URLs to the bucket's `clips/` prefix. The manifest object name includes both the existing audio manifestVersion and full JSON digest, so metadata-only changes cannot replace old manifests. Keep the committed manifest as the source for deterministic CI. Preserve Ash releases for rollback.

Before cutover, verify CORS GET/HEAD and Range behavior from web and Capacitor origins, actual cache-control/content-type headers, every public URL, offline warm replay, and SW version rotation. Requested cache TTL is one year; actual CDN headers must be measured. Current SW ignores cross-origin requests and CSP media-src permits only self/blob: both need narrowly scoped changes and review. Do not claim offline/native acceptance from publisher tests. Update playlist-integrity and cache-bust guards before deleting MP3s from the checkout; deletion does not remove historical git objects.

Rollback: redeploy the prior app URL configuration/manifest; retain existing local assets until cutover verification and retain published Ash objects afterward. No history rewrite, storage deletion, voice generation or user-data migration is part of this command.

References: [Storage access model](https://supabase.com/docs/guides/storage/buckets/fundamentals), [upload and overwrite semantics](https://supabase.com/docs/guides/storage/uploads/standard-uploads), [Storage schema/API boundary](https://supabase.com/docs/guides/storage/schema/design).
