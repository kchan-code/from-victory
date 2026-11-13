// activity_events — PURE validation/sanitization core.
//
// No server imports, no DB client. Fully unit-testable. The service-role write
// path lives in lib/activity/record.ts and calls buildEventRow() from here.
//
// PRIVACY BACKBONE: this module is what guarantees the table stays EVENT-ONLY.
// It enforces a closed event vocabulary, closed enum dimensions, and — most
// importantly — an ALLOW-LIST for `meta` keys with primitive-only,
// length-capped values. Anything not on the allow-list is dropped, so no free
// text / journal / narration content can ever reach the table even if a caller
// passes it by mistake.

export const EVENT_NAMES = [
  "app_open",
  "daily_start",
  "daily_complete",
  "pregame_start",
  "pregame_complete",
  "practice_start",
  "practice_complete",
  "postgame_open",
  "push_click",
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export const SURFACES = ["hub", "daily", "pregame", "practice", "postgame", "push"] as const;
export type Surface = (typeof SURFACES)[number];

export const AUDIO_MODES = ["clip", "timer"] as const;
export const NETWORK_MODES = ["online", "offline"] as const;

// Allow-listed `meta` keys. Technical playback facts and the entry source ONLY:
//   clips_played/errored, audio_completed — pregame playback ints/bool
//   src               — entry source (e.g. "full", "saved")
//
// FV-724: NOTHING AN ATHLETE SELECTS IS STORED HERE. `position`, `adversity`
// (the hard moment chosen to rehearse), `anchor`, `prayer_style` and
// `cue_word_category` were allow-listed until 2026-11-13 and were written per
// athlete on every completed pregame, while nothing ever read them. The
// Privacy Policy says a usage record "does not contain what the athlete
// selected or was shown inside a session" and that an athlete's choices are
// kept private to that athlete. Do not add a selection, preference or
// profile field here (that includes focus_area) without changing the policy
// first and a kids-privacy-officer review.
export const META_KEY_ALLOWLIST = [
  "clips_played",
  "clips_errored",
  "audio_completed",
  "src",
] as const;

const ALLOWED_META = new Set<string>(META_KEY_ALLOWLIST);
const MAX_STRING_LEN = 64;

export type MetaValue = string | number | boolean;
export type ActivityMeta = Record<string, MetaValue>;

export type ActivityEventInput = {
  event_name: string;
  surface?: string | null;
  sport?: string | null;
  audio_mode?: string | null;
  network_mode?: string | null;
  meta?: Record<string, unknown> | null;
};

export type ActivityEventRow = {
  athlete_id: string;
  event_name: EventName;
  surface: Surface | null;
  sport: string | null;
  audio_mode: string | null;
  network_mode: string | null;
  meta: ActivityMeta | null;
};

function oneOf<T extends string>(allowed: readonly T[], v: unknown): T | null {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

/**
 * Keep only allow-listed keys with primitive, length-capped values. Anything
 * else (unknown keys, objects, arrays, long strings, non-finite numbers) is
 * dropped silently. Returns null when nothing survives (so we store NULL rather
 * than an empty object).
 */
export function sanitizeMeta(meta: Record<string, unknown> | null | undefined): ActivityMeta | null {
  if (!meta || typeof meta !== "object") return null;
  const out: ActivityMeta = {};
  for (const [key, value] of Object.entries(meta)) {
    if (!ALLOWED_META.has(key)) continue;
    if (typeof value === "boolean") {
      out[key] = value;
    } else if (typeof value === "number") {
      if (Number.isFinite(value)) out[key] = value;
    } else if (typeof value === "string") {
      if (value.length > 0) out[key] = value.slice(0, MAX_STRING_LEN);
    }
    // objects / arrays / null / undefined → dropped
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Validate + normalize a raw input into a DB-ready row, or null if the
 * event_name is not in the closed vocabulary (the only hard-reject — an unknown
 * event is meaningless). Invalid dimensions are coerced to null rather than
 * rejecting the whole event, so one bad field never loses the signal.
 */
export function buildEventRow(
  athleteId: string,
  input: ActivityEventInput,
): ActivityEventRow | null {
  const event_name = oneOf(EVENT_NAMES, input.event_name);
  if (!event_name) return null;
  if (!athleteId) return null;

  return {
    athlete_id: athleteId,
    event_name,
    surface: oneOf(SURFACES, input.surface),
    sport: typeof input.sport === "string" ? input.sport.slice(0, MAX_STRING_LEN) : null,
    audio_mode: oneOf(AUDIO_MODES, input.audio_mode),
    network_mode: oneOf(NETWORK_MODES, input.network_mode),
    meta: sanitizeMeta(input.meta),
  };
}
