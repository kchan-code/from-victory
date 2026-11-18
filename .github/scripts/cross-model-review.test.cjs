// Unit tests for the cross-model review gate logic.
// Zero deps — runs with Node 20's built-in runner: `node --test`.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  modelFamily,
  containsSha,
  parseMarker,
  latestMarkerForSha,
  decide,
  run,
  reevaluate,
} = require('./cross-model-review.cjs');

const SHA = 'a'.repeat(32) + '0123abcd';
const OTHER_SHA = 'b'.repeat(40);
const OWNER = 'kchan-code';

function marker({ status = 'CLEAN', reviewer = 'gpt-5.6-sol-high', coder = 'claude-opus-5-5', sha = SHA } = {}) {
  return [
    `CROSS-MODEL-REVIEW: ${status}`,
    reviewer !== null ? `REVIEWER-MODEL: ${reviewer}` : '',
    coder !== null ? `CODER-MODEL: ${coder}` : '',
    sha !== null ? `Head: ${sha}` : '',
  ].join('\n');
}

function comment(body, { login = OWNER, at = '2026-11-18T12:00:00Z' } = {}) {
  return { body, user: { login }, created_at: at };
}

// --- model families ----------------------------------------------------------

test('modelFamily maps id prefixes to families', () => {
  const cases = {
    'claude-opus-5-5': 'claude',
    'Claude-Sonnet-5-5-high': 'claude',
    'grok-4.7-high': 'grok',
    'gpt-5.6-sol-high': 'gpt',
    'codex-mini': 'gpt',
    codex: 'gpt',
    'gemini-4-carbon-high': 'gemini',
    'composer-2.5': 'other',
    'cursor-grok-4.6-high': 'other', // prefix rule: only grok-* is grok
    claude: 'other', // bare name has no claude- prefix
    gpt5: 'other',
    '': 'other',
  };
  for (const [id, family] of Object.entries(cases)) {
    assert.equal(modelFamily(id), family, id);
  }
});

// --- SHA binding -------------------------------------------------------------

test('containsSha requires the full SHA as a whole hex token', () => {
  assert.equal(containsSha(`reviewed ${SHA}.`, SHA), true);
  assert.equal(containsSha(SHA, SHA), true);
  assert.equal(containsSha(SHA.toUpperCase(), SHA), true);
  assert.equal(containsSha(`reviewed ${SHA.slice(0, 7)}`, SHA), false, 'short SHA');
  assert.equal(containsSha(`x${SHA}`, SHA), true, 'non-hex neighbour is fine');
  assert.equal(containsSha(`f${SHA}`, SHA), false, 'inside a longer hex string');
  assert.equal(containsSha(`${SHA}0`, SHA), false, 'inside a longer hex string');
  assert.equal(containsSha(`reviewed ${SHA}`, 'abc'), false, 'invalid head SHA');
});

// --- marker parsing ----------------------------------------------------------

test('parseMarker reads the three line fields', () => {
  assert.deepEqual(parseMarker(marker()), {
    status: 'CLEAN',
    reviewer: 'gpt-5.6-sol-high',
    coder: 'claude-opus-5-5',
    error: null,
  });
});

test('parseMarker returns null when there is no CROSS-MODEL-REVIEW line', () => {
  assert.equal(parseMarker('REVIEWER-MODEL: gpt-5\nCODER-MODEL: claude-x'), null);
  assert.equal(parseMarker('we still need a CROSS-MODEL-REVIEW: CLEAN marker'), null, 'inline mention');
  assert.equal(parseMarker('**CROSS-MODEL-REVIEW: CLEAN**'), null, 'bold breaks the line anchor');
  assert.equal(parseMarker(''), null);
});

test('parseMarker tolerates indentation and CRLF, rejects trailing prose', () => {
  const m = parseMarker('  CROSS-MODEL-REVIEW: clean\r\n\tREVIEWER-MODEL: grok-4.7\r\nCODER-MODEL: claude-opus-5-5\r\n');
  assert.equal(m.status, 'CLEAN');
  assert.equal(m.reviewer, 'grok-4.7');
  assert.equal(m.coder, 'claude-opus-5-5');
  assert.equal(parseMarker('CROSS-MODEL-REVIEW: CLEAN enough I think'), null);
});

test('parseMarker flags conflicting duplicate fields', () => {
  assert.match(parseMarker(`${marker()}\nREVIEWER-MODEL: claude-x`).error, /REVIEWER-MODEL/);
  assert.match(parseMarker(`${marker()}\nCODER-MODEL: gpt-5`).error, /CODER-MODEL/);
  assert.match(parseMarker(`${marker()}\nCROSS-MODEL-REVIEW: BLOCKED`).error, /CROSS-MODEL-REVIEW/);
  assert.equal(parseMarker(`${marker()}\nCODER-MODEL: claude-opus-5-5`).error, null, 'identical repeat is fine');
});

