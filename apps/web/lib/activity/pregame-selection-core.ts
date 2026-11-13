// Anonymous pregame selection counts — PURE validation core (FV-724 follow-up).
//
// No server imports, no DB client, NO athlete identifier anywhere in this
// module. It turns what a client SAYS the athlete picked into a list of
// {dimension, value} pairs, keeping ONLY values that exist in the sport's fixed
// vocabulary (the pregame sport registry, the positive-play library, or the
// two-value prayer-style enum). Anything else — and in particular the cue word
// and anything an athlete can type — is dropped here and never counted.
//
// Each dimension is independent: the output is a flat list, never a combination
// of two selections.
//
// Vocabulary sources (per dimension):
//   need          SportConfig.needs            — display string (no slug exists)
//   role          SportConfig.roles            — display string (no slug exists)
//   adversity     SportConfig.adversitySlugFragments[key] — STABLE SLUG when
//                 the registry has one, else the canonical key string. Valid keys
//                 are adversityOptionsFor(config, role) (a hockey goalie's
//                 relabelled options share the skater key/slug by design).
//   anchor        SportConfig.anchors          — display string (no slug exists)
//   self_talk     SportConfig.selfTalkOptions  — display string (no slug exists)
//   prayer_style  PRAYER_STYLE_OPTIONS         — closed enum ("guided"|"self-guided")
//   positive_play POSITIVE_PLAYS slug          — STABLE SLUG (viz-<role>-<play>),
//                 only plays belonging to (sport, validated role), max 3.

import { PRAYER_STYLE_OPTIONS } from "@/components/pregame/types";
import { MAX_POSITIVE_PLAYS, positivePlaysFor } from "@/components/pregame/positive-plays";
import { adversityOptionsFor, getSportConfig } from "@/components/pregame/sport-registry";
import type { Sport } from "@/components/pregame/sport-registry";
import { SUPPORTED_SPORTS } from "@/lib/sports";

export const SELECTION_DIMENSIONS = [
  "need",
  "role",
  "adversity",
  "anchor",
  "self_talk",
  "prayer_style",
  "positive_play",
] as const;
export type SelectionDimension = (typeof SELECTION_DIMENSIONS)[number];

/** Must match the CHECK on public.pregame_selection_counts.value. */
export const MAX_VALUE_LEN = 120;

export type SelectionCount = { dimension: SelectionDimension; value: string };

/** What the client may send. Every field is treated as untrusted. */
export type PregameSelectionsInput = {
  need?: unknown;
  role?: unknown;
  adversity?: unknown;
  anchor?: unknown;
  selfTalk?: unknown;
  prayerStyle?: unknown;
  positivePlays?: unknown;
  // `cueWord` is intentionally NOT part of this type: it is free text typed by
  // the athlete and must never be counted. Extra keys on the runtime object are
  // ignored because only the fields above are ever read.
};

function pick(allowed: readonly string[], v: unknown): string | null {
  return typeof v === "string" && allowed.includes(v) ? v : null;
}

function isLiveSport(s: unknown): s is Sport {
  return typeof s === "string" && (SUPPORTED_SPORTS as readonly string[]).includes(s);
}

/**
 * Validate a pregame completion's selections against the sport's fixed
 * vocabulary. Returns null for an unknown/unsupported sport; otherwise the
 * (possibly empty) list of countable {dimension, value} pairs.
 */
export function buildSelectionCounts(
  sport: unknown,
  input: PregameSelectionsInput | null | undefined,
): { sport: Sport; selections: SelectionCount[] } | null {
  if (!isLiveSport(sport)) return null;
  const config = getSportConfig(sport);
  const src = input && typeof input === "object" ? input : {};
  const out: SelectionCount[] = [];
  const add = (dimension: SelectionDimension, value: string | null) => {
    if (value !== null && value.length >= 1 && value.length <= MAX_VALUE_LEN) {
      out.push({ dimension, value });
    }
  };

  add("need", pick(config.needs, src.need));

  const role = pick(config.roles ?? [], src.role);
  add("role", role);

  const adversityKey = pick(
    adversityOptionsFor(config, role).map((o) => o.key),
    src.adversity,
  );
  add("adversity", adversityKey === null ? null : (config.adversitySlugFragments[adversityKey] ?? adversityKey));

  add("anchor", pick(config.anchors, src.anchor));
  add("self_talk", pick(config.selfTalkOptions, src.selfTalk));
  add("prayer_style", pick(PRAYER_STYLE_OPTIONS.map((o) => o.value), src.prayerStyle));

  if (role !== null && Array.isArray(src.positivePlays)) {
    const valid = positivePlaysFor(sport, role).map((p) => p.slug);
    const seen = new Set<string>();
    for (const slug of src.positivePlays) {
      if (seen.size >= MAX_POSITIVE_PLAYS) break;
      const ok = pick(valid, slug);
      if (ok !== null && !seen.has(ok)) {
        seen.add(ok);
        add("positive_play", ok);
      }
    }
  }

  return { sport, selections: out };
}
