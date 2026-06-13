-- =============================================================================
-- Migration: 20260613050000_seed_training_sessions_baseball_days_1_30.sql
--
-- Purpose (FV-96 — "Baseball daily training content days 1-30"):
--   Seed all 30 days of the From Victory Core Identity Track for baseball into
--   public.training_sessions_catalog, completing baseball's content arc to
--   parity with hockey + basketball. (Pregame = FV-94, pre-practice = FV-220.)
--
-- Content arc (mirrors hockey/basketball, baseball-adapted):
--   01-05  Identity and security in Christ
--   06-10  Receiving grace
--   11-15  Courage / playing free
--   16-20  Discipline / hidden faithfulness
--   21-25  Pressure / fear / comparison / approval
--   26-30  Leadership / gratitude / perseverance / competing FROM victory
--   Day 30 lands on Hebrews 12:1-2 as the deliberate capstone.
--
-- Authoring:
--   mental_skill_md and journal_prompt re-themed basketball→baseball by
--   content-curator (baseball-expert verified). The mental-skill teaching and
--   scripture exposition are unchanged from the ratified hockey/basketball
--   source — only the sport illustrations + vocabulary were swapped to baseball.
--   scripture_ref + scripture_text + title copied VERBATIM from the matching
--   (day_number) hockey/basketball rows. NIV throughout.
--
-- Format (FV-23 locked):
--   Each body (mental_skill_md) runs <=190 words with the scannable header
--   rhythm "### The truth" / "### What you face" / "### The reset" and the
--   single-move reset set off as a > blockquote (days 8 and 9 mirror the source's
--   alternate header structure).
--
-- Idempotency:
--   ON CONFLICT (day_number, sport) DO NOTHING — re-running is safe.
--
-- Privacy model (for kids-privacy-officer):
--   - training_sessions_catalog is shared, athlete-readable authored content
--     (RLS: all authenticated users SELECT; service-role only writes). No PII.
--   - Journal prompts are single-question, answerable privately, never ask the
--     athlete to disclose to anyone. No content pathologizes normal sports stress.
--   - Baseball stays v2 (FV-100 launch-tier gate open); seeding content is inert
--     until a baseball athlete exists (sport enum/routing = FV-97/FV-98).
-- =============================================================================

insert into public.training_sessions_catalog
  (day_number, sport, title, mental_skill_md, scripture_ref, scripture_text, journal_prompt)
values

