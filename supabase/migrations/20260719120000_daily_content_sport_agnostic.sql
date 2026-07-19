-- =============================================================================
-- Migration: 20260719120000_daily_content_sport_agnostic.sql  (FV-430)
--
-- Purpose (KC directive 2026-07-19): the 30-day daily training arc becomes
--   SPORT-AGNOSTIC. One master text per day replaces the per-sport bodies /
--   titles / prompts across ALL sports' rows. Audit basis: scripture refs were
--   already identical 30/30 across the 7 sport sets; bodies were 79-89%
--   word-identical (basketball 1-17 + hockey 18-30 FV-23 bases). The master
--   keeps every KC-approved shared sentence verbatim and neutralizes only the
--   sport-noun layer (content-curator, 2026-07-19; canonical prose source:
--   docs/daily-training-master.md).
--
-- What changes / what does NOT:
--   - CHANGED: title, mental_skill_md, journal_prompt — set identical for every
--     sport's row of each day_number (UPDATE has no sport filter on purpose).
--   - UNCHANGED: scripture_ref, scripture_text (verbatim, youth-pastor
--     approved), catalog ids (FK-safe for athlete_sessions), schema,
--     (day_number, sport) resolution. Future sports = mechanical 30-row copy
--     of any existing sport's rows.
--
-- Idempotency: pure UPDATEs keyed on day_number — safe to re-run.
-- =============================================================================

begin;

update public.training_sessions_catalog
set title          = 'From Victory, Not Toward It',
    mental_skill_md = '### The truth

A bad game should tell you what happened. It should not tell you who you are.

Paul wrote "more than conquerors" to believers facing real loss — trouble, hardship, danger. Not after a winning streak. In the middle of suffering. It doesn''t mean you never lose. It means loss never gets the final word, and nothing on that list can separate you from the love of God in Christ.

### What you face

Every serious athlete knows the voice that takes one mistake and turns it into a verdict. *I''m not a real player. Coach doesn''t trust me anymore.* It''s fast, and it sounds like the truth. Most of the time it isn''t.

### The reset

When it starts, say it back:

> *That is what happened. That is not who I am.*

The performance is on film. The verdict isn''t real. Breath. Next play.

The worst game you play does not lower your standing with God. The best game you play does not raise it. You don''t compete to earn an identity. You compete from one.',
    journal_prompt = 'When did a single mistake last try to tell you who you are, and what would it look like to answer it back?',
    updated_at     = now()
where day_number = 1;

update public.training_sessions_catalog
set title          = 'You Were Chosen Before Tryouts',
    mental_skill_md = '### The truth

Identity is received, not achieved.

Paul says God chose his people "before the creation of the world" — before they existed to perform, fail, or impress. The reason he gives is love, the Father''s pleasure. Not evaluation. Not film.

### What you face

Every serious athlete lets some voice do the naming — a coach who hasn''t said your name in three weeks, a scout who closed the notebook, a ranking on a website. That''s information. It isn''t the verdict on who you are.

### The reset

When you catch a voice naming you, take it back in one line:

> *That voice has information. It does not have jurisdiction.*

A coach can change your role. A scout can close the notebook. None of it moves the Father.

A program picks you for what you can already do. You were chosen before you''d done anything. No one moved you in by your film, and no one can move you out the same way.',
    journal_prompt = 'Which voice have you been letting name you lately, and what changes if you treat it as information instead of a verdict?',
    updated_at     = now()
where day_number = 2;

update public.training_sessions_catalog
set title          = 'The Best Game Doesn''t Crown You',
    mental_skill_md = '### The truth

A great night is a gift to carry. It is not a crown to put on your own head.

Paul is writing to a church that turned faith into a ranking system. So he asks them: *What do you have that you did not receive?* Every gift you actually have — your hands, your vision, the night everything finally clicked — came to you. None of it was self-made. So none of it can crown you.

### What you face

This is the quiet trap on the ride home after a career night. The mind takes a big night and makes it the new floor: *this is who I am now.* It feels like confidence. It''s a new dependency, and it hands tomorrow''s game power over who you are.

### The reset

Before you put the phone down tonight, say one line:

