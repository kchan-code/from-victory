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
//   - Content source of truth: KC's 2026-07-20 postgame review-bundle pass
//     (all bodies re-authored by KC; football added FV-431; golf `benching`
//     REMOVED per KC — "there is no benching for golf"). Do not edit, trim,
//     or reflow any module body without a KC prose gate.
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
   * `benching` module is "The Bad Round", not "The Bench". Generalizes to any
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

You lost. The room went quiet, the gear came off slowly, and now nobody
has much to say.

Do not use "God is in control" to act like the game did not matter. You
wanted to win, you worked for it, and losing hurts. You can tell God the
truth about that without cleaning it up first.

### What's true

God's control does not make you passive. It lets you face the loss without
being crushed by it. Psalm 34 says He is close to the brokenhearted. He is
not waiting for you to stop caring before you come to Him.

Ask the honest questions. Did you prepare well? Did you stay with your
assignment? Did you support your line when the game turned? Own what is
yours. Leave alone what was never yours to control.

> Care about the loss. Learn from it. Do not make it your identity.

Your standing with God rests on what Christ has done, not on tonight's
score. Tomorrow, watch the tape and take one correction back to practice.
Tonight, let the loss be painful without putting yourself on trial.`,
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

The door kept opening for somebody else. Shift after shift, you stayed on
the bench and did not hear your name. It hurts to watch someone else get
the opportunity you wanted. Do not pretend it does not.

### What's true

Right now, the coach is not trusting you with the ice time you want. Start
there. Do not spend the ride home guessing at every reason or building a
case against him. Psalm 139 says God knows you completely. Because your
life is secure in Christ, you can face a limited role without letting it
decide who you are.

> You do not control the shifts you are given. You control what you do with them.

Tomorrow, be bold enough to ask the coach what must improve. Listen even
if the answer is incomplete or hard to hear. Then own the part you can
change. If you get three shifts, make them disciplined shifts. Practice
with purpose, support your line, and stay ready. God may not change the
role immediately. He can still form courage, patience, and faithfulness in
you while you work inside it.`,
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

You had a bad night. Maybe your turnover ended up in the net. Maybe one
lost assignment changed the game. Your mind keeps replaying the same
shift because you know it mattered.

Do not minimize it, and do not exaggerate it. Tell the truth about the
play.

### What's true

Maybe the mistake was yours. Grace does not ask you to deny that. It lets
you own the turnover, apologize if someone needs to hear it, and learn
without deciding that one night has exposed who you really are.

Lamentations says God's compassion is new every morning. That mercy is
not a promise that your next game will be better. It is the reason you
can face the tape honestly: Christ has already carried your condemnation.

> Own the mistake without turning it into your name.

Tomorrow, find the first decision or detail that broke down. Take the
coaching and work on it. Tonight, stop replaying the shift as a punishment.`,
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

You lost. The locker room emptied quietly, the gym lights are behind you,
and the ride home gives you plenty of time to replay it.

Do not hide behind "God is in control" as if caring less were more
spiritual. You wanted this game. You worked for it. The loss can hurt.

### What's true

Psalm 34 says God is close to the brokenhearted. You can bring Him the
actual disappointment, not the answer you think a Christian athlete is
supposed to give.

Then be honest about your part. Did you defend with discipline? Did you
move the ball? Did your effort change when the game turned? Responsibility
is not condemnation. It is how you learn.

> The result matters. It is not your standing before God.

Christ's finished work, not your final score, secures that standing.
Tomorrow, take one clear correction from the film and bring it to practice.
Tonight, do not force perspective or turn the loss into a judgment on your
whole life.`,
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

The sub never came. You watched the scorer's table, stayed ready, and the
buzzer sounded without your number. It hurts to sit while somebody else
gets the minutes you wanted. You do not have to act like it does not.

### What's true

Right now, the coach is not trusting you with the role you want. Accepting
that fact is not the same as agreeing with every decision. It means you
stop spending your energy on the minutes you were not given. Psalm 139
says God knows you completely. Your place in Christ is secure enough for
you to face the situation without hiding from it.

> You cannot choose your minutes. You can be ready for every one you receive.

