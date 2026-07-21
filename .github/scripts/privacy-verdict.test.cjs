// Unit tests for the privacy VERDICT gate logic (FV-4).
// Zero deps — runs with Node 20's built-in runner: `node --test`.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  isPrivacyPath,
  sensitiveFiles,
  extractVerdict,
  parseLatestVerdict,
  decide,
} = require('./privacy-verdict.cjs');

// --- path matching ---------------------------------------------------------

test('isPrivacyPath matches every CLAUDE.md privacy path', () => {
  for (const f of [
    'apps/web/app/page.tsx',
    'supabase/migrations/001_init.sql',
    '.claude/agents/kids-privacy-officer.md',
    'CLAUDE.md',
    'docs/brand.md',
  ]) {
    assert.equal(isPrivacyPath(f), true, `${f} should be sensitive`);
  }
});

test('isPrivacyPath matches the committed Codex mirror paths (FV-460)', () => {
  for (const f of [
    'AGENTS.md', // generated from CLAUDE.md — same content, same gate
    '.codex/agents/kids-privacy-officer.toml',
    '.codex/agents/product-strategist.toml',
  ]) {
    assert.equal(isPrivacyPath(f), true, `${f} should be sensitive`);
  }
});

test('isPrivacyPath rejects non-privacy paths (incl. lookalikes)', () => {
  for (const f of [
    'README.md',
    '.github/workflows/privacy-verdict.yml',
    '.github/scripts/privacy-verdict.cjs',
    'docs/handoff-2026-05-31.md', // docs/* is NOT sensitive — only docs/brand.md
    'apps/web', // directory name, no trailing slash
    'apps/webhooks/x.ts', // prefix lookalike must not match apps/web/
    'packages/content/safety-keywords.json', // packages/content/ no longer a privacy prefix (FV-173)
    'packages/contentful/x.ts', // prefix lookalike
    'CLAUDE.md.bak',
    'docs/brand.md.bak',
    '',
  ]) {
    assert.equal(isPrivacyPath(f), false, `${f} should NOT be sensitive`);
  }
});

test('isPrivacyPath rejects Codex-mirror lookalikes and non-agent mirror files (FV-460)', () => {
  for (const f of [
    'AGENTS.md.bak', // exact match only
    'agents.md', // case-sensitive exact match only
    '.codex/hooks.json', // only .codex/agents/ is the sensitive prefix
    '.codex/hooks/block-subagent-git.sh',
    '.codex/README.md',
    '.codexagents/x.toml', // prefix lookalike must not match .codex/agents/
    '.agents/skills/from-victory-design/SKILL.md', // .agents/ is not a sensitive prefix
    'bin/sync-codex.sh', // the generator itself is tooling, not content
  ]) {
    assert.equal(isPrivacyPath(f), false, `${f} should NOT be sensitive`);
  }
});

test('isPrivacyPath is defensive about bad input', () => {
  assert.equal(isPrivacyPath(undefined), false);
  assert.equal(isPrivacyPath(null), false);
  assert.equal(isPrivacyPath(42), false);
});

test('sensitiveFiles returns only the sensitive subset', () => {
  const changed = ['README.md', 'apps/web/x.tsx', 'docs/brand.md', 'docs/notes.md'];
  assert.deepEqual(sensitiveFiles(changed), ['apps/web/x.tsx', 'docs/brand.md']);
  assert.deepEqual(sensitiveFiles([]), []);
  assert.deepEqual(sensitiveFiles(undefined), []);
});

// --- verdict extraction (line-anchored, last-match-wins) --------------------

test('extractVerdict reads a line-anchored verdict (incl. quoted)', () => {
  assert.equal(extractVerdict('## review\n\nVERDICT: APPROVED'), 'APPROVED');
  assert.equal(extractVerdict('> VERDICT: BLOCKED'), 'BLOCKED');
  assert.equal(extractVerdict('VERDICT: CHANGES_REQUESTED'), 'CHANGES_REQUESTED');
});

test('extractVerdict ignores an inline mention (not at line start)', () => {
  assert.equal(extractVerdict('no VERDICT: APPROVED is required for this PR'), null);
  assert.equal(extractVerdict('looks good, shipping'), null);
});

test('extractVerdict takes the LAST verdict line in a body', () => {
  assert.equal(
    extractVerdict('I almost wrote\nVERDICT: APPROVED\nbut on reflection\nVERDICT: BLOCKED'),
    'BLOCKED',
  );
});

// --- latest-verdict resolution ---------------------------------------------

const owner = (verdict, at) => ({
  body: `kids-privacy-officer review\n\nVERDICT: ${verdict}`,
  created_at: at,
  author_association: 'OWNER',
});

test('parseLatestVerdict reads a trusted verdict', () => {
  assert.deepEqual(parseLatestVerdict([owner('APPROVED', '2026-06-02T00:00:00Z')]), {
    verdict: 'APPROVED',
    at: '2026-06-02T00:00:00Z',
  });
});

test('parseLatestVerdict takes the latest by timestamp (approve then block)', () => {
  const comments = [
    owner('APPROVED', '2026-06-02T00:00:00Z'),
    owner('BLOCKED', '2026-06-02T01:00:00Z'),
  ];
  assert.equal(parseLatestVerdict(comments).verdict, 'BLOCKED');
});

