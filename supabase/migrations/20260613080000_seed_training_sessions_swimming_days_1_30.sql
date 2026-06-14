-- =============================================================================
-- Migration: 20260613080000_seed_training_sessions_swimming_days_1_30.sql
--
-- Purpose (SWIMMING daily training content days 1-30 — v2, DORMANT):
--   Seed all 30 days of the From Victory Core Identity Track for swimming into
--   public.training_sessions_catalog, bringing the swimming content arc to
--   parity with hockey (20260523120000 + 20260605000000), basketball
--   (20260611130000), and golf (20260613030000). Swimming is a v2 sport;
--   this content ships DORMANT until the swimming track is selectable.
--
-- Content arc (mirrors hockey/basketball/golf, swimming-adapted):
--   01-05  Identity and security in Christ
--   06-10  Receiving grace
--   11-15  Courage / playing free
--   16-20  Discipline / hidden faithfulness
--   21-25  Pressure / fear / comparison / approval
--   26-30  Leadership / gratitude / perseverance / competing FROM victory
--   Day 30 lands on Hebrews 12:1-2 as the deliberate capstone.
--
-- Authoring:
--   mental_skill_md and journal_prompt authored by the content trio
--   (content-curator, sports-psychologist + youth-pastor; swimming-expert
--   verified). scripture_ref + scripture_text copied VERBATIM from the matching
--   basketball rows (same day_number) — these are sport-neutral and
--   youth-pastor-approved; no verse changed. title copied VERBATIM from
--   basketball except where a basketball-specific word required a minimal swap
--   (Day 4 "Trained in the Empty Gym" -> "Trained in the Empty Pool"). NIV
--   throughout.
--   Swimming-true swaps applied: a bad game -> a bad swim / a bad meet; a
--   missed shot -> a DQ / a blown turn / getting touched out; the bench ->
--   the heat sheet / not making the relay / sitting an event; coach yelling ->
--   the clock / the psych sheet's silence; "next possession/shift" -> "next
--   length / next race." The black line and the lonely middle, the clock as
--   the whole verdict, the heat sheet / psych sheet, the touch, the taper, 5am
--   doubles in the dark, the DQ that erases a swim, the plateau (held the same
--   time), getting touched out, and the ready room are the swimming-distinct
--   textures.
--
-- SWIMMING SAFETY RAILS (apply even in daily content):
--   - NO breath-hold / hypoxic / underwater-breath / no-breathing language
--     anywhere. Any breathing reference is dry-land calm-down only (deck, car,
--     ready room — never in the water).
--   - NO body-composition / weight / leanness / suit / food / appearance
--     language anywhere (swimming is RED-S-adjacent). Effort and craft only.
--   - No prosperity gospel / triumphalism / "streak broken" framing.
--   - Identity precedes performance: "the clock can report a swim; it cannot
--     name a swimmer."
--
-- Format (FV-23 locked):
--   Each mental_skill_md runs <=190 words with the standing scannable header
--   rhythm "### The truth" / "### What you face" / "### The reset", the
--   single-move reset set off as a > blockquote. Days 8 and 9 mirror the
--   basketball source's special structure (Day 8 braids one movement; Day 9
--   runs the dual register — athletic miss vs. moral failure).
--
-- Idempotency:
--   ON CONFLICT (day_number, sport) DO NOTHING — re-running is safe.
--   Future content edits ship as their own UPDATE migration.
--
-- Privacy model (for kids-privacy-officer):
--   - training_sessions_catalog is shared, athlete-readable authored content
--     (RLS: all authenticated users SELECT; service-role only writes).
--   - No PII. Only authored content. No new column / table / policy.
--   - journal_prompts are single-question, answerable privately, never ask the
--     athlete to disclose to anyone. (Journal display is descoped per FV-135;
--     the prompt column is seeded for schema/sibling-sport parity.)
--   - No content pathologizes normal sports stress. The failure-touching day
--     (Day 25) holds the loss (the swim that got away / the number on the
--     board) honestly, without shame and without promising outcome reversal.
--     Day 9 keeps the careful dual register and is privacy-safe.
-- =============================================================================

insert into public.training_sessions_catalog
  (day_number, sport, title, mental_skill_md, scripture_ref, scripture_text, journal_prompt)
values

