// Privacy VERDICT gate (FV-4).
//
// Enforces CLAUDE.md → "Merge Authority & Risk Tiers" → Privacy override
// (HARD RULE): a PR whose diff touches a Privacy-sensitive path may not merge
// until the kids-privacy-officer has posted `VERDICT: APPROVED`. This module is
// the pure, testable core; the workflow (.github/workflows/privacy-verdict.yml)
// wires it to GitHub and publishes a `privacy-verdict` commit status that the
// `main` ruleset requires.
//
// Zero dependencies — runs under github-script's Node and `node --test`.

'use strict';

// Privacy-sensitive paths, from CLAUDE.md → Project Workflow Config, plus the
// committed Codex mirror of the same content (FV-460, KC 2026-07-21):
// AGENTS.md and .codex/agents/** are generated from CLAUDE.md and
// .claude/agents/** by bin/sync-codex.sh, so they carry the identical
// PII/minor-protection language and get the identical gate.
// Prefix entries match the path and everything under it; exact entries match
// only that file.
const PRIVACY_PREFIXES = [
  'apps/web/',
  'supabase/',
  '.claude/agents/',
  '.codex/agents/',
];
const PRIVACY_EXACT = ['CLAUDE.md', 'docs/brand.md', 'AGENTS.md'];

// Comment authors we trust to issue a verdict. The kids-privacy-officer runs in
// a maintainer's Claude Code session and posts via that account, so the verdict
// is only honored from repo-trusted authors — an external PR author (NONE /
// CONTRIBUTOR / FIRST_TIME_CONTRIBUTOR) cannot self-approve. NOTE: in a solo
// repo the OWNER is also the PR author, so the gate is, by design, a forcing
// function ("a verdict comment must exist") rather than a cryptographic barrier
// against the maintainer — the human posting the officer's verdict is the
// backstop. See PR description / FV-4 for the rationale.
const TRUSTED_ASSOCIATIONS = ['OWNER', 'MEMBER', 'COLLABORATOR'];

// The verdict must be its own line (optionally quoted), so prose that merely
// mentions "VERDICT: APPROVED" inline does not satisfy the gate.
const VERDICT_LINE_RE = /^[ \t>]*VERDICT:[ \t]*(APPROVED|BLOCKED|CHANGES_REQUESTED)\b/gim;

/** Parse an ISO-8601 timestamp to epoch ms; missing/invalid sorts oldest. */
function toMs(ts) {
  const n = Date.parse(ts);
  return Number.isNaN(n) ? -Infinity : n;
}

/** True if a single changed file lives on a Privacy-sensitive path. */
function isPrivacyPath(file) {
  if (typeof file !== 'string' || file.length === 0) return false;
  if (PRIVACY_EXACT.includes(file)) return true;
  return PRIVACY_PREFIXES.some((prefix) => file.startsWith(prefix));
}

/** The subset of changed files that are Privacy-sensitive. */
function sensitiveFiles(files) {
  return (files || []).filter(isPrivacyPath);
}

/** Last line-anchored verdict token in a comment body, or null. */
function extractVerdict(body) {
  const matches = [...String(body || '').matchAll(VERDICT_LINE_RE)];
  if (matches.length === 0) return null;
  return matches[matches.length - 1][1].toUpperCase();
}

/**
 * Resolve the latest trusted verdict from PR comments.
 * @param {{body?:string, created_at?:string, author_association?:string}[]} comments
 * @param {string[]} [trusted] author associations allowed to issue a verdict
 * @returns {{verdict:'APPROVED'|'BLOCKED'|'CHANGES_REQUESTED', at:string}|null}
 */
function parseLatestVerdict(comments, trusted = TRUSTED_ASSOCIATIONS) {
  const found = [];
  for (const c of comments || []) {
    if (!c || !trusted.includes(c.author_association)) continue;
    const verdict = extractVerdict(c.body);
    if (verdict) found.push({ verdict, at: c.created_at || '' });
  }
  if (found.length === 0) return null;
  // Latest by created_at wins, so an APPROVED can be overridden by a later
  // BLOCKED (and vice-versa). On an exact timestamp tie, the non-APPROVED
  // verdict wins — ties resolve fail-closed.
  found.sort((a, b) => {
    const d = toMs(b.at) - toMs(a.at);
    if (d !== 0) return d;
    const weak = (v) => (v === 'APPROVED' ? 1 : 0);
    return weak(a.verdict) - weak(b.verdict);
  });
  return found[0];
}

/**
 * Decide the gate result. Pure — no I/O.
 * @param {string[]} changedFiles
 * @param {object[]} comments
 * @param {string} [headCommittedAt] ISO timestamp of the PR head commit; an
 *   APPROVED verdict must post-date it, so a new push invalidates a stale
 *   approval and forces a fresh review.
 * @returns {{state:'success'|'failure', description:string}}
 */