-- ---------------------------------------------------------------------------
-- Days 1-5 — Identity and security in Christ
-- ---------------------------------------------------------------------------
(
  1,
  'baseball',
  'From Victory, Not Toward It',
  $session$### The truth

A bad game should tell you what happened. It should not tell you who you are.

Paul wrote "more than conquerors" to believers facing real loss — trouble, hardship, danger. Not after a winning streak. In the middle of suffering. It doesn't mean you never lose. It means loss never gets the final word, and nothing on that list can separate you from the love of God in Christ.

### What you face

Every serious hitter knows the voice that takes one bad at-bat and turns it into a verdict. *I'm not a real player. Coach is going to drop me in the order.* It's fast, and it sounds like the truth. Most of the time it isn't.

### The reset

When it starts, say it back:

> *That is what happened. That is not who I am.*

The at-bat is on film. The verdict isn't real. Breath. Next pitch.

The worst game you play does not lower your standing with God. The best game you play does not raise it. You don't compete to earn an identity. You compete from one.$session$,
  'Romans 8:37',
  'No, in all these things we are more than conquerors through him who loved us.',
  $prompt$When did a single bad at-bat last try to tell you who you are, and what would it look like to answer it back?$prompt$
),
(
  2,
  'baseball',
  'You Were Chosen Before Tryouts',
  $session$### The truth

Identity is received, not achieved.

Paul says God chose his people "before the creation of the world" — before they existed to perform, fail, or impress. The reason he gives is love, the Father's pleasure. Not evaluation. Not the radar gun.

### What you face

Every serious ballplayer lets some voice do the naming — a coach who dropped you in the order, a scout who closed the notebook, a ranking on a website. That's information. It isn't the verdict on who you are.

### The reset

When you catch a voice naming you, take it back in one line:

> *That voice has information. It does not have jurisdiction.*

A coach can change your spot in the order. A scout can close the notebook. None of it moves the Father.

A program picks you for what you can already do at the plate. You were chosen before you'd done anything. No one moved you in by your numbers, and no one can move you out the same way.$session$,
  'Ephesians 1:4-5',
  'For he chose us in him before the creation of the world to be holy and blameless in his sight. In love he predestined us to be adopted to sonship through Jesus Christ, in accordance with his pleasure and will.',
  $prompt$Which voice have you been letting name you lately, and what changes if you treat it as information instead of a verdict?$prompt$
),
(
  3,
  'baseball',
  'The Best Game Doesn''t Crown You',
  $session$### The truth

A great night is a gift to carry. It is not a crown to put on your own head.

Paul is writing to a church that turned faith into a ranking system. So he asks them: *What do you have that you did not receive?* Every gift you actually have — your hands, your eyes, the night the barrels were finally coming — came to you. None of it was self-made. So none of it can crown you.

### What you face

This is the quiet trap on the ride home after a 4-for-4. The mind takes a big night and makes it the new floor: *this is who I am now.* It feels like confidence. It's a new dependency, and it hands tomorrow's at-bats power over who you are.

### The reset

Before you put the phone down tonight, say one line:

> *I'll take the night. It's a gift, not my standing.*

A bad night can't lower your standing — it was never yours to lose. A great night can't raise it. Open hands, both ways.$session$,
  '1 Corinthians 4:7',
  'For who makes you different from anyone else? What do you have that you did not receive? And if you did receive it, why do you boast as though you did not?',
  $prompt$After your best night at the plate, what did you start telling yourself about who you are, and how does "gift, not standing" reframe it?$prompt$
),
(
  4,
  'baseball',
  'Trained in the Empty Gym',
  $session$### The truth

Most of your training happens with no one watching. That isn't lesser work. That's the work that actually forms you.

Paul writes this to people whose effort would never be seen or rewarded by anyone above them. He doesn't tell them to grind harder for recognition. He moves the question: the work always had an audience, and that audience was settled long before anyone on earth started keeping score.

### What you face

So when the cage empties out and the only sound is the swing off the tee, a drift starts: *does this rep even count if no one sees it?* That question sounds like motivation. It's really about location. Slide toward "not really," and the work has quietly become an audition.

### The reset

Before the rep, say it once:

> *This rep already counts.*

Not as pressure. As release. Two seconds, then start.

The unseen rep is where competing from victory gets built. Your standing came first. The work is what flows from it.$session$,
  'Colossians 3:23-24',
  'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters, since you know that you will receive an inheritance from the Lord as a reward. It is the Lord Christ you are serving.',
  $prompt$What does your early work in the empty cage become when you stop treating it as an audition?$prompt$
),
(
  5,
  'baseball',
  'Step Off the Ranking Table',
  $session$### The truth

Comparison isn't measuring you. It's auditioning a verdict on who you are, using someone else's at-bats.

Watch how Jesus handles it. Peter — just restored after denying him three times — sees John and asks, "Lord, what about him?" Jesus won't dignify it: *"What is that to you? You must follow me."* He's already settled what the ranking question was trying to decide.

### What you face

It runs every direction at once — up at the hitter ahead of you in the order, sideways at the teammate in your spot, down at the one chasing your at-bats. Your brain will keep generating the question. You decide whether to answer it. You've been named, restored, and called in Christ. The player above you can't add to that. The one chasing you can't subtract from it.

### The reset

So when the scroll starts — the highlight, the commit post, the showcase rankings:

> *That film is not my verdict.*

Then lock the phone. Eyes back on the cage you're actually in. You're not on the ranking table. You're following.$session$,
  'John 21:21-22',
  'When Peter saw him, he asked, "Lord, what about him?" Jesus answered, "If I want him to remain alive until I return, what is that to you? You must follow me."',
  $prompt$Which direction does comparison pull you hardest — up at the hitter ahead of you, sideways at your teammate, or down at the one chasing your at-bats — and what would it look like to step off that table today?$prompt$
),