test('latestMarkerForSha ignores other authors, other SHAs, and non-markers', () => {
  const comments = [
    comment(marker(), { login: 'someone-else' }),
    comment(marker({ sha: OTHER_SHA })),
    comment('LGTM'),
  ];
  assert.equal(latestMarkerForSha(comments, SHA), null);
});

test('latestMarkerForSha picks the newest marker for the SHA', () => {
  const comments = [
    comment(marker({ status: 'CLEAN' }), { at: '2026-11-18T12:00:00Z' }),
    comment(marker({ status: 'ISSUES' }), { at: '2026-11-18T13:00:00Z' }),
  ];
  assert.equal(latestMarkerForSha(comments, SHA).status, 'ISSUES');
  assert.equal(latestMarkerForSha([...comments].reverse(), SHA).status, 'ISSUES');
});

// --- decide ------------------------------------------------------------------

test('decide passes on a clean, cross-family marker for the head SHA', () => {
  const r = decide({ prAuthor: 'kchan-code', headSha: SHA, comments: [comment(marker())] });
  assert.equal(r.pass, true, r.message);
  assert.match(r.message, /gpt-5\.6-sol-high \(gpt\)/);
  assert.match(r.message, /claude-opus-5-5 \(claude\)/);
});

test('decide fails when there are no comments', () => {
  const r = decide({ prAuthor: 'kchan-code', headSha: SHA, comments: [] });
  assert.equal(r.pass, false);
  assert.match(r.message, /No cross-model review marker/);
  assert.ok(r.message.includes(SHA), 'tells the user which SHA to cite');
});

test('decide fails after a new push: the marker names the previous SHA', () => {
  const r = decide({ prAuthor: 'kchan-code', headSha: OTHER_SHA, comments: [comment(marker({ sha: SHA }))] });
  assert.equal(r.pass, false);
  assert.match(r.message, /No cross-model review marker/);
});

test('decide fails when the marker omits the SHA', () => {
  const r = decide({ prAuthor: 'kchan-code', headSha: SHA, comments: [comment(marker({ sha: null }))] });
  assert.equal(r.pass, false);
});

test('decide fails when the marker comes from anyone but kchan-code', () => {
  for (const login of ['cursor[bot]', 'github-actions[bot]', 'KChan-Code-fake']) {
    const r = decide({ prAuthor: 'kchan-code', headSha: SHA, comments: [comment(marker(), { login })] });
    assert.equal(r.pass, false, login);
  }
});

test('decide fails on a non-CLEAN status', () => {
  const r = decide({ prAuthor: 'kchan-code', headSha: SHA, comments: [comment(marker({ status: 'ISSUES' }))] });
  assert.equal(r.pass, false);
  assert.match(r.message, /CROSS-MODEL-REVIEW: ISSUES, not CLEAN/);
});

test('decide: a later non-CLEAN marker overrides an earlier CLEAN one for the same SHA', () => {
  const comments = [
    comment(marker(), { at: '2026-11-18T12:00:00Z' }),
    comment(marker({ status: 'ISSUES' }), { at: '2026-11-18T12:05:00Z' }),
  ];
  assert.equal(decide({ prAuthor: 'kchan-code', headSha: SHA, comments }).pass, false);
});

test('decide fails when a model line is missing', () => {
  const noReviewer = decide({ prAuthor: 'x', headSha: SHA, comments: [comment(marker({ reviewer: null }))] });
  assert.equal(noReviewer.pass, false);
  assert.match(noReviewer.message, /missing REVIEWER-MODEL/);
  const noCoder = decide({ prAuthor: 'x', headSha: SHA, comments: [comment(marker({ coder: null }))] });
  assert.equal(noCoder.pass, false);
  assert.match(noCoder.message, /missing CODER-MODEL/);
});

test('decide fails when reviewer and coder share a family', () => {
  const pairs = [
    ['claude-sonnet-5-5-high', 'claude-opus-5-5'],
    ['codex-mini', 'gpt-5.6-sol-high'],
    ['grok-4.7-high', 'grok-4.7-low'],
    ['gemini-4-carbon-high', 'gemini-4-hydrogen-low'],
    ['composer-2.5', 'muse-wonder-1.0'], // both "other"
  ];
  for (const [reviewer, coder] of pairs) {
    const r = decide({ prAuthor: 'x', headSha: SHA, comments: [comment(marker({ reviewer, coder }))] });
    assert.equal(r.pass, false, `${reviewer} vs ${coder}`);
    assert.match(r.message, /different model family/);
  }
});

test('decide accepts every cross-family pairing', () => {
  const ids = ['claude-opus-5-5', 'grok-4.7-high', 'gpt-5.6-sol-high', 'gemini-4-carbon-high', 'composer-2.5'];
  for (const reviewer of ids) {
    for (const coder of ids) {
      if (reviewer === coder) continue;
      const r = decide({ prAuthor: 'x', headSha: SHA, comments: [comment(marker({ reviewer, coder }))] });
      assert.equal(r.pass, true, `${reviewer} vs ${coder}`);
    }
  }
});

