-- =============================================================================
-- Migration: 20260604120000_recut_training_sessions_days_1_10.sql
--
-- Purpose (FV-23 — "Reduce reading load in the daily training session"):
--   Re-cut the body (mental_skill_md) of the 10 already-seeded Core Identity
--   Track days to the LIGHTER, SCANNABLE format KC locked after beta feedback
--   that the daily content was "too much reading." Days 1-10 previously ran
--   ~280-320 words each (5-7 phone screens of scroll); they now run ≤190 words
--   (~1.5 scrolls) AND carry a consistent section-header rhythm so the athlete
--   can scan rather than read straight through.
--
-- Section headers (the scannability win):
--   A fixed 3-header rhythm — "### The truth" / "### What you face" /
--   "### The reset" — runs across the days so the athlete learns where each
--   move lives (and always knows the reset is coming). Two days run only two
--   headers on purpose: Day 8 (one braided movement) and Day 9 (a deliberately
--   parallel dual register a middle header would fracture).
--
-- What changed / what did NOT:
--   - CHANGED: mental_skill_md only — tighter prose, one example instead of
--     stacked examples, the single-move reset set off under "### The reset",
--     and the new section headers. The verse stays IN the card (no
--     progressive-disclosure fold; that render concern is deferred to the
--     daily-training UI build). Days 5 and 10 were reordered (not rewritten)
--     so the scripture sits under "### The truth".
--   - UNCHANGED: title, scripture_ref, scripture_text, journal_prompt.
--     Each day keeps its distinct scripture and distinct reset; protected
--     brand-anchor lines preserved (Day 1's "worst game / best game" standing
--     line restored within budget). Day 9's dual register (athletic miss vs.
--     moral failure) and privacy-safe handling preserved.
--
-- Authoring:
--   Re-cut + headered under content-curator orchestration to the FV-23-locked
--   format (target 140-170w, hard ceiling 190w including headers). Reviewed by
--   KC (Tier-2, athlete-facing voice). The new format is now the ceiling for
--   FV-9 (days 11-30).
--
-- Idempotency:
--   Pure UPDATEs keyed on (day_number, sport) — naturally idempotent and
--   safe to re-run. Per the seed migration's own note, content edits ship as
--   their own UPDATE migration rather than re-running the seed. updated_at is
--   refreshed automatically by the training_sessions_catalog_set_updated_at
--   trigger. If a (day_number, sport) row does not exist, the UPDATE affects
--   zero rows and the migration still succeeds.
--
-- Privacy model (for kids-privacy-officer):
--   - training_sessions_catalog is shared, athlete-readable authored content
--     (RLS: all authenticated users SELECT; service-role only writes).
--   - No PII. Only authored content changes here.
--   - Journal prompts are unchanged. Bodies remain free of anything that
--     pathologizes normal sports stress; Day 9 keeps the careful dual
--     register and never asks the athlete to disclose anything to anyone.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Day 1 — "From Victory, Not Toward It" (Romans 8:37)
-- ---------------------------------------------------------------------------
update public.training_sessions_catalog
   set mental_skill_md = $session$### The truth

A bad day should tell you what happened. It should not tell you who you are.

Paul wrote "more than conquerors" to believers facing real loss — trouble, hardship, danger. Not after a winning streak. In the middle of suffering. It doesn't mean you never lose. It means loss never gets the final word, and nothing on that list can separate you from the love of God in Christ.

### What you face

Every serious athlete knows the voice that takes one mistake and turns it into a verdict. *I'm not a real player. Coach doesn't see me anymore.* It's fast, and it sounds like the truth. Most of the time it isn't.

### The reset

When it starts, say it back:

> *That is what happened. That is not who I am.*

The performance is on tape. The verdict isn't real. Breath. Next play.

The worst game you play does not lower your standing with God. The best game you play does not raise it. You don't compete to earn an identity. You compete from one.$session$
 where day_number = 1 and sport = 'hockey';

-- ---------------------------------------------------------------------------
-- Day 2 — "You Were Chosen Before Tryouts" (Ephesians 1:4-5)
-- ---------------------------------------------------------------------------
update public.training_sessions_catalog
   set mental_skill_md = $session$### The truth

Identity is received, not achieved.

Paul says God chose his people "before the creation of the world" — before they existed to perform, fail, or impress. The reason he gives is love, the Father's pleasure. Not evaluation. Not tape.

### What you face

Every serious athlete lets some voice do the naming — a coach who hasn't said your name in three weeks, a scout who closed the notebook, a ranking on a website. That's information. It isn't the verdict on who you are.

