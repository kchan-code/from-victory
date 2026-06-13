# Stripe Go-Live + Free Accounts — Runbook

**Owner:** KC · **Status:** ready to execute once PR for FV-62/FV-69 merges
**Goal:** start collecting real money, while keeping the ability to hand out
free accounts to get the word out — without locking out anyone who already has access.

---

## The mental model: two switches, not one

Going "live" is really two independent switches. Keep them separate in your head:

1. **Collect money** — swap Stripe test keys/prices for live ones. (Part A.)
2. **Enforce the gate** — make "paid vs. free" actually *mean* something, i.e.
   block non-payers. This is OFF by default behind a flag
   (`ENFORCE_SUBSCRIPTION_GATING`). (Part D.)

You can turn on #1 today and leave #2 off — nobody is affected, you just start
taking payments from people who choose to subscribe. Turn on #2 only **after**
you've comped everyone who should stay free (Part C), so no current user gets
locked out.

**Free accounts** are handled by an explicit comp-grant mechanism
(`access_grants` table + the `/dashboard/admin/grants` console) — completely
decoupled from Stripe. A comped parent needs **no card and never touches
checkout**. Grants can be permanent or time-boxed.

---

## Order of operations (do these in sequence)

```
A. Flip Stripe to live           (Stripe dashboard + Vercel env)  ← start collecting money
B. Apply the access-grants DB migration   (one supabase db push)
C. Comp everyone who should be free       (/dashboard/admin/grants)  ← incl. current beta users
D. Turn enforcement ON                    (set the env flag, redeploy)  ← now non-payers are gated
```

Parts A and B are independent and can be done in either order. **C must happen
before D.** D is the only step that can lock anyone out, and it's instantly
reversible (Part E).

---

## Part A — Flip Stripe to live mode

