-- =============================================================================
-- Migration: 20260523120000_seed_training_sessions_days_1_10.sql
--
-- Purpose:
--   Seed the first 10 days of the From Victory Core Identity Track into
--   public.training_sessions_catalog (created in 20260522000749_content_schema).
--
-- Content arc:
--   Days 1-5  — "Identity and security in Christ" (block 1)
--   Days 6-10 — "Receiving grace" (block 2)
--
--   Each day is a Core Track session with the 5-element structure from
--   docs/brand.md and .claude/agents/content-curator.md: opening truth,
--   scripture foundation, universal-athlete application, simple
--   single-move practical reset, landing line. ≤300 words for
--   MENTAL_SKILL_MD body.
--
-- Authoring:
--   Co-authored under content-curator orchestration with co-authors
--   sports-psychologist and youth-pastor. Reviewed by KC across multiple
--   sessions. Each day uses a distinct primary scripture and a distinct
--   single-move reset. NIV translations throughout.
--
-- Idempotency:
--   ON CONFLICT (day_number, sport) DO NOTHING — re-running the migration
--   is safe. Future content edits should ship as their own UPDATE
--   migrations rather than re-running this seed.
--
-- Privacy model (for kids-privacy-officer):
--   - training_sessions_catalog is shared, athlete-readable content
--     (RLS: all authenticated users can SELECT; service-role only writes).
--   - No PII in this table; only authored content.
--   - Journal prompts are read by athletes and seed the private journal
--     entry (PR-09 will wire that). Each prompt is single-question,
--     answerable in 3-5 sentences by a 15-year-old, and never asks the
--     athlete to write anything they would feel awkward writing privately.
--   - No content here pathologizes normal sports stress. The single
--     failure-touching day (Day 9) holds a careful dual register —
--     athletic miss vs. moral failure — without conflating the two.
-- =============================================================================

insert into public.training_sessions_catalog
  (day_number, sport, title, mental_skill_md, scripture_ref, scripture_text, journal_prompt)
values

-- ---------------------------------------------------------------------------
-- Day 1 — "Identity and security in Christ" block
-- ---------------------------------------------------------------------------
(
  1,
  'hockey',
  'From Victory, Not Toward It',
  $session$A bad day should tell you what happened. It should not tell you who you are.

Paul wrote Romans 8:37 to believers in Rome facing real loss — trouble, hardship, persecution, danger, sword. "More than conquerors" is the line he reaches for in the middle of suffering, not after a winning streak. The verse does not mean Christians never lose. It means loss does not get the final word. Nothing on that list — nothing — can separate you from the love of God in Christ.

Every serious athlete knows the voice that takes one mistake and turns it into a verdict. The missed shot becomes "I'm not a real player." The benched practice becomes "Coach doesn't see me anymore." The lost game becomes "I let everyone down." That voice is fast, and it sounds like the truth. Most of the time it isn't.

When it starts, say it back in two sentences:

*That is what happened. That is not who I am.*

The performance is on tape. The verdict isn't real. Take a breath. Look at the next play.

The world says: perform, then belong. The gospel says: in Christ you already belong, and effort flows from there. The worst game you play does not lower your standing with God. The best game you play does not raise it.

You don't compete tonight to earn an identity. You compete from one.$session$,
  'Romans 8:37',
  'No, in all these things we are more than conquerors through him who loved us.',
  $prompt$When did a single mistake or setback last start rewriting how you see yourself — and what changes if you read it back through "more than conquerors through him who loved us"?$prompt$
),

-- ---------------------------------------------------------------------------
-- Day 2
-- ---------------------------------------------------------------------------
(
  2,
  'hockey',
  'You Were Chosen Before Tryouts',
  $session$Identity is received, not achieved.

Ephesians 1 opens with Paul piling clause on clause to praise the lavishness of God's grace. Verses 4-5 sit inside that doxology. The chronology is the point: God chose his people "before the creation of the world" — before they existed to perform, fail, impress, or disappoint. Verse 5 names the reason: love, and the Father's pleasure. Not evaluation. Not tape.

Every serious athlete has voices they let do the naming — a coach who hasn't said your name in three weeks, a scout who closed the notebook, a ranking on a website. Their evaluations are information; they are not the verdict on who you are.

A team picks based on what you can already do. Adoption runs the opposite direction: it was given before you had done anything, because of the Father's love, not because of an eye test.

When you notice you've been letting a voice name you, take it back in one line:

*That voice has information. It does not have jurisdiction.*

A coach can change your role. A scout can close the notebook. None of it moves the Father.

No one moved you into the family based on your tape. No one can move you out of it the same way.$session$,
  'Ephesians 1:4-5',
  'For he chose us in him before the creation of the world to be holy and blameless in his sight. In love he predestined us to be adopted to sonship through Jesus Christ, in accordance with his pleasure and will.',
  $prompt$Whose voice have you been letting name you lately — and what changes if you read that voice through "chosen before the creation of the world"?$prompt$
),

