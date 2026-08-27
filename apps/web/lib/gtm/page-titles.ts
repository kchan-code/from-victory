// Shared title/route/excerpt constants for the two live GTM Engine pages
// (FV-411), extracted so FV-413's internal cross-links can reference a
// single source of truth instead of duplicating literal strings.
//
// Every string below must exactly match the corresponding page's
// local `PAGE_TITLE` / `PAGE_DESCRIPTION` constant and rendered <h1> in
// app/pregame-ritual-christian-athlete/page.tsx and
// app/christian-athlete-apps/page.tsx. Do NOT edit these without also
// updating those two files (and vice versa).
//
// 2026-08-26: founder-directed answer-first refresh (FV-504). Live
// comparison now names the apps that actually win today's SERP.

export const PREGAME_RITUAL_HREF = "/pregame-ritual-christian-athlete";

export const PREGAME_RITUAL_TITLE =
  "A Pregame Ritual for the Christian Athlete: The Guided Visualization";

export const PREGAME_RITUAL_EXCERPT =
  "You've already seen the first shot, first possession, first tee before you step in. The hard moment is named. Compete From Victory.";

export const PREGAME_RITUAL_DATE_PUBLISHED = "2026-07-09";
export const PREGAME_RITUAL_DATE_MODIFIED = "2026-08-26";

export const CHRISTIAN_ATHLETE_APPS_HREF = "/christian-athlete-apps";

export const CHRISTIAN_ATHLETE_APPS_TITLE =
  "Christian Athlete Apps Compared: Faithful Athlete, Playbook Devotional, Core IV";

export const CHRISTIAN_ATHLETE_APPS_EXCERPT =
  "Faithful Athlete, Playbook Devotional, and Core IV lead stores. From Victory: see the first shot, then compete from victory. Not in stores yet.";

export const CHRISTIAN_ATHLETE_APPS_DATE_PUBLISHED = "2026-07-09";
export const CHRISTIAN_ATHLETE_APPS_DATE_MODIFIED = "2026-08-26";
