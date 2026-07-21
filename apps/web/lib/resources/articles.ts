// Article registry for /resources SEO cornerstone section (FV-238).
//
// VERBATIM CONTENT: bodyMd fields are reproduced byte-for-byte from
// /tmp/fv238-final-articles.md (curator revision pass, 2026-06-12).
// Do NOT edit, trim, reflow, or re-wrap any bodyMd string. Scripture
// quotes were reconciled character-for-character against NIV; any
// diff from this source is a regression.
//
// AUTHORED HERE (flagged for KC review):
//   - excerpt field (one sentence per article — see AUTHORED note)
// All other fields come verbatim from the content source.
//
// `related` (FV-413): optional cross-links rendered by the page/render
// layer after the article body. `label` must be a verbatim reuse of the
// linked page's own title/h1 — see lib/gtm/page-titles.ts.
//
// 2026-07-10 (KC-requested content review): the closing CTA in the first
// three articles pointed to the pre-launch /#waitlist section. The app is
// live, so those three CTAs were swapped for the "Start a free trial" →
// /pricing pattern already used in articles 4-5. sha256 pins below and
// dateModified on the three articles were updated to match.

import {
  PREGAME_RITUAL_HREF,
  PREGAME_RITUAL_TITLE,
  PREGAME_RITUAL_EXCERPT,
  CHRISTIAN_ATHLETE_APPS_HREF,
  CHRISTIAN_ATHLETE_APPS_TITLE,
  CHRISTIAN_ATHLETE_APPS_EXCERPT,
} from "@/lib/gtm/page-titles";

export type ArticleAudience = "athlete" | "parent";

export interface RelatedLink {
  href: string;
  label: string; // verbatim reuse of the linked page's own title/h1
}

export interface ArticleImage {
  src: string; // self-hosted under /images/blog (FV-416)
  alt: string; // plain, factual — voice guardrails
  width: number;
  height: number;
}

export interface Article {
  slug: string;
  title: string; // H1 — used in <h1>, JSON-LD headline, og:title
  metaDescription: string; // ≤155 chars
  excerpt: string; // AUTHORED — 1-line card excerpt for the index
  audience: ArticleAudience;
  bodyMd: string; // verbatim from content source
  related?: RelatedLink[]; // FV-413 — cross-links, rendered after the body
  datePublished: string; // ISO date (FV-418) — merge date of the content
  dateModified: string; // ISO date (FV-418) — last substantive update
  image?: ArticleImage; // FV-416 — editorial hero, rendered between header and body
}

// ---------------------------------------------------------------------------
// ARTICLES — verbatim body content, AUTHORED excerpts flagged inline
// ---------------------------------------------------------------------------