-- ---------------------------------------------------------------------------
-- Days 1-5 — Identity and security in Christ
-- ---------------------------------------------------------------------------
(
  1,
  'swimming',
  'From Victory, Not Toward It',
  $session$### The truth

A bad swim should tell you what happened. It should not tell you who you are.

Paul wrote "more than conquerors" to believers facing real loss — trouble, hardship, danger. Not after a winning streak. In the middle of suffering. It doesn't mean you never miss a time. It means a slow swim never gets the final word, and nothing on that list can separate you from the love of God in Christ.

### What you face

Every serious swimmer knows the voice that takes one bad split and turns it into a verdict. *I'm not a real racer. I'm going to blow this whole meet.* It's fast, and it sounds like the truth. Most of the time it isn't.

### The reset

When it starts, say it back:

> *That is what happened. That is not who I am.*

The time is on the board. The verdict isn't real. Settle. Next length.

The worst swim you have does not lower your standing with God. The best swim you have does not raise it. You don't compete to earn an identity. You compete from one.$session$,
  'Romans 8:37',
  'No, in all these things we are more than conquerors through him who loved us.',
  $prompt$When did a single swim last try to tell you who you are, and what would it look like to answer it back?$prompt$
),
(
  2,
  'swimming',
  'You Were Chosen Before Tryouts',
  $session$### The truth

Identity is received, not achieved.

Paul says God chose his people "before the creation of the world" — before they existed to perform, fail, or impress. The reason he gives is love, the Father's pleasure. Not evaluation. Not a time standard.

### What you face

Every serious swimmer lets some voice do the naming — a coach who stopped writing your name on the relay, a recruiter who went quiet after a meet, a seed on the psych sheet. That's information. It isn't the verdict on who you are.

### The reset

When you catch a voice naming you, take it back in one line:

> *That voice has information. It does not have jurisdiction.*

A coach can change your lane. A recruiter can close the laptop. None of it moves the Father.

A program recruits you for the times you can already post. You were chosen before you'd posted anything. No cut earned your way in, and no clock can sign you out.$session$,
  'Ephesians 1:4-5',
  'For he chose us in him before the creation of the world to be holy and blameless in his sight. In love he predestined us to be adopted to sonship through Jesus Christ, in accordance with his pleasure and will.',
  $prompt$Which voice have you been letting name you lately, and what changes if you treat it as information instead of a verdict?$prompt$
),
(
  3,
  'swimming',
  'The Best Swim Doesn''t Crown You',
  $session$### The truth

A lifetime best is a gift to carry. It is not a crown to put on your own head.

Paul is writing to a church that turned faith into a ranking system. So he asks them: *What do you have that you did not receive?* Every gift you actually have — your feel for the water, your turns, the day the time finally dropped — came to you. None of it was self-made. So none of it can crown you.

### What you face

This is the quiet trap on the ride home after a best time. The mind takes one great swim and makes it the new floor: *this is who I am now.* It feels like confidence. It's a new dependency, and it hands tomorrow's heat power over who you are.

### The reset

Before you put the phone down tonight, say one line:

> *I'll take the swim. It's a gift, not my standing.*

A bad swim can't lower your standing — it was never yours to lose. A best time can't raise it. Open hands, both ways.$session$,
  '1 Corinthians 4:7',
  'For who makes you different from anyone else? What do you have that you did not receive? And if you did receive it, why do you boast as though you did not?',
  $prompt$After your best swim, what did you start telling yourself about who you are, and how does "gift, not standing" reframe it?$prompt$
),
(
  4,
  'swimming',
  'Trained in the Empty Pool',
  $session$### The truth

Most of your training happens with no one watching. That isn't lesser work. That's the work that actually forms you.

Paul writes this to people whose effort would never be seen or rewarded by anyone above them. He doesn't tell them to grind harder for recognition. He moves the question: the work always had an audience, and that audience was settled long before anyone on earth started keeping score.

### What you face

So in the lonely middle of a long set, eyes on the black line, no one timing this one, a drift starts: *does this length even count if no one sees it?* That question sounds like motivation. It's really about location. Slide toward "not really," and the work has quietly become an audition.

### The reset

Before the length, say it once:

> *This rep already counts.*

Not as pressure. As release. A beat, then push off.

The unseen length is where competing from victory gets built. Your standing came first. The work is what flows from it.$session$,
  'Colossians 3:23-24',
  'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters, since you know that you will receive an inheritance from the Lord as a reward. It is the Lord Christ you are serving.',
  $prompt$What does your effort in the empty pool become when you stop treating it as an audition?$prompt$
),
(
  5,
  'swimming',
  'Step Off the Ranking Table',
  $session$### The truth

Comparison isn't measuring you. It's auditioning a verdict on who you are, using someone else's time.

Watch how Jesus handles it. Peter — just restored after denying him three times — sees John and asks, "Lord, what about him?" Jesus won't dignify it: *"What is that to you? You must follow me."* He's already settled what the ranking question was trying to decide.

### What you face

It runs every direction at once — up at the swimmer seeded ahead of you, sideways at the one in the next lane with the same time, down at the one chasing your spot in the relay. Your brain will keep generating the question. You decide whether to answer it. You've been named, restored, and called in Christ. The swimmer above you can't add to that. The one chasing you can't subtract from it.

### The reset

So when the scroll starts — the posted time, the commit announcement, the rankings page:

> *That time is not my verdict.*

Then lock the phone. Eyes back on the pool you're actually in. You're not on the ranking table. You're following.$session$,
  'John 21:21-22',
  'When Peter saw him, he asked, "Lord, what about him?" Jesus answered, "If I want him to remain alive until I return, what is that to you? You must follow me."',
  $prompt$Which direction does comparison pull you hardest — up, sideways, or down — and what would it look like to step off that table today?$prompt$
),