> *I''ll take the win. It''s a gift, not my standing.*

A bad night can''t lower your standing — it was never yours to lose. A great night can''t raise it. Open hands, both ways.',
    journal_prompt = 'After your best game, what did you start telling yourself about who you are, and how does "gift, not standing" reframe it?',
    updated_at     = now()
where day_number = 3;

update public.training_sessions_catalog
set title          = 'Trained Where No One''s Watching',
    mental_skill_md = '### The truth

Most of your training happens with no one watching. That isn''t lesser work. That''s the work that actually forms you.

Paul writes this to people whose effort would never be seen or rewarded by anyone above them. He doesn''t tell them to grind harder for recognition. He moves the question: the work always had an audience, and that audience was settled long before anyone on earth started keeping score.

### What you face

So when the place empties out and it''s just you and the work, a drift starts: *does this rep even count if no one sees it?* That question sounds like motivation. It''s really about location. Slide toward "not really," and the work has quietly become an audition.

### The reset

Before the rep, say it once:

> *This rep already counts.*

Not as pressure. As release. Two seconds, then start.

The unseen rep is where competing from victory gets built. Your standing came first. The work is what flows from it.',
    journal_prompt = 'What does your effort with no one watching become when you stop treating it as an audition?',
    updated_at     = now()
where day_number = 4;

update public.training_sessions_catalog
set title          = 'Step Off the Ranking Table',
    mental_skill_md = '### The truth

Comparison isn''t measuring you. It''s auditioning a verdict on who you are, using someone else''s film.

Watch how Jesus handles it. Peter — just restored after denying him three times — sees John and asks, "Lord, what about him?" Jesus won''t dignify it: *"What is that to you? You must follow me."* He''s already settled what the ranking question was trying to decide.

### What you face

It runs every direction at once — up at the player ahead of you, sideways at the teammate in your spot, down at the one chasing your spot. Your brain will keep generating the question. You decide whether to answer it. You''ve been named, restored, and called in Christ. The player above you can''t add to that. The one chasing you can''t subtract from it.

### The reset

So when the scroll starts — the highlight, the commit post, the rankings list:

> *That film is not my verdict.*

Then lock the phone. Eyes back on the training in front of you. You''re not on the ranking table. You''re following.',
    journal_prompt = 'Which direction does comparison pull you hardest — up, sideways, or down — and what would it look like to step off that table today?',
    updated_at     = now()
where day_number = 5;

update public.training_sessions_catalog
set title          = 'Tuesday Is Holy Ground',
    mental_skill_md = '### The truth

The God who meets you under the lights also meets you in the empty weight room. Same gaze. Same delight.

Zechariah spoke to people rebuilding after exile. Their foundation was small — nothing worth filming. His word to them wasn''t *don''t worry, it''ll grow into something impressive.* It was quieter: the eyes of the Lord that range over the whole earth rejoice when they land here. On the small thing.

### What you face

The warmup. The stretch you almost skipped. The drill no one filmed. These aren''t the throwaway hours of your athletic life. They are your athletic life. Most of who you become gets built here, not on game night.

### The reset

So pick one ordinary moment today — lacing up, the first rep — and land there with one sentence:

> *This counts. I''m here.*

Then do the thing. Not for an audience. Just present, in a moment God is already present in.

There''s no off-camera with Him. The Tuesday is holy ground.',
    journal_prompt = 'Which ordinary, unfilmed part of your training have you been treating as filler, and what shifts when you call it holy ground?',
    updated_at     = now()
where day_number = 6;

update public.training_sessions_catalog
set title          = 'Come, Don''t Earn',
    mental_skill_md = '### The truth

Rest is not something you earn. It''s something you receive.

Hear who this invitation is for. Not the strong. Not the proven. The weary. The burdened. Weariness isn''t what disqualifies you from this rest — it''s what qualifies you for it. And Christ isn''t adding to your load. He''s lifting the crushing yoke off your shoulders and handing you one shaped to fit.

### What you face

You know the off day. The film you open "just to check something." The nap you cut short because lying there feels like quitting. The guilt reps after a hard practice. The loop says rest means someone''s pulling ahead. It has it backward.

