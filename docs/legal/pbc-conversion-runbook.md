# PBC Conversion Runbook — From Victory LLC → Benefit Corporation

> **Status: PREP.** KC's outside counsel recommended converting From Victory to a
> public benefit corporation (2026-08). Counsel drives the legal filings; this
> runbook tracks everything on our side — decisions KC owes counsel, the
> operational cascade after the conversion is effective, draft benefit-purpose
> language for attorney review, and the exact repo changes that ship once the
> new entity exists.
>
> **Nothing in this document is legal or tax advice.** Every draft here is input
> for the attorney and CPA, not a substitute for them. Do NOT change any live
> legal copy (privacy policy, terms, footer) until the conversion is EFFECTIVE
> and KC confirms the exact new legal name.

## 0. Current state (verified 2026-08-10)

- Current entity: **From Victory LLC, a New Jersey limited liability company.**
- Named in exactly three repo files (five spots) — see §6 for the change list.
- Terms of Use: governed by New Jersey law, NJ venue (terms §23-24).
- Privacy policy + terms are already flagged DRAFT-for-attorney (FV-324 /
  FV-329) — the entity swap can ride the same attorney review.
- Founder: KC, presumed sole member of the LLC. CLAUDE.md reserves 2-5% equity
  for a future chaplain / sports-psych advisor — a corporate form makes that
  grant mechanically real (actual shares/options instead of LLC-interest
  gymnastics).
- Business model: revenue-first subscription (Stripe live, ENFORCE gating on).
  A benefit corporation is a **for-profit** form — this model does not change.

## 1. Decisions KC owes counsel (bring to the next call)

| # | Decision | Options / notes |
|---|---|---|
| 1 | **State of incorporation** | (a) New Jersey benefit corporation (NJ Benefit Corporation Act, N.J.S.A. 14A:18-1 et seq.) — stays home-state, simplest footprint. (b) Delaware public benefit corporation (8 Del. C. §§ 361-368) + NJ foreign registration — standard if outside investment is ever on the table. KC's standing posture is revenue-first / may never raise, which weakens the usual Delaware default — ask counsel to make the case either way. |
| 2 | **Path: statutory conversion vs. merge vs. new-co** | Statutory conversion of the LLC (if counsel confirms availability for the chosen destination) preserves contracts and history; alternative is forming a new corp and merging the LLC in, or contributing assets. Counsel's call — but ask which path preserves the Stripe account, bank account, and existing customer subscriptions with the least re-papering. |
| 3 | **Exact legal name** | e.g. "From Victory, Inc." vs "From Victory PBC" vs "From Victory, a benefit corporation". Note: Delaware no longer requires "PBC" in the name (post-2020 amendments); NJ naming rules differ. The name chosen here is what goes into the privacy policy, terms, footer, Stripe, and bank — confirm the exact string, punctuation included. |
| 4 | **Benefit purpose language** | Drafts in §3. The specific public benefit is a public, charter-level statement — KC should be comfortable with it as a permanent mission lock. Decide how explicitly Christian the charter language is (see the two variants). |
| 5 | **Tax treatment** | A benefit corporation is a normal taxable corporation (default C corp; S election possible if eligible and desired). Moving from a (presumably disregarded) LLC changes the tax picture: C-corp double taxation vs. pass-through, payroll for KC, and potential §1202 QSBS qualification for founder stock (a real long-term upside of C-corp status — ask the CPA). **CPA must be in the loop before the effective date.** |
| 6 | **EIN continuity** | Depending on the path, the IRS may require a new EIN for the corporation. New EIN ripples into Stripe, bank, and payroll — ask counsel/CPA to confirm before filing so the cascade in §4 is sequenced right. |
| 7 | **Effective date** | Pick a clean date (quarter/month boundary helps the CPA). Everything in §4-6 keys off it. |
| 8 | **Governance docs** | Certificate w/ benefit purpose, bylaws, initial board (KC sole director is fine), stock issuance to KC, IP assignment from the LLC/KC into the corp (code, brand, content, trademark rights). Ask counsel to include the advisor-equity plan (2-5% pool) in the initial paperwork so the chaplain/advisor grant is ready when recruited. |
| 9 | **Benefit-report obligation** | NJ benefit corporations owe an **annual benefit report** measured against an independent third-party standard, delivered to shareholders and posted publicly (confirm current filing mechanics with counsel). Delaware PBCs owe a statement to stockholders at least **biennially**, no third-party standard, no public filing required. This is the main ongoing compliance difference — get the calendar obligation from counsel in writing. |

## 2. Why PBC fits (context for the decision, not advocacy)

- **Mission lock without becoming a nonprofit.** Directors of a benefit
  corporation must balance shareholder value against the stated public benefit.
  That protects the faith-first mission (identity precedes performance) through
  growth, advisors, or any future investment — while staying fully for-profit
  and revenue-first.
- **Answers the "not-for-profit?" tension.** The Giants-chaplain conversation
  (2026-07-20) surfaced an expectation that this is ministry, not business. A
  PBC is a credible middle answer: legally for-profit, charter-bound to the
  mission. Useful language for chaplain-network and advisory conversations.
- **Advisor equity becomes real.** The reserved 2-5% advisory grant can be
  actual stock/options under a corporate equity plan.
