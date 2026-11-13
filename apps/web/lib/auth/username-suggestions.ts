/**
 * Username suggestions for first-time athlete setup (FV-634).
 *
 * Shown ONLY after a real username collision (the DB unique index rejected
 * the athlete's choice). PURE: no I/O, no DB, safe in server and client
 * bundles.
 *
 * Privacy contract:
 *   - Candidates come from fixed neutral word lists plus a random number.
 *     They are NEVER derived from the athlete's name, birthdate, team, sport,
 *     or the username they just tried (that one is only used to exclude an
 *     exact repeat).
 *   - No availability lookup. These are "try one of these", not "available":
 *     the final submit is still decided by the DB uniqueness constraint, so
 *     there is no endpoint that reveals whether a handle exists.
 *
 * Every candidate passes validateUsername (length, [a-z0-9_], reserved list).
 * Word lists (product-strategist review): sport-, team- and position-neutral,
 * faith- and brand-neutral, non-violent, nothing about body/age/gender, no
 * real places, and no common first names. The number is always 3 digits
 * (100-999) so it never reads as an age or a birth year. Longest shape is
 * 6 + 1 + 7 + 3 = 17 chars (limit 20).
 */

import { validateUsername } from "./athlete-username";

export const SUGGESTION_COUNT = 3;

export const SUGGESTION_ADJECTIVES: readonly string[] = [
  "swift",
  "steady",
  "bright",
  "calm",
  "bold",
  "clear",
  "quick",
  "keen",
  "north",
  "solid",
  "sharp",
  "sunny",
  "crisp",
  "rapid",
  "prime",
  "early",
];

export const SUGGESTION_NOUNS: readonly string[] = [
  "comet",
  "harbor",
  "summit",
  "river",
  "lantern",
  "cedar",
  "prairie",
  "canyon",
  "meadow",
  "ridge",
  "orbit",
  "beacon",
  "pine",
  "delta",
  "ember",
  "glacier",
];

/** Returns a uniform integer in [0, maxExclusive). */
export type RandomInt = (maxExclusive: number) => number;

/** CSPRNG-backed, rejection-sampled (no modulo bias). */
export const cryptoRandomInt: RandomInt = (maxExclusive) => {
  const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  for (;;) {
    globalThis.crypto.getRandomValues(buf);
    const v = buf[0] ?? 0;
    if (v < limit) return v % maxExclusive;
  }
};

function pick<T>(list: readonly T[], rand: RandomInt): T {
  return list[rand(list.length)] as T;
}

/**
 * Up to SUGGESTION_COUNT distinct, valid candidates such as "steady_comet27".
 * `exclude` holds handles never to suggest (the one just rejected).
 */
export function generateUsernameSuggestions(
  opts: { exclude?: readonly string[]; rand?: RandomInt } = {},
): string[] {
  const rand = opts.rand ?? cryptoRandomInt;
  const excluded = new Set((opts.exclude ?? []).map((u) => u.toLowerCase()));
  const out: string[] = [];
  const usedPairs = new Set<string>();

  // Bounded: a pathological rand can't spin forever.
  for (let attempt = 0; attempt < 50 && out.length < SUGGESTION_COUNT; attempt++) {
    const adj = pick(SUGGESTION_ADJECTIVES, rand);
    const noun = pick(SUGGESTION_NOUNS, rand);
    const pair = `${adj}_${noun}`;
    // Distinct word pairs, so the three options look meaningfully different.
    if (usedPairs.has(pair)) continue;
    const digits = 100 + rand(900); // always 3 digits: 100..999
    const candidate = `${pair}${digits}`;
    const valid = validateUsername(candidate);
    if (!valid.ok || valid.normalized !== candidate) continue;
    if (excluded.has(candidate)) continue;
    usedPairs.add(pair);
    out.push(candidate);
  }
  return out;
}