-- ---------------------------------------------------------------------------
-- Days 6-10 — Receiving grace
-- ---------------------------------------------------------------------------
(
  6,
  'swimming',
  'Tuesday Is Holy Ground',
  $session$### The truth

The God who meets you behind the blocks at finals also meets you in the empty pool at 5am. Same gaze. Same delight.

Zechariah spoke to people rebuilding after exile. Their foundation was small — nothing worth posting. His word to them wasn't *don't worry, it'll grow into something impressive.* It was quieter: the eyes of the Lord that range over the whole earth rejoice when they land here. On the small thing.

### What you face

The warmup laps. The drill you almost mailed in. The morning doubles in the dark that no one was timing. These aren't the throwaway hours of your swimming life. They are your swimming life. Most of who you become gets built here, not on meet day.

### The reset

So pick one ordinary moment today — gripping the wall, the first push-off — and land there with one sentence:

> *This counts. I'm here.*

Then do the thing. Not for an audience. Just present, in a moment God is already present in.

There's no off-camera with Him. The Tuesday is holy ground.$session$,
  'Zechariah 4:10',
  'Who dares despise the day of small things, since the seven eyes of the Lord that range throughout the earth will rejoice when they see the chosen capstone in the hand of Zerubbabel?',
  $prompt$Which ordinary, unwatched part of your training have you been treating as filler, and what shifts when you call it holy ground?$prompt$
),
(
  7,
  'swimming',
  'Come, Don''t Earn',
  $session$### The truth

Rest is not something you earn. It's something you receive.

Hear who this invitation is for. Not the strong. Not the proven. The weary. The burdened. Weariness isn't what disqualifies you from this rest — it's what qualifies you for it. And Christ isn't adding to your load. He's lifting the crushing yoke off your shoulders and handing you one shaped to fit.

### What you face

You know the off day. The race you replay "just to check something." The nap you cut short because lying there feels like quitting. The guilt laps after a hard practice. The loop says rest means someone else is dropping time while you sit still. It has it backward.

### The reset

At one rest moment today — the off day, a nap, an evening with no pool — say one sentence:

> *I'm not behind. I'm being restored.*

One line. Let it interrupt the loop.

You're not competing to earn rest, or worth, or a place. You already have one. So you can stop. You can come without earning your way in.$session$,
  'Matthew 11:28-30',
  'Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls. For my yoke is easy and my burden is light.',
  $prompt$Where does rest still feel like falling behind, and what would it take to receive it as restoration instead?$prompt$
),
(
  8,
  'swimming',
  'Fully Known, Fully Held',
  $session$### The truth

You carry two versions of yourself most days. The polished one you show coaches and post online. The harsh one that runs you down at 11pm. Neither is the real you.

David wrote Psalm 139 as a man who'd been examined — sitting, rising, thinking, every honest corner. What he found there wasn't surveillance. It was safety. To be known and not loved is our deepest fear. To be loved and not known is the loneliness most people live in. To be fully known and fully held — that's the gospel. The One who already won sees the actual you, not the time you posted, and holds you there.

### The reset

So you can stop performing for yourself. Pick one true sentence about your swim. Not flattering. Not condemning. Just accurate: *I held my stroke count on the front half. I fell apart on the last 50.* No editorial. You're not fixing it. You're letting it be seen.

That's training from victory — honest, because honesty is safe here. You were already searched. You were already held.$session$,
  'Psalm 139:1-3',
  'You have searched me, Lord, and you know me. You know when I sit and when I rise; you perceive my thoughts from afar. You discern my going out and my lying down; you are familiar with all my ways.',
  $prompt$What is one accurate, un-edited sentence about today — not flattering, not condemning — that you can let simply be seen?$prompt$
),
(
  9,
  'swimming',
  'Grace Meets the Mistake',
  $session$### The truth

Two things sit side by side today, and they don't collapse into each other.

One is the in-race mistake — the blown turn, the early breakout, the start you left on the blocks. After a mistake, the mind reaches for one of two dodges: shrink it ("not a big deal") or swell it ("I'm trash"). Both feel like honesty. Neither is. Clean naming loosens the grip.

The other is heavier — the lie you told, the corner you cut when no one was watching. John writes to people pulling toward two errors: pretending they have no sin, or sinking under the ones they've got. He cuts down the middle. Sin is real. So is the grace that meets it. Forgiveness rests on God being faithful and just — not on you finding the right words. You bring the actual thing into the light, not the cleaned-up version, and you are met.

### The reset

Same posture under both: don't hide. So at the next mistake today, one sentence:

> *That happened. Next.*

Two beats. Don't argue with it. Eyes back on the length in front of you.$session$,
  '1 John 1:9',
  'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.',
  $prompt$Where have you been either shrinking or swelling a mistake instead of naming it cleanly, and what would honest naming sound like?$prompt$
),
(
  10,
  'swimming',
  'Sent Out From Delight',
  $session$### The truth

Zephaniah 3:17 doesn't drop from a sentimental sky. It lands at the end of a hard book — pages of judgment first, then this: *he will take great delight in you... he will rejoice over you with singing.* A God who looked closely at the real problem, dealt with it in Christ, and on the other side of that, delights in you. Not your last swim. You.

### What you face

In the car on the way to the pool. The ready room before your heat is called. Your internal monologue is running, and you haven't noticed what it sounds like. Listen. If it sounds like a job interview — proving you belong, justifying your lane, earning the next recruiting look — you're auditioning. Most swimmers never hear it. They just feel tight behind the blocks and don't know why.

### The reset

Before your next race, on the deck, say one sentence to yourself:

> *I'm not stepping up to earn this. I'm stepping up because I'm already here.*

Free competing comes from arriving, not auditioning. You're not racing to be wanted. You're racing already wanted. Now go swim.$session$,
  'Zephaniah 3:17',
  'The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.',
  $prompt$When you actually listen to your pre-race monologue, does it sound like arriving or auditioning, and what would arriving sound like instead?$prompt$
),

