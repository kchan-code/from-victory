-- =============================================================================
-- Migration: 20260605000000_seed_training_sessions_days_11_30.sql
--
-- Purpose (FV-9 — "Days 11-30 daily training content"):
--   Seed days 11-30 of the From Victory Core Identity Track into
--   public.training_sessions_catalog, completing the 30-day launch arc
--   (days 1-10 were seeded by 20260523120000 and re-cut to the lighter
--   format by 20260604120000). Hockey only; basketball is FV-32, tennis
--   FV-51 — the (day_number, sport) key leaves room for them.
--
-- Format (FV-23 locked):
--   Each body (mental_skill_md) runs <=190 words and carries the standing
--   scannable header rhythm "### The truth" / "### What you face" /
--   "### The reset", with the single-move reset set off as a `>` blockquote.
--   The verse stays in the card (no progressive-disclosure fold). NIV cited.
--
-- Arc (days 11-30):
--   11-15 Courage / playing free
--   16-20 Discipline / hidden faithfulness
--   21-25 Pressure / fear / comparison / approval
--   26-30 Leadership / gratitude / perseverance / competing FROM victory
--   Day 30 lands the 30-day journey on the home-page spine verse
--   (Hebrews 12:1-2) as the deliberate "compete from victory" capstone.
--   Each day uses a distinct primary scripture (none reused from days 1-10)
--   and a distinct single-move reset.
--
-- Authoring:
--   content-curator orchestration; scripture handling reviewed by
--   youth-pastor, hockey authenticity by hockey-expert, voice/arc by KC
--   (Tier-2). NIV throughout.
--
-- Idempotency:
--   ON CONFLICT (day_number, sport) DO NOTHING — re-running is safe. Future
--   content edits ship as their own UPDATE migration rather than re-running
--   this seed (same discipline as the days 1-10 seed).
--
-- Privacy model (for kids-privacy-officer):
--   - training_sessions_catalog is shared, athlete-readable content
--     (RLS: all authenticated users SELECT; service-role only writes).
--   - No PII; only authored content.
--   - Journal prompts are single-question, answerable privately, and never
--     ask the athlete to write anything awkward or to disclose to anyone.
--   - No content pathologizes normal sports stress. The failure-touching
--     day (Day 25) holds the loss honestly without shame and without
--     promising outcome reversal.
-- =============================================================================

insert into public.training_sessions_catalog
  (day_number, sport, title, mental_skill_md, scripture_ref, scripture_text, journal_prompt)
values

-- ---------------------------------------------------------------------------
-- Days 11-15 — Courage / playing free
-- ---------------------------------------------------------------------------
(
  11,
  'hockey',
  'Play Free, You''re Held',
  $session$### The truth

Fear asks one question: what if it falls apart? Faith answers with a Person, not a guarantee.

David wrote this as a soldier with real enemies — not a man whose troubles were imaginary. He doesn't say "nothing will go wrong." He says the Lord is his light and his stronghold, so the fear has nowhere to land. The threat is real. The verdict on him is already settled.

### What you face

You feel it in your hands before a big shift — the grip too tight, the legs heavy, playing not to lose. Tight hands cost you the very play you're scared to miss. The fear is honest. It just doesn't get to drive.

### The reset

When the grip tightens, breathe out and say it once:

> *I'm not playing scared. I'm already held.*

Then loosen the hands and go.

You don't play free by feeling safe. You play free because you already are.$session$,
  'Psalm 27:1',
  'The Lord is my light and my salvation— whom shall I fear? The Lord is the stronghold of my life— of whom shall I be afraid?',
  $prompt$Where does fear grip you tightest before you compete — and what would it look like to step into that exact moment held instead of afraid?$prompt$
),

(
  12,
  'hockey',
  'Take the Shot',
  $session$### The truth

Hiding feels safe. It isn't. The mistake you avoid by playing small is bigger than the one you risk.

Paul wrote this to Timothy, a young leader tempted to shrink back when things got hard. He doesn't tell him to feel braver. He reminds him what the Spirit actually gives — power, love, self-discipline. Timidity wasn't from God. So Timothy didn't have to obey it.

### What you face

There's a shot you don't take. A pass you make instead, safer, because if you miss the big one everyone sees it. So you disappear on purpose and call it smart. That's not discipline. That's fear wearing a disguise.

### The reset

Next time you feel yourself shrinking, name it and move:

> *Fear's here. I take the shot anyway.*

Miss it clean rather than hide it clean.

A missed shot is a play. A shot never taken is a verdict you handed to fear. Take it.$session$,
  '2 Timothy 1:7',
  'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.',
  $prompt$What's one play you keep avoiding because missing it in front of people scares you — and what is that fear actually protecting?$prompt$
),

