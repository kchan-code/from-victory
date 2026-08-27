# Product truths — From Victory

The reverse pipe to the Delvox GTM Engine. When a feature ships, changes, or gets cut,
record it here — dated, plain, factual. The engine's profile refresh reads this file, and
everything downstream (positioning, content, comparisons) inherits it. A truth missing
here is a truth missing from all marketing.

Format: date, what it is, why it matters to a buyer. Facts only — no positioning spin
(the engine does that, behind KC's approval gate).

---

## 2026-08-26 — Public store listings are not live; marketing comparison names today's SERP apps

From Victory is a web app / installable PWA. It is not listed on the App Store or Google Play. Internal TestFlight and Play Closed Alpha exist for native-shell QA. Do not tell a parent they can download From Victory from a public store tonight.

The public comparison page (`/christian-athlete-apps`) now names the three apps that currently win "best Christian athlete app" answers: Faithful Athlete, Playbook Devotional, and Core IV (all store-listed). FCA Challenge / YouVersion remain the free-devotion category; Play With Faith may still be mentioned as a sport-specific faith feed. From Victory differentiates as visualization you actually run, then compete from victory — 13+, not therapy, not a daily devotion, not a generic mindfulness app.

Homepage title/meta no longer leads with "Christian Athlete Mindset App." Lead is visualization + Compete From Victory ("See the First Moment"), sport-generic across the seven live sports. Identity in Christ is the second beat, not the H1. Hockey specificity lives on the `/hockey` landing page, not the homepage.

A hockey-specific marketing landing is live at `/hockey`. Spoken moments on that page are limited to lines the hockey audio actually runs (first shift; goalie first save). Seven sports remain live in the product, each with shipped visualization. No other sport landing pages shipped in this pass. No visualization blog series.

Why it matters to a buyer: AI answers and parent search currently recommend the store apps. The site now states the category honestly and does not claim a store listing we do not have.

## 2026-08-24 — Athlete home screen redesigned: icon-first tiles, spine verse on screen one

The athlete home screen (hub) shipped a density redesign driven by TestFlight
beta feedback (#461, #462). It is now one large "Daily Training" hero card plus
a grid of four big icon-first tiles — "Pregame Visualization",
"Pre-Practice Visualization", "Journey", and "Ride Home" — with no descriptive
subtitle copy; each surface explains itself on its own screen and in the
first-run coachmark tour (now 3 stops). The bottom tab bar was removed from the
home screen only (inner screens keep it), sign-out moved to Settings, and the
athlete's own sport is rendered as a faint gold line-art watermark behind the
page (all seven live sports have a glyph). The screen now closes on the brand's
spine verse — "…fixing our eyes on Jesus, the pioneer and perfecter of faith."
— Hebrews 12:2 (NIV), quoted verbatim and cited. No data, pricing, or feature
scope changed — presentation only. The iOS/Android native shells load the
hosted app, so this reached all platforms on deploy with no store update.

Why it matters to a buyer: the first screen an athlete sees is now visibly a
faith-built training app — scripture on screen one — and reads clean and
premium on a phone (a direct response to real beta-tester feedback, which
marketing can honestly describe as "shaped by athlete beta feedback" without
quoting or counting testers per the claims discipline).

Soccer is athlete-selectable in production (KC launch directive 2026-08-13,
FV-78/FV-79; audio #425, DB #426, app wiring #427, postgame #428). Live
sports are now hockey, basketball, golf, football, baseball, lacrosse, and
soccer. A soccer athlete picks a position (Forward, Midfielder, Defender,
Goalkeeper) and gets the full surface: 30 days of daily training, the
audio-guided pregame session (position-specific visualization with a
28-play positive-play library — 7 per position — and a position×adversity
hard-moment grid), the pre-practice "Lock In" session, and the text-only
post-game debrief. Same price, same plan — one subscription covers every
live sport and an athlete can switch sports in settings.

Why it matters to a buyer: soccer families can buy today instead of
waitlisting; the hockey-soccer two-sport athlete (a common pairing)
covers both seasons with one subscription.

Scope note: boys' and girls' soccer are the same game and share one
taxonomy. Claims discipline unchanged: no testimonials, ratings, user
counts, or retention claims until a launch cohort exists.

## 2026-08-12 — Lacrosse is live: sixth sport, full parity

Lacrosse (boys'/men's field lacrosse) is athlete-selectable in production
(KC founder sign-off 2026-08-11 on FV-407; by-ear audio approval and
go-live 2026-08-12, same day as baseball). Live sports are now hockey,
basketball, golf, football, baseball, and lacrosse. A lacrosse athlete
picks a position (Attack, Midfield, Defense, FOGO, Goalie) and gets the
full surface: 30 days of daily training, the audio-guided pregame session
(position-specific visualization with a 35-play positive-play library — 7
per position — and a position×adversity hard-moment grid), the
pre-practice "Lock In" session, and the text-only post-game debrief. Same
price, same plan — one subscription covers every live sport and an
athlete can switch sports in settings.

Why it matters to a buyer: lacrosse families can buy today instead of
waitlisting; the hockey-lacrosse two-sport athlete (a common pairing)
covers both seasons with one subscription.

Scope note: girls' lacrosse is a different game and is NOT covered —
content is authored for boys'/men's field lacrosse only. Claims
discipline unchanged: no testimonials, ratings, user counts, or retention
claims until a launch cohort exists.

## 2026-08-12 — Baseball is live: fifth sport, full parity

Baseball is athlete-selectable in production (KC founder decision 2026-08-11,
FV-100; shipped via FV-97/FV-98, smoke-tested by KC on 2026-08-12). Live
sports are now hockey, basketball, golf, football, and baseball. A baseball
athlete picks a position (Pitcher, Catcher, Infield, Outfield) and gets the
full surface: 30 days of daily training, the audio-guided pregame session
(position-specific visualization with a 28-play positive-play library — 7 per
position — and a position×adversity hard-moment grid), the pre-practice
"Lock In" session, and the text-only post-game debrief (5 scenarios). Same
price, same plan — a subscription covers every live sport and an athlete can
switch sports in settings.

Why it matters to a buyer: baseball families can now buy today instead of
joining the waitlist; multi-sport athletes (e.g. hockey + baseball) cover
both seasons with one subscription.

Claims discipline unchanged: no testimonials, ratings, user counts, or
retention claims until a launch cohort exists.

## 2026-07-22 — Adults 18+ can sign up, pay, and train on their own account; eligibility is 13+ with no upper limit

Adult self-serve is live in production (go-live smoke passed 2026-07-22). An
athlete 18 or older signs up with their own email, confirms they are 18+,
pays $5/mo or $49/yr with the 14-day first-time trial, manages or cancels
billing through the Stripe portal, and can delete their own account from
their settings page — no parent involved. Accounts for athletes under 18
remain parent-created and parent-managed, unchanged. Product eligibility is
now 13 and up with no upper age limit; content is calibrated for 13-25.
Crisis-resource copy across the app is one universal age-neutral version
("Talk to someone you trust"; "This screen is private — no one is notified").
Public pages (pricing, landing FAQ, privacy policy) describe both account
paths.

Why it matters to a buyer: college, junior, club, and semi-pro athletes can
now buy directly — the parent is no longer required for 18+. The parent
remains the buyer for 13-17.

## 2026-07-19 — Football is a live sport
Football is selectable at onboarding and in Settings → Change sport, at full
content parity: pregame guided audio (7 position tracks, 49 athlete-chooseable
positive-play visualizations, 67 hard-moment scripts — the "big hit" adversity
is authored but withheld pending clinical advisor sign-off), pre-practice
"Lock In" session, and the 30-day daily training arc (now sport-agnostic across
all sports, same scripture spine). Live sports: hockey, basketball, golf,
football.

## 2026-07-08 — Guided visualization (core mechanic, recorded by KC)

The pregame session is **audio-guided
visualization**: voice prompts specific to the athlete's **sport and position**.
Headphones on, eyes closed, about five minutes (experienced order, verified against the
app 2026-07-08: a short guided **breath** screen first, then quick setup selections —
today's focus, position, positive plays, hard moment, reset anchor, self-talk — then
the audio: **identity opener** (scripture varies by today's focus), sport- and
position-specific **visualization**, the **hard moment** rehearsed with its reset,
**prayer** (guided or self-guided, athlete's choice), **send-off**. Brand/session anchor
verse Hebrews 12:1-2 — also the default verse behind the athlete's cue word; sports
live: hockey, basketball, golf; baseball coming soon — *superseded: see the
2026-07-19 entry; live sports are hockey, basketball, golf, football*).

Why it matters: visualization is generally accepted best practice in sport, but almost
no tools help athletes actually do it. From Victory does. And during it the athlete is
not self-reliant and not alone — the power of God empowering their freedom to play hard,
fearless, and free. This is the category differentiator and it now leads the messaging.

## 2026-07-08 — Status facts

*Superseded on both counts — see the 2026-06-25 billing entry (the app is live and
buyable; trial CTA) and the 2026-07-22 adult self-serve entry. The claims discipline
(no testimonials, ratings, user counts, or retention claims until a launch cohort
exists) still stands. Connected socials unchanged.*

- Pre-launch, pre-revenue. Waitlist is the only CTA. No testimonials, ratings, user
  counts, or retention claims may be asserted anywhere until a launch cohort exists.
- Connected social accounts (Publer): Facebook, Instagram, YouTube. No LinkedIn.

## 2026-06-25 — Paid subscriptions live (recorded 2026-07-08 by the app repo; re-added after the 2026-07-08 re-export dropped it)

Stripe billing is live and enforced in production: first athlete $5/mo or $49/yr, each
additional athlete $3/mo or $29/yr, 14-day free trial for first-time subscribers,
promotion codes accepted at checkout, cancel anytime via a self-serve billing portal.
Since 2026-06-25 a new parent signup requires a subscription (paywall enforced). The
live site's primary CTA is currently "Start your athlete's 14-day free trial" on the
home, pricing, and parents pages; the waitlist form also remains live (used for v2-sport
interest and team/group-pricing requests). Zero paying customers at time of recording
(clean slate — test accounts deleted).

Why it matters to a buyer: the product can be bought today; "pre-launch / waitlist-only"
framing no longer matches the live site and the engine should reconcile which CTA the
campaigns drive to.

---

_Add new entries above this line, newest first._
