# FV-569: Apple token key operations and the cleanup reaper

Runbook for the Sign in with Apple refresh-token store (spec §5.5) and the
cleanup reaper (spec §5.7, FV-674). Never paste a key, token or user email into
a ticket, chat or log. Key material lives only in the Vercel env of the
environment it belongs to.

## 1. `APPLE_TOKEN_KEY`: one key per environment

- Staging and production use **different** `APPLE_TOKEN_KEY` values. Never copy
  production's key to staging (or the reverse): a staging leak must not decrypt
  production refresh tokens, and a staging row must not be decryptable in prod.
- Format: 32 random bytes, base64. Generate with `openssl rand -base64 32` on
  your machine and paste straight into Vercel (Production / Preview scoped
  separately). Do not echo it to the terminal history or a file in the repo.
- Rows are AES-256-GCM, bound to their row by AAD (`token|<user_id>|<client_id>`),
  so a ciphertext cannot be replayed onto another user.

## 2. Versioned keys (rotation)

- The current key is `APPLE_TOKEN_KEY`, and `APPLE_TOKEN_KEY_VERSION` (default
  `1`) names its version. Every stored row records the `key_version` it was
  written with.
- To rotate: move the current value to `APPLE_TOKEN_KEY_V<n>` (n = the version
  it was written under), set a new `APPLE_TOKEN_KEY`, and raise
  `APPLE_TOKEN_KEY_VERSION` to n+1. New rows use the new key; old rows stay
  decryptable through `APPLE_TOKEN_KEY_V<n>`.
- **Keep every `APPLE_TOKEN_KEY_V<n>` until no row of that version remains**
  (all such rows re-written by a later sign-in, or deleted with their user).
  Check by key version with a count-only query in the Supabase SQL editor:
  `select key_version, count(*) from private.apple_signin_tokens group by 1;`
  and the same on `private.apple_signin_handoffs`. Remove an old key only when
  its count is 0 in both.
- Deleting a version early makes those rows undecryptable, which is the lost-key
  case below.

## 3. Lost or wrong key: revoke fails

If a key is lost, or an environment's key does not match its rows, revoke fails
for those users (decrypt error). The system fails closed and keeps going:

- User-facing deletion shows the manual Apple instruction and raises an alert.
- The reaper retries; after 5 failed runs it deletes the unestablished account
  **without** revoking (Apple TN3194: the deletion must be fulfilled) and sends
  an alert with an 8-character internal id prefix only.
- Manual-revoke path for the affected person: Settings (iPhone) > Apple ID >
  Sign-In & Security > Sign in with Apple > From Victory > Stop Using Apple ID.
  (appleid.apple.com > Sign-In and Security > Sign in with Apple works too.)
  Tell the user this only when they ask; do not email them from the alert.
- Restore the missing `APPLE_TOKEN_KEY_V<n>` if it can be found; the next
  reaper run then revokes normally.

## 4. Delete users only through the app

- Account deletion and the reaper revoke at Apple **before** deleting. The
  Supabase dashboard (Authentication > Users > Delete) and `auth.admin.deleteUser`
  called by hand skip the Apple revoke, leave the person's Apple authorization
  active, and discard the only copy of their refresh token (cascade).
- For an Apple-linked account that must be removed, use the in-app delete (or
  mark it and let the reaper do it); never use the dashboard delete.
- Established accounts are never touched by the reaper (it deletes only through
  `finalize_pending_deletion`, which re-checks `is_unestablished` under the lock).

## 5. Reaper: dry run, then live

Route: `/api/cron/reap-incomplete-signups` (Vercel cron every 15 minutes, added
in `vercel.json`). Auth: `Authorization: Bearer $CRON_SECRET`.
Not gated by any `SSO_*` flag: it, the handoff purge and all deletion paths run
even when sign-in buttons are off.

**Defaults to dry run.** Unless `REAPER_DRY_RUN` is exactly `false` the route
only computes and logs counts (`candidates`, `tombstoned`, `wouldMark`); it
marks, revokes, deletes and purges nothing. The cron entry only starts after
this code is merged to `main` (auto-deploys to production), which KC controls.

Procedure:

1. **Staging first.** Keep `REAPER_DRY_RUN` unset. Invoke manually:
   `curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://<staging-host>/api/cron/reap-incomplete-signups`
   Read the JSON counts. Expect `dryRun: true`, `deleted: 0`.
2. Sanity-check that `candidates` matches what you expect (abandoned signups
   older than 1 hour; no established or athlete accounts; `wouldMark` plus
   `tombstoned` = `candidates`). If it looks wrong, stop; do not go live.
3. **Production: dry run for the first week.** Leave `REAPER_DRY_RUN` unset in
   production and watch the 15-minute logs
   (`[cron/reap-incomplete-signups] done — dryRun=true ...`).
4. **Go live on staging**: set `REAPER_DRY_RUN=false` on staging, create a
   throwaway unverified signup, age it past 1 hour (or use an Apple-linked
   pending account), invoke, and confirm: `marked`/`deleted` rise, the Apple
   authorization is gone, and the user row is removed. Run the Apple revoke
   failure case (wrong key) once and confirm `revokeFailed`, attempts bump, and
   the alert after five runs.
5. **Go live on production**: set `REAPER_DRY_RUN=false` (the literal string) in
   Vercel Production and redeploy so the env applies. Watch the first live runs
   for `errors=0` and a sensible `deleted` count (cap is 100 per run).
6. **Roll back**: set `REAPER_DRY_RUN=true` (or remove the `vercel.json`
   entry). Tombstoned accounts simply wait; nothing is lost. Run the reaper
   once after rolling forward again.

Log lines are counts only. If an alert fires
("pending account closed without confirmed revoke"), it carries only an 8-char
internal id prefix; look it up through service-role SQL, not by email.
