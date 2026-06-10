# From Victory — Log Retention Policy

**Linear:** FV-13 (Part B) | **Last updated:** 2026-06-10

---

## 1. Vercel Function Logs

Vercel retains server-side function logs according to plan:

| Plan | Retention |
|---|---|
| Hobby | ~1 day (rolling) |
| Pro | ~30 days (rolling) |
| Enterprise | Configurable (customer-defined, up to 90 days) |

**What From Victory logs at the server-action level:**

Server actions and API routes log only opaque infrastructure identifiers
(parent/athlete UUIDs, Stripe event IDs, Postgres error codes, boolean
flags). Per the CLAUDE.md minimal-PII rule:

- No first names, birthdates, or other athlete PII in logs
- No journal content, prompt text, or safety-detection categories
- No raw IP addresses (Next.js/Vercel may log them internally per their
  Privacy Policy, but From Victory code does not log or persist them)
- No athlete synthetic email addresses (`athlete-<uuid>@<internal-domain>`)

**Action item before GA:**

1. Confirm the production Vercel plan and its actual log retention period.
2. Confirm that no log drain is forwarding function logs to a third-party
   aggregator (Datadog, Sentry, Logtail, etc.) before public signup — if
   one is added, perform a PII audit of what reaches the drain first.

---

## 2. Database Event Tables

### 2a. `auth_rate_limit_events` (added FV-13 Part A)

**Retention:** TRANSIENT — self-pruning within the rate-limit window.

- The writing server action prunes rows older than the rate-limit window on
  every write, so the table never grows unboundedly.
- Rows contain only: a non-reversible HMAC digest of the client identifier
  (no raw IP address, no email), an event type enum, and a timestamp.
- This satisfies CLAUDE.md's "no long-term IP-derived data" rule: the
  digest is one-way, scoped to the rate-limit window, and auto-deleted.

### 2b. `account_deletion_events` (FV-14)

**Retention:** DURABLE — deliberately not TTL-deleted.

- This table is the proof-of-deletion audit record: it provides the forensic
  evidence that a deletion request was received and executed.
- Content is content-free: opaque UUIDs only (no names, emails, or journal
  content). No minor PII is stored.
- Durability is intentional — a TTL deletion of the audit record would
  destroy the evidence of the deletion event itself, which is the opposite
  of the record's purpose.
- If a future regulatory or legal requirement demands a shorter retention
  on deletion audit records, evaluate at that time. For now: durable.

### 2c. `safety_events` (FV-135 — dormant, no production callers)

**Intended retention when wired:** TBD — lean toward a rolling TTL (see below);
NO journal content is ever written.

- Per CLAUDE.md Option C, each row stores only the columns in
  `20260522002717_safety_events.sql`: `athlete_id`, `athlete_session_id`,
  `category` (which detection bucket matched), and `detected_at` — **never**
  the journal text that triggered the detection.
- Sensitivity note: although content-free, `category` is health-adjacent
  behavioral metadata about a **minor**, which carries regulatory weight under
  GDPR-K and state age-appropriate-design codes (CA, FL, TX). That argues
  **against** indefinite retention. When this table is wired, default to a
  rolling TTL (e.g. 90 days for detection metadata) unless a specific
  forensic/product need justifies keeping it longer, and document that choice
  here.
- No `safety_events` row ever contains journal content — this is a
  NON-NEGOTIABLE design constraint (CLAUDE.md Journal Safety Architecture).

---

## 3. Review Cadence

Review this policy:

- At GA (general availability / public signup launch)
- When a log drain or external error aggregator is added
- When a new event table is added to the schema
- Annually thereafter, or when applicable regulations change

---

*Cross-references: FV-13 (device-cookie hardening + rate-limit events),
FV-14 (account deletion audit), FV-135 (journal / Option C dormant),
CLAUDE.md §Non-Negotiable Constraints.*