### The reset

At one rest moment today — the off day, a nap, an evening with no training — say one sentence:

> *I''m not behind. I''m being restored.*

One line. Let it interrupt the loop.

You''re not competing to earn rest, or worth, or a place. You already have one. So you can stop. You can come without earning your way in.',
    journal_prompt = 'Where does rest still feel like falling behind, and what would it take to receive it as restoration instead?',
    updated_at     = now()
where day_number = 7;

update public.training_sessions_catalog
set title          = 'Fully Known, Fully Held',
    mental_skill_md = '### The truth

You carry two versions of yourself most days. The polished one you show coaches and post online. The harsh one that runs you down at 11pm. Neither is the real you.

David wrote Psalm 139 as a man who''d been examined — sitting, rising, thinking, every honest corner. What he found there wasn''t surveillance. It was safety. To be known and not loved is our deepest fear. To be loved and not known is the loneliness most people live in. To be fully known and fully held — that''s the gospel. The One who already won sees the actual you, not the highlight reel, and holds you there.

### The reset

So you can stop performing for yourself. Pick one true sentence about your day. Not flattering. Not condemning. Just accurate: *I worked the warmup hard. I checked out partway through practice.* No editorial. You''re not fixing it. You''re letting it be seen.

That''s training from victory — honest, because honesty is safe here. You were already searched. You were already held.',
    journal_prompt = 'What is one accurate, un-edited sentence about today — not flattering, not condemning — that you can let simply be seen?',
    updated_at     = now()
where day_number = 8;

update public.training_sessions_catalog
set title          = 'Grace Meets the Mistake',
    mental_skill_md = '### The truth

Two things sit side by side today, and they don''t collapse into each other.

One is the in-game miss — the blown assignment, the lazy pass, the read you should have made a half-second sooner. After a miss, the mind reaches for one of two dodges: shrink it ("not a big deal") or swell it ("I''m trash"). Both feel like honesty. Neither is. Clean naming loosens the grip.

The other is heavier — the lie you told, the corner you cut when no one was watching. John writes to people pulling toward two errors: pretending they have no sin, or sinking under the ones they''ve got. He cuts down the middle. Sin is real. So is the grace that meets it. Forgiveness rests on God being faithful and just — not on you finding the right words. You bring the actual thing into the light, not the cleaned-up version, and you are met.

### The reset

Same posture under both: don''t hide. So at the next mistake today, one sentence:

> *That happened. Next.*

Two beats. Don''t argue with it. Eyes back on the play.',
    journal_prompt = 'Where have you been either shrinking or swelling a mistake instead of naming it cleanly, and what would honest naming sound like?',
    updated_at     = now()
where day_number = 9;

update public.training_sessions_catalog
set title          = 'Sent Out From Delight',
    mental_skill_md = '### The truth

Zephaniah 3:17 doesn''t drop from a sentimental sky. It lands at the end of a hard book — pages of judgment first, then this: *he will take great delight in you... he will rejoice over you with singing.* A God who looked closely at the real problem, dealt with it in Christ, and on the other side of that, delights in you. Not your last game. You.

### What you face

In the car on the way there. The locker room before warmups. Your internal monologue is running, and you haven''t noticed what it sounds like. Listen. If it sounds like a job interview — proving you belong, justifying your spot, earning the next chance — you''re auditioning. Most athletes never hear it. They just feel tight and don''t know why.

### The reset

Before your next game, say one sentence under your breath:

> *I''m not going in to earn this. I''m going in because I''m already here.*

Free competing comes from arriving, not auditioning. You''re not going in to be wanted. You''re going in already wanted. Now go play.',
    journal_prompt = 'When you actually listen to your pregame monologue, does it sound like arriving or auditioning, and what would arriving sound like instead?',
    updated_at     = now()
where day_number = 10;

update public.training_sessions_catalog
set title          = 'Play Free, You''re Held',
    mental_skill_md = '### The truth

Fear asks one question: what if it falls apart? Faith answers with a Person, not a guarantee.