All in the [Stripe Dashboard](https://dashboard.stripe.com), then Vercel.

### A1. Toggle to Live mode
Top-right of the Stripe dashboard, switch from **Test mode** to **Live mode**.
Everything below (products, prices, webhook, keys) must be created in **Live
mode** — test-mode objects do not carry over, and price IDs do not cross modes.

### A2. Create the live Products + Prices (graduated tiered pricing)
The checkout passes `quantity = number of linked athletes`, so each Price must
be **graduated tiered** (first athlete one rate, additional athletes a cheaper
rate). Recreate the two prices you set up in test mode (FV-283):

**Monthly price** (one Product, e.g. "From Victory — Monthly"):
- Pricing model: **Graduated tiering**
- Tier 1: first **1** unit → **$5.00 / unit / month**
- Tier 2: **2+** units → **$3.00 / unit / month**

**Annual price** (same Product or a second one):
- Pricing model: **Graduated tiering**
- Tier 1: first **1** unit → **$49.00 / unit / year**
- Tier 2: **2+** units → **$29.00 / unit / year**

> The sibling-discount amounts ($3 / $29) are tunable on the Price object in the
> dashboard later with **no code deploy** — the code just reads quantity.

> Do **not** put the 14-day trial on the Price. The trial is applied in code
> (`trial_period_days: 14`, first-time subscribers only) so repeat-trial abuse
> is preventable. Leave the Price trial-free.

Copy the two **live Price IDs** (`price_...`).

### A3. Create the live webhook endpoint
Developers → Webhooks → **Add endpoint**:
- URL: `https://<your-production-domain>/api/webhooks/stripe`
  (must be `https://` — the success/cancel URLs also need the scheme.)
- Events to send:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- Copy the endpoint's **Signing secret** (`whsec_...`).

> **API version caveat (FV-219):** our integration pins the Stripe API version to
> `2024-06-20`. Your account's default is newer (`2026-05-27.dahlia`). The pin
> means Stripe sends us events in the shape our webhook expects, so this is safe
> as-is. If you ever set the webhook endpoint's own API version, set it to
> `2024-06-20` to match. (FV-219 tracks upgrading the pin later.)

### A4. Set the live env vars in Vercel (Production scope)
Project → Settings → Environment Variables → **Production**:

| Var | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from A3) |
| `STRIPE_PRICE_ID_MONTHLY` | live monthly `price_...` (from A2) |
| `STRIPE_PRICE_ID_ANNUAL` | live annual `price_...` (from A2) |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-production-domain>` |

### A5. Redeploy
Trigger a production deploy so the new env vars take effect.

### A6. Smoke test (live)
1. Sign up as a fresh parent, add one athlete, go to `/subscribe`, pick a plan.
2. Use a **real card** — the 14-day trial means **$0 charged today**, so this is
   safe. (Cancel from the billing portal afterward if you don't want it to
   convert on day 14.)
3. Confirm in Stripe: a Customer + a `trialing` Subscription appear.
4. Confirm the webhook delivered (Webhooks → your endpoint → recent deliveries,
   all `200`), and that the parent's `subscriptions` row exists with
   `status = trialing`.

✅ At this point you are **taking real payments.** Enforcement is still off, so
nothing is gated yet.

---

## Part B — Apply the access-grants migration

The comp/free-account feature needs its DB table in production.

```bash
# from repo root, on a checkout that has the merged migration
supabase db push                       # applies 20260613060000_access_grants.sql
supabase gen types typescript --linked > apps/web/lib/supabase/types.ts
# commit the regenerated types if they differ from the hand-written stub
```

Confirm the table exists:
```bash
supabase migration list                # 20260613060000_access_grants present on remote
```

> The PR ships a hand-written `access_grants` type so CI is green pre-push.
> After `db push`, regenerate types so they're authoritative.

---

## Part C — Comp the people who should be free (the GTM lever)

This is the "get the word out" mechanism. Two audiences:

1. **Anyone already using the app for free today** (beta testers under your admin
   account, friends, advisors) — comp them **before** Part D so they aren't
   locked out.
2. **New people you want to give free access** — influencers, coaches, chaplains,
   friends-and-family, anyone you're trying to win.

### How to comp (after the PR merges)
Go to **`/dashboard/admin/grants`** (visible only to admin accounts —
the emails in the `ADMIN_EMAILS` env var):
1. Enter the **parent's email** (they must have signed up first — they sign up
   normally, then you grant; no card, no checkout).
2. Enter a **reason** ("coach", "beta", "friends & family") — this is your audit trail.
3. Optionally set an **expiry** (e.g. free for the launch season). Leave blank
   for **permanent** free access.
4. Submit. They now have full access. Revoke any time from the same page.

> **Handing out ready-made accounts at an event?** Use the existing
> `/dashboard/admin/create-athlete` flow to create athlete logins under your
> admin parent, then grant your admin parent a comp — every athlete under it is
> covered.

### Data check before enabling enforcement
If any beta accounts were comped the old way (a hand-inserted `subscriptions`
row with a fake `stripe_customer_id` like `comp_beta_001`), they'll still read as
`active` and keep working — but the clean path is a real grant. Migrate them:
```sql
-- find any fake comp rows
select parent_id, stripe_customer_id, status
from subscriptions
where stripe_customer_id not like 'cus_%';
```
For each, issue a real grant via the console (or SQL insert into `access_grants`)
and delete the fake `subscriptions` row. (None expected if beta used the
admin-create path without the fake-row hack.)

---

## Part D — Turn enforcement ON

Only after **A + B + C** are done, the migration is live, and `/athlete/paused`
is deployed (it ships in this PR).

1. Set in Vercel (Production):
   ```
   ENFORCE_SUBSCRIPTION_GATING=true
   ```
2. Redeploy.

### What enforcement does
- **Full access** (active/trialing subscription **or** an active comp grant) →
  everything works as normal.
- **Degraded** (past_due / unpaid) → still works; not hard-blocked (a
  fix-payment banner is a follow-up, FV-195).
- **Blocked** (no subscription, no comp) →
  - a **parent** is sent to `/subscribe`,
  - an **athlete** is sent to `/athlete/paused` (a calm screen telling them to
    ask their parent — never a checkout, athletes can't buy).

### Verify after enabling
- A blocked test parent → redirected to `/subscribe`.
- A blocked test athlete → sees `/athlete/paused`.
- A **comped** parent's athlete → full access (proves comps survive the gate).
- A `trialing`/`active` parent's athlete → full access.

---

## Part E — Rollback

Enforcement is a single switch. If anything looks wrong after Part D:

```
ENFORCE_SUBSCRIPTION_GATING=false   (or delete it)   → redeploy
```

Everyone instantly has access again (back to today's behavior). The Stripe
live billing (Part A) and the comp data (Part C) are unaffected — only the
gate turns off.

---

## Reference

- **Comp grants:** `apps/web/lib/actions/grants.ts`, table
  `supabase/migrations/20260613060000_access_grants.sql`, console
  `/dashboard/admin/grants`
- **Enforcement guard:** `apps/web/lib/subscriptions/enforce.ts`
  (`requireActiveAccess`), flag `ENFORCE_SUBSCRIPTION_GATING`
- **Entitlement resolver:** `apps/web/lib/subscriptions/access.ts`
  (comp grant first, then Stripe status)
- **Checkout / trial / tiered pricing (already live in code):**
  `apps/web/lib/actions/subscription.ts` (FV-217 trial, FV-283 sibling discount)
- **Related issues:** FV-62 (enforcement), FV-69 (comp grants), FV-217 (trial +
  reprice), FV-283 (sibling discount), FV-219 (Stripe API-version upgrade),
  FV-231 (landing free-trial CTA — gated on this flip)