const ARTICLES: Article[] = [
  {
    slug: "bible-verses-for-athletes-before-a-game",
    title: "12 Bible Verses for Athletes to Read Before a Game",
    metaDescription:
      "Twelve NIV Bible verses for athletes before a game, with short, identity-first reflections. Steady your nerves on who you already are in Christ.",
    // AUTHORED excerpt:
    excerpt:
      "Twelve NIV verses with identity-first reflections — to settle your nerves on who you already are before the first whistle.",
    audience: "athlete",
    datePublished: "2026-06-12",
    dateModified: "2026-07-10",
    image: {
      src: "/images/blog/bible-verses-before-a-game.jpg",
      alt: "Outdoor basketball hoop overlooking the sea in gray morning light",
      width: 1600,
      height: 1066,
    },
    bodyMd: `Before the warmup, before the anthem, before the first whistle, a lot of athletes are looking for something to hold onto. A verse on a wristband. A line a coach taped to a locker. Something to quiet the noise.

Here's the thing most pregame verse lists miss: Scripture before a game isn't a performance hack. It's not a spell you say to play better. The right verse doesn't make you a lock to win — it reminds you who you already are while you compete, win or lose.

That's the order that matters. **Your Identity Is Secure. Compete From Victory.** Not toward it. You're not playing to earn your standing tonight. You already have it. These verses are here to settle you back onto that ground.

Read a few before you lace up. Pick one to carry.

### Verses that anchor your identity

**Hebrews 12:1-2** — *"Let us run with perseverance the race marked out for us, fixing our eyes on Jesus, the pioneer and perfecter of faith."*
This is the foundation. You run the race God marked out for you, eyes fixed on the One who already finished his. You compete from his completed work, not toward a victory you have to earn. Start here.

**Romans 8:1** — *"Therefore, there is now no condemnation for those who are in Christ Jesus."*
The verdict on you was settled at the cross — before you ever stepped on the field. A bad game can't reopen a case God has already closed.

**Psalm 139:14** — *"I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well."*
Before you were an athlete, you were known and made on purpose. Your worth was set long before your stat line existed.

### Verses for nerves and fear

**Isaiah 41:10** — *"So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand."*
God said this to people in exile, facing real loss. "Do not fear" doesn't mean you stop feeling nervous. It means you're not alone in the moment.

**Philippians 4:6-7** — *"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."*
Paul wrote this from a prison cell. Peace here isn't the absence of pressure — it's the presence of Christ inside it.

**Joshua 1:9** — *"Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."*
Courage isn't the absence of fear. It's moving forward because the One with you is bigger than what's in front of you.

### Verses for effort and competing hard

**Colossians 3:23** — *"Whatever you do, work at it with all your heart, as working for the Lord, not for human masters."*
Working for the Lord doesn't mean playing harder to earn his love — you already have it. It means your effort becomes worship. The crowd isn't your final audience.

**1 Corinthians 9:24** — *"Do you not know that in a race all the runners run, but only one gets the prize? Run in such a way as to get the prize."*
Paul borrowed sports to describe the Christian life — but watch which prize he's after. The very next line names it: a crown "that will last forever" (9:25), not the medal that tarnishes. Train with intention and give your full effort, because the race that matters most has a prize nothing can take from you.

**Philippians 4:13** — *"I can do all this through him who gives me strength."*
Read in context, this isn't a victory guarantee. Paul is talking about contentment in any circumstance — whether well fed or hungry, he says a few lines up. Your strength to compete *and* to lose well both come from the same place.

### Verses for after the final whistle

**Lamentations 3:22-23** — *"Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness."*
The writer says this from inside real ruin, not after it cleared. Notice the subject: it's the Lord's love that holds you, not your own bounce-back. However tonight goes, his mercy meets you again tomorrow — fresh, before you've earned it back.

**Romans 8:37** — *"No, in all these things we are more than conquerors through him who loved us."*
Careful with this one. Read the verses right before it — "trouble or hardship or persecution or famine or nakedness or danger or sword" (8:35). *Those* are the "things." It's not a "we're going to win" line. Paul means none of that — not even loss — can separate you from the love of God. You're more than a conqueror even on the night you lose.

**Psalm 46:10** — *"He says, 'Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.'"*
This isn't a breathing trick to look composed. It's a relief: the outcome isn't resting on your shoulders. He is God, you are not — and that's where the calm comes from. Carry it into the quiet before the puck drops or the ball goes up.

### How to actually use these

Don't try to memorize all twelve. Pick one. Read it slow. Let it do one job — settle your nerves, or remind you who you are, or free you to compete. Then go play.

The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. That's the freedom these verses point to.

> **Try a pregame session.** Want a 5-minute guided routine that turns a verse like these into a calm, focused mind before you compete? **From Victory** builds it into your warmup. **Start a free trial** and run your first session before your next game. [Start your free trial →](/pricing)`,
  },

  {
    slug: "pre-game-nerves-christian-athlete-routine",
    title: "Pre-Game Nerves: A Christian Athlete's 5-Step Routine",
    metaDescription:
      "A simple, repeatable pre-game routine for Christian athletes — breath, identity, visualization, a cue word — to settle nerves and compete free.",
    // AUTHORED excerpt:
    excerpt:
      "A five-step repeatable routine — breath, identity, visualization, cue word, prayer — so nerves stop writing the story and you compete free.",
    audience: "athlete",
    datePublished: "2026-06-12",
    dateModified: "2026-07-10",
    image: {
      src: "/images/blog/pre-game-nerves.jpg",
      alt: "Goalie pads and skates beside the net, pucks on the ice",
      width: 1600,
      height: 1066,
    },
    related: [{ href: PREGAME_RITUAL_HREF, label: PREGAME_RITUAL_TITLE }],
    bodyMd: `Nerves before a game aren't a malfunction. They're energy. Your body is getting ready. The problem isn't that you feel them — the problem is when nerves start writing a story about who you are. *I'm not ready. I'm going to get exposed. It's all on me.*

You don't fix that with "just relax." You fix it with a routine — the same handful of moves, every time, so your mind has a rail to grab when the pressure climbs. Here's a five-step routine built on the same structure From Victory uses in its guided pregame session.

### Step 1 — Breathe (settle the body first)

You can't think your way calm when your breath is high and shallow. Start there. Make the exhale longer than the inhale — that's the part that tells your nervous system you're safe.

> Four counts in. Six counts out. Do it twice.

Slow breath first. Everything else stacks on top of it.

### Step 2 — Remember what's true (anchor your identity)

Once your body settles, your mind needs the truth — out loud or in your head:

> The worst game I play does not lower my standing with God. The best game I play does not raise it. I'm loved before I lace up. I'm loved after the final horn.

This is the core move. Nerves get loud because they treat the game as a verdict on you. It isn't. **Your Identity Is Secure. Compete From Victory** — from a standing you already have, not one you're trying to win tonight. The book of Hebrews puts it this way: *"Let us run with perseverance the race marked out for us, fixing our eyes on Jesus, the pioneer and perfecter of faith"* (Hebrews 12:1-2). You run from his finished race, not toward one you have to earn.

When that lands, the next line is true: *Nothing to prove. Nothing to protect. Everything to give.*

### Step 3 — See it before it happens (visualization)

Your brain rehearses what you feed it. So feed it the play you want.

Pick one moment you'll likely face tonight — a clean breakout, a catch-and-shoot off the closeout, a faceoff, a free throw — and run it in your head, start to finish. See yourself calm. See your feet ready before the ball arrives. See the clean release, the follow-through held.

Then rehearse one hard moment too — a turnover, a missed chance — and rehearse the *reset* after it: breathe, say the truth, make the next play. You're not hoping nothing goes wrong. You're deciding in advance how you'll answer when it does.

### Step 4 — Set a cue word (one word to come back to)

In the game you won't have time for a paragraph. You need one word.

Pick a single word that pulls you back to center when the pressure spikes: *Free. Compete. Next. Steady. Faithful.* When you turn it over, when the crowd gets loud, when your mind starts to race — come back to your breath and say your word. One word resets faster than a speech.

### Step 5 — Pray and send yourself off

Last, hand it over. It doesn't need to be eloquent:

> Father, thank you that I don't have to earn my worth tonight — it's already secure in you. Free me to play brave and loose and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. In Jesus' name, amen.

Then the send-off — the line you walk out on:

> I'm secure. Play free. Play brave. Give everything. Now play from victory.

### Why this works

None of these steps make you immune to nerves. That's not the goal. The goal is to stop letting nerves name you, so you can compete free — loose, brave, and fully in the game. Breath settles the body. Truth settles the identity. Visualization settles the plan. The cue word carries it into the action. Prayer hands it to the One already holding you.

Same routine, every game. That's how it becomes yours.

> **Try a pregame session.** From Victory turns these five steps into a real ~5-minute guided audio session — sport-aware, position-aware, voiced for the moment before you compete. **Start a free trial** and run it before your next game. [Start your free trial →](/pricing)`,
  },

  {
    slug: "how-to-bounce-back-after-a-bad-game",
    title: "How to Bounce Back After a Bad Game",
    metaDescription:
      "A bad game is information, not a verdict. A faith-grounded, no-shame way for athletes to reset, recover, and return after a rough night.",
    // AUTHORED excerpt:
    excerpt:
      "A bad game is information, not a verdict. A faith-grounded, no-shame reset process for after the hard nights.",
    audience: "athlete",
    datePublished: "2026-06-12",
    dateModified: "2026-07-10",
    image: {
      src: "/images/blog/bounce-back.jpg",
      alt: "Basketball rim and net lit against a dark gym",
      width: 1600,
      height: 1068,
    },
    bodyMd: `You know the ride home after a bad one. The replays running on a loop. The one turnover, the missed chance, the shift where everything went sideways. The quiet in the car that feels louder than the game did.

First thing: that's normal. It means you care. You're not broken for feeling it.

But here's what the bad game is trying to do, and what you don't have to let it: it's trying to turn a performance into a verdict. It happened on the ice or the floor, and now it's whispering something about *you*. There's a difference, and the difference is everything.

### A bad game is a performance event, not a verdict on you

The game can be reviewed. Your identity can't be touched by it. The turnover was real. The sentence the turnover is trying to write — *I'm not good enough, I don't belong, I let everyone down* — is fiction.

You're not talking yourself into feeling fine. You're refusing to let one game rewrite the player. The mistake is real. The verdict is false.

And if you follow Christ, the ground under you is even more solid than that. *"Therefore, there is now no condemnation for those who are in Christ Jesus"* (Romans 8:1). Keep the categories straight here: that verse isn't a grade on whether you played well tonight — it's the settled answer to a deeper question, your standing before God. That question got answered at the cross, long before tonight. A bad game can't reopen it. You are, at once, more flawed than you'd like to admit *and* more loved than you dared hope.

### Let it sting before you move on

Don't skip the part where it hurts. Pretending you're fine isn't toughness — it's just delay. The Psalms and the book of Lamentations are full of people telling God exactly how bad it feels, sitting in the loss, long before they get anywhere near hope. So sit in it. Name the disappointment honestly. You don't have to be okay yet.

And then, from *inside* that hard place — not on the far side of it — hear what the writer of Lamentations dared to say while the ruins were still smoking: *"Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness"* (Lamentations 3:22-23). Notice who's doing the work. It isn't your resilience that gets you through — it's the Lord's love that keeps the loss from consuming you. And his mercy doesn't run out overnight. Tomorrow it meets you again, fresh, before you've done anything to earn it back. Feel tonight honestly. Then, when you're ready, start to move.

### The reset, in four moves

When you're ready — that night, or the next morning — work it instead of replaying it:

1. **Breathe.** Longer exhale than inhale. Get your body out of the spin.
2. **Name what actually happened.** Not "I'm trash." Specifically: *I forced a pass through traffic. I started slow.* Real, reviewable information.
3. **Take the one lesson.** What's the single adjustment for next time? One. Write it down.
4. **Drop the rest.** The shame isn't information. It teaches you nothing. Leave it on the ice.

That's it. That's the bounce-back. Not "get hyped." Not "just stay positive." Just: feel it, learn the one thing, return.

### Returning is the whole skill

The athletes who last aren't the ones who never have bad games. They're the ones who return. Who come back to practice. Who take the next rep. Who answer one bad night with one good shift instead of three more bad ones.

That return is built on something steady. Hebrews says it like this: *"Let us run with perseverance the race marked out for us, fixing our eyes on Jesus, the pioneer and perfecter of faith"* (Hebrews 12:1-2). You don't run with your eyes on your last stat line. You run with them fixed on the One who already finished his race for you. That's where the perseverance comes from. **Your Identity Is Secure. Compete From Victory** — even the night after you lost.

The game is the game. You are not the game. You never were. Now go take the next rep.

> **Try a pregame session.** Walk into your next game already grounded. From Victory's 5-minute guided pregame routine helps you reset before you ever step on — so a bad night doesn't follow you into the next one. **Start a free trial** and run your first session today. [Start your free trial →](/pricing)`,
  },

  {
    slug: "when-your-athlete-gets-cut-a-parents-guide",
    title: "When Your Athlete Gets Cut: A Parent's Guide",
    metaDescription:
      "Your athlete just got cut. A warm, practical guide for parents — what to say in the car, what to avoid, and how to anchor them in identity, not results.",
    // AUTHORED excerpt:
    excerpt:
      "What to say in the car, what to avoid, and how to anchor your athlete in identity — not results — after a cut.",
    audience: "parent",
    datePublished: "2026-06-12",
    dateModified: "2026-07-09",
    image: {
      src: "/images/blog/when-your-athlete-gets-cut.jpg",
      alt: "Rows of empty arena seats",
      width: 1600,
      height: 1066,
    },
    bodyMd: `The list went up, or the call came, and your athlete's name wasn't on it. Now you're the one holding it — driving home, sitting outside their room, trying to find words that help instead of hurt.

This is hard for them, and it's hard for you. You've watched the early mornings and the long drives and the hours they put in. Watching it not pay off the way they hoped aches in a particular way. So before anything else: it's okay that this hurts. For both of you.

Here's a guide for the moments right after — grounded in the one thing your athlete most needs to know, which is that their worth was never on that list to begin with.

### First, just be there

Before any of the words below, know this: the first hour usually isn't the time for the deep theological truth. It's the time for presence. Your athlete doesn't need a four-point framework in the first ten minutes — they need to know you're with them while it hurts. Sit in it with them. The truths underneath matter enormously, and they'll land far better once the first wave of grief has been allowed to be grief. Lead with your presence; let the framing follow.

### What to say in the car

The car ride home is sacred. Get it right and it's a memory that steadies them for years. So keep it simple:

- **"I'm sorry. That really hurts."** Name it. Don't rush past it.
- **"I love watching you play, and that hasn't changed at all."** Separate your delight in them from any result.
- **"I'm proud of how you've worked."** Praise the effort and character, which they control — not the outcome, which they don't.
- **And often, the best move: less.** Let the silence sit. You don't have to fix it in the first ten minutes. Sometimes the most loving thing is to just be there while they feel it.

### What NOT to say

These come from a good place, but they tend to land wrong:

- **"That coach doesn't know what he's doing."** It feels loyal, but it teaches your athlete to blame others and skip the growth.
- **"You'll show them next year."** This makes the goal revenge and ties their healing to a future result you can't promise.
- **"At least you have [school / other sport / etc.]."** "At least" rushes them out of a grief they need to feel first.
- **Anything that makes it about you.** Your disappointment is real, but the car ride is for theirs.

And the spiritual version of all of these, the one to be most careful with: **don't promise that God will get them back on the team, make the coach see their value, or "use this so you win later."** That's not a promise God made, and when it doesn't come true it can quietly damage their faith. What's actually true is steadier and better: *God is with them in this. This disappointment is real, but it is not ultimate. And it does not change their standing with him one inch.*

### The truth underneath the cut

Here's the deepest help you can give your athlete — not a pep talk, but a foundation. Save it for when the first sting has eased, not for the first raw minutes.

The world runs on *perform, then belong.* Make the team, then you matter. A cut is that whole system pressing on your child at once: *if I'm not on the roster, who am I?*

The gospel runs the other way. In Christ, **belonging comes first, and performance flows from a security you already have.** *"Therefore, there is now no condemnation for those who are in Christ Jesus"* (Romans 8:1). Your athlete's worth was settled at the cross — not on a tryout sheet. *"I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well"* (Psalm 139:14). They were known and loved and made on purpose long before a coach ever evaluated them.

A cut can tell them what happened. It cannot tell them who they are. That's the line to hold for them when they can't hold it for themselves.

### When it's more than disappointment

One honest note. Most kids who get cut hurt for a while and then, with support, find their feet. But if you see something heavier — hopelessness that doesn't lift, real withdrawal from people and things they love, anything beyond ordinary disappointment — don't try to carry that alone. Loop in a trusted adult, your family pastor, or your doctor. If it ever escalates to thoughts of self-harm, the 988 Suicide & Crisis Lifeline is there any hour. We're a training resource, not counselors or clinicians, and the loving move is to get real help when it's needed.

### The next faithful step

When the worst of it passes — not tonight, but soon — help them take one small step forward. Not a grand plan. One step:

- Ask the coach, calmly and later, what to work on. (Feedback, not appeal.)
- Pick one thing to train this off-season.
- Show up to the next thing. Just show up.

That's how athletes operate **from** a secure place instead of scrambling to re-earn one. They run the race marked out for them, *"fixing our eyes on Jesus, the pioneer and perfecter of faith"* (Hebrews 12:1-2) — competing from a victory that's already theirs, not toward one a coach controls.

Your athlete is not the cut. They never were. **Your Identity Is Secure. Compete From Victory.** That's the ground you're standing them back on.

> **Help your athlete compete from a secure identity.** From Victory is a daily mental-toughness training app with faith as its foundation — built to anchor your athlete in who they are in Christ, not in the last result. **Start a free trial** and walk through the first days together. [Start your free trial →](/pricing)`,
  },

  {
    slug: "sports-psychology-and-faith-do-they-mix",
    title: "Sports Psychology and Faith: Do They Mix?",
    metaDescription:
      "Can sports psychology and Christian faith work together? Yes — when faith is the foundation, not the decoration. An honest look at how, and the limits.",
    // AUTHORED excerpt:
    excerpt:
      "They mix well — but only when faith is the foundation the mental skills stand on, not the other way around. An honest look at how, and the limits.",
    audience: "parent",
    datePublished: "2026-06-12",
    dateModified: "2026-07-09",
    image: {
      src: "/images/blog/sports-psychology-and-faith.jpg",
      alt: "Basketball court lines seen from above",
      width: 1600,
      height: 1066,
    },
    bodyMd: `It's a fair question, and a lot of Christian families ask it: *Is mental training compatible with faith — or is it just secular self-help in disguise?* And from the other side: *Does bringing faith into sports psychology water down the actual mental skills?*

The short answer is that they mix well — but only when you get the order right. Faith isn't a decoration you add on top of mental training. It's the foundation the training stands on. Get that backwards and you end up with one of two weak products: self-help with a verse stapled to the end, or a devotional with sports clip-art. Neither is what a serious athlete needs.

### The real difference: where your identity comes from

Most mainstream sports psychology is genuinely useful. Breath control, visualization, cue words, attention management, reframing mistakes as information — these are real, well-researched tools, and a Christian athlete can use every one of them in good conscience.

Self-efficacy — the confidence that *I can do this, I've done it before, I'm prepared* — is one of the most reliable tools in the field, and it's a real one. We're not knocking it. Believing you can execute is genuinely useful, and an athlete should build it.

The question faith answers isn't whether self-efficacy works. It's what your *foundation* is made of. Build your whole identity on "I believe in myself," and the source of your security and the thing being tested are the same person — you. When you get cut, get injured, or play the worst game of your life, the confidence you leaned on is exactly the thing that just took the hit. The floor and the thing standing on the floor crack at the same moment.

The gospel puts the foundation somewhere else — outside your performance, outside even your confidence: *"Therefore, there is now no condemnation for those who are in Christ Jesus"* (Romans 8:1). Your security is settled by God, and a brutal loss can't reach it. That doesn't make self-efficacy useless — it makes it *safe to use*, because it's no longer carrying your worth. You can believe in your preparation without asking your preparation to tell you who you are.

This is the order that changes everything. The world says: perform, then you belong. The gospel says: in Christ, you belong, and performance flows *from* that secure identity. **Your Identity Is Secure. Compete From Victory** — not toward it.

### Faith as the foundation, not the paint

That's why the framing matters so much. A devotional-app-with-sports-language teaches an athlete to feel inspired. A mental-toughness-app-with-faith-as-the-foundation teaches them to *compete* — and grounds that competing in something deeper than their own willpower.

You can see the difference in how the actual skills get used:

- **Visualization** isn't just "see yourself winning." It's rehearsing the hard moment *and* the reset after it, because your standing doesn't depend on the moment going perfectly.
- **A cue word** isn't just a focus trick. It pulls you back to a truth, not just a task.
- **Reframing a mistake** isn't positive thinking. It's the genuine fact that the mistake is real but the verdict on you isn't.

The mental skill and the faith aren't two separate things bolted together. They're one truth, applied. That's the whole design philosophy: *Rooted in the Word. Fueled by the Spirit. Built for Victory.*

### What this is NOT (and we mean it)

Honesty here builds more trust than any claim could, so let's be direct about the limits.

**This is not therapy. This is not treatment. This is not clinical care, and it is not a mental-health service.** Mental *toughness* training — building focus, resilience, and a secure identity for competition — is a different thing from mental *health* care.

If an athlete is struggling with anxiety that doesn't lift, depression, an eating disorder, thoughts of self-harm, or anything that needs real clinical help, the right move is a licensed professional, a trusted adult, and resources like the 988 Suicide & Crisis Lifeline — not a training app. A faith-and-mental-skills app can sit alongside that kind of care. It can never replace it. Any product that blurs that line is one to walk away from.

### So — do they mix?

Yes. Faith and sports psychology mix beautifully, on one condition: faith goes on the bottom, as the foundation, and the mental skills are built on top of it — not the reverse, and never as a substitute for real clinical care when it's needed.

When you get that order right, you don't get a watered-down version of either. You get an athlete who can compete with everything they have *and* lose without losing themselves — because their identity was never riding on the scoreboard. They run the race marked out for them, *"fixing our eyes on Jesus, the pioneer and perfecter of faith"* (Hebrews 12:1-2), from a victory that's already won.

> **See how it works.** From Victory is a daily mental-toughness training app with faith as its foundation — for athletes ages 13 and up. **Start a free trial** and see the order for yourself: identity first, performance from it. [Start your free trial →](/pricing)`,
  },
];

