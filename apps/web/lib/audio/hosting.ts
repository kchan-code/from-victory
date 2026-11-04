/** Public hosting contract. Activation requires verified upload and device evidence.
 * No credentials belong here. Null keeps every production URL local.
 * Mirror constants and isHostedAudioUrl in public/sw.js; tests enforce parity.
 */
export const AUDIO_STORAGE_BASE = "https://kumrgeosgzdlxgljbyju.supabase.co/storage/v1/object/public/pregame-audio";
export const AUDIO_STORAGE_MANIFEST: string | null = null;
const MANIFEST_KEY_RE = /^manifests\/[0-9a-f]{8}\.[0-9a-f]{64}\.json$/;

export function hostedManifestUrl(key: string | null = AUDIO_STORAGE_MANIFEST): string | null {
  return key && MANIFEST_KEY_RE.test(key) ? `${AUDIO_STORAGE_BASE}/${key}` : null;
}

export function hostedClipUrl(url: string, key: string | null = AUDIO_STORAGE_MANIFEST): string {
  if (!hostedManifestUrl(key)) return url;
  const match = /^\/audio\/pregame\/clips\/([a-z0-9-]+\.[0-9a-f]{8}\.mp3)$/.exec(url);
  return match ? `${AUDIO_STORAGE_BASE}/clips/${match[1]}` : url;
}

/** Exact public objects only: never auth, database, signed URLs or other buckets. */
export function isHostedAudioUrl(url: string): boolean {
  if (!url.startsWith(`${AUDIO_STORAGE_BASE}/`)) return false;
  const key = url.slice(AUDIO_STORAGE_BASE.length + 1);
  return /^(?:clips\/[a-z0-9-]+\.[0-9a-f]{8}\.mp3|manifests\/[0-9a-f]{8}\.[0-9a-f]{64}\.json)$/.test(key);
}

export function shouldCacheHostedAudio(url: string, key: string | null = AUDIO_STORAGE_MANIFEST): boolean {
  return !!key && /^manifests\/[0-9a-f]{8}\.[0-9a-f]{64}\.json$/.test(key) && isHostedAudioUrl(url);
}