test('decide fails on conflicting duplicate fields', () => {
  const body = `${marker()}\nCODER-MODEL: gpt-5`;
  const r = decide({ prAuthor: 'x', headSha: SHA, comments: [comment(body)] });
  assert.equal(r.pass, false);
  assert.match(r.message, /invalid: conflicting CODER-MODEL/);
});

test('decide exempts Dependabot PRs', () => {
  const r = decide({ prAuthor: 'dependabot[bot]', headSha: SHA, comments: [] });
  assert.equal(r.pass, true);
  assert.match(r.message, /dependabot/);
});

test('decide fails closed on a missing head SHA', () => {
  assert.equal(decide({ prAuthor: 'x', headSha: undefined, comments: [comment(marker())] }).pass, false);
});

// --- workflow entrypoints (mocked GitHub client) -----------------------------

function fakeCore() {
  const calls = { info: [], failed: [] };
  return {
    calls,
    info: (m) => calls.info.push(m),
    setFailed: (m) => calls.failed.push(m),
  };
}

test('run fails the job without a marker and passes with one', async () => {
  const context = {
    repo: { owner: 'kchan-code', repo: 'from-victory' },
    eventName: 'pull_request',
    payload: { pull_request: { number: 7, user: { login: 'kchan-code' }, head: { sha: SHA } } },
  };
  const github = (comments) => ({
    rest: { issues: { listComments: 'listComments' } },
    paginate: async (fn, args) => {
      assert.equal(fn, 'listComments');
      assert.equal(args.issue_number, 7);
      return comments;
    },
  });

  const red = fakeCore();
  await run({ github: github([]), context, core: red });
  assert.equal(red.calls.failed.length, 1);

  const green = fakeCore();
  await run({ github: github([comment(marker())]), context, core: green });
  assert.equal(green.calls.failed.length, 0);
  assert.match(green.calls.info[0], /CLEAN/);
});

function reevalFixture({ login = OWNER, body = marker(), runs, changes } = {}) {
  const reruns = [];
  const github = {
    rest: {
      pulls: { get: async () => ({ data: { head: { sha: SHA } } }) },
      actions: {
        getWorkflowRun: async () => ({ data: { workflow_id: 42 } }),
        listWorkflowRuns: async (args) => {
          assert.equal(args.workflow_id, 42);
          assert.equal(args.head_sha, SHA);
          assert.equal(args.event, 'pull_request');
          return { data: { workflow_runs: runs.shift() || [] } };
        },
        reRunWorkflow: async (args) => reruns.push(args.run_id),
      },
    },
  };
  const context = {
    repo: { owner: 'kchan-code', repo: 'from-victory' },
    runId: 1,
    payload: { issue: { number: 7, pull_request: {} }, comment: { body, user: { login } }, changes },
  };
  return { github, context, reruns };
}

test('reevaluate re-runs the completed pull_request run for the head SHA', async () => {
  const { github, context, reruns } = reevalFixture({
    runs: [[{ id: 99, status: 'completed', html_url: 'u' }]],
  });
  await reevaluate({ github, context, core: fakeCore(), pollMs: 0 });
  assert.deepEqual(reruns, [99]);
});

test('reevaluate waits for an in-progress run, then re-runs it', async () => {
  const { github, context, reruns } = reevalFixture({
    runs: [[{ id: 5, status: 'in_progress' }], [{ id: 5, status: 'completed', html_url: 'u' }]],
  });
  await reevaluate({ github, context, core: fakeCore(), pollMs: 0 });
  assert.deepEqual(reruns, [5]);
});

test('reevaluate fails loudly if the run never completes', async () => {
  const { github, context, reruns } = reevalFixture({
    runs: [[{ id: 5, status: 'queued' }], [{ id: 5, status: 'queued' }]],
  });
  const core = fakeCore();
  await reevaluate({ github, context, core, pollMs: 0, maxPolls: 1 });
  assert.deepEqual(reruns, []);
  assert.equal(core.calls.failed.length, 1);
});

test('reevaluate ignores comments that are not owner markers', async () => {
  for (const opts of [{ login: 'someone-else' }, { body: 'LGTM' }]) {
    const { github, context, reruns } = reevalFixture({ ...opts, runs: [[{ id: 1, status: 'completed' }]] });
    await reevaluate({ github, context, core: fakeCore(), pollMs: 0 });
    assert.deepEqual(reruns, [], JSON.stringify(opts));
  }
});

test('reevaluate re-runs when an edit removes the marker', async () => {
  const { github, context, reruns } = reevalFixture({
    body: 'never mind',
    changes: { body: { from: marker() } },
    runs: [[{ id: 3, status: 'completed', html_url: 'u' }]],
  });
  await reevaluate({ github, context, core: fakeCore(), pollMs: 0 });
  assert.deepEqual(reruns, [3]);
});