-- ---------------------------------------------------------------------------
-- Days 6-10 — Receiving grace
-- ---------------------------------------------------------------------------
(
  6,
  'baseball',
  'Tuesday Is Holy Ground',
  $session$### The truth

The God who meets you under the lights also meets you in the empty cage. Same gaze. Same delight.

Zechariah spoke to people rebuilding after exile. Their foundation was small — nothing worth filming. His word to them wasn't *don't worry, it'll grow into something impressive.* It was quieter: the eyes of the Lord that range over the whole earth rejoice when they land here. On the small thing.

### What you face

The early work. The stretch you almost skipped. The tee work no one filmed. These aren't the throwaway hours of your athletic life. They are your athletic life. Most of who you become gets built here, not on game night.

### The reset

So pick one ordinary moment today — cleating up, the first swing off the tee — and land there with one sentence:

> *This counts. I'm here.*

Then do the thing. Not for an audience. Just present, in a moment God is already present in.

There's no off-camera with Him. The Tuesday is holy ground.$session$,
  'Zechariah 4:10',
  'Who dares despise the day of small things, since the seven eyes of the Lord that range throughout the earth will rejoice when they see the chosen capstone in the hand of Zerubbabel?',
  $prompt$Which ordinary, unfilmed part of your training — the cage, the early work, the tee — have you been treating as filler, and what shifts when you call it holy ground?$prompt$
),
(
  7,
  'baseball',
  'Come, Don''t Earn',
  $session$### The truth

Rest is not something you earn. It's something you receive.

Hear who this invitation is for. Not the strong. Not the proven. The weary. The burdened. Weariness isn't what disqualifies you from this rest — it's what qualifies you for it. And Christ isn't adding to your load. He's lifting the crushing yoke off your shoulders and handing you one shaped to fit.

### What you face

You know the off day. The at-bat video you open "just to check something." The nap you cut short because lying there feels like quitting. The guilt swings in the cage after a long day. The loop says rest means someone's pulling ahead. It has it backward.

### The reset

At one rest moment today — the off day, a nap, an evening with no work — say one sentence:

> *I'm not behind. I'm being restored.*

One line. Let it interrupt the loop.

You're not competing to earn rest, or worth, or a place. You already have one. So you can stop. You can come without earning your way in.$session$,
  'Matthew 11:28-30',
  'Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls. For my yoke is easy and my burden is light.',
  $prompt$Where does rest still feel like falling behind, and what would it take to receive it as restoration instead?$prompt$
),
(
  8,
  'baseball',
  'Fully Known, Fully Held',
  $session$### The truth

You carry two versions of yourself most days. The polished one you show coaches and post online. The harsh one that runs you down at 11pm. Neither is the real you.

David wrote Psalm 139 as a man who'd been examined — sitting, rising, thinking, every honest corner. What he found there wasn't surveillance. It was safety. To be known and not loved is our deepest fear. To be loved and not known is the loneliness most people live in. To be fully known and fully held — that's the gospel. The One who already won sees the actual you, not the highlight reel, and holds you there.

### The reset

So you can stop performing for yourself. Pick one true sentence about your day. Not flattering. Not condemning. Just accurate: *I worked early work hard. I checked out by my third at-bat.* No editorial. You're not fixing it. You're letting it be seen.

That's training from victory — honest, because honesty is safe here. You were already searched. You were already held.$session$,
  'Psalm 139:1-3',
  'You have searched me, Lord, and you know me. You know when I sit and when I rise; you perceive my thoughts from afar. You discern my going out and my lying down; you are familiar with all my ways.',
  $prompt$What is one accurate, un-edited sentence about today — not flattering, not condemning — that you can let simply be seen?$prompt$
),
(
  9,
  'baseball',
  'Grace Meets the Mistake',
  $session$### The truth

Two things sit side by side today, and they don't collapse into each other.

One is the in-game miss — the ball you booted, the lazy throw, the pitch you should have laid off. After a miss, the mind reaches for one of two dodges: shrink it ("not a big deal") or swell it ("I'm trash"). Both feel like honesty. Neither is. Clean naming loosens the grip.

The other is heavier — the lie you told, the corner you cut when no one was watching. John writes to people pulling toward two errors: pretending they have no sin, or sinking under the ones they've got. He cuts down the middle. Sin is real. So is the grace that meets it. Forgiveness rests on God being faithful and just — not on you finding the right words. You bring the actual thing into the light, not the cleaned-up version, and you are met.

### The reset

Same posture under both: don't hide. So at the next mistake today, one sentence:

> *That happened. Next.*

Two beats. Don't argue with it. Eyes back on the next pitch.$session$,
  '1 John 1:9',
  'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.',
  $prompt$Where have you been either shrinking or swelling a mistake instead of naming it cleanly, and what would honest naming sound like?$prompt$
),
(
  10,
  'baseball',
  'Sent Out From Delight',
  $session$### The truth

Zephaniah 3:17 doesn't drop from a sentimental sky. It lands at the end of a hard book — pages of judgment first, then this: *he will take great delight in you... he will rejoice over you with singing.* A God who looked closely at the real problem, dealt with it in Christ, and on the other side of that, delights in you. Not your last at-bat. You.

### What you face

In the car on the way to the yard. The dugout before first pitch. Your internal monologue is running, and you haven't noticed what it sounds like. Listen. If it sounds like a job interview — proving you belong, justifying your spot, earning your next at-bat — you're auditioning. Most ballplayers never hear it. They just feel tight and don't know why.

### The reset

Before you step in the box, say one sentence under your breath:

> *I'm not going in to earn this. I'm going in because I'm already here.*

Free competing comes from arriving, not auditioning. You're not stepping in to be wanted. You step in already wanted. Now go play.$session$,
  'Zephaniah 3:17',
  'The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.',
  $prompt$When you actually listen to your monologue before an at-bat, does it sound like arriving or auditioning, and what would arriving sound like instead?$prompt$
),