-- ---------------------------------------------------------------------------
-- Days 11-15 — Courage / playing free
-- ---------------------------------------------------------------------------
(
  11,
  'swimming',
  'Race Free, You''re Held',
  $session$### The truth

Fear asks one question: what if it falls apart? Faith answers with a Person, not a guarantee.

David wrote this as a soldier with real enemies — not a man whose troubles were imaginary. He doesn't say "nothing will go wrong." He says the Lord is his light and his stronghold, so the fear has nowhere to land. The threat is real. The verdict on him is already settled.

### What you face

You feel it behind the blocks before a final, the heat that matters — shoulders tight, arms heavy, swimming not to lose. Tight muscles drag the swim you're scared to lose. The fear is honest. It just doesn't get to drive.

### The reset

When the tension climbs, on the deck before you step up, let your shoulders drop and say it once:

> *I'm not racing scared. I'm already held.*

Then loosen the arms and step up.

You don't race free by feeling safe. You race free because you already are.$session$,
  'Psalm 27:1',
  'The Lord is my light and my salvation— whom shall I fear? The Lord is the stronghold of my life— of whom shall I be afraid?',
  $prompt$Where does fear grip you tightest before you race — and what would it look like to step onto that exact block held instead of afraid?$prompt$
),
(
  12,
  'swimming',
  'Send the Race',
  $session$### The truth

Hiding feels safe. It isn't. The mistake you avoid by racing small is bigger than the one you risk.

Paul wrote this to Timothy, a young leader tempted to shrink back when things got hard. He doesn't tell him to feel braver. He reminds him what the Spirit actually gives — power, love, self-discipline. Timidity wasn't from God. So Timothy didn't have to obey it.

### What you face

There's a front-half you could take out fast and a safe pace you keep settling for instead — safer, because if you die on the back half the time shows on the board. So you hold back on purpose and call it smart. That's not race strategy. That's fear wearing a disguise.

### The reset

Next time you feel yourself holding back, name it and commit:

> *Fear's here. I send the race anyway.*

Go out brave and fight the back half rather than coast a safe one.

A bold swim that fades is a result. A race you never sent is a verdict you handed to fear. Send it.$session$,
  '2 Timothy 1:7',
  'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.',
  $prompt$What's one race or front-half you keep holding back on because dying on the back half scares you — and what is that fear actually protecting?$prompt$
),
(
  13,
  'swimming',
  'Strength Isn''t Felt First',
  $session$### The truth

Courage is not a feeling you wait for. It's a step you take before the feeling shows up — if it ever does.

God says this to Joshua at the edge of an impossible task, taking over from Moses. Notice what he doesn't promise: easy, or comfortable, or even brave-feeling. He promises presence. *The Lord your God will be with you wherever you go.* The courage was never meant to come from Joshua's nerves. It came from who was with him.

### What you face

You wait to feel ready before you commit — to the fast take-out, the aggressive turn, the relay leg you're nervous to anchor. The feeling rarely arrives first. So you hesitate on the blocks, and the swim gets timid before it even starts.

### The reset

At the edge of the race, don't check your nerves. Decide:

> *I don't feel it. I go anyway. He's with me.*

Then go.

Courage isn't the absence of fear. It's racing while He's with you, before you feel a thing.$session$,
  'Joshua 1:9',
  'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
  $prompt$When have you waited to feel ready before committing to a race — and what changed when you went before the feeling came?$prompt$
),
(
  14,
  'swimming',
  'Loved, So I Can Lose',
  $session$### The truth

Most of your fear on the blocks isn't fear of a slow swim. It's fear of the verdict that comes after.

John writes that perfect love drives out fear, and he names why fear has such a grip — it "has to do with punishment." We brace for the sentence: the time on the board, the coach who read it, the silence in the car. But God's love isn't a reward for your best times. It came first, and it isn't waiting to punish a slow one.

### What you face

You race stiff because part of you is competing to be approved — by the coach with the stopwatch, the recruiter in the stands, the parent on the bleachers. So every length becomes an audit. That's exhausting, and it's the wrong job.

### The reset

When you feel the audit start, hand the verdict back:

> *I'm not here to be approved. I'm already loved.*

Then swim loose.

You can risk the slow swim because the love isn't on the line. It never was.$session$,
  '1 John 4:18',
  'There is no fear in love. But perfect love drives out fear, because fear has to do with punishment. The one who fears is not made perfect in love.',
  $prompt$Whose verdict are you racing to earn right now — and what would change if you stepped onto the blocks already certain of God's love?$prompt$
),
(
  15,
  'swimming',
  'Afraid and Still In',
  $session$### The truth

You don't have to wait until the fear is gone to trust. Trust is what you do while you're still afraid.

David wrote this on the worst day — captured by enemies, genuinely scared. Look at the order: *When I am afraid, I put my trust in you.* He doesn't trust instead of being afraid. He trusts in the middle of it. The fear and the faith are in the same sentence, the same moment.

### What you face

Last 25, the fear hits — the swimmer in the next lane right on your hip, the touch coming down to a fingertip with the whole heat watching. There's no waiting it out; the wall is right there. You either trust into the finish or you tighten up and lose it.

### The reset

The instant fear spikes, don't fight it. Aim it:

> *When I'm afraid, I trust.*

Then drive for the wall.

Courage isn't a calm you find before the race. It's trust you choose inside the fear, while the swim is still live.$session$,
  'Psalm 56:3-4',
  'When I am afraid, I put my trust in you. In God, whose word I praise— in God I trust and am not afraid. What can mere mortals do to me?',
  $prompt$Think of a moment fear hit you mid-race — what would it have looked like to trust God right there, without waiting to feel calm first?$prompt$
),

