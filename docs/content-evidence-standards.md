# Content evidence standards — public research-adjacent claims

*Established 2026-09-01 from KC's redraft brief for the "Does Visualization
Actually Work for Athletes?" resources article (FV-539/FV-540). Binding for
any PUBLIC content — resources articles, homepage/marketing sections, FAQ
answers, sport pages — that makes claims touching research, science, or
effectiveness. In-app training content keeps its own governing docs
(`docs/pregame-script-style.md`, the script books, `docs/brand.md`); the
sentence-classification ladder below is good practice there too.*

*This file is repo-owned implementation guidance. Positioning and marketing
copy ownership rules in CLAUDE.md ("GTM source of truth") are unchanged.*

## Working principles (read first)

The distilled lessons behind the rules below (KC-approved 2026-09-01,
from the FV-539/FV-540/FV-545 arc). When a case the numbered sections do
not cover comes up, decide by these:

1. **Every factual sentence has a class, and the class dictates the
   language.** Research finding, applied inference, product choice,
   product fact, or anecdote — unclassifiable sentences are deleted
   (§1). Athlete adoption is not efficacy; a narrow study is not a law;
   a delivery format we chose is not one science crowned.
2. **The qualified answer sells better than the confident one.** "Often,
   as a supplement, with real limits" survives every reviewer and the
   audience's bullshit detector; "yes, it works" survives none of them.
   Honesty about limits is the credibility asset.
3. **Scope every claim to exactly what is true.** "Collects no data"
   becomes "the share action collects and stores no athlete data";
   shortened Scripture is an "NIV excerpt," never verbatim; a sample's
   label names the clip that actually plays. Precision is what keeps a
   sentence defensible.
4. **Verify public claims against the shipped code, not memory.** A
   privacy claim is checked against the live RLS and queries; an asset
   label is checked against the asset. If the code cannot back the
   sentence, the sentence changes (§3, §8).
5. **Sport-neutral by default; sport examples only as labeled examples,
   plural.** Neutral vocabulary is competition, performance, action,
   moment, result. One sport's word on a seven-sport surface is a leak
   (§8).
6. **Pages have jobs; content lives once and is extracted, not
   repeated.** Depth lives in the article; other surfaces condense and
   link it, both directions. A page that re-runs another page's job is
   the design failure, whatever its polish.
7. **The theology is held to the same precision as the science.** Ground
   mercy and worth in God's character and Christ's finished work, never
   in the athlete's earning; identity language opens from security,
   never from athlete pain.
8. **A standard counts only when written down and enforced
   mechanically.** Encode rules here, bind them into the agents, and pin
   them in CI: banned-term and em-dash scans, extract drift-pins against
   source articles, sha256 body pins. The next piece starts at the bar
   the last one had to be rewritten to reach.

## 1. The sentence-classification ladder

Before keeping any factual sentence, classify it as exactly one of:

1. **Research finding** — a study or review actually found this.
2. **Reasonable applied inference** — practitioners apply the research this
   way; the research does not directly test it.
3. **From Victory product choice** — a design decision we made.
4. **From Victory product fact** — verifiable in the shipped code.
5. **Athlete anecdote** — a story that illustrates, never proves.

If a sentence cannot be classified, delete it. Never let an inference,
product choice, or anecdote wear the voice of a research result.

Matching language:

- Research finding: "Research suggests…", "One review found…", "One small
  study found…"
- Applied inference: "A practical way to apply that principle is…"
- Product choice: "From Victory uses…" (a choice, not a superiority claim)
- Product fact: state it plainly; verify against the code first.
- Anecdote: "X's experience illustrates…", closed with "This does not
  mean…" or an equivalent illustration-not-proof sentence.

## 2. Source hierarchy

