// Truth bank — the rotating "Remember what is true" line in the pregame opening.
//
// Every guided pregame session used to carry ONE fixed identity line inside
// shared-opening ("The worst game you ever play does not lower your standing
// with God … loved after the final horn"). It played verbatim on every
// session, every sport, every day — the one immovable sentence in a system
// built to rotate — so athletes memorized it and tuned it out. It was also
// hockey-flavored ("lace up", "final horn") for golfers and pitchers.
//
// This bank replaces it. shared-opening now ends on "Remember what is true."
// and the playlist template carries a {{truth}} sentinel right after it; the
// resolver (audio-playlist.ts) substitutes one truth-NN clip per session,
// picked at random per player mount and never the same line twice in a row
// (see truth-rotation.ts). Every line is sport-neutral and says the same
// thing — standing with God does not move with performance — from a
// different angle. Text approved by KC (2026-09-02).
//
// This module is pure data and browser-safe: it is imported by the clip
// generator (clips.ts), the runtime resolver (audio-playlist.ts), and the
// player hook. Keep it free of Node and DOM APIs.

export const TRUTH_SLUG_PREFIX = "truth-";

export type TruthLine = {
  /** Catalog slug — rendered as public/audio/pregame/clips/<slug>.<hash8>.mp3 */
  slug: string;
  /** The spoken line. One or two short sentences, sport-neutral. */
  text: string;
};

export const TRUTH_BANK: readonly TruthLine[] = [
  { slug: "truth-01", text: "Your standing with God does not rise or fall with performance." },
  { slug: "truth-02", text: "The outcome can change. Your place with God cannot." },
  { slug: "truth-03", text: "You were loved before this began. You will be loved afterward." },
  { slug: "truth-04", text: "Your worth was settled at the cross, not here." },
  { slug: "truth-05", text: "You are not earning belonging. In Christ, you already belong." },
  { slug: "truth-06", text: "Nothing today can add to or subtract from grace." },
  { slug: "truth-07", text: "The verdict over you is already spoken: loved, forgiven, and his." },
  { slug: "truth-08", text: "You have nothing to prove to God. Give everything you have." },
  { slug: "truth-09", text: "Your performance may be measured. Your identity is not." },
  { slug: "truth-10", text: "Success cannot crown you. Failure cannot condemn you." },
  { slug: "truth-11", text: "Christ finished the work. You are free to give your best." },
  { slug: "truth-12", text: "Whatever happens, you remain fully known and fully loved by God." },
] as const;

/** Ordered slug list — the resolver indexes into this (filtered to what the
 *  catalog actually carries), so the order here is the rotation order. */
export const TRUTH_SLUGS: readonly string[] = TRUTH_BANK.map((t) => t.slug);

export function isTruthSlug(slug: string): boolean {
  return slug.startsWith(TRUTH_SLUG_PREFIX);
}
