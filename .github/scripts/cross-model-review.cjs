// Cross-model review gate.
//
// A PR passes only when the repo owner has posted a marker comment recording a
// clean review of the PR's CURRENT head commit by a model from a different
// family than the model that wrote the code:
//
//   CROSS-MODEL-REVIEW: CLEAN
//   REVIEWER-MODEL: gpt-5.6-sol-high
//   CODER-MODEL: claude-opus-5-5
//   <full 40-char head SHA anywhere in the comment>
//
// The SHA binding is what makes a new push fail the gate again: an old marker
// names the old SHA, so it no longer matches. This module is the pure, testable
// core; .github/workflows/cross-model-review.yml runs the default branch's copy
// of it and publishes a `cross-model-review` commit status on the PR head.
//
// Zero dependencies — runs under github-script's Node and `node --test`.

'use strict';

const STATUS_CONTEXT = 'cross-model-review';

// Only the repo owner's account can post a marker that counts.
const REQUIRED_AUTHOR = 'kchan-code';

const DEPENDABOT_LOGIN = 'dependabot[bot]';

// Each marker field must be its own line so prose that merely mentions the
// marker does not count.
const STATUS_LINE_RE = /^[ \t]*CROSS-MODEL-REVIEW:[ \t]*(\S+)[ \t]*$/gim;
const REVIEWER_LINE_RE = /^[ \t]*REVIEWER-MODEL:[ \t]*(\S+)[ \t]*$/gim;
const CODER_LINE_RE = /^[ \t]*CODER-MODEL:[ \t]*(\S+)[ \t]*$/gim;
const FULL_SHA_RE = /^[0-9a-f]{40}$/i;

// Provider prefixes (`xai/grok-4.7`) and the family each one implies. A
// provider that contradicts the model name makes the id unclassifiable.
const PROVIDER_FAMILY = { xai: 'grok', anthropic: 'claude', openai: 'gpt', google: 'gemini' };

// Family names as they appear at the start of a model id. `codex` is an
// OpenAI model line, so it maps to the gpt family.
const NAME_FAMILY = { claude: 'claude', grok: 'grok', gpt: 'gpt', codex: 'gpt', gemini: 'gemini' };

function toMs(ts) {
  const n = Date.parse(ts);
  return Number.isNaN(n) ? -Infinity : n;
}

/**
 * Model family of a model id, or null when it cannot be classified. Strips
 * provider prefixes (xai/, anthropic/, openai/, google/) and a `cursor-`
 * prefix, then requires a known family name followed by end-of-id or `-`, so
 * `grok`, `grok-4.7` and `cursor-grok-4.6-high` are grok but `grokking` and
 * `codexposition` are not classified. Unclassified ids fail the gate.
 */
function modelFamily(id) {
  let rest = String(id || '').trim().toLowerCase();
  let providerFamily = null;
  const provider = /^([a-z0-9-]+)\//.exec(rest);
  if (provider) {
    if (!Object.prototype.hasOwnProperty.call(PROVIDER_FAMILY, provider[1])) return null;
    providerFamily = PROVIDER_FAMILY[provider[1]];
    rest = rest.slice(provider[0].length);
  }
  if (rest.startsWith('cursor-')) rest = rest.slice('cursor-'.length);
  const name = /^([a-z]+)(?:-|$)/.exec(rest);
  if (!name || !Object.prototype.hasOwnProperty.call(NAME_FAMILY, name[1])) return null;
  const family = NAME_FAMILY[name[1]];
  if (providerFamily && providerFamily !== family) return null;
  return family;
}

/** Distinct values captured by a line regex, in order of appearance. */
function lineValues(body, re) {
  const values = [...String(body || '').matchAll(re)].map((m) => m[1]);
  return [...new Set(values)];
}

/** True if `sha` appears in `body` as a whole hex token (not inside a longer one). */
function containsSha(body, sha) {
  if (!FULL_SHA_RE.test(String(sha || ''))) return false;
  const re = new RegExp(`(^|[^0-9a-f])${sha}([^0-9a-f]|$)`, 'i');
  return re.test(String(body || ''));
}