// ---------------------------------------------------------------------------
// Featured pages (FV-413) — the two live GTM Engine pages. These are
// full standalone routes (app/pregame-ritual-christian-athlete,
// app/christian-athlete-apps), NOT /resources/[slug] articles, so they
// are kept out of the ARTICLES registry above (which several tests pin at
// exactly 5 entries). getAllFeaturedPages() lets /resources render cards
// linking out to them without duplicating or moving that content.
//
// title/excerpt are verbatim reuse of each page's own PAGE_TITLE /
// PAGE_DESCRIPTION — see lib/gtm/page-titles.ts (single source of truth).
// ---------------------------------------------------------------------------

export interface FeaturedPage {
  href: string; // full route, not /resources/-prefixed
  title: string; // verbatim reuse of the page's own <h1>
  excerpt: string; // verbatim reuse of the page's own lead-sentence copy
}

const FEATURED_PAGES: FeaturedPage[] = [
  {
    href: PREGAME_RITUAL_HREF,
    title: PREGAME_RITUAL_TITLE,
    excerpt: PREGAME_RITUAL_EXCERPT,
  },
  {
    href: CHRISTIAN_ATHLETE_APPS_HREF,
    title: CHRISTIAN_ATHLETE_APPS_TITLE,
    excerpt: CHRISTIAN_ATHLETE_APPS_EXCERPT,
  },
];

/** The two live GTM pages, for the /resources index (FV-413). */
export function getAllFeaturedPages(): FeaturedPage[] {
  return FEATURED_PAGES;
}

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

/** All articles in registry order. */
export function getAllArticles(): Article[] {
  return ARTICLES;
}

/** Find one article by slug. Returns undefined if not found. */
export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

/** All slugs — used by generateStaticParams. */
export function getAllSlugs(): string[] {
  return ARTICLES.map((a) => a.slug);
}