-- ---------------------------------------------------------------------------
-- Days 11-15 — Courage / playing free
-- ---------------------------------------------------------------------------
(
  11,
  'baseball',
  'Play Free, You''re Held',
  $session$### The truth

Fear asks one question: what if it falls apart? Faith answers with a Person, not a guarantee.

David wrote this as a soldier with real enemies — not a man whose troubles were imaginary. He doesn't say "nothing will go wrong." He says the Lord is his light and his stronghold, so the fear has nowhere to land. The threat is real. The verdict on him is already settled.

### What you face

You feel it in your hands in the box with the game close — grip too tight, legs heavy, swinging not to miss. Tight hands roll over the pitch you're scared to roll over. The fear is honest. It just doesn't get to drive.

### The reset

When the grip tightens, breathe out and say it once:

> *I'm not hitting scared. I'm already held.*

Then loosen the hands and let it go.

You don't play free by feeling safe. You play free because you already are.$session$,
  'Psalm 27:1',
  'The Lord is my light and my salvation— whom shall I fear? The Lord is the stronghold of my life— of whom shall I be afraid?',
  $prompt$Where does fear grip you tightest before you compete — and what would it look like to step into that exact at-bat held instead of afraid?$prompt$
),
(
  12,
  'baseball',
  'Take the Shot',
  $session$### The truth

Hiding feels safe. It isn't. The mistake you avoid by playing small is bigger than the one you risk.

Paul wrote this to Timothy, a young leader tempted to shrink back when things got hard. He doesn't tell him to feel braver. He reminds him what the Spirit actually gives — power, love, self-discipline. Timidity wasn't from God. So Timothy didn't have to obey it.

### What you face

A hittable pitch comes in and you let it go by, hoping for a safer one, because if you swing and miss with the game on the line everyone sees it. So you go down looking and call it patience. That's not discipline. That's fear wearing a disguise.

### The reset

Next time you feel yourself shrinking, name it and move:

> *Fear's here. I swing anyway.*

Strike out swinging rather than get rung up looking.

A swing-and-miss is an at-bat. A pitch you never swung at is a called third strike you handed to fear. Swing.$session$,
  '2 Timothy 1:7',
  'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.',
  $prompt$What's one pitch you keep taking — one at-bat or moment you keep passing up — because swinging and missing in front of people scares you, and what is that fear actually protecting?$prompt$
),
(
  13,
  'baseball',
  'Strength Isn''t Felt First',
  $session$### The truth

Courage is not a feeling you wait for. It's a step you take before the feeling shows up — if it ever does.

God says this to Joshua at the edge of an impossible task, taking over from Moses. Notice what he doesn't promise: easy, or comfortable, or even brave-feeling. He promises presence. *The Lord your God will be with you wherever you go.* The courage was never meant to come from Joshua's nerves. It came from who was with him.

### What you face

You wait to feel ready before you commit — to the swing on a 2-strike count, the jump to steal, the dash from first to third. The feeling rarely arrives first. So you hesitate, and the play passes you by.

### The reset

At the edge of the play, don't check your nerves. Decide:

> *I don't feel it. I go anyway. He's with me.*

Then go.

Courage isn't the absence of fear. It's moving while He's with you, before you feel a thing.$session$,
  'Joshua 1:9',
  'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
  $prompt$When have you waited to feel ready before acting at the plate or on the bases — and what changed when you moved before the feeling came?$prompt$
),
(
  14,
  'baseball',
  'Loved, So I Can Lose',
  $session$### The truth

Most of your fear at the plate isn't fear of failing. It's fear of the verdict that comes after.

John writes that perfect love drives out fear, and he names why fear has such a grip — it "has to do with punishment." We brace for the sentence: the bench, the look, the silence on the ride home. But God's love isn't a reward for your good games. It came first, and it isn't waiting to punish a bad one.

### What you face

You play tight because part of you is competing to be approved — by the coach, the scout, the parent in the bleachers. So every at-bat becomes an audit. That's exhausting, and it's the wrong job.

### The reset

When you feel the audit start, hand the verdict back:

> *I'm not here to be approved. I'm already loved.*

Then play loose.

You can risk the strikeout because the love isn't on the line. It never was.$session$,
  '1 John 4:18',
  'There is no fear in love. But perfect love drives out fear, because fear has to do with punishment. The one who fears is not made perfect in love.',
  $prompt$Whose verdict are you playing to earn right now — and what would change if you walked to the plate already certain of God's love?$prompt$
),
(
  15,
  'baseball',
  'Afraid and Still In',
  $session$### The truth

You don't have to wait until the fear is gone to trust. Trust is what you do while you're still afraid.

David wrote this on the worst day — captured by enemies, genuinely scared. Look at the order: *When I am afraid, I put my trust in you.* He doesn't trust instead of being afraid. He trusts in the middle of it. The fear and the faith are in the same sentence, the same moment.

### What you face

Full count, the fear hits — a nasty breaking ball you can't read, a screaming liner off the bat with the game on the line. There's no time to calm down first. You either trust right there or you freeze.

### The reset

The instant fear spikes, don't fight it. Aim it:

> *When I'm afraid, I trust.*

Then make the read.

Courage isn't a calm you find before the pitch. It's trust you choose inside the fear, while the ball is still in the air.$session$,
  'Psalm 56:3-4',
  'When I am afraid, I put my trust in you. In God, whose word I praise— in God I trust and am not afraid. What can mere mortals do to me?',
  $prompt$Think of a moment fear hit you mid-at-bat — what would it have looked like to trust God right there, without waiting to feel calm first?$prompt$
),