David wrote this as a soldier with real enemies — not a man whose troubles were imaginary. He doesn''t say "nothing will go wrong." He says the Lord is his light and his stronghold, so the fear has nowhere to land. The threat is real. The verdict on him is already settled.

### What you face

You feel it in your hands when the game''s on the line — grip too tight, legs heavy, playing not to lose. Tight hands cost you the very play you''re scared to miss. The fear is honest. It just doesn''t get to drive.

### The reset

When the grip tightens, breathe out and say it once:

> *I''m not playing scared. I''m already held.*

Then loosen the hands and go.

You don''t play free by feeling safe. You play free because you already are.',
    journal_prompt = 'Where does fear grip you tightest before you compete — and what would it look like to step into that exact moment held instead of afraid?',
    updated_at     = now()
where day_number = 11;

update public.training_sessions_catalog
set title          = 'Take the Shot',
    mental_skill_md = '### The truth

Hiding feels safe. It isn''t. The mistake you avoid by playing small is bigger than the one you risk.

Paul wrote this to Timothy, a young leader tempted to shrink back when things got hard. He doesn''t tell him to feel braver. He reminds him what the Spirit actually gives — power, love, self-discipline. Timidity wasn''t from God. So Timothy didn''t have to obey it.

### What you face

There''s a play you don''t make. You take the safer option instead, because if you miss the big one everyone sees it. So you disappear on purpose and call it smart. That''s not discipline. That''s fear wearing a disguise.

### The reset

Next time you feel yourself shrinking, name it and move:

> *Fear''s here. I take the shot anyway.*

Miss it clean rather than hide it clean.

A missed shot is a play. A shot never taken is a verdict you handed to fear. Take it.',
    journal_prompt = 'What''s one play you keep passing up because missing it in front of people scares you — and what is that fear actually protecting?',
    updated_at     = now()
where day_number = 12;

update public.training_sessions_catalog
set title          = 'Strength Isn''t Felt First',
    mental_skill_md = '### The truth

Courage is not a feeling you wait for. It''s a step you take before the feeling shows up — if it ever does.

God says this to Joshua at the edge of an impossible task, taking over from Moses. Notice what he doesn''t promise: easy, or comfortable, or even brave-feeling. He promises presence. *The Lord your God will be with you wherever you go.* The courage was never meant to come from Joshua''s nerves. It came from who was with him.

### What you face

You wait to feel ready before you commit — to the hard play, the fifty-fifty, the contact you''d rather avoid. The feeling rarely arrives first. So you hesitate, and the moment passes you by.

### The reset

At the edge of the play, don''t check your nerves. Decide:

> *I don''t feel it. I go anyway. He''s with me.*

Then go.

Courage isn''t the absence of fear. It''s moving while He''s with you, before you feel a thing.',
    journal_prompt = 'When have you waited to feel ready before acting — and what changed when you moved before the feeling came?',
    updated_at     = now()
where day_number = 13;

update public.training_sessions_catalog
set title          = 'Loved, So I Can Lose',
    mental_skill_md = '### The truth

Most of your fear in competition isn''t fear of failing. It''s fear of the verdict that comes after.

John writes that perfect love drives out fear, and he names why fear has such a grip — it "has to do with punishment." We brace for the sentence: the bench, the look, the silence in the car. But God''s love isn''t a reward for your good games. It came first, and it isn''t waiting to punish a bad one.

### What you face

You play stiff because part of you is competing to be approved — by the coach, the scout, the parent in the stands. So every rep becomes an audit. That''s exhausting, and it''s the wrong job.

### The reset

When you feel the audit start, hand the verdict back:

> *I''m not here to be approved. I''m already loved.*

Then play loose.

You can risk the loss because the love isn''t on the line. It never was.',
    journal_prompt = 'Whose verdict are you playing to earn right now — and what would change if you stepped into competition already certain of God''s love?',
    updated_at     = now()
where day_number = 14;

update public.training_sessions_catalog
set title          = 'Afraid and Still In',
    mental_skill_md = '### The truth

You don''t have to wait until the fear is gone to trust. Trust is what you do while you''re still afraid.

