# Product truths — From Victory

The reverse pipe to the Delvox GTM Engine. When a feature ships, changes, or gets cut,
record it here — dated, plain, factual. The engine's profile refresh reads this file, and
everything downstream (positioning, content, comparisons) inherits it. A truth missing
here is a truth missing from all marketing.

Format: date, what it is, why it matters to a buyer. Facts only — no positioning spin
(the engine does that, behind KC's approval gate).

---

## 2026-11-13: The store apps can be required to update (FV-717; effective when the PR deploys, off by default)

- The App Store and Google Play apps can now be told to update. When a minimum app
  version is set, an older app shows an "Update required" screen with a button to its
  store listing instead of the app. Accounts and training history are unaffected.
- No minimum is set. Nobody sees this screen until one is. It cannot be set usefully
  until new builds of both apps are live in the stores.

## 2026-11-13: What happens when a subscription payment fails (FV-710; effective when the PR deploys)

- App Store and Google Play subscriptions: when a renewal payment fails, training stays
  on for the store's billing grace period. If the payment is still failing when that
  period ends, training pauses until the store collects payment; it comes back on by
  itself when it does. Before this change, training stayed on for as long as the store
  kept retrying (up to 60 days on the App Store).
- Web (Stripe) subscriptions: unchanged. Training stays on while Stripe retries the card
  (about two weeks), then the subscription is canceled.
- The paying parent or adult athlete now sees an in-app notice that the payment did not
  go through and how to fix it. A 13-17 athlete never sees billing language; they see
  the existing paused screen.
- Nothing is deleted when training pauses for a failed payment.

## 2026-11-13: Store shells, signup price line, and how a 13-17 account is deleted (FV-716, FV-719, FV-720, FV-734)

On the website, parent signup and adult signup still say 7 days free, then $5/mo or $49/yr, for a first-time subscriber with one athlete. The sentence that a card is required and will be charged when the trial ends stays on checkout only.

In the iPhone app, both signup screens do not show a web price, a trial length, or a card. They say that after you create your account, you choose a subscription in the app. Apple's purchase sheet shows the price. The purchase screen says the subscription renews automatically at the price shown until you cancel, and that you cancel in iPhone Settings under your Apple ID, then Subscriptions. The Android app and older shells still show no price and no trial length on signup.

Daily reminders in the iPhone app and the Android app say they are not available in the app yet. The website and an installed home-screen version still offer the reminder.

An athlete ages 13-17 sees, in settings, that the parent who set up the account can delete it from the parent dashboard. The contact is privacy@fromvictoryapp.com. There is no delete button and no billing on that screen. A parent still deletes from the parent dashboard. An adult athlete still deletes their own account from settings.

Why it matters to a buyer: the iPhone app does not quote the website price, and a 13-17 athlete can see who deletes the account.

## 2026-11-13: Signed-out screen says Welcome, then parent, 18+, or invite (FV-707, FV-708; effective when the PR deploys)

The signed-out screen on the website, in the iPhone app, and in the Android app says "Welcome" and asks how the person will use From Victory. The choices are "I'm a parent" (parent account), "I'm 18+ and training myself" (own account, only when adult signup is enabled), and "I have an invite" (athletes under 18). "Sign in" opens the existing parent email form and the athlete username form. A device that already belongs to an athlete still says "Welcome back" plus that athlete's first name.

The parent dashboard says "Welcome" plus the parent's first name until at least one athlete is linked, then "Welcome back" plus the first name.

Adult signup still requires age 18 or older, an 18+ confirmation, and agreement to the Terms of Use and Privacy Policy. Athletes under 18 are not offered a way to create their own account. In the iPhone app and the Android app, the signup screens do not show a web price or a trial length. The iPhone purchase screen still shows the App Store price. An adult who creates an account inside the Android app still lands in training rather than checkout. The Android sign-in form still tells a new customer to subscribe on the website.

The parent signup page and the adult signup page, on the website, say 7 days free, then $5/mo or $49/yr, for a first-time subscriber. The adult page no longer says 14 days.

Why it matters to a buyer: a first visit is not greeted as a return, and an athlete 18 or older can see how to create their own account from the first screen.

## 2026-11-13 — The invite link page matches the phone the athlete is using (FV-687)

An athlete who opens an invite link in a phone browser sees a short setup path.
iPhone and iPad see the App Store badge. The next step says to install, go back
to the text, and tap the link again. With the app installed, that tap opens
setup in the app (a username and password, or a new password on a reset). It
does not finish the invite by itself. If they would rather type the code, the
page also says to open From Victory, tap "I have an invite", and enter the code.
Android sees the Google Play badge. The next step says to open From Victory,
tap "I have an invite", and enter the code. The link does not open the Android
app. A computer sees both badges and both paths. "Continue in browser" stays
on the page and finishes setup in the browser. This updates the 2026-11-06 note
that the link page offers only the App Store.

Why it matters to a buyer: an athlete on Android can install from the invite
text, and an athlete on iPhone is told the real next step after install.

## 2026-11-13 - Public trial copy now says 7 days (FV-609)

Kinny decided on 12 Nov 2026 that the live free trial is 7 days. Public pages, structured data, llms.txt, FAQ, pricing, and the paste-ready marketing lines now say a 7-day free trial (or "7 days free"). Checkout is unchanged. A first-time checkout that starts with one athlete still gets 7 days. A first checkout that starts with more than one athlete still starts paid. Prices are unchanged ($5/mo or $49/yr for the first athlete, $3/mo or $29/yr for each additional).

Why it matters to a buyer: the homepage, pricing page, and signup page now name the same 7-day trial.

This supersedes the 2026-09-12 note that public marketing still advertised the previous trial length.

## 2026-11-11 — The Android app is available on Google Play (recorded by FV-681)

The From Victory Android app is published on Google Play
(https://play.google.com/store/apps/details?id=com.fromvictoryapp.app) as of 2026-11-11.
It has no in-app purchase: the Android app does not sell subscriptions and shows no
price or subscribe button. New customers subscribe on the website (fromvictoryapp.com),
then sign in to the Android app with the same account. A subscription bought on the
website or in the iPhone app works in the Android app when the subscriber signs in with
that account; a family with no active subscription sees "Subscribe to From Victory from
a web browser at fromvictoryapp.com." The countries where the Play listing is available
are not recorded here. The iOS app on the US App Store and the web app in the browser
are unchanged. This supersedes the 2026-11-03 entry's statement that From Victory is not
on Google Play and has no Android store listing. Other public surfaces that still say
"not on Google Play" are tracked in FV-684. The homepage FAQ's new sign-in and recovery
answers (FV-681) are effective when that PR deploys.

Why it matters to a buyer: an Android family can install From Victory from Google Play;
they subscribe on the website, not in the app, and sign in with the same account.

## 2026-11-11 — The app never tells a subscriber to subscribe; clearer sign-in for athletes 18+ (FV-657; effective when the PR deploys)

- **Android app, already subscribed:** a parent or adult who already subscribes and opens
  the subscription page now sees their status ("You're already subscribed. Manage your
  subscription from a web browser at fromvictoryapp.com.", or the App Store equivalent)
  instead of "Subscribe to From Victory from a web browser". Accounts with free access
  see "You have access to From Victory." on every platform, instead of "You're
  subscribed to From Victory."
- **Subscription page, not subscribed:** a new line above "Sign out" reads "Subscribed
  with a different account? Sign out, then sign in with that one."
- **Sign-in, "Athlete" tab:** the field is now labeled "Username or email", and the help
  text speaks to both groups: under 18 (username from the parent's invite, password
  help from the parent) and 18 or older (sign in with your email, with a "Reset it
  here" password link). The error now reads "That username, email or password isn't
  right."

Why it matters to a buyer: someone who already pays is never asked to pay again, and an
adult who subscribed on the website can find their way into the app on either tab.

## 2026-11-11 — "We couldn't check your access" is no longer shown as a paused or ended subscription (FV-656; effective when the PR deploys)

Sometimes the app can't read a family's subscription status (a temporary error or a
slow response). Before this, an athlete under 18 then saw "Training paused" and "ask
your parent to reactivate access", even when the family's subscription was active. Now
that athlete sees "We couldn't check your access. Please try again." with a "Try again"
button, and nothing about pausing, reactivating or paying. Parents and adults who pay
for themselves see "We couldn't check your access. Please try again. If you already
subscribe, don't purchase another subscription." on the dashboard and the subscribe
page, also with "Try again". Training still stays closed until the check succeeds, and
offline Pregame is neither removed nor extended by a failed check: it keeps the expiry
it already had.

Why it matters to a buyer: a temporary problem checking access never tells a paying family
their subscription stopped, and never prompts them to pay twice.

## 2026-11-11 — Deleting an account tells App Store subscribers to cancel with Apple (FV-652; effective when the PR deploys)

Deleting a From Victory account cancels a subscription bought on the website. It does not
cancel a subscription bought through the App Store on an iPhone: Apple manages that
subscription and only the subscriber can cancel it, in the iPhone's Settings. The delete
section in the parent dashboard and in an adult athlete's settings now says so to anyone
with an active App Store subscription, before they confirm. The public account-deletion
page says the same. Before this, those screens said the subscription was deleted or
canceled without that exception.

Why it matters to a buyer: a family that subscribed in the iPhone app is told plainly
that they must cancel with Apple, so they are not billed after deleting their account.
Any copy that says deleting an account cancels the subscription must carry this
exception.

## 2026-11-11 — An adult athlete's email works on the "Athlete" sign-in tab (FV-654; effective when the PR deploys)

The sign-in screen has two tabs, "Parent" and "Athlete". An adult athlete (18+) who pays
for their own account signs in with their email and password. Before this, entering that
email on the "Athlete" tab was rejected ("That username or password isn't right."); it
only worked on the "Parent" tab, and nothing on screen said so. Now an email works on
either tab and lands the adult on their training home. Athletes under 18 still sign in
with the username and password their parent's invite set up. Nothing else about sign-in
changed.

Why it matters to a buyer: an adult who already subscribed on the website can sign in to
the app with the same email and password, on whichever tab they pick.

## 2026-11-11 — An adult whose subscription has ended can reach account settings from the subscribe page (FV-645; effective when the PR deploys)

An adult athlete (18+) who pays for their own account and whose subscription has ended is
sent to the subscribe page. That page now shows an "Account settings" link beside "Sign
out" for that person. Account settings is where an adult deletes their account. Before
this, inside the iOS and Android apps there was no route from the subscribe page to
account settings, so account deletion could not be reached in the app. Nothing changes
for parents (they reach settings from the dashboard) or for adults with an active
subscription.

Why it matters to a buyer: account deletion is reachable in the app for every account
type, including an adult whose subscription has lapsed.

## 2026-11-09 — Pregame follows the same access rule as the rest of training (FV-625, FV-636; effective when the PR deploys)

Game-Day Pregame now uses the same access rule as Daily Training, Pre-Practice,
Post-Game and the athlete hub. When the account's subscription has ended (canceled or
expired), an athlete who opens Pregame while online is sent to the same place as those
pages: the "Training paused" screen for an athlete under 18, or the subscribe page for an
adult (18+) who pays for their own account. Before this, Pregame stayed open after a
subscription ended.

Offline Pregame (no signal) works for an athlete with access, once Pregame has been opened
online on that device after this change; the first open needs a connection. Before this
change, opening Pregame with no signal showed the browser's offline error page instead of
the session (seen on Android; the cause was in shared web code, fixed with this change).
Offline use lasts until the end of the access period that was last confirmed online on
that device: the current subscription period or free trial, or the end date of free
access that has one. Each online Pregame open renews it. After that date, Pregame needs a
connection again. When a subscription ends (canceled or expired), Pregame stops on that
device the next time it is online and opens Pregame or any other training page, and it
stays stopped offline. A subscription set to cancel at the end of its period keeps working
until that period ends. Accounts with free access that has no end date (for example a
reviewer account) can use Pregame online but not offline.

Adult (18+) athletes who pay for their own account can now open Pregame online and
offline under the same rules. Before this change, Pregame did not open for them at all.

Why it matters to a buyer: Pregame is part of the subscription, like all training, and
it stops when the subscription ends.

## 2026-11-06 — Athlete invites replace device pairing links; password reset keeps the username (FV-630; effective when the PR deploys, iOS link-opening needs the next iOS build)

A parent invites an athlete from the parent dashboard. The invite is a
16-character code plus a link. Opening the link on an iPhone with the app
installed opens the From Victory app (once the next iOS build ships); the
athlete picks a username and password and lands in training, signed in, with no
second sign-in. Without the app, the link page offers the App Store, shows the
code to type into the app after installing ("I have an invite"), or continues in
the browser. The App Store does not carry the invite through an install; the
athlete enters the code.

Each invite works once and expires in 7 days. Creating a new one turns the old
one off. A code is shown only when it is created; to share it again later, the
parent creates a new one. The dashboard shows each athlete as not invited,
invite pending, or account ready. Athletes who were set up before usernames
existed show as "needs username"; an invite lets them pick one (and a new
password) and keeps their training history.

Password reset is separate. For an athlete whose account is set up, the parent
creates a reset code (works once, expires in 24 hours). It sets a new password
and never changes the username. The reset page shows the username (read-only)
to whoever opens the code, so an athlete who forgot it sees it there. Athletes sign in on any phone, including a new
one, with their username and password. Old pairing links already sent keep
working until they expire. No new athlete data is collected (no email, no phone
number); nothing about subscriptions or prices changed.

Why it matters to a buyer: getting an athlete from "parent paid" to "athlete
training on their own phone" is one text message, and a forgotten password does
not cost the athlete their username or history.

## 2026-11-04 — iPhone installation guidance points to the App Store

The homepage FAQ and iPhone browser dashboard installation card direct users to
the existing US App Store listing. The public AI/search description states that
From Victory is also accessible in a browser, without the “installable PWA” label.
Android browser installation instructions remain available. Existing browser
support, installed web apps, and browser reminder settings are unchanged. The
dashboard card remains dismissible and is hidden inside the native app.

## 2026-11-03 — iOS app is available on the US App Store

From Victory iOS app v1.0 is available on the US App Store: https://apps.apple.com/us/app/from-victory/id6804743047. It went live on 2026-11-03 via manual release after App Review approval. US App Store only. iOS only. It is not available on Google Play; there is no Android store listing. The web app (installable PWA) still works in the browser. The marketing site now links the listing with Apple's unmodified "Download on the App Store" badge. This supersedes the 2026-08-26 entry that said the app is not listed on any public store.

Why it matters to a buyer: a parent on iPhone can now download the app from the US App Store. An Android parent cannot get it from a store; they use it in the browser.

## 2026-09-12 — New free trials become 7 days for one athlete (rides FV-574; effective when that PR deploys)

KC approved a new offering (2026-09-11): new first-time trials are SEVEN days,
granted only when the checkout starts with exactly one athlete. Multi-athlete
first checkouts get no free trial. Existing subscribers and in-flight trials
are grandfathered — their promised duration and seat terms do not change.
Prices are unchanged ($5/mo or $49/yr first athlete, $3/$29 additional). The
in-app checkout surfaces (/subscribe banner, signup disclosure) already say
7 days in the same change; every marketing page still says "14-day free
trial" until KC routes new copy through the engine.

Why it matters to a buyer: every "14-day free trial" claim across the site
(home, pricing, parents, sport pages, FAQ, structured data) becomes a 2x
overclaim the moment this deploys — the engine must reconcile all trial copy
to "7-day free trial (one athlete)" in the same launch window, not after.
Context: this is part of the Apple-subscriptions-on-iOS arc (FV-210); the
same 7-day/one-athlete trial will apply to Apple in-app purchases.

## 2026-09-02 — Pregame audio closes on the brand tagline; opening identity line now rotates

The final spoken line of every guided pregame session (all seven live sports, the
shared `shared-sendoff` clip after the prayer and cue word) now reads "You are
secure. Now go compete from victory." It previously read "You are secure. Now play
from victory." The self-guided-prayer path is unchanged: it still ends on the
athlete's own 30-second prayer with no spoken send-off. The text-mode fallback
send-offs still end "Amen. Play from victory."

The identity line near the top of the session (after the two breath rounds and
"Remember what is true.") is no longer one fixed sentence. It is drawn from a bank
of twelve short, sport-neutral lines that all say the same thing — standing with
God does not move with performance — from different angles (e.g. "The outcome can
change. Your place with God cannot." / "Success cannot crown you. Failure cannot
condemn you."). One line plays per session, chosen at random, never the same line
two sessions in a row on the same device. The previous line ("…loved before you
lace up. You are loved after the final horn.") was hockey-flavored and played
verbatim every session in every sport. Sessions are about eight seconds shorter.

Why it matters to a buyer: the session's last words now match the public tagline
("Your Identity Is Secure. Compete From Victory.") word for word, and the daily
identity reminder stays fresh across a season instead of becoming background
noise. Marketing may say the session "reminds the athlete who they are before
they compete" and may quote any line from the bank; it should not describe the
opening as a single fixed line.

## 2026-09-01 — /parents recut to the foundation/game-day framing; sitewide em-dash sweep

The parents page hero now leads "Daily training is the foundation. Game
day calls it up." with the approved five-element pregame description
(breath, visualization, identity in Christ, a focus cue, and prayer)
used consistently. The privacy callout discloses the full collected set
(first name, birthdate, self-chosen username, phrased "never shown to
third parties" per the canonical FV-320 language). Access is stated per
path: 13-17 train under the parent account; the 18+ self-serve trial
line renders only while adult signup is enabled. The canonical tagline
appears exactly once, and a "Read it here. They train it in the app."
block cross-links the athlete page and the two parent-audience articles.
Separately, 97 em dashes were removed from customer-facing copy across
the marketing site (replaced with sentence punctuation, no claim
changes); article bodies and the two GTM-engine pages were left as
approved.

Why it matters to a buyer: the parent page now states exactly what is
collected, exactly who can buy which way, and the same product
distinction the athlete page carries, with no dead-end capability
claims.

## 2026-09-01 — Dedicated "For the Athlete" page live at /athletes

The site nav's "For the Athlete" link now goes to a dedicated athlete page
(/athletes) instead of a homepage anchor. It is a moment-based wisdom page
(KC-approved design, H1 "The mental game, moment by moment."): practical
guidance organized by when the athlete needs it — before competition
(3-step nerves routine), the mental rep (3 rules, qualified research
framing), after a performance you want back (3-step reset), and three NIV
verse excerpts — each block condensed from a published athlete article and
linking to it, with the articles linking back. Product beats: a labeled
audio sample (the real hockey forward first-shift visualization clip), the
one approved beta quote, and a two-path conversion: 18+ self-serve trial
($5/mo or $49/yr after) shown only while adult signup is enabled, and a
13-17 "Send this to a parent" native-share of /parents that collects no
data from minors. Canonical close: "Play hard, fearless, and free."

Why it matters to a buyer: athlete-intent traffic now has a landing surface
in the athlete's own register that feeds both the resources library and the
two live purchase paths, without implying minors can self-serve.

## 2026-09-01 — Visualization research article live; homepage sections 01/02 rewritten to KC's copy

A sixth resources article is live: "Does Visualization Actually Work for
Athletes?" (/resources/does-visualization-work-for-athletes, athlete-facing).
It gives the qualified answer — visualization can help as a supplement,
with real limits — cited to modern systematic reviews (Liu 2025, Reinebo
2024, Toth 2020, Simonsmeier 2021), describes PETTLEP as a framework,
carries the Michael Phelps 2008 anecdote under an explicit
illustration-not-proof close, and states what visualization cannot do.
First article written under the binding evidence standard
(docs/content-evidence-standards.md, FV-540). The homepage's "The mental
rep" section was compressed to KC's own copy (headline "Picture the play.
Prepare for pressure. Compete from Christ's strength.") with one pointer
link to the article, and "The method" section restructured to KC's three
phases (REHEARSE / RESET / RELEASE) with a pointer link to the Pregame
Ritual guide. A new homepage FAQ entry answers "Does visualization
actually work?" in the same qualified register.

Why it matters to a buyer: the visualization differentiator now has an
honest, citable research page marketing can link to, and every public
claim about visualization efficacy is held to a written evidence standard
— no overclaims for a skeptical parent or coach to catch.

## 2026-08-31 — Visualization section gains a locker-room background image

The homepage's "The mental rep" section now has a darkened atmospheric
background: a locker-room image of a player with eyes closed and
headphones on (AI-generated by KC, not a photo of a real athlete),
rendered at low opacity under dark gradients so it reads as mood, not a
focal image. Text remains legible to WCAG AA over the brightest areas.
No copy changed.

Why it matters to a buyer: the section that argues for audio-guided
visualization now looks like the moment it describes.

## 2026-08-31 — Method section now presents the pregame session, step by step

The homepage Method section no longer describes the daily-training rhythm
(read the skill, anchor in Scripture, take one cue); it now walks the
pregame visualization method in four steps under the heading "Rehearse
it. Reset from it. Leave it with God.": set your session (position,
chosen plays, hard moment, one focus), hear the rep (the guided audio
runs the plays and the moment you would rather skip), practice the reset
(the way back after the mistake), and leave it with God (the session
truly ends in a spoken prayer; the copy describes it faithfully and ends
"Then you go compete fearless and free", echoing the hero). The daily
training still exists unchanged as a product; on the homepage it is
described by the lede line "You read the daily training. You hear the
pregame session." and the FAQ.

Why it matters to a buyer: the homepage's "how it works" now describes
the differentiating product (the customized, audio-guided pregame
session, ending in real prayer) rather than the daily reading rhythm.

## 2026-08-31 — Homepage tells the visualization story; new hero thesis

The homepage now makes the case for guided visualization directly. A new
section ("The mental rep", placed right after the playable audio sample)
explains in three beats: why the mental rep matters (imagery is one of
the most studied tools in sport; the honest boundary "It does not
replace training" is stated), what a good rep looks like (first moments
not highlight reels; the athlete picks up to three plays from their
position's library plus a hard moment, so the mistake and the reset get
rehearsed too), and the differentiator (guided audio, eyes closed, real
pauses at game speed, phone in pocket). Claims were held to
sports-psychologist-verified public-safe levels: no percentages, no
"proven", no clinical or meditation-app register. The Method section now
says the guided audio session runs a focus cue with the athlete before
competing, and its lede reads "You read the daily training. You hear the
pregame session." (daily training remains text; the narrated surfaces
are pregame and pre-practice). The hero paragraph is KC's new thesis,
verbatim: "Everyone knows visualization matters. From Victory gives
athletes sport-specific audio guides, grounded in Christ's victory, so
they can compete fearless and free." Note: the hero no longer carries
the "13+" wording; the age floor still appears in onboarding and the
waitlist section.

Why it matters to a buyer: the differentiator (audio-guided,
sport-specific visualization) is now argued explicitly on the homepage
instead of implied, and every claim on the page is one the product and
the research posture can back.

## 2026-08-31 — Hero screenshot is now the Positive Plays pregame screen

The homepage hero's phone now shows the pregame "Picture the plays
you'll make" screen (Positive Plays, where the athlete picks up to three
plays to rehearse) instead of the home dashboard. KC's call: the first
product visual should show the visualization differentiator itself.

Why it matters to a buyer: the hero image now demonstrates the guided
visualization feature the product is differentiated on, not a generic
dashboard.

## 2026-08-31 — Homepage hero now shows a real app screenshot

The phone in the homepage hero now displays a real capture of the app's
home dashboard (the same reviewed screenshot the product-preview carousel
uses) instead of a hand-built imitation of the UI. Every product image on
the homepage is now a genuine screenshot. No copy or layout changed.

Why it matters to a buyer: the first product visual a visitor sees is the
actual app they would be buying, consistent with the carousel below it.

## 2026-08-31 — Site-wide visual hierarchy restored; desktop nav simplified

A build bug had silently disabled every "dimmed text" style across the
site (937 of them): secondary text rendered at full brightness and
navigation links rendered gold instead of muted cream, which made the
top bar read as a wall of gold. The bug is fixed, so the whole site now
shows the muted hierarchy it was designed with, and low-contrast text
was raised to meet WCAG AA accessibility contrast on every dark surface.
The desktop nav is simpler: links no longer wrap to multiple lines,
"For Teams & Churches" and "Resources" moved from the top bar to the
footer (every page) and the mobile menu, the mobile menu now serves all
screens below 1024px, and the gold "Start free trial" pill is the only
gold element in the bar. No copy, pricing, or data facts changed.

Why it matters to a buyer: the site looks calmer and more premium at
first glance, the one gold call-to-action stands out instead of
competing with gold links, and text is legible to accessibility
standards.

## 2026-08-31 — Signup handoff expectations set; 18+ athlete path surfaced from the homepage

FV-515, the final change of the conversion-audit redesign, is live. Both
signup pages now tell the buyer what happens next before they commit: the
parent page (`/signup`) shows a three-step preview (Account, then Athlete,
then Trial) with the line "After you create your account, add your athlete
from your dashboard."; the 18+ athlete page (`/signup/athlete`) shows a
two-step preview (Account, then Trial) with "After you create your
account, you'll head to checkout." Each page also carries the trial and
billing disclosure adjacent to the submit button — the same
FTC-compliant card-required sentence already shown at checkout ("14 days
free for first-time subscribers", card charged automatically at trial end
unless canceled). The 18+ self-serve path is now discoverable from the
homepage: a quiet text link under the hero CTA ("Are you the athlete, and
18 or older? Create your own account") and a secondary card on `/signup`,
both reusing the existing entry-link wording verbatim. The parent form
remains the first and primary path on `/signup` — there is no blocking
chooser. Both surfaces render only when adult self-serve is enabled in
production; no signup fields, age rules, or billing behavior changed.

Why it matters to a buyer: a parent knows before signing up that the
athlete gets added afterward from the dashboard, an 18+ athlete can find
their own path without digging, and nobody reaches checkout surprised
that a card is required.

## 2026-08-31 — Homepage restructured to 8 sections; one approved beta quote now live

FV-514, the centerpiece of the conversion-audit redesign, is live: the
homepage (`/`) goes from 10 sections to 8 — Hero; the playable pregame
sample (context blurb now visible on mobile too, plus a contextual trial
CTA); a new "three-part method" section (daily mental-skill training,
Scripture as the foundation — the one Hebrews 12:1-2 quote on the page —
and game-day/practice application) replacing four consecutive sections
that each restated the same thesis; the app-screenshot preview (unchanged,
plus a contextual trial CTA); a new parent-trust strip ("What you see, and
what stays private") assembled from already-approved lines on /parents and
/pricing; a new pricing summary ("14 days free. Cancel anytime.") linking
to /pricing; the founder letter, now including one approved beta-athlete
quote labeled "Beta feedback" with non-identifying attribution ("Beta
hockey athlete"); and FAQ + waitlist (unchanged). The hero's second phone
mockup and its duplicate verse quote are gone — one phone, dimmed gold
accents, so the real trial CTA is the only solid-gold element in the first
viewport. The homepage now carries exactly 4 conversion CTAs to the trial
signup (hero, after-sample, after-preview, final), the same pattern used
on /parents. Measured at 375×812: the hero is 50% shorter (1483px to
736px, under 1.2 mobile viewports) and the full page is 20% shorter
(12144px to 9712px) — the four-section consolidation alone cut close to
30%, offset partly by the two new required trust/pricing sections. No
facts changed: pricing, privacy promises, and the age floor are worded
identically to /parents and /pricing, just relocated.

Why it matters to a buyer: a parent or athlete arriving cold now sees the
core pitch, a playable sample, and a live signup path much sooner, and the
first credible third-party signal (beta feedback, clearly labeled as such)
before FAQ instead of never.

## 2026-08-31 — Conversion-audit wave 1 shipped: site-wide a11y foundation, one-card pricing page, waitlist trimmed to non-live sports

Three changes from the 2026-08-29 marketing conversion audit are live (PRs #474/#475/#476):

- The marketing site has a real accessibility foundation: a skip-to-content link on every route, main landmarks site-wide, and the homepage hero now renders in server HTML with or without JavaScript (previously the whole landing page was invisible until client scripts ran).
- The pricing page shows one plan card with an annual/monthly toggle (annual default, both prices always visible) instead of two duplicated cards; the separate "Everything included" icon-grid section was removed as redundant. Pricing facts unchanged: $5/mo or $49/yr first athlete, $3/$29 additional, 14-day first-time trial, cancel anytime.
- The waitlist now offers only non-live sports (Swimming, Wrestling, Volleyball, Track & field, Tennis, Other), derived from the live-sport registry so an 8th live sport updates it automatically; no default sport is preselected; a visitor arriving for a live sport is routed to the trial instead. The form collects email + sport + role only — the first-name field and free-text note were removed (privacy-positive: less PII).

Why it matters to a buyer: the pricing page is materially shorter and clearer on mobile; a parent whose sport is live can no longer accidentally join a waitlist for a product they can buy today; campaigns pointing at the waitlist should target non-live sports only.

## 2026-08-27 — Sport landing pages for all seven live sports; Sports menu in the site nav

Every live sport now has its own marketing landing page: `/hockey`, `/basketball`, `/golf`, `/football`, `/baseball`, `/lacrosse`, `/soccer`. Each page's spoken-moment copy is limited to lines that sport's pregame audio actually runs (per-position flagship visualizations, play library, hard moments), lists the real positions/player types the engine uses, keeps identity in Christ as the second beat, and closes on Compete From Victory. All seven are in the sitemap, `llms.txt`, and the analytics marketing-route allowlist.

The site header now carries a "Sports" dropdown listing the seven live sports (driven by `SUPPORTED_SPORTS`, so it tracks the live set automatically). The homepage hero's "Hockey families: see the first shift →" link was removed in favor of that menu. The homepage remains sport-generic ("Visualize and Compete From Victory").

Why it matters to a buyer: a basketball, golf, football, baseball, lacrosse, or soccer parent searching for their sport now lands on a page about their athlete's actual game, not a hockey pitch.

## 2026-08-26 — Public store listings are not live; marketing comparison names today's SERP apps

*Superseded 2026-11-03: the iOS app is now on the US App Store. See the 2026-11-03 entry above. It is not on Google Play.*

From Victory is a web app / installable PWA. It is not listed on the App Store or Google Play. Internal TestFlight and Play Closed Alpha exist for native-shell QA. Do not tell a parent they can download From Victory from a public store tonight.

The public comparison page (`/christian-athlete-apps`) now names the three apps that currently win "best Christian athlete app" answers: Faithful Athlete, Playbook Devotional, and Core IV (all store-listed). FCA Challenge / YouVersion remain the free-devotion category; Play With Faith may still be mentioned as a sport-specific faith feed. From Victory differentiates as visualization you actually run, then compete from victory — 13+, not therapy, not a daily devotion, not a generic mindfulness app.

Homepage title/meta no longer leads with "Christian Athlete Mindset App." Lead is "Visualize and Compete From Victory" (homepage H1 and sitewide title), sport-generic across the seven live sports. Identity in Christ is the second beat, not the H1. Hockey specificity lives on the `/hockey` landing page, not the homepage.

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