function decide(changedFiles, comments, headCommittedAt) {
  const sensitive = sensitiveFiles(changedFiles);
  if (sensitive.length === 0) {
    return { state: 'success', description: 'No privacy-sensitive paths touched — gate N/A.' };
  }
  const latest = parseLatestVerdict(comments);
  if (!latest) {
    return {
      state: 'failure',
      description: 'Privacy paths touched — awaiting kids-privacy-officer VERDICT: APPROVED.',
    };
  }
  if (latest.verdict !== 'APPROVED') {
    return {
      state: 'failure',
      description: `kids-privacy-officer VERDICT: ${latest.verdict} — merge blocked.`,
    };
  }
  // APPROVED only counts for the commit it reviewed: it must be newer than the
  // current head commit. (When headCommittedAt is absent — pure-unit context —
  // the freshness check is skipped; run() always supplies it in CI.)
  if (headCommittedAt && toMs(latest.at) <= toMs(headCommittedAt)) {
    return {
      state: 'failure',
      description: 'VERDICT: APPROVED predates the latest commit — re-review required after push.',
    };
  }
  return { state: 'success', description: 'kids-privacy-officer VERDICT: APPROVED (current commit).' };
}

// GitHub commit-status descriptions are truncated at 140 chars.
function clamp(text) {
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

/**
 * Workflow entrypoint. Computes the verdict for the PR in context and writes a
 * `privacy-verdict` commit status on the PR head SHA. Fails CLOSED: any error
 * after the head SHA is known still posts a `failure` status, so a PR never
 * hangs as a perpetually-pending required check.
 */
async function run({ github, context, core }) {
  const { owner, repo } = context.repo;

  // Resolve the PR number from either trigger; the head SHA is resolved inside
  // the try so even that lookup failing falls through to the fail-closed path.
  let prNumber;
  let headSha;
  if (context.eventName === 'pull_request') {
    prNumber = context.payload.pull_request.number;
    headSha = context.payload.pull_request.head.sha;
  } else if (context.eventName === 'issue_comment') {
    if (!context.payload.issue.pull_request) {
      core.info('Comment is not on a pull request — nothing to do.');
      return;
    }
    prNumber = context.payload.issue.number;
  } else {
    core.info(`Unsupported event ${context.eventName} — nothing to do.`);
    return;
  }

  try {
    if (!headSha) {
      const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: prNumber });
      headSha = pr.head.sha;
    }

    // Freshness is judged against the head commit's committer date. That field
    // is client-settable, but backdating it only makes a real approval look
    // staler (over-block) — the safe direction — so it cannot be used to slip a
    // stale approval through.
    const { data: headCommit } = await github.rest.repos.getCommit({ owner, repo, ref: headSha });
    const headCommittedAt = headCommit.commit.committer.date;

    const files = await github.paginate(github.rest.pulls.listFiles, {
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });
    const changedFiles = files.map((f) => f.filename);

    const comments = await github.paginate(github.rest.issues.listComments, {
      owner,
      repo,
      issue_number: prNumber,
      per_page: 100,
    });

    const { state, description } = decide(changedFiles, comments, headCommittedAt);

    await github.rest.repos.createCommitStatus({
      owner,
      repo,
      sha: headSha,
      state,
      context: 'privacy-verdict',
      description: clamp(description),
      target_url: `${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId}`,
    });

    core.info(`Sensitive files touched: ${sensitiveFiles(changedFiles).length}`);
    core.info(`privacy-verdict → ${state}: ${description}`);
    // Do NOT core.setFailed() on a decision 'failure' (awaiting / non-APPROVED
    // verdict). The gate is the `privacy-verdict` COMMIT STATUS published above —
    // make THAT the required check in the main ruleset. The status self-heals:
    // a later issue_comment run overwrites it green the instant the verdict
    // posts, no re-push or manual re-run needed.
    //
    // Failing the JOB here created a second, NON-self-healing signal: the
    // `pull_request` run always fires BEFORE any verdict comment can exist, so
    // its "Require privacy VERDICT" check-run is born red, and a completed
    // check-run can't be retroactively greened by the comment-triggered run.
    // That left every privacy-path PR sitting red until a manual job re-run.
    // The job's only role is to PUBLISH the status; genuine errors still fail it
    // (see the catch block below).
  } catch (err) {
    // Fail closed: post a red status so the gate blocks rather than hangs. If
    // the head SHA was never resolved we can't post — the job still goes red and
    // the absent required status keeps the PR blocked until a re-run.
    if (headSha) {
      const description = clamp(`privacy-verdict gate error — re-run or contact a maintainer: ${err.message}`);
      try {
        await github.rest.repos.createCommitStatus({
          owner,
          repo,
          sha: headSha,
          state: 'failure',
          context: 'privacy-verdict',
          description,
          target_url: `${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId}`,
        });
      } catch (statusErr) {
        core.error(`Could not post failure status: ${statusErr.message}`);
      }
    }
    core.setFailed(err.message);
  }
}

module.exports = {
  PRIVACY_PREFIXES,
  PRIVACY_EXACT,
  TRUSTED_ASSOCIATIONS,
  toMs,
  isPrivacyPath,
  sensitiveFiles,
  extractVerdict,
  parseLatestVerdict,
  decide,
  run,
};
