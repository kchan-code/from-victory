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
  isDependabotOnly,
  run,
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

function comment(body, { login = OWNER, at = '2026-11-18T12:00:00Z', id } = {}) {
  return { body, user: { login }, created_at: at, ...(id !== undefined ? { id } : {}) };
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
  };
  for (const [id, family] of Object.entries(cases)) {
    assert.equal(modelFamily(id), family, id);
  }
});

test('modelFamily strips cursor- and provider prefixes', () => {
  const cases = {
    'cursor-grok-4.6-high': 'grok',
    'cursor-claude-opus-5-5': 'claude',
    'xai/grok-4.7': 'grok',
    'XAI/grok-4.7': 'grok',
    'anthropic/claude-opus-5-5': 'claude',
    'openai/gpt-5.6-sol-high': 'gpt',
    'openai/codex-mini': 'gpt',
    'google/gemini-4-carbon-high': 'gemini',
    'xai/cursor-grok-4.6-high': 'grok',
  };
  for (const [id, family] of Object.entries(cases)) {
    assert.equal(modelFamily(id), family, id);
  }
});

test('modelFamily classifies bare family names', () => {
  for (const family of ['claude', 'grok', 'gpt', 'gemini']) {
    assert.equal(modelFamily(family), family, family);
  }
  assert.equal(modelFamily('xai/grok'), 'grok');
});

test('modelFamily returns null for ids it cannot classify', () => {
  for (const id of [
    'composer-2.5',
    'muse-wonder-1.0',
    'codexposition', // no token boundary after "codex"
    'grokking-1',
    'gpt5',
    'claudette',
    'cursor-',
    'xai/',
    'openai/claude-opus-5-5', // provider contradicts the model name
    'anthropic/grok-4.7',
    'mistral/large-2',
    '',
    undefined,
  ]) {
    assert.equal(modelFamily(id), null, String(id));
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
  assert.match(r.message, /reviewer gpt, coder claude/);
});

test('decide fails when there are no comments', () => {
  const r = decide({ prAuthor: 'kchan-code', headSha: SHA, comments: [] });
  assert.equal(r.pass, false);
  assert.match(r.message, /No CROSS-MODEL-REVIEW marker/);
  assert.ok(r.help.includes(SHA), 'tells the user which SHA to cite');
});

test('decide fails after a new push: the marker names the previous SHA', () => {
  const r = decide({ prAuthor: 'kchan-code', headSha: OTHER_SHA, comments: [comment(marker({ sha: SHA }))] });
  assert.equal(r.pass, false);
  assert.match(r.message, /No CROSS-MODEL-REVIEW marker/);
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
    ['cursor-grok-4.6-high', 'grok-4.7-high'],
    ['grok', 'grok-4.7-high'],
    ['claude', 'claude-opus-5-5'],
    ['xai/grok-4.7', 'grok-4.7'],
    ['anthropic/claude-opus-5-5', 'cursor-claude-sonnet-5-5'],
  ];
  for (const [reviewer, coder] of pairs) {
    const r = decide({ prAuthor: 'x', headSha: SHA, comments: [comment(marker({ reviewer, coder }))] });
    assert.equal(r.pass, false, `${reviewer} vs ${coder}`);
    assert.match(r.message, /different model family/);
  }
});

test('decide fails when either model id cannot be classified', () => {
  const pairs = [
    ['composer-2.5', 'claude-opus-5-5'],
    ['garbage', 'claude-opus-5-5'],
    ['grok-4.7-high', 'codexposition'],
    ['composer-2.5', 'muse-wonder-1.0'],
  ];
  for (const [reviewer, coder] of pairs) {
    const r = decide({ prAuthor: 'x', headSha: SHA, comments: [comment(marker({ reviewer, coder }))] });
    assert.equal(r.pass, false, `${reviewer} vs ${coder}`);
    assert.match(r.message, /Cannot classify/);
  }
});