David wrote this on the worst day — captured by enemies, genuinely scared. Look at the order: *When I am afraid, I put my trust in you.* He doesn''t trust instead of being afraid. He trusts in the middle of it. The fear and the faith are in the same sentence, the same moment.

### What you face

Late in the game, the fear hits — the play coming right at you, the ball loose with everything on the line. There''s no time to calm down first. You either trust right there or you freeze.

### The reset

The instant fear spikes, don''t fight it. Aim it:

> *When I''m afraid, I trust.*

Then make the read.

Courage isn''t a calm you find before the play. It''s trust you choose inside the fear, while the play is still live.',
    journal_prompt = 'Think of a moment fear hit you mid-play — what would it have looked like to trust God right there, without waiting to feel calm first?',
    updated_at     = now()
where day_number = 15;

update public.training_sessions_catalog
set title          = 'Small Things, Done Right',
    mental_skill_md = '### The truth

How you do the small thing is how you do everything. The little reps aren''t a warmup for character. They are the character.

Jesus says faithfulness in "very little" is the same faithfulness as in "much" — they''re not two different things, just two different sizes. The player you are in the drill nobody''s watching is the same player you''ll be when the game''s on the line. There''s no separate gear that switches on later.

### What you face

The last rep of a hard practice, legs gone, coach looking elsewhere. The rep you could rush, the detail you could fake. Nobody clocks it but you. That rep is where you''re actually built — or quietly cut corners.

### The reset

On the unseen rep, the one you could fake, choose it on purpose:

> *Small and seen by Him. That''s enough.*

Then do it right.

You''re not building a highlight. You''re becoming someone — one small, faithful rep at a time.',
    journal_prompt = 'Which small, unseen part of your training do you tend to coast through — and who are you becoming each time you do?',
    updated_at     = now()
where day_number = 16;

update public.training_sessions_catalog
set title          = 'Run to Finish, Not to Win',
    mental_skill_md = '### The truth

Train as hard as the medal-chasers. Just aim your effort at something the medal can''t give and can''t take.

Paul uses an athlete to make a point that cuts against the athlete: the crown they chase "will not last." He''s not against strict training — he praises it. He''s relocating the prize. The discipline is real and good. But it''s aimed past the trophy, at a faithfulness that outlasts every season you''ll ever play.

### What you face

You can pour everything into a season and still not make the team, still not get the call. If the earthly prize is the whole point, that outcome empties the work. It doesn''t have to.

### The reset

When the result feels like the only thing that matters, re-aim:

> *I train to be faithful, not to be crowned.*

Then put in the work anyway.

The trophy can be lost, shared, or never won. Faithfulness can''t be taken. Train for the crown that lasts.',
    journal_prompt = 'If a season of your hardest work didn''t produce the result you wanted, what would still have made it worth it?',
    updated_at     = now()
where day_number = 17;

update public.training_sessions_catalog
set title          = 'The Long Obedience',
    mental_skill_md = '### The truth

Most quitting doesn''t happen in the loud failures. It happens in the quiet stretch where nothing seems to be working and nobody''s noticing.

Paul knows the real threat isn''t dramatic collapse — it''s growing "weary in doing good." The slow erosion. He answers it with timing: *at the proper time* you''ll reap, not on your schedule. The harvest is real, but it''s later, and the only condition is not giving up before it comes.

### What you face

You''re putting in the work and the results are flat. No jump in playing time, no notice from the coach, no obvious payoff. The temptation isn''t to blow up. It''s to quietly stop trying so hard.

### The reset

In the silent stretch, when results haven''t come, hold the line:

> *I don''t quit because it''s quiet.*

Then do today''s work.

Faithfulness in the quiet isn''t wasted. The harvest isn''t a promised spot or more playing time — it''s who you''re becoming, growing where you can''t yet see it.',
    journal_prompt = 'Where are you putting in work that hasn''t paid off yet — and what''s the temptation when nobody seems to notice?',
    updated_at     = now()
where day_number = 18;

update public.training_sessions_catalog
set title          = 'Trained by What''s Hard',
    mental_skill_md = '### The truth

The hard thing in front of you might not be punishment. It might be the exact thing forming you into who you''re becoming.

