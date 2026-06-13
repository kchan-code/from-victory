// Post-game debrief module registry — FV-225.
//
// Code-resident content: ten on-demand, re-openable modules for the
// car-ride-home moment (The Loss / The Benching / The Bad Game / The Win /
// The Hard Night, hockey + basketball). Mirrors the pregame/pre-practice
// precedent: on-demand content lives in code; only the sequenced daily
// catalog is DB.
//
// Architecture contract:
//   - Zero DB reads. Zero athlete-data writes. No "opened" events, no
//     completion stamps, no localStorage counters.
//   - Content is VERBATIM from docs/track-b-drafts-fv225-fv230.md PART 1,
//     specialist-approved copy. Do not edit, trim, or reflow any module body.
//   - Sport resolution: caller filters by profile.sport. If a sport has no
//     modules (future sports), the picker page 404s/redirects gracefully.
//   - Scenario types: 'loss' | 'benching' | 'bad-game' | 'win' | 'praise'
//     ('win' added 2026-06-12 per KC: "Someone may want to praise even in
//     good or bad times." Praise-as-posture across outcomes; James 1:17.)
//     ('praise' added 2026-06-12 per KC: "praise on a hard night" — the
//     deliberate mirror of The Win. The athlete still choosing to thank God
//     on a HARD night; Habakkuk 3:17-18, "yet I will rejoice." Full trio
//     cycle + both sport experts; highest anti-prosperity guardrail load
//     in the app — see the banned-pattern scan in the FV-225 tests.)

import type { Sport } from "@/lib/sports";

export type PostgameScenario =
  | "loss"
  | "benching"
  | "bad-game"
  | "win"
  | "praise";