Tomorrow, ask the coach directly what you need to improve. Listen without
arguing, then turn the clearest part of the answer into work. If practice
gives you three live reps, make them three attentive, disciplined reps.
Talk from the bench, help your teammates, and stay ready. God does not
promise a larger role, but He does give you courage to be faithful in the
one you have.`,
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

You got beat. Maybe the match turned on the back nine, the playoff went the
other way, or you signed for a number that was not enough. Now it is just
you and the round you wish you could play again.

Do not call the result unimportant because God is in control. You cared,
you competed, and your name is on the card. The loss can hurt.

### What's true

Psalm 34 says God is close to the brokenhearted. You do not need to become
detached from the game to trust Him. Bring Him the disappointment as it is.

Then separate what you controlled from what you did not. Your decisions,
commitment, and response after mistakes are yours to examine. A bad bounce
or another player's score is not.

> Take the round seriously without making it ultimate.

Your standing with God rests on Christ, not on the card. Tomorrow, review
the round and choose one part of your game to address. Tonight, you do not
need to explain the loss away or condemn yourself for it.`,
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

The round got away from you. One bad hole became a bigger number, or the
swing disappeared on the front nine and never returned. Your mind keeps
replaying the worst shots.

Start with facts. Which decisions were poor? Which misses were technical?
Where did frustration change the next shot?

### What's true

You may have managed the course badly. Own that. But *I made poor decisions*
is not the same as *I am a choker.* The first claim can lead to change. The
second turns one round into a label.

Lamentations says God's compassion is new every morning. That is not a
promise of a lower score tomorrow. It means your failures do not exhaust
His mercy. Because Christ has taken your condemnation, you can review the
card without defending yourself or tearing yourself apart.

> Be honest about the round, then make the next correction.

Tomorrow, work on the clearest pattern and make a plan for stopping one
bad hole from leading to two more. Tonight, put the card away.`,
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

You had a bad game. The shot would not fall, or the turnover came at the
worst time and you heard the gym react. Your mind keeps going back to it
because the play mattered.

Be exact about what happened. A bad shooting night, a missed rotation,
and a careless decision are different problems.

### What's true

Maybe your mistake hurt the team. Own it. If you ignored a call or let a
teammate down, repair it. But do not turn *I played badly* into *I am a
liability.* Condemnation stays vague and personal; conviction is specific
and gives you a next step.

Lamentations says God's compassion is new every morning. His mercy is not
earned by making shots tomorrow. Because Christ has carried your
condemnation, you can look directly at the performance and tell the truth.

> Name the mistake. Take the correction. Do not make the mistake your name.

Tomorrow, review the possessions and work on the detail that failed.
Tonight, stop using the replay to punish yourself.`,
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

You won. Maybe it was your goal, a big save, or the shift that changed the
game. Enjoy it. Winning is a good gift, and gratitude does not require you
to act less excited.

Notice what made the night possible: the work you put in, the pass before
the goal, the teammate who covered for you, the people who helped you get
here.

### What's true

James says every good gift comes from a Father who does not change. Your
ability to play, the teammates beside you, and the joy of this night are
gifts. The final score is not proof that God favored you over the other
team or payment for having enough faith.

Your work mattered. Your teammates mattered. God's grace does not erase
either one. It keeps you from acting as though you did it alone.

> Enjoy the win without asking it to prove you are enough.