### The reset

When you catch a voice naming you, take it back in one line:

> *That voice has information. It does not have jurisdiction.*

A coach can change your role. A scout can close the notebook. None of it moves the Father.

A team picks you for what you can already do. You were chosen before you'd done anything. No one moved you in by your tape, and no one can move you out the same way.$session$
 where day_number = 2 and sport = 'hockey';

-- ---------------------------------------------------------------------------
-- Day 3 — "The Best Game Doesn't Crown You" (1 Corinthians 4:7)
-- ---------------------------------------------------------------------------
update public.training_sessions_catalog
   set mental_skill_md = $session$### The truth

A great night is a gift to carry. It is not a crown to put on your own head.

Paul is writing to a church that turned faith into a ranking system. So he asks them: *What do you have that you did not receive?* Every gift you actually have — your hands, your vision, the night your shot was finally on — came to you. None of it was self-made. So none of it can crown you.

### What you face

This is the quiet trap on the ride home after a great game. The mind takes a big night and makes it the new floor: *this is who I am now.* It feels like confidence. It's a new dependency, and it hands tomorrow's game power over who you are.

### The reset

Before you put the phone down tonight, say one line:

> *I'll take the win. It's a gift, not my standing.*

A bad night can't lower your standing — it was never yours to lose. A great night can't raise it. Open hands, both ways.$session$
 where day_number = 3 and sport = 'hockey';

-- ---------------------------------------------------------------------------
-- Day 4 — "Trained in the Empty Rink" (Colossians 3:23-24)
-- ---------------------------------------------------------------------------
update public.training_sessions_catalog
   set mental_skill_md = $session$### The truth

Most of your training happens with no one watching. That isn't lesser work. That's the work that actually forms you.

Paul writes this to people whose effort would never be seen or rewarded by anyone above them. He doesn't tell them to grind harder for recognition. He moves the question: the work always had an audience, and that audience was settled long before anyone on earth started keeping score.

### What you face

So when the door closes and the room goes quiet, a drift starts: *does this rep even count if no one sees it?* That question sounds like motivation. It's really about location. Slide toward "not really," and the work has quietly become an audition.

### The reset

Before the rep, say it once:

> *This rep already counts.*

Not as pressure. As release. Two seconds, then start.

The unseen rep is where competing from victory gets built. Your standing came first. The work is what flows from it.$session$
 where day_number = 4 and sport = 'hockey';

-- ---------------------------------------------------------------------------
-- Day 5 — "Step Off the Ranking Table" (John 21:21-22)
-- ---------------------------------------------------------------------------
update public.training_sessions_catalog
   set mental_skill_md = $session$### The truth

Comparison isn't measuring you. It's auditioning a verdict on who you are, using someone else's tape.

Watch how Jesus handles it. Peter — just restored after denying him three times — sees John and asks, "Lord, what about him?" Jesus won't dignify it: *"What is that to you? You must follow me."* He's already settled what the ranking question was trying to decide.

### What you face

It runs every direction at once — up at the player ahead of you, sideways at your linemate, down at the one chasing your spot. Your brain will keep generating the question. You decide whether to answer it. You've been named, restored, and called in Christ. The player above you can't add to that. The one chasing you can't subtract from it.

### The reset

So when the scroll starts — the clip, the commit post, the list:

> *That tape is not my verdict.*

Then lock the phone. Eyes back on the room you're actually in. You're not on the ranking table. You're following.$session$
 where day_number = 5 and sport = 'hockey';

-- ---------------------------------------------------------------------------
-- Day 6 — "Tuesday Is Holy Ground" (Zechariah 4:10)
-- ---------------------------------------------------------------------------
update public.training_sessions_catalog
   set mental_skill_md = $session$### The truth

The God who meets you under the lights also meets you in the empty weight room. Same gaze. Same delight.

Zechariah spoke to people rebuilding after exile. Their foundation was small — nothing worth filming. His word to them wasn't *don't worry, it'll grow into something impressive.* It was quieter: the eyes of the Lord that range over the whole earth rejoice when they land here. On the small thing.

### What you face

The warmup lap. The stretch you almost skipped. The stickhandling no one filmed. These aren't the throwaway hours of your athletic life. They are your athletic life. Most of who you become gets built here, not on game night.

### The reset

So pick one ordinary moment today — lacing up, the first rep — and land there with one sentence:

> *This counts. I'm here.*

Then do the thing. Not for an audience. Just present, in a moment God is already present in.

