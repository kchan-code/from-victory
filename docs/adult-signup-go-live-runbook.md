# ENABLE_ADULT_SIGNUP — Go-Live Runbook (FV-444)

**Owner of the flip: KC.** Same pattern as the `ENFORCE_SUBSCRIPTION_GATING`
go-live (2026-06-25). Part of the 13-25 expansion arc (KC-approved
2026-07-20; counsel sign-off on the 18+ self-attestation path per FV-329).

## Pre-flip checklist (all must be true)

- [ ] **FV-440 merged** — billing portal, account settings, and
      `deleteAccount` accept `adult_athlete` (PR #382). ✅ merged 2026-07-21
- [ ] **FV-441 merged** — `/athlete/settings` shows Subscription +
      Delete-account sections to `adult_athlete` only (minors never see
      billing UI).
- [ ] **FV-442 merged** — subscribe page qty-1 framing + neutral
      forgot-password copy (PR #381). ✅ merged 2026-07-21
- [ ] **FV-443 merged** — RLS harness adult/minor boundary assertions green
      in CI (PR #385). ✅ merged 2026-07-21
- [ ] **FV-445 merged** — universal crisis copy on all three surfaces
      (PR #380). ✅ merged 2026-07-21
- [ ] **Prod migrations applied** — `supabase db push` from an up-to-date
      main checkout (includes `20260721000000` comment migration,
      `20260721010000` content neutralization, `20260721020000`
      created_as_adult_by_parent). Then
      `supabase gen types typescript --linked` and diff against the
      committed `apps/web/lib/supabase/types.ts` (FV-448 hand-edit).
- [ ] **Flip-day claims PR merged at the same time as the flip**
      (FV-446 part 2: landing-FAQ clause, pricing carve-out, privacy §d
      self-serve-deletion sentence) — these claims become true the moment
      the flag is on; merge them with the flip, not before.

## The flip

1. Vercel → from-victory-web → Settings → Environment Variables →
   Production: add `ENABLE_ADULT_SIGNUP` = `true`.
2. Redeploy production (env changes require a redeploy to take effect).
3. Merge the flip-day claims PR (FV-446 part 2) so the public pages update
   in the same deploy window.

## Post-flip smoke test (prod, ~15 minutes)

Adult path (use a real email you control; card `4242 4242 4242 4242` only
if Stripe test mode — otherwise a real card you immediately cancel):

1. `/signup` shows the "Are you the athlete, and 18 or older?" entry.
2. `/signup/athlete` **rejects** an under-18 birthdate with the clear
   message (not a generic error), and **accepts** an 18+ birthdate with the
   attestation checkbox.
3. Complete signup → Stripe checkout → lands on `/athlete` (no 500, no
   parent-dashboard redirect). 14-day trial applied for a first-time
   subscriber.
4. `/athlete/settings` shows **Subscription** and **Delete account**
   sections. Open the billing portal → it returns to `/athlete/settings`
   (not `/dashboard/settings`).
5. Crisis surfaces (postgame footer + pregame completion card) serve the
   NEW universal copy — check with a hard refresh; CDN may cache the old
   deploy briefly.
6. Delete the account via the typed-confirmation flow → verify in Stripe
   that the subscription is cancelled and in Supabase that the profile row
   is gone (cascade).
7. `/privacy`, `/pricing`, and the landing FAQ show the flip-day claims
   (18+ self-serve described) and no "13-21" anywhere.

Parent regression (the arc's core risk is "widened a parent-only guard and
broke parents"):

8. Fresh parent signup → checkout → create a minor athlete → pairing →
   athlete signs in → parent dashboard shows rhythm. One full pass.
9. As the minor athlete: `/athlete/settings` shows **no** Subscription or
   Delete-account section.
10. Parent billing portal still opens and returns to `/dashboard/settings`.

## Rollback

Remove the env var (or set `false`) + redeploy. The adult route returns to
404-dark; existing adult accounts (if any were created) keep working for
sign-in/billing/deletion — the flag gates only new signups.

## After a green smoke

- [ ] Dated entry in `docs/gtm/product-truths.md`: adults 18+ can sign up,
      pay ($5/mo | $49/yr, 14-day first-time trial), manage billing, and
      delete their own account; eligibility is 13+ with no upper limit.
      Facts only — the Delvox engine does the positioning.
- [ ] Close FV-444 in Linear; notify the Delvox evaluation issue (FV-459)
      that the adult path is live.