Hebrews is honest: discipline doesn''t feel good "at the time." It''s painful. The writer doesn''t pretend otherwise. But he reframes what it is — not a verdict against you, a training that produces something later: a harvest "for those who have been trained by it." The pain is real. So is the forming happening underneath it.

### What you face

The brutal practice. The role you didn''t want. The hard conversation with a coach. In the moment it feels like you''re being singled out, sentenced. That reading turns formation into condemnation.

### The reset

When the hard thing feels like a punishment, name what it actually is:

> *This is forming me, not punishing me.*

Then lean in instead of bracing against it.

God isn''t sentencing you in the hard season. He''s training a player only that season could make.',
    journal_prompt = 'What''s hard for you right now that feels like punishment — and how would you face it differently if it were forming you instead?',
    updated_at     = now()
where day_number = 19;

update public.training_sessions_catalog
set title          = 'Strong, Not Scattered',
    mental_skill_md = '### The truth

Effort isn''t the same as direction. You can work brutally hard and still be running nowhere.

Paul says he doesn''t "run aimlessly" or "beat the air" — wasted motion that looks like effort but lands on nothing. His self-control isn''t random intensity. It''s aimed. Every ounce of discipline points at something specific, because energy with no target just exhausts you and moves nothing.

### What you face

You go hard in practice but scattered — full-speed reps with no focus, fixing nothing, just sweating. It feels like work. At the end you''re tired but no better. Effort without a target is just fatigue.

### The reset

Before the drill, before the rep, give the energy a job:

> *Every rep has a target.*

Pick one thing to sharpen. Aim there.

Intensity isn''t the goal. Intensity pointed at something is. Don''t beat the air — strike a blow that lands.',
    journal_prompt = 'Where do you go hard without a target — and what one specific thing could each rep actually aim at?',
    updated_at     = now()
where day_number = 20;

update public.training_sessions_catalog
set title          = 'Hand It Over',
    mental_skill_md = '### The truth

Carrying the weight doesn''t prove you''re tough. It just means you''re holding something you were never meant to hold alone.

Peter writes "cast all your anxiety on him" to people under real pressure — and he gives a reason that isn''t a technique: *because he cares for you.* This isn''t "think positive." It''s a handoff. The weight is real and it''s heavy. The point is whose hands it''s supposed to end up in.

### What you face

The night before the big game, the pressure piles up — expectations, the depth chart, the scout in the stands. You lie there carrying all of it like holding it tighter will help. It won''t. It just steals the rest you need.

### The reset

When the weight stacks up, picture handing it over and say it:

> *This is yours. I let it go.*

Then breathe. You''re not in charge of the outcome.

You weren''t built to carry the weight alone. Hand it to the One who actually can.',
    journal_prompt = 'What weight are you carrying right now that you''ve never actually handed to God — and what''s it costing you to hold it?',
    updated_at     = now()
where day_number = 21;

update public.training_sessions_catalog
set title          = 'Anxious? Ask, Don''t Spiral',
    mental_skill_md = '### The truth

Anxiety and prayer point at the same thing — the future you can''t control. One spins on it. The other hands it over.

Paul doesn''t just say "don''t be anxious." He gives the swap: instead of spinning, "present your requests to God." And he doesn''t promise the problem disappears. He promises a peace that "transcends understanding" will guard you — stand watch over your mind — even before anything is solved.

### What you face

The worry loop runs the same three feet of track all night — the matchup, the mistake you might make, what they''ll think. Spinning feels like preparing. It isn''t. It just wears the same groove deeper.

### The reset

When you catch the loop, break it by turning the worry into a sentence you say to God:

> *I''ll ask instead of spin.*

Name the actual fear. Hand it over. Then stop.

Spinning changes nothing. Asking changes who''s holding it. Let the peace stand guard.',
    journal_prompt = 'What worry have you been spinning on instead of actually praying about — and what would it look like to hand it over tonight?',
    updated_at     = now()
where day_number = 22;

update public.training_sessions_catalog
set title          = 'Whose Approval Am I After?',
    mental_skill_md = '### The truth

You cannot play for two verdicts at once. Sooner or later, the crowd''s approval and God''s settled love pull in opposite directions, and you have to know which one names you.