Thank God plainly. Then thank a teammate for something specific. If a
player beside you had a hard night, make room for that too. Tomorrow, go
back to work without assuming this result guarantees the next one.`,
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

You won. Maybe you hit a late three, finished through contact, or made the
stop that closed the game. Enjoy it. You do not need to downplay a good
night to prove you are humble.

Pay attention to what helped: the extra work, the screen that freed you,
the teammate who made the next pass, the talk on defense.

### What's true

James says every good gift comes from a Father who does not change. Your
ability to compete, your teammates, and the joy of the night are gifts.
The final score is not proof that God chose your side or rewarded your
faith.

Your preparation mattered, and grace gives you no reason to become lazy.
It also gives you no reason to make the result your proof of worth.

> Receive the win as a gift, not as proof that you have arrived.

Thank God. Thank the teammate whose work may not show in the box score.
Notice if someone on the ride home is carrying a rough night. Then return
to practice ready to work, because this win does not guarantee the next.`,
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
// CLINICAL_SIGN_OFF_REQUIRED: this module (and its sibling-sport mirrors)
// reaches a minor at a night-time, post-loss low point. It must NOT roll out
// to a broad athlete base before the pending clinical-advisor sign-off
// (CLAUDE.md Open Items; tracked in FV-296). grep CLINICAL_SIGN_OFF_REQUIRED
// for all such modules.
const HOCKEY_PRAISE: PostgameModule = {
  slug: "hockey-praise-anyway",
  sport: "hockey",
  scenario: "praise",
  title: "Praise Anyway",
  scriptureRef: "Habakkuk 3:17-18",
  scriptureText:
    "Though the fig tree does not bud and there are no grapes on the vines, though the olive crop fails and the fields produce no food, though there are no sheep in the pen and no cattle in the stalls, yet I will rejoice in the Lord, I will be joyful in God my Savior.",
  bodyMd: `### What happened

The win never came. Your gear is still wet, the ride is quiet, and the
loss feels heavy. You do not have to call the night good. It was not the
result you wanted.

### What's true

Habakkuk had lost the visible signs that life was going well, but he had
not lost God Himself. His praise did not deny the loss or bargain for a
better outcome. It named God as good when the circumstances were not.

> Praise is not pretending the loss did not matter.

God's control is not a reason to shrug. It is the reason you can grieve,
own your part, and keep trusting Him without demanding that He explain the
score. Nothing changes on the scoreboard when you pray. Prayer is not a
way to force the next game to go differently.

Your prayer can be small and honest: *God, this hurts. Show me what is
mine to learn. Thank You that Christ has not let go of me.* You do not
have to feel resolved tonight. That is enough to begin.`,
};

// ---------------------------------------------------------------------------
// Module 2e — Basketball · The Hard Night / Praise Anyway (same trio cycle as
// 1e; basketball-expert texture — gym bag heavier / lot clearing / the score
// still behind your eyes; "the floor" not "the court").
// ---------------------------------------------------------------------------
// CLINICAL_SIGN_OFF_REQUIRED: this module (and its sibling-sport mirrors)
// reaches a minor at a night-time, post-loss low point. It must NOT roll out
// to a broad athlete base before the pending clinical-advisor sign-off
// (CLAUDE.md Open Items; tracked in FV-296). grep CLINICAL_SIGN_OFF_REQUIRED
// for all such modules.
const BASKETBALL_PRAISE: PostgameModule = {
  slug: "basketball-praise-anyway",
  sport: "basketball",
  scenario: "praise",
  title: "Praise Anyway",
  scriptureRef: "Habakkuk 3:17-18",
  scriptureText:
    "Though the fig tree does not bud and there are no grapes on the vines, though the olive crop fails and the fields produce no food, though there are no sheep in the pen and no cattle in the stalls, yet I will rejoice in the Lord, I will be joyful in God my Savior.",
  bodyMd: `### What happened

The win never came. The parking lot is clearing, and the score keeps
running through your head. Let the disappointment be honest. Praise does
not require you to pretend the night went well.

### What's true

Habakkuk praised when every visible source of security had failed. He did
not praise the loss. He trusted God in it.

> Trusting God does not mean becoming indifferent to the result.

God's sovereignty frees you to face the loss, your own play, and the work
ahead. It does not excuse poor preparation or make improvement optional.
Nothing on the scoreboard changes because you pray, and prayer is not a
deal for a win next time.

You can pray: *God, I wanted that game. Show me what I need to own and
change. Thank You that Your love for me rests on Christ, not my stat line.*
You can still feel disappointed when the prayer is over.`,
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

You won. Maybe you closed the match, posted your best score, or finally
made the lineup. Enjoy it. A good round is worth enjoying.

Name what helped: the work you put in, the smart decision after a miss,
the up-and-down that saved the round, the people who supported you.

### What's true

James says every good gift comes from a Father who does not change. Your
ability to play, the people who helped you, and the joy of a good round are
gifts. God did not reward your faith with a lower score. Your preparation
still mattered.

Receive it without using it to prove that you are finally good enough.
Your standing with God rested on Christ before the first tee and still
rests there after the last putt.

> Enjoy the score without asking it to justify you.

Thank God, and thank the people who helped you prepare. Record what worked
while it is fresh. Then return to practice knowing this round was real but
does not guarantee the next one.`,
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

The round did not come together. The clubs are in the trunk, and you still
see the number: the back nine that got away or the cut you missed by one.
Do not call it good, and do not act like it did not matter.

### What's true

Habakkuk had lost the visible signs that life was going well, yet he still
called God his Savior. He did not praise the empty fields. He trusted God
when the fields were empty.

> Praise does not erase the card or purchase a better one.

God's sovereignty does not make the work optional. It frees you to admit
where your decisions, preparation, or response failed without treating the
score as a verdict on your life. Prayer will not change today's card, and
it is not leverage for tomorrow's score.

You can pray honestly: *God, I am disappointed. Show me what to learn and
help me return to the work. Thank You that my standing with You rests on
Christ, not this number.* You do not have to make yourself feel better
before you finish the prayer.`,
};