(
  13,
  'hockey',
  'Strength Isn''t Felt First',
  $session$### The truth

Courage is not a feeling you wait for. It's a step you take before the feeling shows up — if it ever does.

God says this to Joshua at the edge of an impossible task, taking over from Moses. Notice what he doesn't promise: easy, or comfortable, or even brave-feeling. He promises presence. *The Lord your God will be with you wherever you go.* The courage was never meant to come from Joshua's nerves. It came from who was with him.

### What you face

You wait to feel ready before you commit — to the hit, the corner, the hard backcheck. The feeling rarely arrives first. So you hesitate, and the moment passes you by.

### The reset

At the edge of the play, don't check your nerves. Decide:

> *I don't feel it. I go anyway. He's with me.*

Then go.

Courage isn't the absence of fear. It's moving while He's with you, before you feel a thing.$session$,
  'Joshua 1:9',
  'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
  $prompt$When have you waited to feel ready before acting — and what changed when you moved before the feeling came?$prompt$
),

(
  14,
  'hockey',
  'Loved, So I Can Lose',
  $session$### The truth

Most of your fear on the ice isn't fear of failing. It's fear of the verdict that comes after.

John writes that perfect love drives out fear, and he names why fear has such a grip — it "has to do with punishment." We brace for the sentence: the bench, the look, the silence in the car. But God's love isn't a reward for your good games. It came first, and it isn't waiting to punish a bad one.

### What you face

You play stiff because part of you is competing to be approved — by the coach, the scout, the parent in the stands. So every shift becomes an audit. That's exhausting, and it's the wrong job.

### The reset

When you feel the audit start, hand the verdict back:

> *I'm not here to be approved. I'm already loved.*

Then play loose.

You can risk the loss because the love isn't on the line. It never was.$session$,
  '1 John 4:18',
  'There is no fear in love. But perfect love drives out fear, because fear has to do with punishment. The one who fears is not made perfect in love.',
  $prompt$Whose verdict are you playing to earn right now — and what would change if you walked in already certain of God's love?$prompt$
),

(
  15,
  'hockey',
  'Afraid and Still In',
  $session$### The truth

You don't have to wait until the fear is gone to trust. Trust is what you do while you're still afraid.

David wrote this on the worst day — captured by enemies, genuinely scared. Look at the order: *When I am afraid, I put my trust in you.* He doesn't trust instead of being afraid. He trusts in the middle of it. The fear and the faith are in the same sentence, the same moment.

### What you face

Mid-shift, the fear hits — a fast forward bearing down, a puck bouncing your way with the game on the line. There's no time to calm down first. You either trust right there or you freeze.

### The reset

The instant fear spikes, don't fight it. Aim it:

> *When I'm afraid, I trust.*

Then make the read.

Courage isn't a calm you find before the play. It's trust you choose inside the fear, while the play is still live.$session$,
  'Psalm 56:3-4',
  'When I am afraid, I put my trust in you. In God, whose word I praise— in God I trust and am not afraid. What can mere mortals do to me?',
  $prompt$Think of a moment fear hit mid-play — what would it have looked like to trust God right there, without waiting to feel calm first?$prompt$
),

-- ---------------------------------------------------------------------------
-- Days 16-20 — Discipline / hidden faithfulness
-- ---------------------------------------------------------------------------
(
  16,
  'hockey',
  'Small Things, Done Right',
  $session$### The truth

How you do the small thing is how you do everything. The little reps aren't a warmup for character. They are the character.

Jesus says faithfulness in "very little" is the same faithfulness as in "much" — they're not two different things, just two different sizes. The player you are in the drill nobody's watching is the same player you'll be when the game's on the line. There's no separate gear that switches on later.

### What you face

The last rep of a hard practice, legs gone, coach looking elsewhere. The cone you could round lazily. Nobody clocks it but you. That rep is where you're actually built — or quietly cut corners.

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
  'hockey',
  'Run to Finish, Not to Win',
  $session$### The truth

Train as hard as the medal-chasers. Just aim your effort at something the medal can't give and can't take.

Paul uses an athlete to make a point that cuts against the athlete: the crown they chase "will not last." He's not against strict training — he praises it. He's relocating the prize. The discipline is real and good. But it's aimed past the trophy, at a faithfulness that outlasts every season you'll ever play.

### What you face

You can pour everything into a season and still not make the team, still not get the call. If the earthly prize is the whole point, that outcome empties the work. It doesn't have to.

### The reset

When the result feels like the only thing that matters, re-aim:

> *I train to be faithful, not to be crowned.*

Then put in the work anyway.

The trophy can be lost, shared, or never won. Faithfulness can't be taken. Train for the crown that lasts.$session$,
  '1 Corinthians 9:24-25',
  'Do you not know that in a race all the runners run, but only one gets the prize? Run in such a way as to get the prize. Everyone who competes in the games goes into strict training. They do it to get a crown that will not last, but we do it to get a crown that will last forever.',
  $prompt$If a season of your hardest work didn't produce the result you wanted, what would still have made it worth it?$prompt$
),

