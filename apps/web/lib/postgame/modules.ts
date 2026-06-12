// Post-game debrief module registry — FV-225.
//
// Code-resident content: six on-demand, re-openable modules for the
// car-ride-home moment (The Loss / The Benching / The Bad Game, hockey +
// basketball). Mirrors the pregame/pre-practice precedent: on-demand content
// lives in code; only the sequenced daily catalog is DB.
//
// Architecture contract:
//   - Zero DB reads. Zero athlete-data writes. No "opened" events, no
//     completion stamps, no localStorage counters.
//   - Content is VERBATIM from docs/track-b-drafts-fv225-fv230.md PART 1,
//     specialist-approved copy. Do not edit, trim, or reflow any module body.
//   - Sport resolution: caller filters by profile.sport. If a sport has no
//     modules (future sports), the picker page 404s/redirects gracefully.
//   - Scenario types: 'loss' | 'benching' | 'bad-game'

import type { Sport } from "@/lib/sports";

export type PostgameScenario = "loss" | "benching" | "bad-game";

export interface PostgameModule {
  /** URL slug — unique across all modules */
  slug: string;
  sport: Sport;
  scenario: PostgameScenario;
  title: string;
  scriptureRef: string;
  scriptureText: string;
  /** Verbatim markdown body from specialist-approved copy */
  bodyMd: string;
}

// ---------------------------------------------------------------------------
// Module 1a — Hockey · The Loss
// ---------------------------------------------------------------------------
const HOCKEY_LOSS: PostgameModule = {
  slug: "hockey-the-loss",
  sport: "hockey",
  scenario: "loss",
  title: "After the Loss",
  scriptureRef: "Psalm 34:18",
  scriptureText:
    "The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
  bodyMd: `### What happened

You lost. The room was quiet, the gear came off slow, and now the
window's dark and nobody's saying much.

Let it be what it is. A loss is allowed to hurt. You don't have to talk
yourself out of it on the drive home, and you don't have to pretend it
didn't matter. It mattered. That's why it stings.

### What's true

Here's what the night doesn't get to do: it doesn't get to tell you who
you are. The scoreboard reports what happened on the ice. It can't reach
the part of you that's settled in Christ.

The Psalms don't rush you past this. David wrote that God is *close* to
the brokenhearted — not impressed by the ones who shrug it off, close
to the ones who feel it. He's near you tonight, in the car, in the
quiet.

So feel it tonight. You're not asked to feel it forever.

> The loss is real. It is not the verdict on you.

Tomorrow the tape is waiting and so is the next rep. Tonight, you're
already held.`,
};

// ---------------------------------------------------------------------------
// Module 1b — Hockey · The Healthy Scratch / Benching
// ---------------------------------------------------------------------------
const HOCKEY_BENCHING: PostgameModule = {
  slug: "hockey-glued-to-the-bench",
  sport: "hockey",
  scenario: "benching",
  title: "Glued to the Bench",
  scriptureRef: "Psalm 139:1-3",
  scriptureText:
    "You have searched me, Lord, and you know me. You know when I sit and when I rise; you perceive my thoughts from afar. You discern my going out and my lying down; you are familiar with all my ways.",
  bodyMd: `### What happened

The door kept not opening. Shift after shift, your line went without
you — or you watched the whole night from the end of the bench in a
clean jersey. Now you're in the car and the question won't quit:
*does he even trust me?*

That's a real question, and it's a hard seat. You're allowed to be
frustrated. Sitting when you're built to compete is its own kind of
loud.

### What's true

But hear the trap in it. The bench can decide your minutes tonight. It
cannot decide your worth. Those are two different things, and the night
keeps trying to blur them.

David wrote Psalm 139 about a God who already knows him completely —
sitting, rising, every honest corner. You weren't invisible out there.
The One who matters most didn't just see your minutes — he's known you
all the way down since long before tonight.

> A coach sets your ice time. He doesn't set your standing.

Tomorrow you can ask him what he wants to see. Tonight, you're already
seen.`,
};

// ---------------------------------------------------------------------------
// Module 1c — Hockey · The Bad Game / Bad Night
// ---------------------------------------------------------------------------
const HOCKEY_BAD_GAME: PostgameModule = {
  slug: "hockey-the-bad-night",
  sport: "hockey",
  scenario: "bad-game",
  title: "The Bad Night",
  scriptureRef: "Lamentations 3:22-23",
  scriptureText:
    "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
  bodyMd: `### What happened

You couldn't find it tonight. The turnover that ended up in your net.
The bad shift that turned into a bad night. You replayed it on the bench,
and you're replaying it now, and the highlight reel in your head only
keeps the worst clips.

That loop is normal. A rough night earns a little ache. Don't fake
being fine.

### What's true

But watch what the loop is doing. It's taking what *happened* and quietly
turning it into who you *are*. *I'm trash. I cost us.* That's the lie
underneath the replay, and it's louder at night.

Lamentations was written from real wreckage — a city in ruins, no
spin on it. And right in the middle, the writer says God's mercies are
*new every morning.* Not earned by a better game. New tomorrow because
He is faithful, not because you were.

> A bad night is information. It is not your identity.

Watch the tape tomorrow with clear eyes. Tonight, the morning's already
coming.`,
};