Lead with **recent systematic reviews and meta-analyses**. Use foundational
papers afterward, and only to explain **models and methods** (a framework is
a model, never a proof). Use small primary studies only as **narrow
illustrations**, described narrowly: design, sample, task (e.g. "a six-day
putting experiment in which 30 college students…"). Never generalize a
narrow study across sports or task types.

Never use athlete-adoption evidence (surveys, interviews, questionnaire
papers) as effectiveness evidence. Athlete use does not establish that a
method works.

Reference lists: recent reviews first, then frameworks, then narrow
studies, then athlete sources. Every reference clickable (DOI preferred).

## 3. Citation integrity

- Never invent a quotation, sample size, DOI, finding, title, or source
  characterization.
- Verify metadata against the published record (web lookup) before
  publishing; anything unverifiable is flagged or removed, never guessed.
- Characterize each source in one accurate sentence, including its
  limitations when the sentence it supports needs them (e.g. "no longer
  significant after non-randomized studies were removed").
- Sample sizes from the verified record are allowed; percentages and
  effect sizes in body copy are not.

## 4. Banned claim classes (public content)

- **Unconditional answers** ("Yes, it works"), "proven", "guaranteed",
  "clinically shown", "science-backed" as a badge.
- **Familiarity / pre-experience promises**: that a rehearsed moment will
  "feel familiar", "arrive walked-through", or that the athlete has already
  experienced the live sequence. Imagery rehearses a possible plan; it does
  not pre-experience a reactive game or make it predictable.
- **Population claims without prevalence evidence**: any "most athletes…"
  sentence needs direct prevalence data or deletion.
- **Delivery-format superiority**: research has used written, self-paced,
  live-guided, recorded-audio, and video-supported delivery. Guided audio
  is an evidence-informed product choice, not a scientifically superior
  format. Never imply a guided-vs-unguided head-to-head exists.
- **Single-session equivalence**: the stronger performance evidence comes
  from imagery practiced repeatedly over days or weeks. One five-minute
  session "helps you rehearse today's plan" — nothing more.
- **Neuroscience shortcuts** ("the brain cannot tell the difference",
  "rewires your brain").
- **Therapeutic outcomes** or clinical register (anxiety, stress relief,
  treatment). One boundary sentence per piece: not therapy, treatment, or
  clinical care. (A source's own academic title may contain such words.)
- **Outcome guarantees** of performance, calm, confidence, or focus; any
  faith-produces-victory framing.

## 5. Adversity imagery (product-adjacent claims)

Never say "picture yourself failing does not help" as a blanket, and never
describe the product as rehearsing the failure. The rehearsal object is the
**response**: picture the disruption briefly, then mentally rehearse the
coping response and the next action. The reset is practiced, not
guaranteed. Content and meaning of the image matter.

## 6. Anecdote protocol

- Verified facts only; paraphrase, never fabricate dialogue or quotes.
- Placement after the research summary, never as the opening hook or as
  proof.
- Always close with an explicit illustration-not-proof sentence, then
  follow with one ordinary cross-sport example so the famous athlete is
  never a standard the reader must match.
- House-approved exemplar: the Michael Phelps 2008 200-meter butterfly
  passage in the FV-539 article (goggles, stroke count, "illustration, not
  scientific proof").

## 7. Canonical evidence base — visualization / imagery

Approved sources and characterizations (verify metadata again at reuse):

- **Liu et al. (2025)**, Behavioral Sciences — review of 86 studies, 3,593
  athletes; positive average effects; performance evidence rated low in
  certainty (risk of bias, heterogeneity, possible publication bias);
  points toward repeated practice. https://doi.org/10.3390/bs15050685
- **Reinebo et al. (2024)**, Sports Medicine — moderate overall effect, no
  longer statistically significant after non-randomized studies removed;
  use to justify caution. https://doi.org/10.1007/s40279-023-01931-z
- **Toth et al. (2020)**, Psychology of Sport and Exercise — replication of
  the mental-practice literature; small average benefits, mostly from
  repeated programs. https://doi.org/10.1016/j.psychsport.2020.101672
- **Simonsmeier et al. (2021)**, International Review of Sport and Exercise
  Psychology — positive average effects across performance and related
  outcomes. https://doi.org/10.1080/1750984X.2020.1780627
- **Holmes and Collins (2001)** — PETTLEP: a framework/model for making
  imagery relevant (physical, environment, task, timing, learning stage,
  emotion, perspective). A model, not proof of transfer.
  https://doi.org/10.1080/10413200109339004
- **Cooley et al. (2013)** — imagery delivery methods vary; recorded audio
  is one legitimate method. https://doi.org/10.1515/jirspa-2012-0005
- **Woolfolk, Parrish and Murphy (1985)** — narrow only: six-day putting
  experiment, 30 college students, imagined made or narrowly missed putts;
  the missed-putt group performed worse. Not team-sport mistakes, not
  coping imagery. https://doi.org/10.1007/BF01183852
- Do NOT use Hall et al. (1998) as elite-adoption evidence (it is a
  questionnaire-development paper). Do not use Orlick and Partington (1988)
  unless athlete adoption is itself the point being made.
- Phelps sources: the No Limits book, the official Olympic recording of the
  2008 200m butterfly final, and the Washington Post Bowman account (see
  the FV-539 article's References for URLs).

## 8. Resources-article conventions

- Open with a **qualified answer in at most 80 words**; primary keyword in
  the H1, the first 100 words, one heading or nearby paragraph, and the
  meta description (≤160 chars).
- Body 800–1,000 words excluding title, meta, CTA, References. Short,
  mobile-friendly paragraphs. Sentence-case headings.
- Examples from at least three live sports; rotate opening actions (first
  shift, first possession, first tee shot, first at-bat, first defensive
  read, first touch); never hockey-default. Use "opening action" in general
  claims. Say "sport and role", not only "position" (golf uses player
  profiles).
- Product facts verified against the code; phrase the close as "The
  session closes with spoken prayer." (the narration prays; the athlete is
  not required to pray aloud).
- One restrained CTA; promise the experience, not a performance result.
- All existing house rules apply: no em dashes, no emoji, no hype, no
  testimonials/invented proof, never "kid", the canonical tagline at most
  once, mental training leads with faith as the foundation underneath.

## 9. Publication hygiene

Publishable output never contains: draft markers, file paths, issue
numbers, editorial or verification notes, reviewer commentary, change
logs, or a preamble explaining a rewrite. Internal notes live in the PR,
never in the artifact.