(
  18,
  'hockey',
  'The Long Obedience',
  $session$### The truth

Most quitting doesn't happen in the loud failures. It happens in the quiet stretch where nothing seems to be working and nobody's noticing.

Paul knows the real threat isn't dramatic collapse — it's growing "weary in doing good." The slow erosion. He answers it with timing: *at the proper time* you'll reap, not on your schedule. The harvest is real, but it's later, and the only condition is not giving up before it comes.

### What you face

You're putting in the work and the results are flat. No jump in ice time, no notice from the coach, no obvious payoff. The temptation isn't to blow up. It's to quietly stop trying so hard.

### The reset

In the silent stretch, when results haven't come, hold the line:

> *I don't quit because it's quiet.*

Then do today's work.

Faithfulness in the quiet isn't wasted. The harvest isn't a promised spot or more ice time — it's who you're becoming, growing where you can't yet see it.$session$,
  'Galatians 6:9',
  'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.',
  $prompt$Where are you putting in work that hasn't paid off yet — and what's the temptation when nobody seems to notice?$prompt$
),

(
  19,
  'hockey',
  'Trained by What''s Hard',
  $session$### The truth

The hard thing in front of you might not be punishment. It might be the exact thing forming you into who you're becoming.

Hebrews is honest: discipline doesn't feel good "at the time." It's painful. The writer doesn't pretend otherwise. But he reframes what it is — not a verdict against you, a training that produces something later: a harvest "for those who have been trained by it." The pain is real. So is the forming happening underneath it.

### What you face

The brutal practice. The role you didn't want. The hard conversation with a coach. In the moment it feels like you're being singled out, sentenced. That reading turns formation into condemnation.

### The reset

When the hard thing feels like a punishment, name what it actually is:

> *This is forming me, not punishing me.*

Then lean in instead of bracing against it.

God isn't sentencing you in the hard season. He's training a player only that season could make.$session$,
  'Hebrews 12:11',
  'No discipline seems pleasant at the time, but painful. Later on, however, it produces a harvest of righteousness and peace for those who have been trained by it.',
  $prompt$What's hard for you right now that feels like punishment — and how would you face it differently if it were forming you instead?$prompt$
),

(
  20,
  'hockey',
  'Strong, Not Scattered',
  $session$### The truth

Effort isn't the same as direction. You can work brutally hard and still be running nowhere.

Paul says he doesn't "run aimlessly" or "beat the air" — wasted motion that looks like effort but lands on nothing. His self-control isn't random intensity. It's aimed. Every ounce of discipline points at something specific, because energy with no target just exhausts you and moves nothing.

### What you face

You go hard in practice but scattered — full-speed reps with no focus, fixing nothing, just sweating. It feels like work. At the end you're tired but no better. Effort without a target is just fatigue.

### The reset

Before the drill, before the rep, give the energy a job:

> *Every rep has a target.*

Pick one thing to sharpen. Aim there.

Intensity isn't the goal. Intensity pointed at something is. Don't beat the air — strike a blow that lands.$session$,
  '1 Corinthians 9:26-27',
  'Therefore I do not run like someone running aimlessly; I do not fight like a boxer beating the air. No, I strike a blow to my body and make it my slave so that after I have preached to others I myself will not be disqualified for the prize.',
  $prompt$Where do you go hard without a target — and what one specific thing could each rep actually aim at?$prompt$
),

