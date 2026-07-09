// Shared title/route/excerpt constants for the two live GTM Engine pages
// (FV-411), extracted so FV-413's internal cross-links can reference a
// single source of truth instead of duplicating literal strings.
//
// VERBATIM: every string below must exactly match the corresponding page's
// local `PAGE_TITLE` / `PAGE_DESCRIPTION` constant and rendered <h1> in
// app/pregame-ritual-christian-athlete/page.tsx and
// app/christian-athlete-apps/page.tsx. Do NOT edit these without also
// updating those two files (and vice versa).

export const PREGAME_RITUAL_HREF = "/pregame-ritual-christian-athlete";

export const PREGAME_RITUAL_TITLE =
  "A Pregame Ritual for the Christian Athlete: The Guided Visualization";

export const PREGAME_RITUAL_EXCERPT =
  "A pregame ritual for the Christian athlete is a short, repeatable practice that carries your faith into the moment before you compete.";

export const CHRISTIAN_ATHLETE_APPS_HREF = "/christian-athlete-apps";

export const CHRISTIAN_ATHLETE_APPS_TITLE =
  "Three Apps for the Christian Athlete: What Each One Gets Right";

export const CHRISTIAN_ATHLETE_APPS_EXCERPT =
  "A Christian athlete choosing an app is really weighing three kinds of tool: a free Scripture devotional, a sport-specific faith app, and a faith-based app that guides you through pregame visualization.";
