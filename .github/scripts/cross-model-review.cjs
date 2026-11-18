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
// core; .github/workflows/cross-model-review.yml wires it to GitHub.
//
// Zero dependencies — runs under github-script's Node and `node --test`.

'use strict';

// Only the repo owner's account can post a marker that counts.
const REQUIRED_AUTHOR = 'kchan-code';

// PR authors exempt from the gate (dependency bumps are not agent-written code).
const EXEMPT_PR_AUTHORS = ['dependabot[bot]'];

// Each marker field must be its own line so prose that merely mentions the
// marker does not count.
const STATUS_LINE_RE = /^[ \t]*CROSS-MODEL-REVIEW:[ \t]*(\S+)[ \t]*$/gim;
const REVIEWER_LINE_RE = /^[ \t]*REVIEWER-MODEL:[ \t]*(\S+)[ \t]*$/gim;
const CODER_LINE_RE = /^[ \t]*CODER-MODEL:[ \t]*(\S+)[ \t]*$/gim;
const MARKER_MENTION_RE = /CROSS-MODEL-REVIEW:/i;
const FULL_SHA_RE = /^[0-9a-f]{40}$/i;

function toMs(ts) {
  const n = Date.parse(ts);
  return Number.isNaN(n) ? -Infinity : n;
}

/**
 * Model family from a model id prefix: claude-*, grok-*, gpt-* or codex*,
 * gemini-*; anything else is "other".
 */
function modelFamily(id) {
  const m = String(id || '').trim().toLowerCase();
  if (m.startsWith('claude-')) return 'claude';
  if (m.startsWith('grok-')) return 'grok';
  if (m.startsWith('gpt-') || m.startsWith('codex')) return 'gpt';
  if (m.startsWith('gemini-')) return 'gemini';
  return 'other';
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
 * On an exact timestamp tie the later comment in list order wins.
 */
function latestMarkerForSha(comments, headSha, author = REQUIRED_AUTHOR) {
  let best = null;
  for (const c of comments || []) {
    if (!c || !c.user || c.user.login !== author) continue;
    const marker = parseMarker(c.body);
    if (!marker || !containsSha(c.body, headSha)) continue;
    if (!best || toMs(c.created_at) >= toMs(best.at)) {
      best = { ...marker, at: c.created_at || '' };
    }
  }
  return best;
}

/**
 * Decide the gate result. Pure — no I/O.
 * @param {{prAuthor?:string, headSha:string, comments:object[]}} input
 * @returns {{pass:boolean, message:string}}
 */
function decide({ prAuthor, headSha, comments }) {
  if (EXEMPT_PR_AUTHORS.includes(prAuthor)) {
    return { pass: true, message: `PR opened by ${prAuthor} — cross-model review not required.` };
  }
  const short = String(headSha || '').slice(0, 7);
  const howTo =
    `Post a comment from @${REQUIRED_AUTHOR} with the lines "CROSS-MODEL-REVIEW: CLEAN", ` +
    `"REVIEWER-MODEL: <model id>", "CODER-MODEL: <model id>" and the full head SHA ${headSha}.`;
  if (!FULL_SHA_RE.test(String(headSha || ''))) {
    return { pass: false, message: `Could not resolve the PR head SHA (got "${headSha}").` };
  }
  const marker = latestMarkerForSha(comments, headSha);
  if (!marker) {
    return {
      pass: false,
      message: `No cross-model review marker for the current head commit ${short}. ${howTo}`,
    };
  }
  if (marker.error) {
    return { pass: false, message: `Cross-model review marker for ${short} is invalid: ${marker.error}. ${howTo}` };
  }
  if (marker.status !== 'CLEAN') {
    return {
      pass: false,
      message: `Latest cross-model review marker for ${short} says CROSS-MODEL-REVIEW: ${marker.status}, not CLEAN.`,
    };
  }
  if (!marker.reviewer || !marker.coder) {
    const missing = [!marker.reviewer && 'REVIEWER-MODEL', !marker.coder && 'CODER-MODEL'].filter(Boolean);
    return {
      pass: false,
      message: `Cross-model review marker for ${short} is missing ${missing.join(' and ')}. ${howTo}`,
    };
  }
  const reviewerFamily = modelFamily(marker.reviewer);
  const coderFamily = modelFamily(marker.coder);
  if (reviewerFamily === coderFamily) {
    return {
      pass: false,
      message:
        `Reviewer model "${marker.reviewer}" and coder model "${marker.coder}" are both in the ` +
        `"${reviewerFamily}" family. The review must come from a different model family ` +
        '(claude, grok, gpt/codex, gemini, other).',
    };
  }
  return {
    pass: true,
    message:
      `Cross-model review CLEAN for ${short}: reviewer ${marker.reviewer} (${reviewerFamily}), ` +
      `coder ${marker.coder} (${coderFamily}).`,
  };
}

/** Workflow entrypoint for `pull_request` events: fails the job unless decide() passes. */
async function run({ github, context, core }) {
  const { owner, repo } = context.repo;
  const pr = context.payload.pull_request;
  if (!pr) {
    core.setFailed(`cross-model-review runs on pull_request events only (got ${context.eventName}).`);
    return;
  }
  // A re-run keeps its original payload, so this judges the commit the run
  // (and its check) belongs to; comments are always read live.
  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number: pr.number,
    per_page: 100,
  });
  const { pass, message } = decide({
    prAuthor: pr.user && pr.user.login,
    headSha: pr.head.sha,
    comments,
  });
  if (pass) core.info(message);
  else core.setFailed(message);
}