-- ---------------------------------------------------------------------------
-- Days 16-20 — Discipline / hidden faithfulness
-- ---------------------------------------------------------------------------
(
  16,
  'baseball',
  'Small Things, Done Right',
  $session$### The truth

How you do the small thing is how you do everything. The little reps aren't a warmup for character. They are the character.

Jesus says faithfulness in "very little" is the same faithfulness as in "much" — they're not two different things, just two different sizes. The player you are in the drill nobody's watching is the same player you'll be when the game's on the line. There's no separate gear that switches on later.

### What you face

The last round in the cage after a long practice, hands shot, coach looking elsewhere. The swing you could rush, the ground ball you could jog after. Nobody clocks it but you. That rep is where you're actually built — or quietly cut corners.

### The reset

On the unseen rep, the one you could fake, choose it on purpose:

> *Small and seen by Him. That's enough.*

Then do it right.

You're not building a highlight. You're becoming someone — one small, faithful rep at a time.$session$,
  'Luke 16:10',
  'Whoever can be trusted with very little can also be trusted with much, and whoever is dishonest with very little will also be dishonest with much.',
  $prompt$Which small, unseen part of your training do you tend to coast through — and who are you becoming each time you do?$prompt$
),
(
  17,
  'baseball',
  'Run to Finish, Not to Win',
  $session$### The truth

Train as hard as the medal-chasers. Just aim your effort at something the medal can't give and can't take.

Paul uses an athlete to make a point that cuts against the athlete: the crown they chase "will not last." He's not against strict training — he praises it. He's relocating the prize. The discipline is real and good. But it's aimed past the trophy, at a faithfulness that outlasts every season you'll ever play.

### What you face

You can grind every rep in the cage, log every round of early work, and still not make the roster, still not get the offer. If the earthly prize is the whole point, that outcome empties the work. It doesn't have to.

### The reset

When the result feels like the only thing that matters, re-aim:

> *I train to be faithful, not to be crowned.*

Then put in the work anyway.

The trophy can be lost, shared, or never won. Faithfulness can't be taken. Train for the crown that lasts.$session$,
  '1 Corinthians 9:24-25',
  'Do you not know that in a race all the runners run, but only one gets the prize? Run in such a way as to get the prize. Everyone who competes in the games goes into strict training. They do it to get a crown that will not last, but we do it to get a crown that will last forever.',
  $prompt$If a season of your hardest work in the cage and on the field didn't produce the result you wanted, what would still have made it worth it?$prompt$
),
(
  18,
  'baseball',
  'The Long Obedience',
  $session$### The truth

Most quitting doesn't happen in the loud failures. It happens in the quiet stretch where nothing seems to be working and nobody's noticing.

Paul knows the real threat isn't dramatic collapse — it's growing "weary in doing good." The slow erosion. He answers it with timing: *at the proper time* you'll reap, not on your schedule. The harvest is real, but it's later, and the only condition is not giving up before it comes.

### What you face

You're putting in the early work and the results are flat. No bump in the order, no notice from the coach, no obvious payoff for all those reps in the cage. The temptation isn't to blow up. It's to quietly stop trying so hard.

### The reset

In the silent stretch, when results haven't come, hold the line:

> *I don't quit because it's quiet.*

Then do today's work.

Faithfulness in the quiet isn't wasted. The harvest isn't a promised spot or more at-bats — it's who you're becoming, growing where you can't yet see it.$session$,
  'Galatians 6:9',
  'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.',
  $prompt$Where are you putting in work that hasn't paid off yet — and what's the temptation when nobody seems to notice?$prompt$
),
(
  19,
  'baseball',
  'Trained by What''s Hard',
  $session$### The truth

The hard thing in front of you might not be punishment. It might be the exact thing forming you into who you're becoming.

Hebrews is honest: discipline doesn't feel good "at the time." It's painful. The writer doesn't pretend otherwise. But he reframes what it is — not a verdict against you, a training that produces something later: a harvest "for those who have been trained by it." The pain is real. So is the forming happening underneath it.

### What you face

The brutal early work. The role you didn't want — dropped in the order, riding the bench against the lefty. The hard conversation with a coach. In the moment it feels like you're being singled out, sentenced. That reading turns formation into condemnation.

### The reset

When the hard thing feels like a punishment, name what it actually is:

> *This is forming me, not punishing me.*

Then lean in instead of bracing against it.

God isn't sentencing you in the hard season. He's training a ballplayer only that season could make.$session$,
  'Hebrews 12:11',
  'No discipline seems pleasant at the time, but painful. Later on, however, it produces a harvest of righteousness and peace for those who have been trained by it.',
  $prompt$What's hard for you right now that feels like punishment — and how would you face it differently if it were forming you instead?$prompt$
),
(
  20,
  'baseball',
  'Strong, Not Scattered',
  $session$### The truth

Effort isn't the same as direction. You can work brutally hard and still be running nowhere.

Paul says he doesn't "run aimlessly" or "beat the air" — wasted motion that looks like effort but lands on nothing. His self-control isn't random intensity. It's aimed. Every ounce of discipline points at something specific, because energy with no target just exhausts you and moves nothing.

### What you face

You go hard but scattered — full cuts in the cage with no plan, hacking at everything, ground balls and sprints fixing nothing, just sweating. It feels like work. At the end you're tired but no better. Effort without a target is just fatigue.

### The reset

Before the round, before the swing, give the energy a job:

> *Every rep has a target.*

Pick one thing to sharpen. Aim there.

Intensity isn't the goal. Intensity pointed at something is. Don't beat the air — strike a blow that lands.$session$,
  '1 Corinthians 9:26-27',
  'Therefore I do not run like someone running aimlessly; I do not fight like a boxer beating the air. No, I strike a blow to my body and make it my slave so that after I have preached to others I myself will not be disqualified for the prize.',
  $prompt$Where do you go hard without a target — and what one specific thing could each swing or rep actually aim at?$prompt$
),