/**
 * Parse one comment body into a marker, or null if it has no
 * `CROSS-MODEL-REVIEW:` line. Conflicting duplicate fields make the marker
 * invalid rather than picking one.
 * @returns {null | {status:string|null, reviewer:string|null, coder:string|null, error:string|null}}
 */
function parseMarker(body) {
  const statuses = lineValues(body, STATUS_LINE_RE);
  if (statuses.length === 0) return null;
  const reviewers = lineValues(body, REVIEWER_LINE_RE);
  const coders = lineValues(body, CODER_LINE_RE);
  let error = null;
  if (statuses.length > 1) error = 'conflicting CROSS-MODEL-REVIEW lines';
  else if (reviewers.length > 1) error = 'conflicting REVIEWER-MODEL lines';
  else if (coders.length > 1) error = 'conflicting CODER-MODEL lines';
  return {
    status: statuses.length === 1 ? statuses[0].toUpperCase() : null,
    reviewer: reviewers.length === 1 ? reviewers[0] : null,
    coder: coders.length === 1 ? coders[0] : null,
    error,
  };
}

/**
 * Latest marker comment from REQUIRED_AUTHOR that names `headSha`, or null.
 * `created_at` has one-second resolution, so markers in the same second are
 * ordered by comment id (GitHub ids increase over time). If that still cannot
 * order them (missing or equal ids) the result is an ambiguous, failing marker.
 */
function latestMarkerForSha(comments, headSha, author = REQUIRED_AUTHOR) {
  const found = [];
  for (const c of comments || []) {
    if (!c || !c.user || c.user.login !== author) continue;
    const marker = parseMarker(c.body);
    if (!marker || !containsSha(c.body, headSha)) continue;
    found.push({ ...marker, ms: toMs(c.created_at), id: Number.isSafeInteger(c.id) ? c.id : null });
  }
  if (found.length === 0) return null;
  const latestMs = Math.max(...found.map((f) => f.ms));
  const tied = found.filter((f) => f.ms === latestMs);
  if (tied.length === 1) return tied[0];
  const ids = tied.map((f) => f.id);
  if (ids.some((id) => id === null) || new Set(ids).size !== ids.length) {
    return { ...tied[0], error: 'several markers share the same timestamp and cannot be ordered' };
  }
  return tied.reduce((a, b) => (b.id > a.id ? b : a));
}

/**
 * True only for a PR opened by Dependabot whose every commit is authored by
 * Dependabot and carries a verified signature (Dependabot's commits are
 * GitHub-signed). A human commit pushed onto a Dependabot branch, or an
 * incomplete commit list, removes the exemption.
 */
function isDependabotOnly(prAuthor, commits) {
  if (prAuthor !== DEPENDABOT_LOGIN) return false;
  if (!Array.isArray(commits) || commits.length === 0) return false;
  return commits.every(
    (c) =>
      c &&
      c.author &&
      c.author.login === DEPENDABOT_LOGIN &&
      c.commit &&
      c.commit.verification &&
      c.commit.verification.verified === true,
  );
}

/**
 * Decide the gate result. Pure — no I/O.
 * `message` fits a commit-status description (140 chars); `help` is the full
 * instruction for the job log.
 * @param {{prAuthor?:string, commits?:object[], headSha:string, comments:object[]}} input
 * @returns {{pass:boolean, message:string, help:string}}
 */
