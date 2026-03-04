import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLI = path.join(__dirname, '..', 'bin', 'aief-init.mjs')

function run(args, opts = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8',
    cwd: opts.cwd ?? process.cwd(),
    env: { ...process.env, NO_COLOR: '1' },
  })
}

function makeTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aief-canonical-test-'))
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
}

test('canonical CLI --help prints usage and exits 0', () => {
  const r = run(['--help'])
  assert.equal(r.status, 0)
  assert.match(r.stdout, /aief-init/)
  assert.match(r.stdout, /retrofit/)
  assert.match(r.stdout, /doctor/)
})

test('canonical CLI new --dry-run writes nothing', () => {
  const dir = makeTmp()
  try {
    const r = run(['new', '--locale', 'en', '--dry-run'], { cwd: dir })
    assert.equal(r.status, 0, `stderr: ${r.stderr}`)
    assert.ok(!fs.existsSync(path.join(dir, 'AGENTS.md')))
  } finally {
    cleanup(dir)
  }
})

test('canonical CLI validate refs without scripts exits non-zero', () => {
  const dir = makeTmp()
  try {
    const r = run(['validate', 'refs'], { cwd: dir })
    assert.notEqual(r.status, 0)
    assert.match(r.stderr, /scripts\/aief\.mjs not found/)
  } finally {
    cleanup(dir)
  }
})

test('canonical CLI doctor reports missing entry files on empty directory', () => {
  const dir = makeTmp()
  try {
    const r = run(['doctor'], { cwd: dir })
    assert.notEqual(r.status, 0)
    assert.match(r.stdout, /\[FAIL\] AGENTS\.md entry file/)
    assert.match(r.stdout, /\[FAIL\] context\/INDEX\.md entry file/)
  } finally {
    cleanup(dir)
  }
})

test('canonical CLI doctor --json returns machine-readable summary', () => {
  const dir = makeTmp()
  try {
    const r = run(['doctor', '--json'], { cwd: dir })
    assert.notEqual(r.status, 0)
    const payload = JSON.parse(r.stdout)
    assert.equal(payload.summary.fail, 2)
    assert.equal(payload.summary.warn, 1)
    assert.equal(payload.summary.blockingFail, 2)
  } finally {
    cleanup(dir)
  }
})