-- ---------------------------------------------------------------------------
-- Days 21-25 — Pressure / fear / comparison / approval
-- ---------------------------------------------------------------------------
(
  21,
  'baseball',
  'Hand It Over',
  $session$### The truth

Carrying the weight doesn't prove you're tough. It just means you're holding something you were never meant to hold alone.

Peter writes "cast all your anxiety on him" to people under real pressure — and he gives a reason that isn't a technique: *because he cares for you.* This isn't "think positive." It's a handoff. The weight is real and it's heavy. The point is whose hands it's supposed to end up in.

### What you face

The night before the big game, the pressure piles up — expectations, where you sit in the order, the scout who's coming to the showcase. You lie there carrying all of it like gripping it tighter will help. It won't. It just steals the rest you need.

### The reset

When the weight stacks up, picture handing it over and say it:

> *This is yours. I let it go.*

Then breathe. You're not in charge of the outcome.

You weren't built to carry the weight alone. Hand it to the One who actually can.$session$,
  '1 Peter 5:7',
  'Cast all your anxiety on him because he cares for you.',
  $prompt$What weight are you carrying right now that you've never actually handed to God — and what's it costing you to hold it?$prompt$
),
(
  22,
  'baseball',
  'Anxious? Ask, Don''t Spiral',
  $session$### The truth

Anxiety and prayer point at the same thing — the future you can't control. One spins on it. The other hands it over.

Paul doesn't just say "don't be anxious." He gives the swap: instead of spinning, "present your requests to God." And he doesn't promise the problem disappears. He promises a peace that "transcends understanding" will guard you — stand watch over your mind — even before anything is solved.

### What you face

The worry loop runs the same at-bat all night — the guy on the mound, the pitch you might chase, what they'll think. Spinning feels like preparing. It isn't. It just wears the same groove deeper.

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
  'baseball',
  'Whose Approval Am I After?',
  $session$### The truth

You cannot play for two verdicts at once. Sooner or later, the crowd's approval and God's settled love pull in opposite directions, and you have to know which one names you.

Paul asks the question straight: am I trying to win human approval, or God's? He's not against people. He's against being ruled by their verdict — because a player owned by the crowd's opinion will bend everything to keep it. The approval you're already given frees you from the approval you're always chasing.

### What you face

You feel it in how you play to the stands — expanding the zone when the scout is behind the plate, deflating at one disappointed look from the dugout. When your worth rides on the room's reaction, every at-bat becomes a referendum, and you lose the freedom to just hit.

### The reset

When you feel yourself playing to the crowd, re-aim the whole thing:

> *For the One already pleased.*

One audience. Then play for that One alone.

The crowd's verdict shifts every inning. His doesn't. Play for the approval you already have.$session$,
  'Galatians 1:10',
  'Am I now trying to win the approval of human beings, or of God? Or am I trying to please people? If I were still trying to please people, I would not be a servant of Christ.',
  $prompt$Whose reaction in the stands or dugout has the most power over how you feel about yourself — and what does it mean that God's verdict is already settled?$prompt$
),
(
  24,
  'baseball',
  'One Day at a Time',
  $session$### The truth

You can only take the at-bat you're in. Tomorrow's game isn't yours to play yet — so it isn't yours to carry yet either.

Jesus says don't worry about tomorrow, and his reason is kind, not harsh: today already has enough in it. He's not telling you to stop caring. He's telling you to stop hauling tomorrow's weight into today, where you can't do anything with it anyway.

### What you face

You're in BP but your head is three days ahead — the rivalry game, the showcase, the test. Living in tomorrow means you're not really here, and you lose the rep that's actually in front of you.

### The reset

When your mind jumps ahead, pull it back to right now:

> *Today's enough. I'll take the at-bat I'm in.*

Then do the next thing in front of you.

God gives you grace for today. Tomorrow gets its own. Take the at-bat you're in.$session$,
  'Matthew 6:34',
  'Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.',
  $prompt$What future moment are you carrying around today that you can't do anything about yet — and what at-bat is right in front of you instead?$prompt$
),
(
  25,
  'baseball',
  'My Heart May Fail',
  $session$### The truth

Sometimes you don't bounce back. You give everything and still fall short, and no spin makes it not hurt. That's where this verse lives.

The psalmist isn't pretending. He says it plainly: *my flesh and my heart may fail.* He doesn't deny the failure or rush past it. He just refuses to let it be the last word. God is "the strength of my heart and my portion" — not instead of the failure, but underneath it, holding when his own strength gave out.

### What you face

You had the moment and you didn't deliver. The bases loaded and you struck out looking. The pop-up with the game on the line. Days like that, "shake it off" is an insult — the failure is real and it costs something. You're allowed to feel that fully.

### The reset

When you've fallen short and it stings, don't deny it. Anchor below it:

> *My at-bat failed. He didn't.*

Sit with the loss. Then stand on what didn't move.

Your performance can collapse. Your portion can't. He's the strength underneath the failure, not a way around it.$session$,
  'Psalm 73:26',
  'My flesh and my heart may fail, but God is the strength of my heart and my portion forever.',
  $prompt$When you've genuinely fallen short at the plate and it hurt, what does it change to know God was the strength underneath, not just a way to feel better fast?$prompt$
),