/**
 * Workflow entrypoint for `issue_comment` events. A check run created by an
 * issue_comment-triggered workflow attaches to the default branch, not the PR,
 * so instead of evaluating here this re-runs the PR's latest `pull_request`
 * run of this workflow for the current head SHA, whose `cross-model-review`
 * job then re-reads the comments.
 */
async function reevaluate({ github, context, core, pollMs = 10000, maxPolls = 18 }) {
  const { owner, repo } = context.repo;
  const issue = context.payload.issue;
  const comment = context.payload.comment;
  if (!issue || !issue.pull_request) {
    core.info('Comment is not on a pull request — nothing to do.');
    return;
  }
  const previousBody =
    context.payload.changes && context.payload.changes.body ? context.payload.changes.body.from : '';
  const relevant =
    comment &&
    comment.user &&
    comment.user.login === REQUIRED_AUTHOR &&
    (MARKER_MENTION_RE.test(comment.body || '') || MARKER_MENTION_RE.test(previousBody || ''));
  if (!relevant) {
    core.info(`Not a cross-model review marker comment from @${REQUIRED_AUTHOR} — nothing to do.`);
    return;
  }

  const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: issue.number });
  const { data: thisRun } = await github.rest.actions.getWorkflowRun({ owner, repo, run_id: context.runId });

  let target = null;
  for (let attempt = 0; attempt <= maxPolls; attempt++) {
    const { data } = await github.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: thisRun.workflow_id,
      event: 'pull_request',
      head_sha: pr.head.sha,
      per_page: 10,
    });
    target = (data.workflow_runs || [])[0] || null;
    if (!target || target.status === 'completed') break;
    if (attempt < maxPolls) await new Promise((r) => setTimeout(r, pollMs));
  }

  if (!target) {
    core.info(`No pull_request run for head ${pr.head.sha} yet — it will read the marker when it runs.`);
    return;
  }
  if (target.status !== 'completed') {
    core.setFailed(
      `The cross-model-review run for ${pr.head.sha} (${target.html_url}) is still ${target.status}; ` +
        're-run it manually once it finishes.',
    );
    return;
  }
  await github.rest.actions.reRunWorkflow({ owner, repo, run_id: target.id });
  core.info(`Re-running ${target.html_url} to re-evaluate the cross-model review gate.`);
}

module.exports = {
  REQUIRED_AUTHOR,
  EXEMPT_PR_AUTHORS,
  modelFamily,
  containsSha,
  parseMarker,
  latestMarkerForSha,
  decide,
  run,
  reevaluate,
};