// ---------------------------------------------------------------------------
// Module 2a — Basketball · The Loss
// ---------------------------------------------------------------------------
const BASKETBALL_LOSS: PostgameModule = {
  slug: "basketball-the-loss",
  sport: "basketball",
  scenario: "loss",
  title: "After the Loss",
  scriptureRef: "Psalm 34:18",
  scriptureText:
    "The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
  bodyMd: `### What happened

You lost. The locker room emptied out quiet, the gym lights are behind
you now, and the ride home is mostly silence.

Let it be what it is. A loss is allowed to hurt. You don't have to talk
yourself out of it in the car, and you don't have to act like it didn't
matter. It did. That's why it stings.

### What's true

Here's what the night doesn't get to do: it doesn't get to tell you who
you are. The scoreboard reports what happened on the floor. It can't
touch the part of you that's secure in Christ.

The Psalms don't hurry you past this. David wrote that God is *close* to
the brokenhearted — not impressed by whoever shrugs it off, close to
whoever actually feels it. He's near you tonight, in the car, in the
quiet.

So feel it tonight. You're not asked to feel it forever.

> The loss is real. It is not the verdict on you.

Tomorrow the film is waiting and so is the next rep. Tonight, you're
already held.`,
};

// ---------------------------------------------------------------------------
// Module 2b — Basketball · Glued to the Bench
// ---------------------------------------------------------------------------
const BASKETBALL_BENCHING: PostgameModule = {
  slug: "basketball-glued-to-the-bench",
  sport: "basketball",
  scenario: "benching",
  title: "Glued to the Bench",
  scriptureRef: "Psalm 139:1-3",
  scriptureText:
    "You have searched me, Lord, and you know me. You know when I sit and when I rise; you perceive my thoughts from afar. You discern my going out and my lying down; you are familiar with all my ways.",
  bodyMd: `### What happened

The sub never came. You checked the scorer's table, you stayed ready,
and the buzzer went without your number. Now you're in the car and the
question keeps circling: *does he even trust me?*

That's a real question, and it's a hard seat. You're allowed to be
frustrated. Sitting when you're built to compete is its own kind of
loud.

### What's true

But hear the trap in it. The bench can decide your minutes tonight. It
cannot decide your worth. Those are two different things, and the night
keeps trying to blur them.

David wrote Psalm 139 about a God who already knows him completely —
sitting, rising, every honest corner. You weren't invisible down there.
The One who matters most didn't just see your minutes — he's known you
all the way down since long before tonight.

> A coach sets your minutes. He doesn't set your standing.

Tomorrow you can ask him what he wants to see. Tonight, you're already
seen.`,
};

// ---------------------------------------------------------------------------
// Module 2c — Basketball · The Cold Night / Costly Turnover
// ---------------------------------------------------------------------------
const BASKETBALL_BAD_GAME: PostgameModule = {
  slug: "basketball-the-cold-night",
  sport: "basketball",
  scenario: "bad-game",
  title: "The Cold Night",
  scriptureRef: "Lamentations 3:22-23",
  scriptureText:
    "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
  bodyMd: `### What happened

You couldn't find it tonight. The shot wouldn't fall, or the turnover
came at the worst time and you felt the gym react. You replayed it on
the bench, and you're replaying it now, and the highlight reel in your
head only saves the worst clips.

That loop is normal. A cold night earns a little ache. Don't fake being
fine.

### What's true

But watch what the loop is doing. It's taking what *happened* and quietly
turning it into who you *are*. *I'm a liability. I cost us.* That's the
lie under the replay, and it's louder at night.

Lamentations was written from real wreckage — a city in ruins, no spin
on it. And right in the middle, the writer says God's mercies are *new
every morning.* Not earned by a better game. New tomorrow because He is
faithful, not because you were.

> A cold night is information. It is not your identity.

Get up shots tomorrow with clear eyes. Tonight, the morning's already
coming.`,
};

// ---------------------------------------------------------------------------
// Exported registry
// ---------------------------------------------------------------------------

export const POSTGAME_MODULES: PostgameModule[] = [
  HOCKEY_LOSS,
  HOCKEY_BENCHING,
  HOCKEY_BAD_GAME,
  BASKETBALL_LOSS,
  BASKETBALL_BENCHING,
  BASKETBALL_BAD_GAME,
];

/**
 * All modules for a given sport, in scenario order (loss → benching → bad-game).
 * Returns an empty array for sports with no modules — caller handles the 404.
 */
export function modulesForSport(sport: Sport): PostgameModule[] {
  return POSTGAME_MODULES.filter((m) => m.sport === sport);
}

/**
 * Look up a single module by its URL slug. Returns undefined if not found.
 */
export function moduleBySlug(slug: string): PostgameModule | undefined {
  return POSTGAME_MODULES.find((m) => m.slug === slug);
}