// ---------------------------------------------------------------------------
// Module — Football · After the Win (FV-431; KC-authored final copy, 2026-07-20
// postgame review bundle — the content source of truth for this const)
// ---------------------------------------------------------------------------
const FOOTBALL_WIN: PostgameModule = {
  slug: "football-after-the-win",
  sport: "football",
  scenario: "win",
  title: "After the Win",
  scriptureRef: "James 1:17",
  scriptureText:
    "Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.",
  bodyMd: `### What happened

You won. Maybe you got the game ball, led the fourth-quarter drive, or
made the stop that ended it. Enjoy the night. Winning is good, and humility
does not require you to act unimpressed.

Notice what made the result possible: the week of preparation, the block
that opened the run, the teammate who handled his assignment, the coach or
family member who helped you get here.

### What's true

James says every good gift comes from a Father who does not change. Your
ability to compete, your teammates, and the joy of the night are gifts.
The final score is not evidence that God favored your team or rewarded you
for having more faith.

Your preparation mattered. Grace is not an excuse to work less. It is what
keeps hard work from becoming self-worship when the result goes your way.

> Enjoy the win. Give thanks. Stay teachable.

Thank God on more than winning nights. Thank a teammate
for a specific play. Check on the player whose night did not feel like a
victory. Then return to work without assuming this score promises another.`,
};

// ---------------------------------------------------------------------------
// Module — Football · After the Loss (FV-431; KC-authored final copy, 2026-07-20
// postgame review bundle — the content source of truth for this const)
// ---------------------------------------------------------------------------
const FOOTBALL_LOSS: PostgameModule = {
  slug: "football-the-loss",
  sport: "football",
  scenario: "loss",
  title: "After the Loss",
  scriptureRef: "Psalm 34:18",
  scriptureText:
    "The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
  bodyMd: `### What happened

You lost. The locker room went quiet, the pads came off slowly, and now
the score keeps running through your head.

Do not use "God is in control" to shrug at the result. You wanted to win.
You prepared for it. The loss matters, and you can be disappointed.

### What's true

Psalm 34 says God is close to the brokenhearted. His sovereignty gives you
somewhere to take the pain; it does not make the pain unreal or the work
irrelevant.

Ask what belongs to you. Did you know the assignment? Did you communicate?
Did you finish when the game turned? Own those answers. Do not take
responsibility for every bounce, call, or teammate's decision.

> Face the score honestly. Take responsibility without taking condemnation.

Your standing with God rests on what Christ has done, not what you did in
four quarters. Tomorrow, watch the film and take one correction into the
next practice. Tonight, let the loss hurt without making it your identity.`,
};

// ---------------------------------------------------------------------------
// Module — Football · Glued to the Bench (FV-431; KC-authored final copy, 2026-07-20
// postgame review bundle — the content source of truth for this const)
// ---------------------------------------------------------------------------
const FOOTBALL_BENCHING: PostgameModule = {
  slug: "football-glued-to-the-bench",
  sport: "football",
  scenario: "benching",
  title: "Glued to the Bench",
  scriptureRef: "Psalm 139:1-3",
  scriptureText:
    "You have searched me, Lord, and you know me. You know when I sit and when I rise; you perceive my thoughts from afar. You discern my going out and my lying down; you are familiar with all my ways.",
  bodyMd: `### What happened

The depth chart went up and your name moved down. Snap after snap, someone
else took the reps you wanted. It hurts to stand ready and never hear your
number. Do not pretend the role is fine with you.

### What's true

Right now, the coach is not trusting you with the snaps you want. Begin
with the situation as it is, not the one you think you deserve. Psalm 139
says God knows you completely. Your identity in Christ gives you the
freedom to face the depth chart without letting it define you.

> You do not control how many reps you get. You control how you use them.

Tomorrow, ask the coach what you need to show in practice, film study, or
your assignment. Be bold enough to hear the answer, then own what you can
change. If you get three reps, make them three prepared, physical,
assignment-sound reps. Communicate, help the starter, and stay ready. Paul
did not choose his confinement, but he refused to let it make him useless.
God may not give you the role you want. He can still make you faithful in
the role you have.`,
};