- **No product change.** Nothing about pricing, Stripe, subscriptions, or the
  app changes because of the corporate form.

## 3. Draft benefit-purpose language (FOR ATTORNEY REVIEW — not final)

General public benefit (statutory boilerplate) plus a specific public benefit.
Two variants for KC to choose a register; counsel conforms to the statute.

**Variant A — explicitly faith-forward:**

> The specific public benefit purpose of the Corporation is to strengthen the
> mental, emotional, and spiritual resilience of athletes, beginning at age 13,
> by providing daily mental-toughness training grounded in the Christian faith,
> so that athletes learn to root their identity in something more durable than
> performance.

**Variant B — mission-forward, faith named once:**

> The specific public benefit purpose of the Corporation is to promote the
> mental and emotional well-being of young athletes by delivering accessible,
> faith-based mental-toughness training that builds resilience, protects
> athlete privacy, and teaches that identity precedes performance.

Notes for counsel: the brand spine is Hebrews 12:1-2 ("compete from victory,
not toward it"); the product serves ages 13+, with heightened privacy
protections for minors 13-17 — if the privacy commitment is worth elevating to
charter level (Variant B does), KC would welcome that.

## 4. Operational cascade (AFTER the effective date, in order)

Owner key: **KC** (only KC can do it), **Counsel**, **CPA**, **Repo** (agent
work in this codebase).

1. **Counsel:** files effective; corporate book delivered (certificate, bylaws,
   board consent, stock certificate, IP assignment, EIN letter if new).
2. **KC + CPA:** IRS/EIN squared away; NJ state tax + payroll registrations
   updated; accounting entity switched as of the effective date.
3. **KC:** Bank — update or re-open the business account in the new entity
   name. Do this before Stripe so payouts land correctly.
4. **KC:** Stripe — update legal entity name / tax ID in Stripe business
   settings (may trigger re-verification; keep the same account, do NOT create
   a new Stripe account — subscriptions and webhooks must survive). Check the
   statement descriptor still reads correctly after the change.
5. **KC:** Insurance, domain registrar (Cloudflare), Vercel, Supabase, Resend,
   OpenAI, Linear, GitHub org — billing/legal entity name updates. None are
   urgent-day-one; batch within the first month.
6. **KC + Counsel:** USPTO — trademark search is still pending (CLAUDE.md open
   item). File the application in the NEW entity's name; if anything was
   already filed under the LLC, counsel records an assignment.
7. **Repo:** ship the entity-swap PR (§6) — only after KC confirms the exact
   name and the effective date has passed.
8. **Repo:** record the change in `docs/gtm/product-truths.md` (dated, factual:
   new legal name, effective date, "benefit corporation" status). Any
   MARKETING of the PBC status (site copy, social, "why we're a PBC" page) is
   Delvox GTM Engine territory — KC runs the engine; this repo does not invent
   that copy.
9. **KC (future, when native app ships):** Apple Developer / D-U-N-S under the
   new entity.

## 5. Repo guardrails

- The entity-swap PR touches `apps/web/**` → **privacy path → Tier 2**:
  qa-reviewer + kids-privacy-officer + KC gate. No auto-merge.
- Privacy policy and Terms get a new "effective date" line when the entity name
  changes — counsel should bless the updated docs as part of the same review
  already pending under FV-329.
- Terms §23-24 (NJ governing law + venue) may or may not change depending on
  the state-of-incorporation decision — counsel's call; do not touch without
  instruction.

## 6. Exact repo change list (execute only post-effective-date)

Every occurrence of the old entity, verified by grep on 2026-08-10:

| File | Line (approx) | Current text | Change to |
|---|---|---|---|
| `apps/web/app/terms/page.tsx` | ~48 | "refer to From Victory LLC, a New Jersey limited liability company" | new name + form per counsel |
| `apps/web/app/terms/page.tsx` | ~497, ~510 | Governing law / venue: New Jersey | only if counsel instructs |
| `apps/web/app/terms/page.tsx` | ~529 | Contact block: "From Victory LLC" | new name |
| `apps/web/app/privacy/page.tsx` | ~58 | "From Victory LLC, a New Jersey limited liability company (…)" | new name + form |
| `apps/web/app/privacy/page.tsx` | ~448 | Contact block: "From Victory LLC" | new name |
| `apps/web/components/landing/Footer.tsx` | ~54 | "© 2026 From Victory LLC · All rights reserved" | "© 2026 <new name> · All rights reserved" |

Not in the repo but same sweep: Stripe statement descriptor + receipt name,
Resend email footer templates (none currently name the entity — re-grep before
shipping), any app-store listings (future).

## 7. Open questions log

- [ ] State: NJ benefit corp vs Delaware PBC? (counsel)
- [ ] Path: conversion vs merger vs new-co + asset contribution? (counsel)
- [ ] Exact legal name string? (KC + counsel)
- [ ] New EIN required? (CPA/counsel)
- [ ] C corp vs S election? QSBS relevance? (CPA)
- [ ] Benefit purpose: Variant A or B (or counsel redraft)? (KC)
- [ ] Effective date? (KC + counsel + CPA)
- [ ] Does the pending FV-329 attorney review of privacy/terms fold in the
      entity swap, or is that a second pass? (counsel)
- [ ] Annual benefit-report standard + calendar (if NJ)? (counsel)