-- ---------------------------------------------------------------------------
-- Days 16-20 — Discipline / hidden faithfulness
-- ---------------------------------------------------------------------------
(
  16,
  'swimming',
  'Small Things, Done Right',
  $session$### The truth

How you do the small thing is how you do everything. The little reps aren't a warmup for character. They are the character.

Jesus says faithfulness in "very little" is the same faithfulness as in "much" — they're not two different things, just two different sizes. The swimmer you are in the drill nobody's watching is the same swimmer you'll be when the race is on the line. There's no separate gear that switches on later.

### What you face

The last set after a hard practice, arms gone, coach looking elsewhere. The turn you could shortcut, the streamline you could let go a foot early. Nobody clocks it but you. That length is where you're actually built — or quietly cut corners.

### The reset

On the unseen length, the one you could fake, choose it on purpose:

> *Small and seen by Him. That's enough.*

Then do it right.

You're not building a highlight. You're becoming someone — one small, faithful length at a time.$session$,
  'Luke 16:10',
  'Whoever can be trusted with very little can also be trusted with much, and whoever is dishonest with very little will also be dishonest with much.',
  $prompt$Which small, unseen part of your training do you tend to coast through — and who are you becoming each time you do?$prompt$
),
(
  17,
  'swimming',
  'Run to Finish, Not to Win',
  $session$### The truth

Train as hard as the medal-chasers. Just aim your effort at something the medal can't give and can't take.

Paul uses an athlete to make a point that cuts against the athlete: the crown they chase "will not last." He's not against strict training — he praises it. He's relocating the prize. The discipline is real and good. But it's aimed past the trophy, at a faithfulness that outlasts every season you'll ever swim.

### What you face

You can pour a whole season into the work — the 5am doubles, the endless aerobic sets — and still not drop the time, still not make the cut. If the earthly prize is the whole point, that outcome empties the work. It doesn't have to.

### The reset

When the result feels like the only thing that matters, re-aim:

> *I train to be faithful, not to be crowned.*

Then put in the work anyway.

The medal can be lost, shared, or never won. Faithfulness can't be taken. Train for the crown that lasts.$session$,
  '1 Corinthians 9:24-25',
  'Do you not know that in a race all the runners run, but only one gets the prize? Run in such a way as to get the prize. Everyone who competes in the games goes into strict training. They do it to get a crown that will not last, but we do it to get a crown that will last forever.',
  $prompt$If a season of your hardest work didn't drop your time or land the result you wanted, what would still have made it worth it?$prompt$
),
(
  18,
  'swimming',
  'The Long Obedience',
  $session$### The truth

Most quitting doesn't happen in the loud failures. It happens in the quiet stretch where nothing seems to be working and nobody's noticing.

Paul knows the real threat isn't dramatic collapse — it's growing "weary in doing good." The slow erosion. He answers it with timing: *at the proper time* you'll reap, not on your schedule. The harvest is real, but it's later, and the only condition is not giving up before it comes.

### What you face

You're grinding the yardage and the times are flat — the plateau, the same splits week after week. No drop, no notice from the coach, no obvious payoff for the hours. The temptation isn't to blow up. It's to quietly stop holding the intervals so hard.

### The reset

In the silent stretch, when the time won't move, hold the line:

> *I don't quit because it's quiet.*

Then do today's work.

Faithfulness in the quiet isn't wasted. The harvest isn't a guaranteed cut or a faster time — it's who you're becoming, growing where you can't yet see it.$session$,
  'Galatians 6:9',
  'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.',
  $prompt$Where are you putting in work that hasn't shown up on the clock yet — and what's the temptation when nobody seems to notice?$prompt$
),
(
  19,
  'swimming',
  'Trained by What''s Hard',
  $session$### The truth

The hard thing in front of you might not be punishment. It might be the exact thing forming you into who you're becoming.

Hebrews is honest: discipline doesn't feel good "at the time." It's painful. The writer doesn't pretend otherwise. But he reframes what it is — not a verdict against you, a training that produces something later: a harvest "for those who have been trained by it." The pain is real. So is the forming happening underneath it.

### What you face

The brutal main set. The event you didn't want to swim, the lonely distance heat. The hard conversation with a coach about your training. In the moment it feels like you're being singled out, sentenced. That reading turns formation into condemnation.

### The reset

When the hard thing feels like a punishment, name what it actually is:

> *This is forming me, not punishing me.*

Then lean in instead of bracing against it.

God isn't sentencing you in the hard set. He's training a swimmer only that set could make.$session$,
  'Hebrews 12:11',
  'No discipline seems pleasant at the time, but painful. Later on, however, it produces a harvest of righteousness and peace for those who have been trained by it.',
  $prompt$What's hard for you right now that feels like punishment — and how would you face it differently if it were forming you instead?$prompt$
),
(
  20,
  'swimming',
  'Strong, Not Scattered',
  $session$### The truth

Effort isn't the same as direction. You can work brutally hard and still be swimming nowhere.

Paul says he doesn't "run aimlessly" or "beat the air" — wasted motion that looks like effort but lands on nothing. His self-control isn't random intensity. It's aimed. Every ounce of discipline points at something specific, because energy with no target just exhausts you and moves nothing.

### What you face

You hammer the set but scattered — full-effort lengths with sloppy technique, ragged turns, just churning water. It feels like work. At the end you're spent but no sharper. Effort without a target is just fatigue.

### The reset

Before the length, before the rep, give the energy a job — a stroke count, a turn, one thing to sharpen:

> *Every length has a target.*

Pick one thing to sharpen. Aim there.

Intensity isn't the goal. Intensity pointed at something is. Don't just churn water — make the length land.$session$,
  '1 Corinthians 9:26-27',
  'Therefore I do not run like someone running aimlessly; I do not fight like a boxer beating the air. No, I strike a blow to my body and make it my slave so that after I have preached to others I myself will not be disqualified for the prize.',
  $prompt$Where do you go hard without a target — and what one specific thing could each length actually aim at?$prompt$
),