-- ---------------------------------------------------------------------------
-- Day 3
-- ---------------------------------------------------------------------------
(
  3,
  'hockey',
  'The Best Game Doesn''t Crown You',
  $session$A great night is a gift to carry. It is not a crown to put on your own head.

Paul is writing to a church that had turned faith into a ranking system — who followed which teacher, who had the better gift, who was further along. By chapter 4, he's done with it. He turns three questions on the whole room: *Who makes you different? What do you have that you did not receive? Why boast as if you didn't?* He isn't trying to shrink anyone. He's pulling a false floor out from under them so they can stand on a real one. Every gift you actually have — your hands, your vision, your lungs, the night your shot was finally on — came to you. None of it was self-made. So none of it can do the work of crowning you.

This is the quiet trap on the ride home after a great game. The brain takes a big night and tries to make it the new floor: *this is who I am now.* It feels like confidence. It's actually a new dependency, and it hands tomorrow's game power over who you are.

**Tonight, try one move. Receive and name.**

Before you put your phone down, say one line in your head:

> *I'll take the win. It's a gift, not my standing.*

Enjoy the night. Read the texts. Watch the clip. The line just keeps the result from taking over — so tomorrow you compete against an opponent, not against your own identity.

A bad night can't lower your standing because it was never yours to lose. A great night can't raise it because it was never yours to earn. Open hands, both ways.$session$,
  '1 Corinthians 4:7',
  'For who makes you different from anyone else? What do you have that you did not receive? And if you did receive it, why do you boast as though you did not?',
  $prompt$Which part of tonight are you tempted to make into your identity — and what would it look like to receive it as a gift instead?$prompt$
),

-- ---------------------------------------------------------------------------
-- Day 4
-- ---------------------------------------------------------------------------
(
  4,
  'hockey',
  'Trained in the Empty Rink',
  $session$Most of your training happens with no one watching. That isn't lesser work. That is the work that actually forms you.

Paul writes this to people whose effort would never be seen, credited, or rewarded by anyone above them. He doesn't tell them to grind harder for invisible recognition. He moves the question entirely. The work has always had an audience — and that audience was settled long before anyone on earth started keeping score. Scouts and stat sheets did not assign your worth. They cannot grade what your training is for.

So when the door closes and the room goes quiet, a quiet drift starts: *does this rep even count if no one sees it?* That question sounds like motivation. It's actually about location. If the answer slides toward "not really," the work has quietly become an audition. You aren't training anymore — you're performing for an imagined room.

**The reset.** Before you start the rep, say it once, in your head:

> ***This rep already counts.***

Not as pressure. As release. The line names what was always true and pulls the work off the imagined room — the coach, the highlight, the version of you that needs proof. Two seconds. Then start.

The unseen rep is where competing *from* victory gets built. The lights and the locker room talk only show what was already formed in the quiet.

Hidden work isn't preparation for the day you finally matter. The standing came first. The work is what flows from it.$session$,
  'Colossians 3:23-24',
  'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters, since you know that you will receive an inheritance from the Lord as a reward. It is the Lord Christ you are serving.',
  $prompt$When you train with no one watching, who do you catch yourself trying to convince — and what changes if that audience was already settled?$prompt$
),