-- ---------------------------------------------------------------------------
-- Days 26-30 — Leadership / gratitude / perseverance / competing FROM victory
-- ---------------------------------------------------------------------------
(
  26,
  'baseball',
  'Lead by Serving',
  $session$### The truth

The world ranks leadership by who's above you. Jesus flips it: real greatness is measured by who you lift.

His disciples were jockeying for position — who's first, who's most important. Jesus doesn't scold the desire for greatness; he redefines it. "Whoever wants to be first must be slave of all." Then he points at himself: the Son of Man came "not to be served, but to serve." The model isn't a boss. It's a servant who spent himself for others.

### What you face

A captain's role, the cleanup spot, seniority — and the pull to lead by status. Barking, ranking, reminding people where they hit in the order. That's authority spent on yourself. It builds nothing in the dugout.

### The reset

When you're tempted to lead by pulling rank, flip it:

> *I lead by lifting, not by ranking.*

Find one teammate to serve today.

You don't lead by climbing over the room. You lead by getting underneath it and lifting.$session$,
  'Mark 10:43-45',
  'Not so with you. Instead, whoever wants to become great among you must be your servant, and whoever wants to be first must be slave of all. For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.',
  $prompt$Where do you tend to lead by status instead of service — and who on your team could you actually lift this week?$prompt$
),
(
  27,
  'baseball',
  'Don''t Coast on Your Age',
  $session$### The truth

You don't earn the right to lead by getting older. You earn it by how you show up — starting now.

Paul tells young Timothy not to let his age disqualify him, but notice the answer he gives: *set an example.* He doesn't say "wait until you have seniority." He says your conduct, right now, is the credential. Influence doesn't come from your spot in the order. It comes from who you are when people are watching and when they're not.

### What you face

You think leadership is for the captains, the seniors, the everyday starters. So you coast — figure your example doesn't matter yet. But the younger players are already watching how you take BP, how you handle an 0-for-4, how you treat people.

### The reset

When you think you're too young or too far down the lineup to matter, decide otherwise:

> *My example sets the tone.*

Then set it on purpose today.

You don't need a title to lead. You need a life worth copying.$session$,
  '1 Timothy 4:12',
  'Don''t let anyone look down on you because you are young, but set an example for the believers in speech, in conduct, in love, in faith and in purity.',
  $prompt$Who's watching how you compete and carry yourself right now — and what example are you actually setting, title or no title?$prompt$
),
(
  28,
  'baseball',
  'Count It, Don''t Chase It',
  $session$### The truth

The never-enough loop always wants the next thing. Gratitude stops, looks at what's already here, and names it.

Paul says "give thanks in all circumstances" — not in the good ones only, in all of them. That's not pretending hard things are fine. It's the discipline of noticing what's true and good even on an ordinary day, instead of always sprinting toward the thing you don't have yet.

### What you face

You crack the lineup and immediately want the everyday spot. Go 2-for-3, and you're already chasing the multi-hit night. The bar keeps moving, and you never actually arrive. The chase feels like drive. It's really a leak.

### The reset

Tonight, before you chase tomorrow, stop and count:

> *Three gifts, named. Then I go.*

Name three real things from today. Out loud or written. Then rest.

The chase says you're not there yet. Gratitude says look what you've already been given.$session$,
  '1 Thessalonians 5:16-18',
  'Rejoice always, pray continually, give thanks in all circumstances; for this is God''s will for you in Christ Jesus.',
  $prompt$What's one thing from today you blew past without noticing because you were already chasing the next at-bat?$prompt$
),
(
  29,
  'baseball',
  'Mercies for This Morning',
  $session$### The truth

You don't have to drag yesterday's failure into today's at-bats. The grace you need for today is brand new this morning — it didn't carry over your debt.

These words sit in the book of Lamentations — written in the rubble, in real grief. Right in the middle of it: *his compassions never fail. They are new every morning.* The mercy isn't rationed or worn out by yesterday. Every single morning, it's fresh. That's how you persevere — not on leftover strength, on grace renewed daily.

### What you face

An 0-for-4, a hard week, and you wake up still carrying it — like today's first pitch comes already in the hole, owing something. So you press, trying to make up for yesterday, and you swing tight.

### The reset

In the morning, before you bring yesterday with you, leave it:

> *Yesterday's done. Today's mercy is new.*

Then step in clean.

You're not running on yesterday's fumes. You're running on mercy that's new this morning.$session$,
  'Lamentations 3:22-23',
  'Because of the Lord''s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.',
  $prompt$What from yesterday are you still carrying into today's first at-bat — and what would it look like to start this morning on grace that's actually new?$prompt$
),
(
  30,
  'baseball',
  'Eyes on the One Who Won',
  $session$### The truth

You don't step in the box to win a victory. You compete from one that's already been won.

This is where all thirty days have been pointing. Hebrews says run "fixing our eyes on Jesus" — the pioneer who already ran his race, endured the cross, and "sat down." That last part matters: he sat. The work is finished. You're not competing to earn a standing. You're playing from the standing he already secured.

### What you face

After thirty days, the old pull is still there — to make the next at-bat prove you, the next season name you, the box score settle who you are. That treadmill never ends. There's another way to play.

### The reset

Whenever the game feels like it's for your worth, remember where you're playing from:

> *The victory is already won. I compete from it, not for it.*

Eyes up. Then go.

He already finished and sat down. You compete from his victory — never toward your own.$session$,
  'Hebrews 12:1-2',
  'Therefore, since we are surrounded by such a great cloud of witnesses, let us throw off everything that hinders and the sin that so easily entangles. And let us run with perseverance the race marked out for us, fixing our eyes on Jesus, the pioneer and perfecter of faith. For the joy set before him he endured the cross, scorning its shame, and sat down at the right hand of the throne of God.',
  $prompt$After these thirty days, what's one way you can tell the difference between competing from victory and competing toward it — and where do you still catch yourself doing the second?$prompt$
)

on conflict (day_number, sport) do nothing;