-- ---------------------------------------------------------------------------
-- Days 21-25 — Pressure / fear / comparison / approval
-- ---------------------------------------------------------------------------
(
  21,
  'swimming',
  'Hand It Over',
  $session$### The truth

Carrying the weight doesn't prove you're tough. It just means you're holding something you were never meant to hold alone.

Peter writes "cast all your anxiety on him" to people under real pressure — and he gives a reason that isn't a technique: *because he cares for you.* This isn't "think positive." It's a handoff. The weight is real and it's heavy. The point is whose hands it's supposed to end up in.

### What you face

The night before the big meet, the pressure piles up — the cut you need, your name on the relay, the college coach who's coming to watch. You lie there carrying all of it like gripping it tighter will help. It won't. It just steals the rest you need.

### The reset

When the weight stacks up, picture handing it over and say it:

> *This is yours. I let it go.*

Then settle. You're not in charge of the outcome.

You weren't built to carry the weight alone. Hand it to the One who actually can.$session$,
  '1 Peter 5:7',
  'Cast all your anxiety on him because he cares for you.',
  $prompt$What weight are you carrying right now that you've never actually handed to God — and what's it costing you to hold it?$prompt$
),
(
  22,
  'swimming',
  'Anxious? Ask, Don''t Spiral',
  $session$### The truth

Anxiety and prayer point at the same thing — the future you can't control. One spins on it. The other hands it over.

Paul doesn't just say "don't be anxious." He gives the swap: instead of spinning, "present your requests to God." And he doesn't promise the problem disappears. He promises a peace that "transcends understanding" will guard you — stand watch over your mind — even before anything is solved.

### What you face

The worry loop runs the same heat all night — the start, the split you might miss, what they'll think if you get touched out. Spinning feels like preparing. It isn't. It just wears the same groove deeper.

### The reset

When you catch the loop, break it by turning the worry into a sentence you say to God:

> *I'll ask instead of spin.*

Name the actual fear. Hand it over. Then stop.

Spinning changes nothing. Asking changes who's holding it. Let the peace stand guard.$session$,
  'Philippians 4:6-7',
  'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
  $prompt$What worry have you been spinning on instead of actually praying about — and what would it look like to hand it over tonight?$prompt$
),
(
  23,
  'swimming',
  'Whose Approval Am I After?',
  $session$### The truth

You cannot swim for two verdicts at once. Sooner or later, the crowd's approval and God's settled love pull in opposite directions, and you have to know which one names you.

Paul asks the question straight: am I trying to win human approval, or God's? He's not against people. He's against being ruled by their verdict — because a swimmer owned by the crowd's opinion will bend everything to keep it. The approval you're already given frees you from the approval you're always chasing.

### What you face

You feel it in how you race to the stands — going out too fast when the recruiter's on deck, deflating at one disappointed look from the coach. When your worth rides on the room's reaction, every length becomes a referendum, and you lose the freedom to just swim.

### The reset

When you feel yourself racing to the crowd, re-aim the whole thing:

> *For the One already pleased.*

One audience. Then swim for that One alone.

The crowd's verdict shifts every heat. His doesn't. Swim for the approval you already have.$session$,
  'Galatians 1:10',
  'Am I now trying to win the approval of human beings, or of God? Or am I trying to please people? If I were still trying to please people, I would not be a servant of Christ.',
  $prompt$Whose reaction on the pool deck or in the stands has the most power over how you feel about yourself — and what does it mean that God's verdict is already settled?$prompt$
),
(
  24,
  'swimming',
  'One Day at a Time',
  $session$### The truth

You can only swim the length you're in. Tomorrow's race isn't yours to swim yet — so it isn't yours to carry yet either.

Jesus says don't worry about tomorrow, and his reason is kind, not harsh: today already has enough in it. He's not telling you to stop caring. He's telling you to stop hauling tomorrow's weight into today, where you can't do anything with it anyway.

### What you face

You're in practice but your head is three days ahead — the championship meet, the showcase, the test. Living in tomorrow means you're not really here, and you lose the length that's actually in front of you.

### The reset

When your mind jumps ahead, pull it back to right now:

> *Today's enough. I'll swim the length I'm in.*

Then do the next thing in front of you.

God gives you grace for today. Tomorrow gets its own. Swim the length you're in.$session$,
  'Matthew 6:34',
  'Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.',
  $prompt$What future moment are you carrying around today that you can't do anything about yet — and what's right in front of you instead?$prompt$
),
(
  25,
  'swimming',
  'My Heart May Fail',
  $session$### The truth

Sometimes you don't bounce back. You give everything and still fall short, and there's no spin that makes it not hurt. That's where this verse lives.

The psalmist isn't pretending. He says it plainly: *my flesh and my heart may fail.* He doesn't deny the failure or rush past it. He just refuses to let it be the last word. God is "the strength of my heart and my portion" — not instead of the failure, but underneath it, holding when his own strength gave out.

### What you face

You had the swim in front of you and it got away. The DQ that erased the whole race. Getting touched out at the wall by a fingertip with everyone watching. Days like that, "shake it off" is an insult — the failure is real and it costs something. You're allowed to feel that fully.

### The reset

When you've fallen short and it stings, don't deny it. Anchor below it:

> *My swim failed. He didn't.*

Sit with the loss. Then stand on what didn't move.

Your time can collapse. Your portion can't. He's the strength underneath the failure, not a way around it.$session$,
  'Psalm 73:26',
  'My flesh and my heart may fail, but God is the strength of my heart and my portion forever.',
  $prompt$When you've genuinely fallen short and it hurt, what does it change to know God was the strength underneath, not just a way to feel better fast?$prompt$
),