-- ---------------------------------------------------------------------------
-- Day 5 — block 1 close (Identity)
-- ---------------------------------------------------------------------------
(
  5,
  'hockey',
  'Step Off the Ranking Table',
  $session$Comparison is not measuring you. It is auditioning a verdict on who you are, using someone else's tape.

It runs in every direction at once — up at the player ahead of you, sideways at your linemate, down at the one chasing your spot. The brain will keep generating the question. You decide whether to render the verdict.

Look at how Jesus answers Peter. They are sitting on a beach after breakfast. Jesus has just walked Peter — the disciple who denied him three times — through a quiet restoration and told him plainly what following will one day cost him. Peter turns, sees John behind them, and asks, "Lord, what about him?" Jesus does not soften it. *"If I want him to remain alive until I return, what is that to you? You must follow me."* He will not grant the ranking question the dignity of an answer, because he has already settled what it was trying to decide.

You have been named, restored, and called in Christ. The player above you cannot add to that. The player chasing you cannot subtract from it. Ranking yourself in any direction is asking a question Jesus has already refused.

So when the scroll starts — the tournament clip, the commit post, the list — try this:

Catch the question. Say it once: *That tape is not my verdict.* Lock the phone. Bring your eyes back to the rep, the page, the room you are actually in.

You are not on the ranking table. You never were. You are following.$session$,
  'John 21:21-22',
  'When Peter saw him, he asked, "Lord, what about him?" Jesus answered, "If I want him to remain alive until I return, what is that to you? You must follow me."',
  $prompt$Whose tape have you been quietly using to grade yourself this week, and what would it look like to set that ranking question down?$prompt$
),

-- ---------------------------------------------------------------------------
-- Day 6 — "Receiving grace" block opens
-- ---------------------------------------------------------------------------
(
  6,
  'hockey',
  'Tuesday Is Holy Ground',
  $session$The God who meets you under the lights also meets you in the empty weight room. Same God. Same gaze. Same delight.

Zechariah was speaking to people rebuilding after exile. Their foundation was small — nothing like what they remembered, nothing worth filming. And the prophet's word to them wasn't *don't worry, it'll grow into something impressive.* It was something quieter and better: the eyes of the Lord that range throughout the whole earth rejoice when they land here. On this. On the small thing.

Sit with that. The gaze that nothing escapes is already delighting in your Tuesday.

The warmup lap. The stretch you almost skipped. The stickhandling no one filmed. The first stride out of the corner on a drill you've done a thousand times. These are not the throwaway hours of your athletic life. They are your athletic life. Most of who you become gets built here, not on game night.

So try this today. Pick one ordinary moment — lacing up, the first rep, the walk to the rink — and land your attention there with one sentence:

*This counts. I'm here.*

Then do the thing. Not for an audience. Not to make the moment feel bigger than it is. Just present, in a moment God is already present in.

There is no off-camera with Him. The Tuesday is holy ground.

Carry: His eyes are already here. So am I.$session$,
  'Zechariah 4:10',
  'Who dares despise the day of small things, since the seven eyes of the Lord that range throughout the earth will rejoice when they see the chosen capstone in the hand of Zerubbabel?',
  $prompt$Name one ordinary moment in your day today — something small enough you'd normally drift through. What would it look like to be fully there, knowing God already is?$prompt$
),

-- ---------------------------------------------------------------------------
-- Day 7
-- ---------------------------------------------------------------------------
(
  7,
  'hockey',
  'Come, Don''t Earn',
  $session$Rest is not something you earn. It's something you receive.

Hear who this invitation is addressed to. Not the strong. Not the proven. Not the athletes who put up the numbers this week and now get a reward. The weary. The burdened. Weariness is not what disqualifies you from this rest — it's what qualifies you for it. And the yoke image is sharper than it sounds: Christ is not adding to your load. He is lifting the crushing yoke off your shoulders and handing you one shaped to fit. Stop carrying what was never yours to carry.

You know the off day. The one where you keep opening film "just to check something." The nap you cut short because lying there feels like quitting. The extra reps after a hard practice — not strategic ones, guilt ones. The loop says rest means someone else is pulling ahead of you. That voice has it backward. Because your identity is already secure in Christ, rest stops being a negotiation and starts being a gift.

**The practice.** At one rest moment today — the scheduled off day, a nap, an evening with no training — say one sentence, out loud or in your head:

*"I'm not behind. I'm being restored."*

One line. Let it interrupt the loop.

This is the From Victory shape: you are not competing to earn rest, approval, or worth. You are already loved. So you can stop. You can receive. You can come without earning your way in.$session$,
  'Matthew 11:28-30',
  'Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls. For my yoke is easy and my burden is light.',
  $prompt$Where is the guilt loudest when you try to rest — and what would change if you believed rest was already yours?$prompt$
),