There's no off-camera with Him. The Tuesday is holy ground.$session$
 where day_number = 6 and sport = 'hockey';

-- ---------------------------------------------------------------------------
-- Day 7 — "Come, Don't Earn" (Matthew 11:28-30)
-- ---------------------------------------------------------------------------
update public.training_sessions_catalog
   set mental_skill_md = $session$### The truth

Rest is not something you earn. It's something you receive.

Hear who this invitation is for. Not the strong. Not the proven. The weary. The burdened. Weariness isn't what disqualifies you from this rest — it's what qualifies you for it. And Christ isn't adding to your load. He's lifting the crushing yoke off your shoulders and handing you one shaped to fit.

### What you face

You know the off day. The film you open "just to check something." The nap you cut short because lying there feels like quitting. The guilt reps after a hard practice. The loop says rest means someone's pulling ahead. It has it backward.

### The reset

At one rest moment today — the off day, a nap, an evening with no training — say one sentence:

> *I'm not behind. I'm being restored.*

One line. Let it interrupt the loop.

You're not competing to earn rest, or worth, or a place. You already have one. So you can stop. You can come without earning your way in.$session$
 where day_number = 7 and sport = 'hockey';

-- ---------------------------------------------------------------------------
-- Day 8 — "Fully Known, Fully Held" (Psalm 139:1-3) — two-header day
-- ---------------------------------------------------------------------------
update public.training_sessions_catalog
   set mental_skill_md = $session$### The truth

You carry two versions of yourself most days. The polished one you show coaches and post online. The harsh one that runs you down at 11pm. Neither is the real you.

David wrote Psalm 139 as a man who'd been examined — sitting, rising, thinking, every honest corner. What he found there wasn't surveillance. It was safety. To be known and not loved is our deepest fear. To be loved and not known is the loneliness most people live in. To be fully known and fully held — that's the gospel. The One who already won sees the actual you, not the highlight reel, and holds you there.

### The reset

So you can stop performing for yourself. Pick one true sentence about your day. Not flattering. Not condemning. Just accurate: *I worked the warmup hard. I checked out in the third.* No editorial. You're not fixing it. You're letting it be seen.

That's training from victory — honest, because honesty is safe here. You were already searched. You were already held.$session$
 where day_number = 8 and sport = 'hockey';

-- ---------------------------------------------------------------------------
-- Day 9 — "Grace Meets the Mistake" (1 John 1:9) — two-header day; dual register
-- ---------------------------------------------------------------------------
update public.training_sessions_catalog
   set mental_skill_md = $session$### The truth

Two things sit side by side today, and they don't collapse into each other.

One is the in-game miss — the blown coverage, the bad change, the puck you should have moved sooner. After a miss, the mind reaches for one of two dodges: shrink it ("not a big deal") or swell it ("I'm trash"). Both feel like honesty. Neither is. Clean naming loosens the grip.

The other is heavier — the lie you told, the corner you cut when no one was watching. John writes to people pulling toward two errors: pretending they have no sin, or sinking under the ones they've got. He cuts down the middle. Sin is real. So is the grace that meets it. Forgiveness rests on God being faithful and just — not on you finding the right words. You bring the actual thing into the light, not the cleaned-up version, and you are met.

### The reset

Same posture under both: don't hide. So at the next mistake today, one sentence:

> *That happened. Next.*

Two beats. Don't argue with it. Eyes back on the play.$session$
 where day_number = 9 and sport = 'hockey';

-- ---------------------------------------------------------------------------
-- Day 10 — "Sent Out From Delight" (Zephaniah 3:17)
-- ---------------------------------------------------------------------------
update public.training_sessions_catalog
   set mental_skill_md = $session$### The truth

Zephaniah 3:17 doesn't drop from a sentimental sky. It lands at the end of a hard book — pages of judgment first, then this: *he will take great delight in you... he will rejoice over you with singing.* A God who looked closely at the real problem, dealt with it in Christ, and on the other side of that, delights in you. Not your last shift. You.

### What you face

In the car on the way to the rink. The room before warmups. Your internal monologue is running, and you haven't noticed what it sounds like. Listen. If it sounds like a job interview — proving you belong, justifying your spot, earning the next shift — you're auditioning. Most athletes never hear it. They just feel tight and don't know why.

### The reset

Before your next game, say one sentence under your breath:

> *I'm not going in to earn this. I'm going in because I'm already here.*

Free competing comes from arriving, not auditioning. You're not going in to be wanted. You're going in already wanted. Now go play.$session$
 where day_number = 10 and sport = 'hockey';