export interface PostgameModule {
  /** URL slug — unique across all modules */
  slug: string;
  sport: Sport;
  scenario: PostgameScenario;
  title: string;
  /**
   * Optional per-module card eyebrow override. When absent the picker/detail
   * pages fall back to the team-sport-default SCENARIO_EYEBROW map. Individual
   * sports set this where the default leaks team-sport framing — e.g. golf's
   * `benching` module is "Didn't Qualify", not "The Bench". Generalizes to any
   * non-team sport (swimming/tennis) without a per-sport eyebrow map.
   */
  eyebrow?: string;
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
// Module 3a — Golf · After the Loss
// ---------------------------------------------------------------------------
const GOLF_LOSS: PostgameModule = {
  slug: "golf-the-loss",
  sport: "golf",
  scenario: "loss",
  title: "After the Loss",
  scriptureRef: "Psalm 34:18",
  scriptureText:
    "The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
  bodyMd: `### What happened

You got beat. Maybe the match slipped on the back nine, maybe the playoff
went the other way, maybe you signed for a number that wasn't enough. Now
it's just you, the car, and a quiet you can't talk your way out of.

Let it be what it is. A loss is allowed to hurt. Out here there's no bench
to hide on and no line to share it with — it was your card, your round, and
that's a lonely kind of sting. It mattered. That's why it aches.

### What's true

Here's what the round doesn't get to do: it doesn't get to tell you who you
are. The card reports what happened on the course. It can't reach the part
of you that's settled in Christ.

The Psalms don't rush you past this. David wrote that God is *close* to the
brokenhearted — not impressed by the ones who shrug it off, close to the
ones who feel it. He's near you tonight, in the car, in the quiet.

So feel it tonight. You're not asked to feel it forever.

> The loss is real. It is not the verdict on you.

Tomorrow the range is waiting and so is the next round. Tonight, you're
already held.`,
};

// ---------------------------------------------------------------------------
// Module 3b — Golf · Left Off the Card (benching analog — didn't qualify)
// ---------------------------------------------------------------------------
const GOLF_BENCHING: PostgameModule = {
  slug: "golf-left-off-the-card",
  sport: "golf",
  scenario: "benching",
  title: "Left Off the Card",
  eyebrow: "Didn't Qualify", // golf has no bench — overrides the default "The Bench"
  scriptureRef: "Psalm 139:1-3",
  scriptureText:
    "You have searched me, Lord, and you know me. You know when I sit and when I rise; you perceive my thoughts from afar. You discern my going out and my lying down; you are familiar with all my ways.",
  bodyMd: `### What happened

Your number wasn't good enough. Qualifying came and went, the lineup got
posted, and your name wasn't on it — beaten by a stroke or two, left home
while the travel five tees off without you. Now you're in the car and the
question won't quit: *am I even good enough for this?*

That's a real question, and it's a hard seat. You're allowed to be
frustrated. Doing the work and missing the cut by one is its own kind of
loud.

### What's true

But hear the trap in it. The qualifying sheet can decide your spot this
week. It cannot decide your worth. Those are two different things, and the
night keeps trying to blur them.

David wrote Psalm 139 about a God who already knows him completely —
sitting, rising, every honest corner. Your number got read. *You* didn't.
The One who matters most has known you all the way down since long before
this week's scores.

> A coach reads your card. He doesn't write who you are.

Tomorrow you can ask what it takes to make it next time. Tonight, you're
already known.`,
};

// ---------------------------------------------------------------------------
// Module 3c — Golf · The Blow-Up Round (bad-game analog)
// ---------------------------------------------------------------------------
const GOLF_BAD_GAME: PostgameModule = {
  slug: "golf-the-blow-up-round",
  sport: "golf",
  scenario: "bad-game",
  title: "The Blow-Up Round",
  eyebrow: "The Bad Round", // golf plays rounds, not games — overrides "The Bad Game"
  scriptureRef: "Lamentations 3:22-23",
  scriptureText:
    "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
  bodyMd: `### What happened

You couldn't find it today. The one bad hole that turned into a snowman, the
swing that left somewhere on the front nine, the number that ran away from
you and wouldn't stop. You replayed it walking up the last fairway, and
you're replaying it now, and your head only keeps the worst holes.

That loop is normal. A round like that earns a little ache. Don't fake
being fine.

### What's true

But watch what the loop is doing. It's taking what *happened* and quietly
turning it into who you *are*. *I'm a choker. I can't play.* That's the lie
under the replay, and it's louder at night.

Lamentations was written from real wreckage — a city in ruins, no spin on
it. And right in the middle, the writer says God's mercies are *new every
morning.* Not earned by a better round. New tomorrow because He is faithful,
not because you were.

> A blow-up round is information. It is not your identity.

Hit the range tomorrow with clear eyes. Tonight, the morning's already
coming.`,
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

// ---------------------------------------------------------------------------
// Module 1d — Hockey · The Win (KC scope addition 2026-06-12; trio cycle +
// hockey-expert fixes applied in the drafts doc)
// ---------------------------------------------------------------------------
const HOCKEY_WIN: PostgameModule = {
  slug: "hockey-after-the-win",
  sport: "hockey",
  scenario: "win",
  title: "After the Win",
  scriptureRef: "James 1:17",
  scriptureText:
    "Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.",
  bodyMd: `### What happened

You won. Maybe it was the goal, the big save, the shift that swung it.
The body's still buzzing.

Good. Sit in it. Name what actually went right — the reps that built it,
the pass that set you up, the linemate, the prep nobody saw.

### What's true

The scoreboard couldn't drop you after a loss, and it can't crown you
after this. That's the freedom.

Every good gift comes down from a Father who doesn't change like shifting
shadows. The win, the body, the room, this whole night — gift. The
Father you'd thank tonight is the same One who was close in the car after
the last loss. He didn't change. Only the scoreboard did. You don't need
a speech. Just: thank you.

Enjoy it tonight, then let it rest — the win doesn't owe you a sequel.
And win like someone who's lost before — someone two stalls down might've
had their worst night.

> The win is real. It is not the crown on you.

Take the win — and let the thank-you travel past the scoreboard.`,
};

// ---------------------------------------------------------------------------
// Module 2d — Basketball · The Win (same trio cycle; basketball-expert fix
// applied)
// ---------------------------------------------------------------------------
const BASKETBALL_WIN: PostgameModule = {
  slug: "basketball-after-the-win",
  sport: "basketball",
  scenario: "win",
  title: "After the Win",
  scriptureRef: "James 1:17",
  scriptureText:
    "Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.",
  bodyMd: `### What happened

You won. Maybe it was the dagger three, the and-one, the stop in crunch
time. The body's still buzzing.

Good. Sit in it. Name what actually went right — the reps that built it,
the pass that set you up, the teammate, the prep nobody saw.

### What's true

The scoreboard couldn't drop you after a loss, and it can't crown you
after this. That's the freedom.

Every good gift comes down from a Father who doesn't change like shifting
shadows. The win, the body, the teammates, this whole night — gift. The
Father you'd thank tonight is the same One who was close in the car after
the last loss. He didn't change. Only the scoreboard did. You don't need
a speech. Just: thank you.

Enjoy it tonight, then let it rest — the win doesn't owe you a sequel.
And win like someone who's lost before — the teammate two seats down
might've had their worst night.

> The win is real. It is not the crown on you.

Take the win — and let the thank-you travel past the scoreboard.`,
};

// ---------------------------------------------------------------------------
// Module 1e — Hockey · The Hard Night / Praise Anyway (KC scope addition
// 2026-06-12: "praise on a hard night" — the deliberate MIRROR of The Win.
// Full trio cycle: youth-pastor (Habakkuk 3:17-18 — the "yet" engine; praise
// severed from outcome; same God good night or bad; anti-prosperity
// guardrails) + sports-psychologist (ache named FIRST, then the chosen lift;
// anti-bypassing; permit the ache to remain) + content-curator integration;
// hockey-expert texture (car-or-bus / wet gear / dark window). The reset
// blockquote and the "Only the night did" seam deliberately echo The Win.)
// ---------------------------------------------------------------------------
const HOCKEY_PRAISE: PostgameModule = {
  slug: "hockey-praise-anyway",
  sport: "hockey",
  scenario: "praise",
  title: "Praise Anyway",
  scriptureRef: "Habakkuk 3:17-18",
  scriptureText:
    "Though the fig tree does not bud and there are no grapes on the vines, though the olive crop fails and the fields produce no food, though there are no sheep in the pen and no cattle in the stalls, yet I will rejoice in the Lord, I will be joyful in God my Savior.",
  bodyMd: `### What happened

The win never came. You're in the car — or the back of the bus — gear
still wet, the window dark, the loss sitting heavy in your chest.

And you might still feel bad tonight, and that's okay. Name the ache
first. Don't talk yourself out of it.

### What's true

Habakkuk looked at empty fields and ruined vines and said *yet I will
rejoice* — not because the harvest came, but because his God hadn't moved.

> Praise on a hard night is real. It is not a trade for a better one.

That's the whole thing. You're not praising because the night was good.
You're praising because He's good — and those were never the same thing.

Nothing on the scoreboard changes when you say it. The same God you'd
thank after a win is the same God in this dark car. He didn't change.
Only the night did.

So lean on Him, not on yourself. The thank-you isn't gritted teeth — it's
weight handed over.

Say the thank-you with empty hands — and mean it.`,
};

// ---------------------------------------------------------------------------
// Module 2e — Basketball · The Hard Night / Praise Anyway (same trio cycle as
// 1e; basketball-expert texture — gym bag heavier / lot clearing / the score
// still behind your eyes; "the floor" not "the court").
// ---------------------------------------------------------------------------
const BASKETBALL_PRAISE: PostgameModule = {
  slug: "basketball-praise-anyway",
  sport: "basketball",
  scenario: "praise",
  title: "Praise Anyway",
  scriptureRef: "Habakkuk 3:17-18",
  scriptureText:
    "Though the fig tree does not bud and there are no grapes on the vines, though the olive crop fails and the fields produce no food, though there are no sheep in the pen and no cattle in the stalls, yet I will rejoice in the Lord, I will be joyful in God my Savior.",
  bodyMd: `### What happened

The win never came. You're in the car, the gym bag heavier than it
should be, the lot clearing out, the score still sitting behind your eyes.

And you might still feel bad tonight, and that's okay. Name the ache
first. Don't talk yourself out of it.

### What's true

Habakkuk looked at empty fields and ruined vines and said *yet I will
rejoice* — not because the harvest came, but because his God hadn't moved.

> Praise on a hard night is real. It is not a trade for a better one.

That's the whole thing. You're not praising because the night was good.
You're praising because He's good — and those were never the same thing.

Nothing on the scoreboard changes when you say it. The same God you'd
thank after a win is the same God in this quiet car. He didn't change.
Only the night did.

So lean on Him, not on yourself. The thank-you isn't gritted teeth — it's
weight handed over.

Say the thank-you with empty hands — and mean it.`,
};

// ---------------------------------------------------------------------------
// Module 3d — Golf · After the Win (same trio cycle; golf-expert texture —
// scorecard / closed-out the match / best ever; individual-sport no-room
// framing mirrors the loss module's loneliness layer)
// ---------------------------------------------------------------------------
const GOLF_WIN: PostgameModule = {
  slug: "golf-after-the-win",
  sport: "golf",
  scenario: "win",
  title: "After the Win",
  scriptureRef: "James 1:17",
  scriptureText:
    "Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.",
  bodyMd: `### What happened

You won. Maybe you closed out the match, shot your best ever, or your
number finally cleared the cut. The body's still buzzing.

Good. Sit in it. Name what actually went right — the reps that built it,
the up-and-down that saved the round, the practice nobody saw.

### What's true

The scorecard couldn't drop you after a blow-up round, and it can't crown
you after this. That's the freedom.

Every good gift comes down from a Father who doesn't change like shifting
shadows. The round, the swing, this whole day — gift, not wages. God didn't
reward your faith with a lower score; the good round and your standing with
Him were never on the same scorecard. The Father you'd thank tonight is the
same One who was close in the car after the last bad round. He didn't
change. Only the number did.

Enjoy it tonight, then let it rest — the round doesn't owe you a sequel.
And win like someone who's blown up before, who knows the next card can go
the other way.

> The win is real. It is not the crown on you.

Take the round — and let the thank-you travel past the scorecard.`,
};

// ---------------------------------------------------------------------------
// Module 3e — Golf · Praise Anyway (highest anti-prosperity risk; same Habakkuk
// engine as hockey/basketball; golf-expert texture — four hours alone with your
// card / clubs in the trunk / back nine / individual-sport loneliness)
//
// CLINICAL_SIGN_OFF_REQUIRED: this module (and its hockey/basketball mirrors)
// reaches a minor at a night-time, post-loss low point. It must NOT roll out to
// a broad athlete base before the pending clinical-advisor sign-off (CLAUDE.md
// Open Items; tracked in FV-296). The content itself names the ache, permits it,
// and never forces a bypass — but the clinical gate is a standing requirement,
// not satisfied by this code. grep CLINICAL_SIGN_OFF_REQUIRED for all such modules.
// ---------------------------------------------------------------------------
const GOLF_PRAISE: PostgameModule = {
  slug: "golf-praise-anyway",
  sport: "golf",
  scenario: "praise",
  title: "Praise Anyway",
  scriptureRef: "Habakkuk 3:17-18",
  scriptureText:
    "Though the fig tree does not bud and there are no grapes on the vines, though the olive crop fails and the fields produce no food, though there are no sheep in the pen and no cattle in the stalls, yet I will rejoice in the Lord, I will be joyful in God my Savior.",
  bodyMd: `### What happened

The round didn't come. You're in the car, clubs in the trunk, the bad
number still sitting behind your eyes — the round that got away from you
on the back nine, or the cut you missed by one. Four hours alone with your
own card, and it didn't go your way.

And you might still feel bad tonight, and that's okay. Name the ache
first. Don't talk yourself out of it.

### What's true

Habakkuk looked at empty fields and ruined vines and said *yet I will
rejoice* — not because the harvest came, but because his God hadn't moved.

> Praise on a hard night is real. It is not a trade for a better round.

That's the whole thing. You're not praising to earn a lower score next
time. You're praising because He's good — and those were never the same
thing.

Nothing on the card changes when you say it. The same God you'd thank
after your best round is the same God in this quiet car. He didn't change.
Only the number did.

So lean on Him, not on yourself. The thank-you isn't gritted teeth — it's
weight handed over.

Say the thank-you with empty hands — and mean it.`,
};

export const POSTGAME_MODULES: PostgameModule[] = [
  HOCKEY_WIN,
  HOCKEY_LOSS,
  HOCKEY_BENCHING,
  HOCKEY_BAD_GAME,
  HOCKEY_PRAISE,
  BASKETBALL_WIN,
  BASKETBALL_LOSS,
  BASKETBALL_BENCHING,
  BASKETBALL_BAD_GAME,
  BASKETBALL_PRAISE,
  GOLF_WIN,
  GOLF_LOSS,
  GOLF_BENCHING,
  GOLF_BAD_GAME,
  GOLF_PRAISE,
];

/**
 * All modules for a given sport, in scenario order (win → loss → benching →
 * bad-game → praise). The win leads: an athlete opening this on a good night
 * should not have to scroll past hard nights to find theirs. "Praise Anyway"
 * (praise on a hard night) trails deliberately — it is the chosen-posture
 * capstone an athlete grows into after the raw consolation modules, not the
 * first thing a gutted athlete sees.
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