Paul asks the question straight: am I trying to win human approval, or God''s? He''s not against people. He''s against being ruled by their verdict — because a player owned by the crowd''s opinion will bend everything to keep it. The approval you''re already given frees you from the approval you''re always chasing.

### What you face

You feel it in how you play to the stands — pressing when the scout is there, deflating at one disappointed look. When your worth rides on the room''s reaction, every rep becomes a referendum, and you lose the freedom to just compete.

### The reset

When you feel yourself playing to the crowd, re-aim the whole thing:

> *For the One already pleased.*

One audience. Then play for that One alone.

The crowd''s verdict shifts every game. His doesn''t. Play for the approval you already have.',
    journal_prompt = 'Whose reaction in the stands or locker room has the most power over how you feel about yourself — and what does it mean that God''s verdict is already settled?',
    updated_at     = now()
where day_number = 23;

update public.training_sessions_catalog
set title          = 'One Day at a Time',
    mental_skill_md = '### The truth

You can only play the moment you''re in. Tomorrow''s game isn''t yours to play yet — so it isn''t yours to carry yet either.

Jesus says don''t worry about tomorrow, and his reason is kind, not harsh: today already has enough in it. He''s not telling you to stop caring. He''s telling you to stop hauling tomorrow''s weight into today, where you can''t do anything with it anyway.

### What you face

You''re in practice but your head is three days ahead — the big game, the tryout, the test. Living in tomorrow means you''re not really here, and you lose the rep that''s actually in front of you.

### The reset

When your mind jumps ahead, pull it back to right now:

> *Today''s enough. I''ll play the moment I''m in.*

Then do the next thing in front of you.

God gives you grace for today. Tomorrow gets its own. Play the moment you''re in.',
    journal_prompt = 'What future moment are you carrying around today that you can''t do anything about yet — and what''s right in front of you instead?',
    updated_at     = now()
where day_number = 24;

update public.training_sessions_catalog
set title          = 'My Heart May Fail',
    mental_skill_md = '### The truth

Sometimes you don''t bounce back. You give everything and still fall short, and there''s no spin that makes it not hurt. That''s where this verse actually lives.

The psalmist isn''t pretending. He says it plainly: *my flesh and my heart may fail.* He doesn''t deny the failure or rush past it. He just refuses to let it be the last word. God is "the strength of my heart and my portion" — not instead of the failure, but underneath it, holding when his own strength gave out.

### What you face

You had the moment and you didn''t deliver. The miss everyone saw. Days like that, "shake it off" is an insult — the failure is real and it costs something. You''re allowed to feel that fully.

### The reset

When you''ve genuinely fallen short and it stings, don''t deny it. Anchor below it:

> *My game failed. He didn''t.*

Sit with the loss. Then stand on what didn''t move.

Your performance can collapse. Your portion can''t. He''s the strength underneath the failure, not a way around it.',
    journal_prompt = 'When you''ve genuinely fallen short and it hurt, what does it change to know God was the strength underneath, not just a way to feel better fast?',
    updated_at     = now()
where day_number = 25;

update public.training_sessions_catalog
set title          = 'Lead by Serving',
    mental_skill_md = '### The truth

The world ranks leadership by who''s above you. Jesus flips it: real greatness is measured by who you lift.

His disciples were jockeying for position — who''s first, who''s most important. Jesus doesn''t scold the desire for greatness; he redefines it. "Whoever wants to be first must be slave of all." Then he points at himself: the Son of Man came "not to be served, but to serve." The model isn''t a boss. It''s a servant who spent himself for others.

### What you face

A captain''s title, a leadership role, seniority — and the pull to lead by status. Barking, ranking, reminding people where they stand. That''s authority spent on yourself. It builds nothing in the room.

### The reset

When you''re tempted to lead by pulling rank, flip it:

> *I lead by lifting, not by ranking.*

Find one teammate to serve today.

You don''t lead by climbing over the room. You lead by getting underneath it and lifting.',
    journal_prompt = 'Where do you tend to lead by status instead of service — and who on your team could you actually lift this week?',
    updated_at     = now()
where day_number = 26;

