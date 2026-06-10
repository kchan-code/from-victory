# Frontend Backlog

> **STALE — 2026-06-10.** This file reflects the frontend-engineer
> holistic review of 2026-05-30. It predates basketball-in-MVP (FV-26),
> the compositional pregame re-arch (FV-113–FV-120), and the journal
> descope (FV-135). Many P1/P2 items below may already be resolved or
> superseded. Verify against Linear before acting on these items.



Deferred frontend improvements from the **frontend-engineer holistic review of
`apps/web` (2026-05-30)**. The **P0** tier shipped in
[PR #66](https://github.com/kchan-code/from-victory/pull/66); the P1/P2 items
below are not yet done. Pull from here when picking up frontend work.

Effort key: **S** = quick, **M** = a few hours, **L** = a day+ / needs design.

---

## ✅ P0 — shipped (PR #66)
- Tap targets ≥44px on pregame back/close nav (were 34px).
- Visible `focus-visible` rings on all inputs + auth `SubmitButton` (were `outline-none`).
- App Router boundaries: `app/error.tsx`, `app/not-found.tsx`, `app/athlete/loading.tsx`, `app/dashboard/loading.tsx`.
- "Read instead" toggle on the guided-audio screen (accessible path for deaf/HoH or loud environments).
- `DeleteAthleteButton` aria (`aria-expanded`/`aria-controls`/`aria-live` + consequence in the accessible name).
- Brand-spine drift: Romans 8:37 → Hebrews 12:1-2 in the landing Hero mockup and `/dev/components`.

---

## P1 — should-fix soon

| Item | File(s) | Why | Effort |
|---|---|---|---|
| Athlete home is a "coming soon" stub | `app/athlete/page.tsx` | Confuses any athlete who gets a pairing link cold; needs a real pre-launch empty-state or the Day-1 content presented as the actual session | M |
| Migrate `useFormState` → `useActionState` | all ~12 form components | `useFormState` (react-dom) is deprecated as of React 18.3; do before the Next 15 / React 19 bump (see security-debt issue #1) | M |
| Error color uses raw `text-red-400` | ~17 spots across forms + dashboard | Bypasses the registered `--fv-danger` (#E5564C) token; the two reds differ visibly and won't update from one source | S |
| Progress bar lacks ARIA | `components/pregame/shared.tsx` (PregameHeader) | No `role="progressbar"` + `aria-valuenow/min/max`; screen readers get no session progress | S |
| Quick Reset breath has no gate | `components/pregame/QuickReset.tsx` | Sphere is `autoStart={false}` with no `onComplete`; athlete can skip breathing entirely in an urgency flow | S |
| Pairing URL fallback is broken | `components/dashboard/PairingPanel.tsx` | `window.location.origin` with an empty server-side fallback can produce a relative URL parents copy/text; use `NEXT_PUBLIC_SITE_URL` | S |
| Delete-athlete inline form cramped | `components/dashboard/DeleteAthleteButton.tsx` | `w-[260px]` can clip on 375px | S |
| No `data-testid` anywhere | all interactive components | qa-reviewer's Playwright is forced onto fragile text/role selectors; add stable hooks on critical paths | M |
| Middleware doesn't exclude `/api/webhooks` | `apps/web/middleware.ts` | Known Stripe-webhook signature break; fix **before** the first webhook PR | S |

---

## P2 — polish / tech-debt

| Item | File(s) | Why | Effort |
|---|---|---|---|
| Two parallel primitive libraries | `components/ui/*` vs `components/pregame/shared.tsx` | Divergent Button/Card/Eyebrow/Icon; every design change needs two edits — consolidate into `ui/` | L |
| `shared.tsx` is a 508-line kitchen sink | `components/pregame/shared.tsx` | 15 components in one file; violates one-component-per-file; hurts review/test/tree-shaking | M |
| Arbitrary radii vs tokens | pregame screens | `rounded-[12/18/22px]` alongside registered `--r-sm/md/lg/xl` | S |
| Placeholder footer links | `components/landing/Footer.tsx` | About/Contact `href="#"`, non-existent `#audiences` anchor | S |
| Inconsistent focus-ring color | `components/landing/WaitlistForm.tsx` | Cobalt focus rings while auth forms use gold — pick one | S |
| Missing maskable PWA icon | `app/manifest.ts` | Android adaptive icons need a `purpose: "maskable"` variant or the installed icon shows as a plain square | S |
| Breath sphere ignores reduced-motion | `components/pregame/BreathingSphere.tsx` | rAF loop runs regardless of `prefers-reduced-motion: reduce` | M |
| Pregame card "Screenshot it" | `components/pregame/screens-b.tsx` | Mechanism varies by device; a `navigator.share()` action would be platform-appropriate | L |
| Privacy/Terms have no back-nav | `app/privacy/page.tsx`, `app/terms/page.tsx` | Dead-end in standalone PWA mode (no browser back); add a minimal nav/back link | S |

---

*Source: frontend-engineer agent review, 2026-05-30. Overall assessment then:
solid for pre-beta — coherent design system, sophisticated pregame flow; main
gaps were the (now-fixed) P0 accessibility/trust blockers, plus the consistency
and tech-debt items above.*
