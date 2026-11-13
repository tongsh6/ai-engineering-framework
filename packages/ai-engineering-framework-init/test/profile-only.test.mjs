import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CLI = path.resolve(HERE, '../bin/aief-init.mjs')
const ALIAS = path.resolve(HERE, '../../aief-init/bin/aief-init.mjs')
const TEMPLATE = path.resolve(HERE, '../templates/minimal/context/PROJECT_PROFILE.yaml')
const PROFILE = 'docs/engineering/project-operating-profile.yaml'

function run(root, args, cli = CLI) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root, encoding: 'utf8', timeout: 15000,
    env: { ...process.env, NO_COLOR: '1' },
  })
  assert.ifError(result.error)
  return result
}

function fixture(t, baseDir = '') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aief-profile-only-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const profile = parseYaml(fs.readFileSync(TEMPLATE, 'utf8'))
  const absolute = path.join(root, baseDir, PROFILE)
  const save = () => {
    fs.mkdirSync(path.dirname(absolute), { recursive: true })
    // JSON is valid YAML and avoids duplicating the production YAML serializer.
    fs.writeFileSync(absolute, JSON.stringify(profile, null, 2) + '\n')
  }
  save()
  return { root, profile, absolute, save }
}

function report(result, exitCode = 0) {
  assert.equal(result.status, exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`)
  const payload = JSON.parse(result.stdout)
  assert.equal(payload.scope, 'profile')
  return payload
}

const ARGS = ['doctor', '--profile-only', '--profile-path', PROFILE, '--json']

test('profile-only validates manual adoption without creating a context tree (canonical and alias)', (t) => {
  const f = fixture(t)
  const before = fs.readFileSync(f.absolute, 'utf8')
  for (const cli of [CLI, ALIAS]) {
    const payload = report(run(f.root, ARGS, cli))
    assert.equal(payload.profilePath, PROFILE)
    assert.equal(payload.summary.blockingFail, 0)
    assert.ok(payload.checks.some((c) => c.id === 'project-profile-schema' && c.level === 'pass'))
    assert.ok(payload.checks.some((c) => c.id === 'project-profile-unknowns' && c.level === 'warn'))
    assert.ok(!payload.checks.some((c) => ['entry-agents', 'entry-context-index', 'script-aief', 'refs-validate'].includes(c.id)))
    assert.ok(!fs.existsSync(path.join(f.root, 'context')))
    assert.ok(!fs.existsSync(path.join(f.root, 'AGENTS.md')))
    assert.equal(fs.readFileSync(f.absolute, 'utf8'), before)
  }
})

test('default doctor still requires its complete AIEF scaffold', (t) => {
  const f = fixture(t)
  const result = run(f.root, ['doctor', '--profile-path', PROFILE, '--json'])
  assert.equal(result.status, 1)
  const payload = JSON.parse(result.stdout)
  assert.equal(payload.scope, 'project')
  assert.ok(payload.checks.some((c) => c.id === 'entry-context-index' && c.level === 'fail'))
})

test('profile-only never executes project-provided validation scripts', (t) => {
  const f = fixture(t)
  fs.mkdirSync(path.join(f.root, 'scripts'))
  fs.writeFileSync(path.join(f.root, 'scripts/aief.mjs'), "import fs from 'node:fs'; fs.writeFileSync('executed.txt', 'unexpected'); process.exit(17)\n")
  report(run(f.root, ARGS))
  assert.ok(!fs.existsSync(path.join(f.root, 'executed.txt')))
})

test('profile-only uses the existing AGENTS Profile declaration without a default copy', (t) => {
  const f = fixture(t)
  const agents = `# Existing project\nProfile: \`${PROFILE}\`\n`
  fs.writeFileSync(path.join(f.root, 'AGENTS.md'), agents)
  const payload = report(run(f.root, ['doctor', '--profile-only', '--json']))
  assert.equal(payload.profilePath, PROFILE)
  assert.equal(fs.readFileSync(path.join(f.root, 'AGENTS.md'), 'utf8'), agents)
  assert.ok(!fs.existsSync(path.join(f.root, 'context')))
})

test('profile-only rejects a conflicting explicit SSOT path', (t) => {
  const f = fixture(t)
  fs.writeFileSync(path.join(f.root, 'AGENTS.md'), `Profile: ${PROFILE}\n`)
  const result = run(f.root, ['doctor', '--profile-only', '--profile-path', 'other.yaml'])
  assert.equal(result.status, 1)
  assert.match(result.stderr, /parallel profile|declares project profile/)
  assert.ok(!fs.existsSync(path.join(f.root, 'other.yaml')))
})

test('profile-only supports a scoped base directory', (t) => {
  const f = fixture(t, 'AIEF')
  const payload = report(run(f.root, [...ARGS, '--base-dir', 'AIEF']))
  assert.equal(payload.projectRoot, path.join(f.root, 'AIEF'))
  assert.ok(!fs.existsSync(path.join(f.root, 'AIEF/context')))
})

test('profile-only retains project-relative path containment', (t) => {
  const f = fixture(t)
  for (const requested of ['../outside.yaml', f.absolute]) {
    const result = run(f.root, ['doctor', '--profile-only', '--profile-path', requested])
    assert.equal(result.status, 1)
    assert.match(result.stderr, /inside the project root|project-relative path/)
  }
})

test('profile-only rejects a missing profile', (t) => {
  const f = fixture(t)
  fs.unlinkSync(f.absolute)
  const payload = report(run(f.root, ARGS), 1)
  assert.ok(payload.checks.some((c) => c.id === 'entry-project-profile' && c.level === 'fail'))
})

test('profile-only rejects malformed YAML', (t) => {
  const f = fixture(t)
  fs.writeFileSync(f.absolute, 'project: [\n')
  const payload = report(run(f.root, ARGS), 1)
  assert.ok(payload.checks.some((c) => c.id === 'project-profile-yaml-parse' && c.level === 'fail'))
})

test('profile-only retains enum and release-consistency validation', (t) => {
  const f = fixture(t)
  f.profile.project.lifecycle.stage = 'not-a-stage'
  f.save()
  let payload = report(run(f.root, ARGS), 1)
  assert.ok(payload.checks.some((c) => c.id === 'project-profile-schema' && c.level === 'fail'))
  f.profile.project.lifecycle.stage = 'development'
  f.profile.project.release = { everReleased: false, channel: 'stable' }
  f.save()
  payload = report(run(f.root, ARGS), 1)
  assert.ok(payload.checks.some((c) => c.id === 'project-profile-schema' && c.level === 'fail'))
})

test('profile-only still blocks AI evidence used to confirm a human-owned field', (t) => {
  const f = fixture(t)
  f.profile.project.lifecycle.stage = 'development'
  f.profile.governance.provenance['/project/lifecycle/stage'] = {
    status: 'confirmed', source: { type: 'repository_evidence', reference: 'README.md' },
  }
  f.save()
  const payload = report(run(f.root, ARGS), 1)
  assert.ok(payload.checks.some((c) => c.id === 'profile-human-fact-invalid-source' && c.level === 'fail'))
})

test('profile-only cannot be used by mutating commands', (t) => {
  const f = fixture(t)
  for (const command of ['new', 'retrofit', 'migrate', 'validate']) {
    const result = run(f.root, [command, '--profile-only'])
    assert.equal(result.status, 1)
    assert.match(result.stderr, /only supported by doctor/)
  }
  assert.ok(!fs.existsSync(path.join(f.root, 'context')))
})
