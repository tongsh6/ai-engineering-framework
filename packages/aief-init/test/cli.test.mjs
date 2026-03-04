import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLI = path.join(__dirname, '..', 'bin', 'aief-init.mjs')
const CANONICAL_CLI = path.join(
  __dirname,
  '..',
  '..',
  'ai-engineering-framework-init',
  'bin',
  'aief-init.mjs'
)

function run(args, opts = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8',
    cwd: opts.cwd ?? process.cwd(),
    env: { ...process.env, NO_COLOR: '1' },
  })
}

function runCanonical(args, opts = {}) {
  return spawnSync(process.execPath, [CANONICAL_CLI, ...args], {
    encoding: 'utf8',
    cwd: opts.cwd ?? process.cwd(),
    env: { ...process.env, NO_COLOR: '1' },
  })
}

function makeTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aief-test-'))
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
}

// ── Help ──────────────────────────────────────────────────────────────────────

test('--help prints usage and exits 0', () => {
  const r = run(['--help'])
  assert.equal(r.status, 0)
  assert.match(r.stdout, /aief-init/)
  assert.match(r.stdout, /retrofit/)
  assert.match(r.stdout, /doctor/)
  assert.match(r.stdout, /validate refs/)
  assert.match(r.stdout, /migrate/)
})

test('no args prints help and exits 0', () => {
  const r = run([])
  assert.equal(r.status, 0)
  assert.match(r.stdout, /aief-init/)
})

test('canonical --help prints usage and exits 0', () => {
  const r = runCanonical(['--help'])
  assert.equal(r.status, 0)
  assert.match(r.stdout, /aief-init/)
  assert.match(r.stdout, /doctor/)
})

// ── Unknown command ───────────────────────────────────────────────────────────

test('unknown command exits non-zero with error message', () => {
  const r = run(['foobar'])
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /Unknown command/)
})

test('unknown option exits non-zero with error message', () => {
  const r = run(['new', '--unknown-flag'])
  assert.notEqual(r.status, 0)
})

// ── new ───────────────────────────────────────────────────────────────────────

test('new creates AGENTS.md and context/INDEX.md', () => {
  const dir = makeTmp()
  try {
    const r = run(['new', '--locale', 'en'], { cwd: dir })
    assert.equal(r.status, 0, `stderr: ${r.stderr}`)
    assert.ok(fs.existsSync(path.join(dir, 'AGENTS.md')), 'AGENTS.md missing')
    assert.ok(fs.existsSync(path.join(dir, 'context', 'INDEX.md')), 'context/INDEX.md missing')
  } finally {
    cleanup(dir)
  }
})

test('new --dry-run writes nothing', () => {
  const dir = makeTmp()
  try {
    const r = run(['new', '--dry-run'], { cwd: dir })
    assert.equal(r.status, 0, `stderr: ${r.stderr}`)
    assert.ok(!fs.existsSync(path.join(dir, 'AGENTS.md')), 'AGENTS.md should NOT exist in dry-run')
  } finally {
    cleanup(dir)
  }
})

test('new --base-dir places files under sub-dir', () => {
  const dir = makeTmp()
  try {
    const r = run(['new', '--base-dir', 'AIEF', '--locale', 'en'], { cwd: dir })
    assert.equal(r.status, 0, `stderr: ${r.stderr}`)
    assert.ok(fs.existsSync(path.join(dir, 'AIEF', 'AGENTS.md')), 'AIEF/AGENTS.md missing')
  } finally {
    cleanup(dir)
  }
})

// ── retrofit ──────────────────────────────────────────────────────────────────

test('retrofit --level L0 creates AGENTS.md and context/INDEX.md', () => {
  const dir = makeTmp()
  try {
    const r = run(['retrofit', '--level', 'L0', '--locale', 'en'], { cwd: dir })
    assert.equal(r.status, 0, `stderr: ${r.stderr}`)
    assert.ok(fs.existsSync(path.join(dir, 'AGENTS.md')))
    assert.ok(fs.existsSync(path.join(dir, 'context', 'INDEX.md')))
  } finally {
    cleanup(dir)
  }
})

test('retrofit --level L0+ also creates REPO_SNAPSHOT.md', () => {
  const dir = makeTmp()
  try {
    const r = run(['retrofit', '--level', 'L0+', '--locale', 'en'], { cwd: dir })
    assert.equal(r.status, 0, `stderr: ${r.stderr}`)
    assert.ok(fs.existsSync(path.join(dir, 'context', 'tech', 'REPO_SNAPSHOT.md')))
  } finally {
    cleanup(dir)
  }
})

test('retrofit --level L1 creates scaffold docs', () => {
  const dir = makeTmp()
  try {
    const r = run(['retrofit', '--level', 'L1', '--locale', 'en'], { cwd: dir })
    assert.equal(r.status, 0, `stderr: ${r.stderr}`)
    assert.ok(fs.existsSync(path.join(dir, 'context', 'business', 'domain-model.md')))
    assert.ok(fs.existsSync(path.join(dir, 'workflow', 'INDEX.md')))
    assert.ok(fs.existsSync(path.join(dir, 'docs', 'standards', 'skill-spec.md')))
  } finally {
    cleanup(dir)
  }
})

test('retrofit --level L2 creates standards spec files', () => {
  const dir = makeTmp()
  try {
    const r = run(['retrofit', '--level', 'L2', '--locale', 'en', '--force'], { cwd: dir })
    assert.equal(r.status, 0, `stderr: ${r.stderr}`)
    assert.ok(fs.existsSync(path.join(dir, 'docs', 'standards', 'skill-spec.md')))
    assert.ok(fs.existsSync(path.join(dir, 'docs', 'standards', 'command-spec.md')))
    assert.ok(fs.existsSync(path.join(dir, 'docs', 'standards', 'agent-spec.md')))
    assert.ok(fs.existsSync(path.join(dir, 'context', 'experience', 'INDEX.md')))
  } finally {
    cleanup(dir)
  }
})