// ---------------------------------------------------------------------------
// Module — Football · The Bad Game (FV-431; KC-authored final copy, 2026-07-20
// postgame review bundle — the content source of truth for this const)
// ---------------------------------------------------------------------------
const FOOTBALL_BAD_GAME: PostgameModule = {
  slug: "football-the-bad-game",
  sport: "football",
  scenario: "bad-game",
  title: "The Bad Game",
  scriptureRef: "Lamentations 3:22-23",
  scriptureText:
    "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
  bodyMd: `### What happened

You had a bad game. Maybe you dropped the third-down ball, blew an
assignment, or let a receiver get behind you. It will be on Hudl, and you
already know the clip you do not want to watch.

Do not soften the play, and do not turn it into a statement about your
whole life. Start with what actually happened.

### What's true

Maybe your mistake cost the team. If it did, own it. Apologize where that
is needed. Then refuse the label *I am a liability.* A missed assignment
gives you something specific to correct. A label only tells you to feel
worse.

Lamentations says God's compassion is new every morning. That mercy does
not guarantee a better game next week. It means you can watch the film
without hiding, because Christ has already borne your condemnation.

> Own the snap. Repair what you can. Learn the correction.

Tomorrow, sit with the coach, name what you saw, and take the detail back
to practice. Tonight, stop replaying the clip as a way to pay for it.`,
};

// ---------------------------------------------------------------------------
// Module — Football · Praise Anyway (FV-431; KC-authored final copy, 2026-07-20
// postgame review bundle — the content source of truth for this const)
//
// CLINICAL_SIGN_OFF_REQUIRED: this module (and its hockey/basketball/golf
// mirrors) reaches a minor at a night-time, post-loss low point. It must NOT
// roll out to a broad athlete base before the pending clinical-advisor
// sign-off (CLAUDE.md Open Items; tracked in FV-296). The content names the
// ache, permits it, and never forces a bypass — but the clinical gate is a
// standing requirement, not satisfied by this code.
// ---------------------------------------------------------------------------
const FOOTBALL_PRAISE: PostgameModule = {
  slug: "football-praise-anyway",
  sport: "football",
  scenario: "praise",
  title: "Praise Anyway",
  scriptureRef: "Habakkuk 3:17-18",
  scriptureText:
    "Though the fig tree does not bud and there are no grapes on the vines, though the olive crop fails and the fields produce no food, though there are no sheep in the pen and no cattle in the stalls, yet I will rejoice in the Lord, I will be joyful in God my Savior.",
  bodyMd: `### What happened

The win never came. The pads are packed, the bus is dark, and the score is
still in your head. You wanted a different ending. Do not rush past that
or call the loss good.

### What's true

Habakkuk had lost every visible sign that life was going well, yet he still
called God his Savior. He did not praise the empty fields. He trusted God
in the middle of them.

> Faith in God's control is not indifference to the result.

God's sovereignty frees you to grieve, examine your own play, and return
to the work. It does not excuse missed preparation or remove the need to
repair a mistake. Prayer does not change the final score, and it is not a
trade for a better result next week.

Your prayer can be direct: *God, this hurts. Show me what is mine to own
and help me do the work. Thank You that my standing with You rests on
Christ, not tonight's score.* You can finish that prayer and still feel the
loss.`,
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
  GOLF_BAD_GAME,
  GOLF_PRAISE,
  FOOTBALL_WIN,
  FOOTBALL_LOSS,
  FOOTBALL_BENCHING,
  FOOTBALL_BAD_GAME,
  FOOTBALL_PRAISE,
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