-- ---------------------------------------------------------------------------
-- Days 21-25 — Pressure / fear / comparison / approval
-- ---------------------------------------------------------------------------
(
  21,
  'hockey',
  'Hand It Over',
  $session$### The truth

Carrying the weight doesn't prove you're tough. It just means you're holding something you were never meant to hold alone.

Peter writes "cast all your anxiety on him" to people under real pressure — and he gives a reason that isn't a technique: *because he cares for you.* This isn't "think positive." It's a handoff. The weight is real and it's heavy. The point is whose hands it's supposed to end up in.

### What you face

The night before the big game, the pressure piles up — expectations, the depth chart, the scout in the stands. You lie there carrying all of it like holding it tighter will help. It won't. It just steals the rest you need.

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
  'hockey',
  'Anxious? Ask, Don''t Spiral',
  $session$### The truth

Anxiety and prayer point at the same thing — the future you can't control. One spins on it. The other hands it over.

Paul doesn't just say "don't be anxious." He gives the swap: instead of spinning, "present your requests to God." And he doesn't promise the problem disappears. He promises a peace that "transcends understanding" will guard you — stand watch over your mind — even before anything is solved.

### What you face

The worry loop runs the same three feet of track all night — the matchup, the mistake you might make, what they'll think. Spinning feels like preparing. It isn't. It just wears the same groove deeper.

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
  'hockey',
  'Whose Approval Am I After?',
  $session$### The truth

You cannot play for two verdicts at once. Sooner or later, the crowd's approval and God's settled love pull in opposite directions, and you have to know which one names you.

Paul asks the question straight: am I trying to win human approval, or God's? He's not against people. He's against being ruled by their verdict — because a player owned by the crowd's opinion will bend everything to keep it. The approval you're already given frees you from the approval you're always chasing.

### What you face

You feel it in how you play to the stands — pressing when the scout is there, deflating at one disappointed look. When your worth rides on the room's reaction, every shift becomes a referendum, and you lose the freedom to just compete.

### The reset

When you feel yourself playing to the crowd, re-aim the whole thing:

> *For the One already pleased.*

One audience. Then play for that One alone.

The crowd's verdict shifts every period. His doesn't. Play for the approval you already have.$session$,
  'Galatians 1:10',
  'Am I now trying to win the approval of human beings, or of God? Or am I trying to please people? If I were still trying to please people, I would not be a servant of Christ.',
  $prompt$Whose reaction in the stands or locker room has the most power over how you feel about yourself — and what does it mean that God's verdict is already settled?$prompt$
),

(
  24,
  'hockey',
  'One Day at a Time',
  $session$### The truth

You can only play the shift you're in. Tomorrow's game isn't yours to play yet — so it isn't yours to carry yet either.

Jesus says don't worry about tomorrow, and his reason is kind, not harsh: today already has enough in it. He's not telling you to stop caring. He's telling you to stop hauling tomorrow's weight into today, where you can't do anything with it anyway.

### What you face

You're in practice but your head is three days ahead — the big game, the tryout, the test. Living in tomorrow means you're not really here, and you lose the rep that's actually in front of you.

### The reset

When your mind jumps ahead, pull it back to right now:

> *Today's enough. I'll play the shift I'm in.*

Then do the next thing in front of you.

God gives you grace for today. Tomorrow gets its own. Play the shift you're in.$session$,
  'Matthew 6:34',
  'Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.',
  $prompt$What future moment are you carrying around today that you can't do anything about yet — and what's right in front of you instead?$prompt$
),

(
  25,
  'hockey',
  'My Heart May Fail',
  $session$### The truth

Sometimes you don't bounce back. You give everything and still fall short, and there's no spin that makes it not hurt. That's where this verse actually lives.

The psalmist isn't pretending. He says it plainly: *my flesh and my heart may fail.* He doesn't deny the failure or rush past it. He just refuses to let it be the last word. God is "the strength of my heart and my portion" — not instead of the failure, but underneath it, holding when his own strength gave out.

### What you face

You had the moment and you didn't deliver. The miss everyone saw. Days like that, "shake it off" is an insult — the failure is real and it costs something. You're allowed to feel that fully.

### The reset

When you've genuinely fallen short and it stings, don't deny it. Anchor below it:

> *My game failed. He didn't.*

Sit with the loss. Then stand on what didn't move.

Your performance can collapse. Your portion can't. He's the strength underneath the failure, not a way around it.$session$,
  'Psalm 73:26',
  'My flesh and my heart may fail, but God is the strength of my heart and my portion forever.',
  $prompt$When you've genuinely fallen short and it hurt, what does it change to know God was the strength underneath, not just a way to feel better fast?$prompt$
),

