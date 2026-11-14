# Rotating PREGAME_MARKER_SECRET

**Linear:** FV-749 · **Owner:** KC

One page for the secret behind the pregame option totals. Read it before
you change the value. A change at the wrong time corrupts a month of
counts, and nothing warns you.

## What it is

`PREGAME_MARKER_SECRET` is a Vercel Production environment variable,
stored as Sensitive. It is server-side only.

When an athlete finishes a pregame, the server
(`apps/web/lib/activity/pregame-selections.ts`) computes one marker per
chosen option. The marker is an HMAC-SHA256 keyed with this secret over the
athlete id, the month, the sport and the option
(`apps/web/lib/activity/pregame-marker.ts`). The database receives only the
marker, never the athlete id.

The database function `record_pregame_selections` stores markers in
`pregame_selection_contributors` and totals in `pregame_selection_counts`.
The marker is how it counts each athlete once per option per month, and how
it tracks that athlete's repeat picks (the 2+, 4+ and 8+ bands).

The month is the **UTC** calendar month. A month starts at 00:00 UTC on the
1st. In US Eastern time that is 7:00 pm on the last day of the previous
month (8:00 pm during daylight time).

## What breaks on a mid-month change

A new secret gives every athlete a new marker for the same option in the
same month. For each option an athlete picked both before and after the
change:

- The athlete is counted twice in the distinct-athlete count
  (`athlete_count`).
- Their repeat-pick count restarts at 1, so the 2+, 4+ and 8+ bands
  undercount.
- An inflated `athlete_count` can lift an option over the 10-athlete read
  floor when fewer than 10 different athletes chose it. That is a privacy
  problem, not only a reporting one.

Pick totals (`selection_count`) stay correct.

Nothing errors. Nothing alerts. The damage is limited to the month in which
the change happened. The next month is clean, because markers include the
month and old markers are deleted when their month ends.

## What happens if it is missing

If the variable is unset in production, nothing is recorded. The server
logs `[activity] pregame selection counts skipped: marker secret not
configured` and emails one alert to `ALERT_EMAIL_TO` per server instance.
Picks made while it is missing are lost. They cannot be rebuilt later.

There is no fallback to another secret and no development default.

## When rotation is safe

Rotate at the start of a new UTC month, as soon as you can after 00:00 UTC
on the 1st, and have the new deployment live before athletes run pregame
that month.

- Do not rotate before 00:00 UTC on the 1st. That changes the secret for
  the month that is about to close, when it holds the most data.
- 00:00 UTC is evening in North America, and athletes may be running
  pregame. Every athlete who finishes a pregame in the new month before the
  new secret is live can be double-counted for that month. The sooner the
  new deployment is live after 00:00 UTC, the fewer there are.
- A rotation at any other time of the month affects every athlete who
  already ran pregame that month.

If the secret has leaked, do not wait. Rotate now, accept that this month's
distinct-athlete counts and bands are wrong, and record the date (see
"How to tell" below).

## How to rotate

1. Confirm the time. It must be after 00:00 UTC on the 1st. `date -u`
   prints the current UTC time.
2. Generate the value straight to the clipboard. Do not print it, paste it
   in chat, or save it to a file:

   ```sh
   openssl rand -base64 48 | pbcopy
   ```

3. Vercel → the From Victory project → Settings → Environment Variables →
   `PREGAME_MARKER_SECRET` → Edit. Paste the new value. Keep the
   environment as Production and the type as Sensitive. Keep the Note
   field (see below). Save.
4. Redeploy production. A saved value does nothing until a new deployment
   is live. Vercel → Deployments → the current production deployment →
   Redeploy.
5. Clear the clipboard: `pbcopy < /dev/null`.
6. Check the new deployment is serving: `GET
   https://www.fromvictoryapp.com/api/health` returns `{"ok":true}`.
7. After the next pregame completes, check the Vercel logs. There should
   be no `pregame selection counts skipped` line and no missing-secret
   alert email.
8. Write the rotation date and UTC time in the Linear issue or the handoff
   note. That record is the only reliable history.

Do not delete the variable and add it again as two separate steps with a
deploy in between. Completions during the gap record nothing.

### Rollbacks carry the old secret

A Vercel deployment keeps the environment values it was built with.
Instant Rollback to a deployment built before the rotation brings the old
secret back. That is a mid-month change. After a rotation, if you must roll
back (`docs/runbooks/rollback.md`), fix forward with a new deployment as
soon as you can, and record that the month's distinct-athlete counts are
suspect.

## How to tell a mid-month rotation happened

There is no way to tell from the data today. The tables hold no timestamp
and no record of which secret produced a marker. A double-counted athlete
looks the same as two athletes. The raw tables must not be read for display
or export in any case.

The only evidence is outside the database:

- The Vercel variable shows when it was last updated, and the Vercel
  activity log records environment variable changes. If the last update
  and the redeploy that followed are not within the first hours of a UTC
  month, treat that month as affected.
- The rotation record from step 8.

If a month is affected, its pick totals are still good. Do not use its
distinct-athlete counts or its 2+, 4+ and 8+ bands. They cannot be
repaired.

## The Note field in Vercel

The variable's Note field in Vercel carries a warning, so the person editing
the value sees it at the point of change. As of 2026-11-14 it reads "Do not
rotate mid-month, see FV-749". If the variable is ever recreated, add a note
again. Suggested wording:

> Do not change mid-month. Rotate only just after 00:00 UTC on the 1st, then
> redeploy. A mid-month change double-counts athletes for that month and
> nothing alerts. See docs/runbooks/pregame-marker-secret.md.