function decide({ prAuthor, commits, headSha, comments }) {
  const help =
    `Post a comment from @${REQUIRED_AUTHOR} with the lines "CROSS-MODEL-REVIEW: CLEAN", ` +
    `"REVIEWER-MODEL: <model id>", "CODER-MODEL: <model id>" and the full head SHA ${headSha}. ` +
    'Format: CONTRIBUTING.md -> "Cross-model review marker".';
  const fail = (message) => ({ pass: false, message, help });

  if (isDependabotOnly(prAuthor, commits)) {
    return { pass: true, message: 'Every commit is a verified Dependabot commit — cross-model review not required.', help: '' };
  }
  if (!FULL_SHA_RE.test(String(headSha || ''))) {
    return fail('Could not resolve the PR head SHA.');
  }
  const short = headSha.slice(0, 7);
  const marker = latestMarkerForSha(comments, headSha);
  if (!marker) return fail(`No CROSS-MODEL-REVIEW marker from @${REQUIRED_AUTHOR} for head ${short}.`);
  if (marker.error) return fail(`Marker for ${short} is invalid: ${marker.error}.`);
  if (marker.status !== 'CLEAN') {
    return fail(`Latest marker for ${short} says CROSS-MODEL-REVIEW: ${marker.status}, not CLEAN.`);
  }
  if (!marker.reviewer || !marker.coder) {
    const missing = [!marker.reviewer && 'REVIEWER-MODEL', !marker.coder && 'CODER-MODEL'].filter(Boolean);
    return fail(`Marker for ${short} is missing ${missing.join(' and ')}.`);
  }
  const reviewerFamily = modelFamily(marker.reviewer);
  const coderFamily = modelFamily(marker.coder);
  const unknown = [!reviewerFamily && marker.reviewer, !coderFamily && marker.coder].filter(Boolean);
  if (unknown.length > 0) {
    return fail(`Cannot classify model id ${unknown.map((m) => `"${m}"`).join(' and ')} as claude, grok, gpt/codex or gemini.`);
  }
  if (reviewerFamily === coderFamily) {
    return fail(`Reviewer and coder are both ${reviewerFamily}; the review needs a different model family.`);
  }
  return {
    pass: true,
    message: `CLEAN for ${short}: reviewer ${reviewerFamily}, coder ${coderFamily}.`,
    help: '',
  };
}

// GitHub commit-status descriptions are truncated at 140 chars.
function clamp(text) {
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

/**
 * Workflow entrypoint for `pull_request_target` and `issue_comment` events.
 * Writes the `cross-model-review` commit status on the PR head SHA. A decision
 * failure is a red status, not a failed job, so the status can turn green on a
 * later comment without a re-run (same model as privacy-verdict.cjs). Errors
 * fail closed: a red status is posted when the head SHA is known, and the job
 * fails.
 */
async function run({ github, context, core }) {
  const { owner, repo } = context.repo;
  let prNumber;
  if (context.eventName === 'pull_request_target') {
    prNumber = context.payload.pull_request.number;
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

  let headSha;
  const targetUrl = `${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId}`;
  try {
    const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: prNumber });
    headSha = pr.head.sha;
    const author = pr.user && pr.user.login;
    let commits = [];
    if (author === DEPENDABOT_LOGIN) {
      commits = await github.paginate(github.rest.pulls.listCommits, {
        owner,
        repo,
        pull_number: prNumber,
        per_page: 100,
      });
      // listCommits stops at 250; an incomplete list never earns the exemption.
      if (commits.length !== pr.commits) commits = [];
    }
    const comments = await github.paginate(github.rest.issues.listComments, {
      owner,
      repo,
      issue_number: prNumber,
      per_page: 100,
    });

    const { pass, message, help } = decide({ prAuthor: author, commits, headSha, comments });
    await github.rest.repos.createCommitStatus({
      owner,
      repo,
      sha: headSha,
      state: pass ? 'success' : 'failure',
      context: STATUS_CONTEXT,
      description: clamp(message),
      target_url: targetUrl,
    });
    core.info(`${STATUS_CONTEXT} on ${headSha} -> ${pass ? 'success' : 'failure'}: ${message}`);
    if (help) core.info(help);
  } catch (err) {
    if (headSha) {
      try {
        await github.rest.repos.createCommitStatus({
          owner,
          repo,
          sha: headSha,
          state: 'failure',
          context: STATUS_CONTEXT,
          description: clamp(`cross-model-review gate error — re-run or contact a maintainer: ${err.message}`),
          target_url: targetUrl,
        });
      } catch (statusErr) {
        core.error(`Could not post failure status: ${statusErr.message}`);
      }
    }
    core.setFailed(err.message);
  }
}

module.exports = {
  STATUS_CONTEXT,
  REQUIRED_AUTHOR,
  modelFamily,
  containsSha,
  parseMarker,
  latestMarkerForSha,
  isDependabotOnly,
  decide,
  run,
};