-- ---------------------------------------------------------------------------
-- Days 26-30 — Leadership / gratitude / perseverance / competing FROM victory
-- ---------------------------------------------------------------------------
(
  26,
  'hockey',
  'Lead by Serving',
  $session$### The truth

The world ranks leadership by who's above you. Jesus flips it: real greatness is measured by who you lift.

His disciples were jockeying for position — who's first, who's most important. Jesus doesn't scold the desire for greatness; he redefines it. "Whoever wants to be first must be slave of all." Then he points at himself: the Son of Man came "not to be served, but to serve." The model isn't a boss. It's a servant who spent himself for others.

### What you face

A letter on your jersey, a leadership role, seniority — and the pull to lead by status. Barking, ranking, reminding people where they stand. That's authority spent on yourself. It builds nothing in the room.

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
  'hockey',
  'Don''t Coast on Your Age',
  $session$### The truth

You don't earn the right to lead by getting older. You earn it by how you show up — starting now.

Paul tells young Timothy not to let his age disqualify him, but notice the answer he gives: *set an example.* He doesn't say "wait until you have seniority." He says your conduct, right now, is the credential. Influence doesn't come from your spot on the roster. It comes from who you are when people are watching and when they're not.

### What you face

You think leadership is for the captains, the older guys, the ones with the letter. So you coast — figure your example doesn't matter yet. But the younger players are already watching how you practice, how you lose, how you treat people.

### The reset

When you think you're too young or low on the depth chart to matter, decide otherwise:

> *My example sets the tone.*

Then set it on purpose today.

You don't need a title to lead. You need a life worth copying.$session$,
  '1 Timothy 4:12',
  'Don''t let anyone look down on you because you are young, but set an example for the believers in speech, in conduct, in love, in faith and in purity.',
  $prompt$Who's watching how you compete and carry yourself right now — and what example are you actually setting, title or no title?$prompt$
),

(
  28,
  'hockey',
  'Count It, Don''t Chase It',
  $session$### The truth

The never-enough loop always wants the next thing. Gratitude stops, looks at what's already here, and names it.

Paul says "give thanks in all circumstances" — not in the good ones only, in all of them. That's not pretending hard things are fine. It's the discipline of noticing what's true and good even on an ordinary day, instead of always sprinting toward the thing you don't have yet.

### What you face

You make the team and immediately want the next line. Win, and you're already chasing the next win. The bar keeps moving, and you never actually arrive. The chase feels like drive. It's really a leak.

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
  'hockey',
  'Mercies for This Morning',
  $session$### The truth

You don't have to drag yesterday's failure into today's practice. The grace you need for today is brand new this morning — it didn't carry over your debt.

These words sit in the book of Lamentations — written in the rubble, in real grief. Right in the middle of it: *his compassions never fail. They are new every morning.* The mercy isn't rationed or worn out by yesterday. Every single morning, it's fresh. That's how you persevere — not on leftover strength, on grace renewed daily.

### What you face

A bad game, a hard week, and you wake up still carrying it — like today starts in the hole, owing something. So you press, trying to make up for yesterday, and you play tight.

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
  'hockey',
  'Eyes on the One Who Won',
  $session$### The truth

You don't run this race to win a victory. You run it from one that's already been won.

This is where all thirty days have been pointing. Hebrews says run "fixing our eyes on Jesus" — the pioneer who already ran his race, endured the cross, and "sat down." That last part matters: he sat. The work is finished. You're not competing to earn a standing. You're running from the standing he already secured.

### What you face

After thirty days, the old pull is still there — to make the next game prove you, the next season name you, the scoreboard settle who you are. That treadmill never ends. There's another way to run.

### The reset

Whenever the race feels like it's for your worth, remember where you're running from:

> *The race is already won. I run from it, not for it.*

Eyes up. Then run.

He already finished and sat down. You compete from his victory — never toward your own.$session$,
  'Hebrews 12:1-2',
  'Therefore, since we are surrounded by such a great cloud of witnesses, let us throw off everything that hinders and the sin that so easily entangles. And let us run with perseverance the race marked out for us, fixing our eyes on Jesus, the pioneer and perfecter of faith. For the joy set before him he endured the cross, scorning its shame, and sat down at the right hand of the throne of God.',
  $prompt$After these thirty days, what's one way you can tell the difference between competing from victory and competing toward it — and where do you still catch yourself doing the second?$prompt$
)

on conflict (day_number, sport) do nothing;
