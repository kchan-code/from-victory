# @from-victory/content

Static content for the From Victory athlete app.

## What's here

| File | Purpose |
|---|---|
| `safety-keywords.json` | Vocabulary for the Journal Safety Pipeline (PR-06). Drives `apps/web/lib/safety/detect.ts`. **STUB — pending clinical advisor review per CLAUDE.md Open Items.** |

Future additions (not yet shipped):
- 30 daily training sessions (PR-07a/b will seed `training_sessions_catalog` from this package or directly via SQL).
- Sport-adaptive variants (post-MVP).

## Editing `safety-keywords.json`

This file is the canonical source of safety-detection vocabulary. It is read by `apps/web/lib/safety/keywords.ts` at server-start.

**Review cadence (per CLAUDE.md):** quarterly, with the clinical advisor (TBD). When the advisor recruits, expect a full replacement PR.

**Until the advisor lands:** edits should be conservative. False positives dilute signal; missing real signals is the higher-cost failure mode but better-the-pipeline-exists than perfect-but-unshipped.

**Schema:**

```json
{
  "version": 1,
  "status": "STUB" | "REVIEWED" | "...",
  "categories": [
    {
      "id": "crisis" | "self_harm" | "abuse" | "...",
      "label": "Human-readable category label",
      "resources_focus": "988_lifeline" | "crisis_text_line" | "trusted_adult",
      "keywords": ["phrase one", "phrase two", "..."]
    }
  ]
}
```

**Order matters:** the detector returns the FIRST matching category. Put most-urgent categories first (currently `crisis`, then `self_harm`, then `abuse`).