-- ---------------------------------------------------------------------------
-- Day 8
-- ---------------------------------------------------------------------------
(
  8,
  'hockey',
  'Fully Known, Fully Held',
  $session$You carry two versions of yourself most days. The polished one you show coaches and post online. The harsh one that runs you down at 11pm. Neither is the real you. The real you lives somewhere in between, and most days you barely see it.

David wrote Psalm 139 as a man who had been examined. Sitting, rising, thinking, going, lying down — every honest corner. And the astonishing thing is what he found there: not surveillance, but safety. To be known and not loved is our deepest fear. To be loved and not known is the loneliness most people live with. To be fully known and fully held — that is the gospel. The One who already won the victory sees the actual you, not the highlight reel and not the worst tape, and holds you there.

So you can stop performing for yourself. Try this today: pick one true sentence about your day. Not flattering. Not condemning. Just accurate. "I was anxious before the meeting." "I worked the warmup hard." "I checked out in the third." One sentence, no editorial. You're not fixing it. You're just letting it be seen.

This is what training from victory actually looks like — not pretending you're better than you are, not punishing yourself for being worse. Honest, because honesty is safe here. You were already searched. You were already held.

One true sentence. That's the move.$session$,
  'Psalm 139:1-3',
  'You have searched me, Lord, and you know me. You know when I sit and when I rise; you perceive my thoughts from afar. You discern my going out and my lying down; you are familiar with all my ways.',
  $prompt$What's one sentence about today that's neither flattering nor condemning — just true?$prompt$
),

-- ---------------------------------------------------------------------------
-- Day 9 — single failure-touching day, placed late in block 2
-- ---------------------------------------------------------------------------
(
  9,
  'hockey',
  'Grace Meets the Mistake',
  $session$Two things sit side by side today, and they don't collapse into each other.

One is the in-game miss. The blown coverage, the bad change, the puck you should have moved a half-second sooner. After a miss, the mind reaches for one of two dodges: shrink it ("not a big deal") or swell it ("I'm trash"). Both feel like honesty. Neither is. Clean naming loosens the grip — eyes open, no spin, no sentence longer than it needs to be.

The other is the heavier thing. The lie you told. The cruelty you let fly in the room. The thing you cut a corner on when no one was watching. John writes to people pulling toward two errors — pretending they have no sin, or sinking under the weight of the ones they've got — and he cuts straight down the middle. Sin is real. So is the grace that meets it. Both, at the same time. Forgiveness rests on God being faithful and just, not on you finding the right words or feeling sorrow deeply enough to qualify. You bring the actual thing into the light — not the cleaned-up version — and you are met.

These are different problems with the same posture underneath: don't hide. Christ's victory covers what you've actually done, not the edited highlight. So on the bench, after the miss, you don't need to earn your way back to ready.

Next mistake today, one sentence inside your head:

**"That happened. Next."**

Two beats. Don't argue with it. Don't soften it. Eyes back on the play.$session$,
  '1 John 1:9',
  'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.',
  $prompt$Where today are you holding the cleaned-up version instead of the actual thing — on the ice or off it — and what would it look like to bring the real one into the light?$prompt$
),

-- ---------------------------------------------------------------------------
-- Day 10 — block 2 close (Receiving grace), bridges into Days 11-15 (Courage)
-- ---------------------------------------------------------------------------
(
  10,
  'hockey',
  'Sent Out From Delight',
  $session$In the car on the way to the rink. Or the room before warmups. Your internal monologue is running, and you haven't noticed what it sounds like.

Listen to it. If it sounds like a job interview — proving you belong, justifying your spot, earning the next shift — you're auditioning. Most athletes never hear the audition. They just feel tight on the ice and don't know why.

Zephaniah 3:17 doesn't drop out of a sentimental sky. It lands at the end of a hard book — pages of judgment first, then this. *"He will take great delight in you... he will rejoice over you with singing."* The delight is not naive. It is final. A God who has looked closely at the real problem, dealt with it in Christ, and on the other side of that — actually delights in you. Not your last shift. You.

Before your next training or game, say one sentence. Out loud in the car, or under your breath in the room: *"I'm not going in to earn this. I'm going in because I'm already here."* Once. Not a mantra to charge up on. An orientation you set down and leave alone. You're noticing where you already stand.

Tight competing comes from auditioning. Free competing comes from arriving. Same body, same skill, different posture. Grace is not a feeling you work up before puck drop. It's the ground under your skates before you ever stepped on.

You're not going in to be wanted. You're going in already wanted. Now go play.$session$,
  'Zephaniah 3:17',
  'The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.',
  $prompt$What does your pre-game internal monologue actually sound like when no one is listening — and what would change if you believed you were already delighted in before you stepped on the ice?$prompt$
)

on conflict (day_number, sport) do nothing;