update public.training_sessions_catalog
set title          = 'Don''t Coast on Your Age',
    mental_skill_md = '### The truth

You don''t earn the right to lead by getting older. You earn it by how you show up — starting now.

Paul tells young Timothy not to let his age disqualify him, but notice the answer he gives: *set an example.* He doesn''t say "wait until you have seniority." He says your conduct, right now, is the credential. Influence doesn''t come from your spot on the roster. It comes from who you are when people are watching and when they''re not.

### What you face

You think leadership is for the captains, the older players, the ones with the title. So you coast — figure your example doesn''t matter yet. But the younger players are already watching how you practice, how you lose, how you treat people.

### The reset

When you think you''re too young or low on the depth chart to matter, decide otherwise:

> *My example sets the tone.*

Then set it on purpose today.

You don''t need a title to lead. You need a life worth copying.',
    journal_prompt = 'Who''s watching how you compete and carry yourself right now — and what example are you actually setting, title or no title?',
    updated_at     = now()
where day_number = 27;

update public.training_sessions_catalog
set title          = 'Count It, Don''t Chase It',
    mental_skill_md = '### The truth

The never-enough loop always wants the next thing. Gratitude stops, looks at what''s already here, and names it.

Paul says "give thanks in all circumstances" — not in the good ones only, in all of them. That''s not pretending hard things are fine. It''s the discipline of noticing what''s true and good even on an ordinary day, instead of always sprinting toward the thing you don''t have yet.

### What you face

You make the team and immediately want the next spot. Win, and you''re already chasing the next win. The bar keeps moving, and you never actually arrive. The chase feels like drive. It''s really a leak.

### The reset

Tonight, before you chase tomorrow, stop and count:

> *Three gifts, named. Then I go.*

Name three real things from today. Out loud or written. Then rest.

The chase says you''re not there yet. Gratitude says look what you''ve already been given.',
    journal_prompt = 'What''s one thing from today you blew past without noticing because you were already chasing the next thing?',
    updated_at     = now()
where day_number = 28;

update public.training_sessions_catalog
set title          = 'Mercies for This Morning',
    mental_skill_md = '### The truth

You don''t have to drag yesterday''s failure into today''s practice. The grace you need for today is brand new this morning — it didn''t carry over your debt.

These words sit in the book of Lamentations — written in the rubble, in real grief. Right in the middle of it: *his compassions never fail. They are new every morning.* The mercy isn''t rationed or worn out by yesterday. Every single morning, it''s fresh. That''s how you persevere — not on leftover strength, on grace renewed daily.

### What you face

A bad game, a hard week, and you wake up still carrying it — like today starts in the hole, owing something. So you press, trying to make up for yesterday, and you play tight.

### The reset

In the morning, before you bring yesterday with you, leave it:

> *Yesterday''s done. Today''s mercy is new.*

Then start today clean.

You''re not running on yesterday''s fumes. You''re running on mercy that''s new this morning.',
    journal_prompt = 'What from yesterday are you still carrying into today — and what would it look like to start this morning on grace that''s actually new?',
    updated_at     = now()
where day_number = 29;

update public.training_sessions_catalog
set title          = 'Eyes on the One Who Won',
    mental_skill_md = '### The truth

You don''t run this race to win a victory. You run it from one that''s already been won.

This is where all thirty days have been pointing. Hebrews says run "fixing our eyes on Jesus" — the pioneer who already ran his race, endured the cross, and "sat down." That last part matters: he sat. The work is finished. You''re not competing to earn a standing. You''re running from the standing he already secured.

### What you face

After thirty days, the old pull is still there — to make the next game prove you, the next season name you, the scoreboard settle who you are. That treadmill never ends. There''s another way to run.

### The reset

Whenever the race feels like it''s for your worth, remember where you''re running from:

> *The race is already won. I run from it, not for it.*

Eyes up. Then run.

He already finished and sat down. You compete from his victory — never toward your own.',
    journal_prompt = 'After these thirty days, what''s one way you can tell the difference between competing from victory and competing toward it — and where do you still catch yourself doing the second?',
    updated_at     = now()
where day_number = 30;

commit;
