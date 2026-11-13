# Uptime monitor — health endpoint

**Linear:** FV-729 · **Owner:** KC

The app exposes a first-party probe. Pointing a vendor at it is a new
third-party dependency. Product-strategist approves the service before any
account is created. Do not add an error SDK, analytics script, or package
to the app for this. Athletes are not tracked.

## What to check

| Check | URL | Pass |
|---|---|---|
| App + database | `GET https://www.fromvictoryapp.com/api/health` | HTTP 200 and body `{"ok":true}` |
| Sign-in page | `GET https://www.fromvictoryapp.com/signin` | HTTP 200 |

Alert KC (the same person who receives `ALERT_EMAIL_TO`). A one-minute
interval is enough. Treat any non-200, a timeout, or a body other than
`{"ok":true}` as down.

## What the health route does

- Uses the public anon key for a header-only read of `training_sessions_catalog` (`head: true`). No rows come back.
- That table is shared content, not athlete data. The response includes no rows and no secrets.
- `Cache-Control: no-store`. Do not let the monitor cache a stale 200.
- Missing Supabase env or an unreachable database returns `503` and `{"ok":false}`.

## What it does not do

Client render errors do not go to the uptime vendor. The root and athlete
error boundaries POST `/api/client-error`. That handler emails
`ALERT_EMAIL_TO` through `notifyError`, at most a handful of times per
minute per server instance, and stores nothing. The message is truncated.
User ids are not accepted. See `docs/security/log-retention.md` §2d.

## Turning a monitor on

1. Product-strategist agrees the vendor.
2. Create the two checks above. No auth header. No custom header that would
   put a secret in the vendor's dashboard.
3. Send alerts to KC. Do not install the vendor's browser script.