-- ---------------------------------------------------------------------------
-- Days 26-30 — Leadership / gratitude / perseverance / competing FROM victory
-- ---------------------------------------------------------------------------
(
  26,
  'swimming',
  'Lead by Serving',
  $session$### The truth

The world ranks leadership by who's above you. Jesus flips it: real greatness is measured by who you lift.

His disciples were jockeying for position — who's first, who's most important. Jesus doesn't scold the desire for greatness; he redefines it. "Whoever wants to be first must be slave of all." Then he points at himself: the Son of Man came "not to be served, but to serve." The model isn't a boss. It's a servant who spent himself for others.

### What you face

A captain's role, the fastest seed, a senior spot — and the pull to lead by status. Reminding people where they sit on the psych sheet, letting them feel your times. That's authority spent on yourself. It builds nothing on the pool deck.

### The reset

When you're tempted to lead by pulling rank, flip it:

> *I lead by lifting, not by ranking.*

Find one teammate to serve today.

You don't lead by your seed time. You lead by how you carry a bad swim — and who you pick up on the deck after theirs.$session$,
  'Mark 10:43-45',
  'Not so with you. Instead, whoever wants to become great among you must be your servant, and whoever wants to be first must be slave of all. For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.',
  $prompt$Where do you tend to lead by status instead of service — and who on your team could you actually lift this week?$prompt$
),
(
  27,
  'swimming',
  'Don''t Coast on Your Age',
  $session$### The truth

You don't earn the right to lead by getting older. You earn it by how you show up — starting now.

Paul tells young Timothy not to let his age disqualify him, but notice the answer he gives: *set an example.* He doesn't say "wait until you have seniority." He says your conduct, right now, is the credential. Influence doesn't come from your seed on the heat sheet. It comes from who you are when people are watching and when they're not.

### What you face

You think leadership is for the captains, the seniors, the fastest in the lane. So you coast — figure your example doesn't matter yet. But the younger swimmers are already watching how you train, how you handle not making the relay, how you treat people on a hard morning.

### The reset

When you think you're too young or too far down the heat sheet to matter, decide otherwise:

> *My example sets the tone.*

Then set it on purpose today.

You don't need a title to lead. You need a life worth copying.$session$,
  '1 Timothy 4:12',
  'Don''t let anyone look down on you because you are young, but set an example for the believers in speech, in conduct, in love, in faith and in purity.',
  $prompt$Who's watching how you compete and carry yourself right now — and what example are you actually setting, title or no title?$prompt$
),
(
  28,
  'swimming',
  'Count It, Don''t Chase It',
  $session$### The truth

The never-enough loop always wants the next thing. Gratitude stops, looks at what's already here, and names it.

Paul says "give thanks in all circumstances" — not in the good ones only, in all of them. That's not pretending hard things are fine. It's the discipline of noticing what's true and good even on an ordinary day, instead of always sprinting toward the thing you don't have yet.

### What you face

You hit the cut and immediately want the next one down. Drop a personal best, and you're already chasing the time under it. The bar keeps moving, and you never actually arrive. The chase feels like drive. It's really a leak.

### The reset

Tonight, before you chase tomorrow, stop and count:

> *Three gifts, named. Then I go.*

Name three real things from today. Out loud or written. Then rest.

The chase says you're not there yet. Gratitude says look what you've already been given.$session$,
  '1 Thessalonians 5:16-18',
  'Rejoice always, pray continually, give thanks in all circumstances; for this is God''s will for you in Christ Jesus.',
  $prompt$What's one thing from today you blew past without noticing because you were already chasing the next thing?$prompt$
),
(
  29,
  'swimming',
  'Mercies for This Morning',
  $session$### The truth

You don't have to drag yesterday's swim into today's practice. The grace you need for today is brand new this morning — it didn't carry over your debt.

These words sit in the book of Lamentations — written in the rubble, in real grief. Right in the middle of it: *his compassions never fail. They are new every morning.* The mercy isn't rationed or worn out by yesterday. Every single morning, it's fresh. That's how you persevere — not on leftover strength, on grace renewed daily.

### What you face

A bad meet, a hard week, and you wake up still carrying it — like this morning's practice starts already in the hole, owing something. So you press, trying to make up for yesterday, and you swim tight.

### The reset

In the morning, before you bring yesterday with you, leave it:

> *Yesterday's done. Today's mercy is new.*

Then start today clean.

You're not running on yesterday's fumes. You're running on mercy that's new this morning.$session$,
  'Lamentations 3:22-23',
  'Because of the Lord''s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.',
  $prompt$What from yesterday are you still carrying into today — and what would it look like to start this morning on grace that's actually new?$prompt$
),
(
  30,
  'swimming',
  'Eyes on the One Who Won',
  $session$### The truth

You don't swim this race to win a victory. You swim it from one that's already been won.

This is where all thirty days have been pointing. Hebrews says run "fixing our eyes on Jesus" — the pioneer who already ran his race, endured the cross, and "sat down." That last part matters: he sat. The work is finished. You're not competing to earn a standing. You're swimming from the standing he already secured.

### What you face

After thirty days, the old pull is still there — to make the next swim prove you, the next season name you, the clock settle who you are. That treadmill never ends. There's another way to race.

### The reset

Whenever the race feels like it's for your worth, remember where you're swimming from:

> *The race is already won. I run from it, not for it.*

Eyes up. Then go swim.

He already finished and sat down. You compete from his victory — never toward your own.$session$,
  'Hebrews 12:1-2',
  'Therefore, since we are surrounded by such a great cloud of witnesses, let us throw off everything that hinders and the sin that so easily entangles. And let us run with perseverance the race marked out for us, fixing our eyes on Jesus, the pioneer and perfecter of faith. For the joy set before him he endured the cross, scorning its shame, and sat down at the right hand of the throne of God.',
  $prompt$After these thirty days, what's one way you can tell the difference between competing from victory and competing toward it — and where do you still catch yourself doing the second?$prompt$
)

on conflict (day_number, sport) do nothing;