test('decide accepts every cross-family pairing', () => {
  const ids = ['claude-opus-5-5', 'grok-4.7-high', 'gpt-5.6-sol-high', 'gemini-4-carbon-high', 'xai/grok-4.7'];
  for (const reviewer of ids) {
    for (const coder of ids) {
      if (reviewer === coder || (reviewer.includes('grok') && coder.includes('grok'))) continue;
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

test('decide fails closed on a missing head SHA', () => {
  assert.equal(decide({ prAuthor: 'x', headSha: undefined, comments: [comment(marker())] }).pass, false);
});

// --- same-second markers -------------------------------------------------------

test('same-second markers: the higher comment id wins', () => {
  const at = '2026-11-18T12:00:00Z';
  const issuesLast = [comment(marker(), { at, id: 10 }), comment(marker({ status: 'ISSUES' }), { at, id: 11 })];
  assert.equal(decide({ prAuthor: 'x', headSha: SHA, comments: issuesLast }).pass, false);
  // List order must not matter: the CLEAN row listed last still loses to id 11.
  assert.equal(decide({ prAuthor: 'x', headSha: SHA, comments: [...issuesLast].reverse() }).pass, false);
  const cleanLast = [comment(marker({ status: 'ISSUES' }), { at, id: 10 }), comment(marker(), { at, id: 11 })];
  assert.equal(decide({ prAuthor: 'x', headSha: SHA, comments: cleanLast }).pass, true);
});

test('same-second markers that cannot be ordered fail closed', () => {
  const at = '2026-11-18T12:00:00Z';
  for (const comments of [
    [comment(marker({ status: 'ISSUES' }), { at }), comment(marker(), { at })], // no ids
    [comment(marker(), { at, id: 7 }), comment(marker(), { at, id: 7 })], // equal ids
    [comment(marker(), { at, id: 7 }), comment(marker(), { at })], // one id missing
  ]) {
    const r = decide({ prAuthor: 'x', headSha: SHA, comments });
    assert.equal(r.pass, false);
    assert.match(r.message, /cannot be ordered/);
  }
});

test('a newer timestamp beats a higher id', () => {
  const comments = [
    comment(marker({ status: 'ISSUES' }), { at: '2026-11-18T12:00:00Z', id: 99 }),
    comment(marker(), { at: '2026-11-18T12:00:01Z', id: 1 }),
  ];
  assert.equal(decide({ prAuthor: 'x', headSha: SHA, comments }).pass, true);
});

// --- Dependabot exemption ------------------------------------------------------

// Shape of a real Dependabot commit from the GitHub API (PR #660 in this repo):
// author dependabot[bot], committer web-flow (GitHub's signing identity),
// verification { verified: true, reason: 'valid' }.
function botCommit({
  sha = SHA,
  login = 'dependabot[bot]',
  committer = 'web-flow',
  verified = true,
  reason = 'valid',
} = {}) {
  return {
    sha,
    author: login === null ? null : { login },
    committer: committer === null ? null : { login: committer },
    commit: { verification: { verified, reason } },
  };
}

test('Dependabot exemption needs a Dependabot opener and only verified Dependabot commits', () => {
  assert.equal(isDependabotOnly('dependabot[bot]', [botCommit({ sha: OTHER_SHA }), botCommit()], SHA), true);
  const r = decide({ prAuthor: 'dependabot[bot]', commits: [botCommit()], headSha: SHA, comments: [] });
  assert.equal(r.pass, true);
  assert.match(r.message, /Dependabot/);
});

test('Dependabot exemption is lost when anyone else pushes a commit', () => {
  for (const commits of [
    [botCommit(), botCommit({ login: 'kchan-code' })],
    [botCommit(), botCommit({ login: null })], // author not linked to a GitHub account
    [botCommit(), botCommit({ verified: false })], // spoofed author email, unsigned
    [], // commit list unavailable or incomplete
    undefined,
  ]) {
    assert.equal(isDependabotOnly('dependabot[bot]', commits, SHA), false, JSON.stringify(commits));
    assert.equal(decide({ prAuthor: 'dependabot[bot]', commits, headSha: SHA, comments: [] }).pass, false);
  }
});

test('Dependabot exemption accepts dependabot[bot] or web-flow as committer', () => {
  assert.equal(isDependabotOnly('dependabot[bot]', [botCommit({ committer: 'web-flow' })], SHA), true);
  assert.equal(isDependabotOnly('dependabot[bot]', [botCommit({ committer: 'dependabot[bot]' })], SHA), true);
});

test('Dependabot exemption is lost when a human is the committer of a signed Dependabot-authored commit', () => {
  for (const committer of ['kchan-code', 'Web-Flow', 'github-actions[bot]', null]) {
    const commits = [botCommit({ committer })];
    assert.equal(isDependabotOnly('dependabot[bot]', commits, SHA), false, String(committer));
    assert.equal(decide({ prAuthor: 'dependabot[bot]', commits, headSha: SHA, comments: [] }).pass, false);
  }
  const mixed = [botCommit({ sha: OTHER_SHA }), botCommit({ committer: 'kchan-code' })];
  assert.equal(isDependabotOnly('dependabot[bot]', mixed, SHA), false);
});

test('Dependabot exemption requires verification reason "valid"', () => {
  for (const reason of ['unsigned', 'bad_email', 'unknown_key', undefined]) {
    assert.equal(isDependabotOnly('dependabot[bot]', [botCommit({ reason })], SHA), false, String(reason));
  }
});

test('Dependabot exemption requires the head commit to be in the list and qualify', () => {
  assert.equal(isDependabotOnly('dependabot[bot]', [botCommit({ sha: OTHER_SHA })], SHA), false);
  assert.equal(isDependabotOnly('dependabot[bot]', [botCommit()], undefined), false);
  const r = decide({ prAuthor: 'dependabot[bot]', commits: [botCommit({ sha: OTHER_SHA })], headSha: SHA, comments: [] });
  assert.equal(r.pass, false);
});

test('Dependabot lookalike openers are not exempt', () => {
  for (const login of ['Dependabot[bot]', 'dependabot', 'dependabot[bot] ', 'mydependabot[bot]', 'kchan-code']) {
    assert.equal(isDependabotOnly(login, [botCommit()], SHA), false, login);
    assert.equal(decide({ prAuthor: login, commits: [botCommit()], headSha: SHA, comments: [] }).pass, false, login);
  }
});

test('Dependabot commits on a human-opened PR are not exempt', () => {
  assert.equal(isDependabotOnly('kchan-code', [botCommit()], SHA), false);
});

// --- workflow entrypoint (mocked GitHub client) --------------------------------

function fakeCore() {
  const calls = { info: [], failed: [], error: [] };
  return {
    calls,
    info: (m) => calls.info.push(m),
    error: (m) => calls.error.push(m),
    setFailed: (m) => calls.failed.push(m),
  };
}

function fakeGithub({ comments = [], prUser = 'kchan-code', commits = [], prCommits, failComments = false } = {}) {
  const statuses = [];
  const github = {
    rest: {
      pulls: {
        get: async ({ pull_number }) => {
          assert.equal(pull_number, 7);
          return {
            data: { head: { sha: SHA }, user: { login: prUser }, commits: prCommits ?? commits.length },
          };
        },
        listCommits: 'listCommits',
      },
      issues: { listComments: 'listComments' },
      repos: { createCommitStatus: async (args) => statuses.push(args) },
    },
    paginate: async (fn) => {
      if (fn === 'listCommits') return commits;
      if (failComments) throw new Error('boom');
      return comments;
    },
  };
  return { github, statuses };
}

const REPO = { owner: 'kchan-code', repo: 'from-victory' };
const PRT = { repo: REPO, eventName: 'pull_request_target', runId: 1, serverUrl: 'https://github.com', payload: { pull_request: { number: 7 } } };
const COMMENT = {
  repo: REPO,
  eventName: 'issue_comment',
  runId: 2,
  serverUrl: 'https://github.com',
  payload: { issue: { number: 7, pull_request: {} } },
};

test('run posts a red status without a marker, without failing the job', async () => {
  const { github, statuses } = fakeGithub();
  const core = fakeCore();
  await run({ github, context: PRT, core });
  assert.equal(statuses.length, 1);
  assert.equal(statuses[0].sha, SHA);
  assert.equal(statuses[0].context, 'cross-model-review');
  assert.equal(statuses[0].state, 'failure');
  assert.ok(statuses[0].description.length <= 140);
  assert.equal(core.calls.failed.length, 0);
});

test('run posts a green status from a comment event when the marker is valid', async () => {
  const { github, statuses } = fakeGithub({ comments: [comment(marker())] });
  await run({ github, context: COMMENT, core: fakeCore() });
  assert.equal(statuses[0].state, 'success');
});

test('run ignores comments on plain issues and unsupported events', async () => {
  const { github, statuses } = fakeGithub({ comments: [comment(marker())] });
  await run({ github, context: { ...COMMENT, payload: { issue: { number: 7 } } }, core: fakeCore() });
  await run({ github, context: { ...PRT, eventName: 'pull_request' }, core: fakeCore() });
  assert.equal(statuses.length, 0);
});

test('run exempts a Dependabot-only PR and drops the exemption on an incomplete commit list', async () => {
  const ok = fakeGithub({ prUser: 'dependabot[bot]', commits: [botCommit()] });
  await run({ github: ok.github, context: PRT, core: fakeCore() });
  assert.equal(ok.statuses[0].state, 'success');

  const truncated = fakeGithub({ prUser: 'dependabot[bot]', commits: [botCommit()], prCommits: 300 });
  await run({ github: truncated.github, context: PRT, core: fakeCore() });
  assert.equal(truncated.statuses[0].state, 'failure');
});

test('run fails closed on an API error', async () => {
  const { github, statuses } = fakeGithub({ failComments: true });
  const core = fakeCore();
  await run({ github, context: PRT, core });
  assert.equal(statuses.length, 1);
  assert.equal(statuses[0].state, 'failure');
  assert.match(statuses[0].description, /gate error/);
  assert.deepEqual(core.calls.failed, ['boom']);
});
