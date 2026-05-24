# Feature Roadmap

Curated list of features and improvements deferred from the MVP build.
Authoritative day-to-day deferred-item tracking lives in memory and in
the open-items section of `CLAUDE.md`; this file holds the larger
deferrals worth surfacing across sessions.

When a deferred item ships, remove it from this list (or move it under
"Shipped" if it's worth keeping a record of).

---

## Pregame / Postgame

### Pregame session persistence

The pregame flow (visualization → Beat 1 → Beat 2) ships as a
transient UI experience for MVP. No database table, no parent-dashboard
read, no rhythm-feed entry on completion.

**Defer reason**: ship the flow first, observe whether persistence is
actually needed, add it when there's a real product reason.

**When to revisit**: when one of the following lands —
- Parent dashboard needs to show pregame-use in the rhythm feed
- Athletes start asking for a streak / history of pregame use
- Analytics question we can't answer without the data
- Coach-mode or team-mode entry path needs it

**What it would take when picked up**:
- New table `pregame_sessions` (athlete_id, tier, started_at,
  completed_at, possibly identity_anchor_line_text snapshot)
- RLS: athlete own row, parent reads metadata only (no identity-anchor
  content), service-role full
- Server action `logPregame` called from the UI's start/complete events
- Privacy review on the new minor-data surface
- Optionally: rhythm-feed integration

### Postgame screen

KC named postgame as a planned screen alongside pregame, but only the
pregame flow has been designed so far.

**When to revisit**: after pregame ships and we have a baseline athlete
loop. Postgame is a different design problem — likely a brief
reflection prompt, possibly journal-tied (PR-09 territory), and needs
its own sports-psychologist + content-curator pass before UI work.

---

## Content

### Days 11-30 Core Identity Track

Days 1-10 seeded into `training_sessions_catalog` via
`20260523120000_seed_training_sessions_days_1_10.sql`. Remaining 20
days span four arc blocks:

| Days | Block |
|---|---|
| 11-15 | Courage, risk-taking, playing free |
| 16-20 | Discipline, practice, and hidden faithfulness |
| 21-25 | Pressure, fear, comparison, and approval |
| 26-30 | Leadership, gratitude, perseverance, and competing from victory |

**When to revisit**: after PR-08 (today-core) ships and athletes can
actually use the existing 10 days. Drafting more content before there's
a working surface to consume it is bad sequencing.

### Sport-swap templating

Day 10's journal prompt closes with "before you stepped on the ice" —
hockey-locked phrasing inside the prompt itself. Other days keep
sport-locked phrasing in the body but leave the prompt more
transferable.

**When to revisit**: when v2 work expands beyond hockey. At that point,
do a sweep across all 30 days for sport-locked phrasing in titles,
landing lines, and prompts (the parts that can't be easily swapped at
render time).

### Scenario Modules content + schema

Two-track architecture established in PR #28: Core Identity Track
(daily arc, ≤300 words) + Sport-Specific Scenario Modules (situational
library, 600-900 words). Core Track is shipping; Scenario Modules
are not.

**When to revisit**: after the Core Track loop is functional. Scenario
Modules need their own table (or column split — TBD), distinct from
`training_sessions_catalog`. Privacy review will be heavy because the
modules touch emotionally specific situations.

**Open product question** (flagged by kids-privacy-officer): do 13-15
athletes get any surfacing/warning treatment before opening
emotionally heavy modules (`injury`, `wanting_to_quit`, `burnout`,
`anxiety`, `parent_pressure`)? Must be answered before any module
ships.

---

## Safety + privacy hardening

### Pre-GA hardening checklist

Tracked in detail in
`/Users/kinnychanhome/.claude/projects/-Users-kinnychanhome-Claude-FromVictory/memory/project_pre-ga-hardening-from-pr21.md`.

Must close before public signup opens. Quick summary:

- Per-IP rate limits on `/pair`, `/signin`, `/forgot-password`, and
  `submitWaitlist`
- HMAC-signed device cookie on `fv_device_athlete_id`
- `__Host-` cookie prefix in production
- Log retention TTL documented in `/privacy`

**When to revisit**: just before public signup launches. Not blocking
the friendly beta tester.

### Robots / indexing posture

`/privacy` and `/terms` are currently `robots: index, follow`. The
`privacy@fromvictoryapp.com` mailbox must be live and monitored before
those pages are publicly indexed. If the mailbox is not yet set up,
flip both pages to `robots: noindex` temporarily.

**When to revisit**: KC to confirm mailbox status; flip noindex on/off
accordingly.

---

## Account + payments

### Stripe payments

MVP-critical for revenue, not for beta testing. Parent buys the
subscription ($8.99/mo or $79/yr per CLAUDE.md). Not yet wired.

**When to revisit**: when the beta tester loop is solid and we're
within ~2 weeks of public launch.

### Account deletion flow (PR-18)

Parents must be able to delete an athlete account; cascade-delete the
athlete's data (profile, sessions, journal entries, safety events)
within 30 days. Schema cascades are in place; the user-facing flow
isn't.

**When to revisit**: same window as Stripe — pre-launch hardening.

---

## Infrastructure

### Vercel preview redirect URL

The forgot-password flow's redirect URL is hardcoded to
`https://www.fromvictoryapp.com` (production). Preview deploys
currently send users to production for the reset, which works but
isn't ideal for testing the flow on a preview branch.

**When to revisit**: if/when preview-deploy round-trip testing of
forgot-password becomes important. Use a project-specific Vercel
wildcard pattern (not `*.vercel.app` — that's an account takeover
vector).

### Vercel CLI upgrade

Flagged at session start: 50.37.1 → 54.3.0. Non-blocking.

**When to revisit**: any quiet moment. `npm i -g vercel@latest`.

---

## Shipped (for reference)

When a roadmap item lands, the entry moves here so we don't lose the
history. Initially empty — items will move down as they ship.