test('parseLatestVerdict takes the latest by timestamp (block then approve)', () => {
  const comments = [
    owner('BLOCKED', '2026-06-02T01:00:00Z'),
    owner('APPROVED', '2026-06-02T02:00:00Z'),
  ];
  assert.equal(parseLatestVerdict(comments).verdict, 'APPROVED');
});

test('parseLatestVerdict resolves a timestamp tie fail-closed (BLOCKED wins)', () => {
  const ts = '2026-06-02T01:00:00Z';
  // Try both array orders — neither should let APPROVED win the tie.
  assert.equal(parseLatestVerdict([owner('APPROVED', ts), owner('BLOCKED', ts)]).verdict, 'BLOCKED');
  assert.equal(parseLatestVerdict([owner('BLOCKED', ts), owner('APPROVED', ts)]).verdict, 'BLOCKED');
});

test('parseLatestVerdict ignores untrusted authors (no self-approval)', () => {
  const drive_by = {
    body: 'VERDICT: APPROVED',
    created_at: '2026-06-02T03:00:00Z',
    author_association: 'NONE',
  };
  assert.equal(parseLatestVerdict([drive_by]), null);
});

test('parseLatestVerdict returns null when no verdict present', () => {
  const chatter = {
    body: 'looks good to me, shipping',
    created_at: '2026-06-02T00:00:00Z',
    author_association: 'OWNER',
  };
  assert.equal(parseLatestVerdict([chatter]), null);
  assert.equal(parseLatestVerdict([]), null);
});

// --- decide() --------------------------------------------------------------

const COMMIT_AT = '2026-06-02T00:00:00Z';
const AFTER = '2026-06-02T01:00:00Z';
const BEFORE = '2026-06-01T23:00:00Z';

test('decide: no sensitive paths → success', () => {
  assert.equal(decide(['README.md', 'docs/notes.md'], [], COMMIT_AT).state, 'success');
});

test('decide: sensitive + no verdict → failure', () => {
  assert.equal(decide(['apps/web/x.tsx'], [], COMMIT_AT).state, 'failure');
});

test('decide: sensitive + APPROVED after head commit → success', () => {
  const r = decide(['supabase/migrations/x.sql'], [owner('APPROVED', AFTER)], COMMIT_AT);
  assert.equal(r.state, 'success');
});

test('decide: sensitive + APPROVED that predates head commit → failure (stale)', () => {
  const r = decide(['apps/web/x.tsx'], [owner('APPROVED', BEFORE)], COMMIT_AT);
  assert.equal(r.state, 'failure');
  assert.match(r.description, /predates/);
});

test('decide: sensitive + BLOCKED → failure', () => {
  assert.equal(decide(['CLAUDE.md'], [owner('BLOCKED', AFTER)], COMMIT_AT).state, 'failure');
});

test('decide: sensitive + CHANGES_REQUESTED → failure', () => {
  assert.equal(decide(['docs/brand.md'], [owner('CHANGES_REQUESTED', AFTER)], COMMIT_AT).state, 'failure');
});

test('decide: APPROVED then later BLOCKED → failure', () => {
  const comments = [owner('APPROVED', AFTER), owner('BLOCKED', '2026-06-02T02:00:00Z')];
  assert.equal(decide(['apps/web/x.tsx'], comments, COMMIT_AT).state, 'failure');
});

test('decide: untrusted self-approval → failure', () => {
  const drive_by = { body: 'VERDICT: APPROVED', created_at: AFTER, author_association: 'NONE' };
  assert.equal(decide(['apps/web/x.tsx'], [drive_by], COMMIT_AT).state, 'failure');
});

test('decide: OWNER fresh APPROVED clears the gate (intended solo-repo behavior)', () => {
  // Documents the deliberate choice: a trusted human posting the officer's
  // verdict is an acceptable manual clear; the gate forces it to exist + be
  // fresh, it does not cryptographically bar the maintainer.
  assert.equal(decide(['apps/web/x.tsx'], [owner('APPROVED', AFTER)], COMMIT_AT).state, 'success');
});

// --- Codex mirror coverage (FV-460) ----------------------------------------

test('decide: PR touching only AGENTS.md requires a fresh verdict', () => {
  assert.equal(decide(['AGENTS.md'], [], COMMIT_AT).state, 'failure');
  const stale = decide(['AGENTS.md'], [owner('APPROVED', BEFORE)], COMMIT_AT);
  assert.equal(stale.state, 'failure');
  assert.match(stale.description, /predates/);
  assert.equal(decide(['AGENTS.md'], [owner('APPROVED', AFTER)], COMMIT_AT).state, 'success');
});

test('decide: PR touching only a .codex/agents TOML requires a fresh verdict', () => {
  const files = ['.codex/agents/kids-privacy-officer.toml'];
  assert.equal(decide(files, [], COMMIT_AT).state, 'failure');
  assert.equal(decide(files, [owner('APPROVED', AFTER)], COMMIT_AT).state, 'success');
});

test('decide: mirror tooling/config alone stays N/A (no false gate)', () => {
  const r = decide(
    ['bin/sync-codex.sh', '.codex/hooks.json', '.codex/README.md', '.github/workflows/ci.yml'],
    [],
    COMMIT_AT,
  );
  assert.equal(r.state, 'success');
  assert.match(r.description, /N\/A/);
});