test('retrofit --level L3 creates pattern files and .ai-adapters', () => {
  const dir = makeTmp()
  try {
    const r = run(['retrofit', '--level', 'L3', '--locale', 'en', '--force'], { cwd: dir })
    assert.equal(r.status, 0, `stderr: ${r.stderr}`)
    assert.ok(fs.existsSync(path.join(dir, 'docs', 'standards', 'patterns', 'phase-router.md')))
    assert.ok(fs.existsSync(path.join(dir, 'docs', 'standards', 'patterns', 'experience-mgmt.md')))
    assert.ok(fs.existsSync(path.join(dir, '.ai-adapters', 'README.md')))
  } finally {
    cleanup(dir)
  }
})

test('retrofit invalid level exits non-zero', () => {
  const dir = makeTmp()
  try {
    const r = run(['retrofit', '--level', 'L99', '--locale', 'en'], { cwd: dir })
    assert.notEqual(r.status, 0)
    assert.match(r.stderr, /L99/)
  } finally {
    cleanup(dir)
  }
})

test('doctor on empty directory exits non-zero with actionable hints', () => {
  const dir = makeTmp()
  try {
    const r = run(['doctor'], { cwd: dir })
    assert.notEqual(r.status, 0)
    assert.match(r.stdout, /\[FAIL\] AGENTS\.md entry file/)
    assert.match(r.stdout, /\[FAIL\] context\/INDEX\.md entry file/)
    assert.match(r.stdout, /hint:/)
  } finally {
    cleanup(dir)
  }
})

test('doctor --json returns structured report on empty directory', () => {
  const dir = makeTmp()
  try {
    const r = run(['doctor', '--json'], { cwd: dir })
    assert.notEqual(r.status, 0)
    const payload = JSON.parse(r.stdout)
    assert.equal(typeof payload.projectRoot, 'string')
    assert.equal(payload.summary.fail, 2)
    assert.equal(payload.summary.warn, 1)
    assert.equal(payload.summary.blockingFail, 2)
  } finally {
    cleanup(dir)
  }
})

test('doctor after L0 retrofit exits 0 and warns about missing scripts/aief.mjs', () => {
  const dir = makeTmp()
  try {
    const r1 = run(['retrofit', '--level', 'L0', '--locale', 'en'], { cwd: dir })
    assert.equal(r1.status, 0, `stderr: ${r1.stderr}`)

    const r2 = run(['doctor'], { cwd: dir })
    assert.equal(r2.status, 0, `stdout: ${r2.stdout}\nstderr: ${r2.stderr}`)
    assert.match(r2.stdout, /\[PASS\] AGENTS\.md entry file/)
    assert.match(r2.stdout, /\[PASS\] context\/INDEX\.md entry file/)
    assert.match(r2.stdout, /\[WARN\] scripts\/aief\.mjs available/)
  } finally {
    cleanup(dir)
  }
})

test('doctor --base-dir checks scoped AIEF directory', () => {
  const dir = makeTmp()
  try {
    const r1 = run(['retrofit', '--level', 'L0', '--base-dir', 'AIEF', '--locale', 'en'], { cwd: dir })
    assert.equal(r1.status, 0, `stderr: ${r1.stderr}`)

    const r2 = run(['doctor', '--base-dir', 'AIEF'], { cwd: dir })
    assert.equal(r2.status, 0, `stdout: ${r2.stdout}\nstderr: ${r2.stderr}`)
    assert.match(r2.stdout, /\[PASS\] AGENTS\.md entry file/)
    assert.match(r2.stdout, /\[PASS\] context\/INDEX\.md entry file/)
    assert.match(r2.stdout, /\[WARN\] scripts\/aief\.mjs available/)
  } finally {
    cleanup(dir)
  }
})

test('canonical doctor on empty directory exits non-zero', () => {
  const dir = makeTmp()
  try {
    const r = runCanonical(['doctor'], { cwd: dir })
    assert.notEqual(r.status, 0)
    assert.match(r.stdout, /\[FAIL\] AGENTS\.md entry file/)
    assert.match(r.stdout, /\[FAIL\] context\/INDEX\.md entry file/)
  } finally {
    cleanup(dir)
  }
})

// ── validate / migrate delegation ─────────────────────────────────────────────

test('validate refs without scripts/aief.mjs exits non-zero with helpful error', () => {
  const dir = makeTmp()
  try {
    const r = run(['validate', 'refs'], { cwd: dir })
    assert.notEqual(r.status, 0)
    assert.match(r.stderr, /scripts\/aief\.mjs not found/)
    assert.match(r.stderr, /aief-init retrofit/)
  } finally {
    cleanup(dir)
  }
})

test('migrate without scripts/aief.mjs exits non-zero with helpful error', () => {
  const dir = makeTmp()
  try {
    const r = run(['migrate', '--to-base-dir', 'AIEF'], { cwd: dir })
    assert.notEqual(r.status, 0)
    assert.match(r.stderr, /scripts\/aief\.mjs not found/)
  } finally {
    cleanup(dir)
  }
})

// ── locale fallback ───────────────────────────────────────────────────────────

test('unsupported locale falls back to zh-CN with warning', () => {
  const dir = makeTmp()
  try {
    const r = run(['new', '--locale', 'fr'], { cwd: dir })
    assert.equal(r.status, 0, `stderr: ${r.stderr}`)
    assert.match(r.stdout, /\[warn\].*Falling back/)
  } finally {
    cleanup(dir)
  }
})
