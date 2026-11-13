import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parse as parseYaml } from 'yaml'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLI = path.join(__dirname, '..', 'bin', 'aief-init.mjs')
const PROFILE_SCHEMA = path.resolve(__dirname, '../../../docs/standards/schemas/project-profile.schema.json')
const PACKAGED_PROFILE_SCHEMA = path.resolve(__dirname, '../schemas/project-profile.schema.json')
const ROOT_TEMPLATES = path.resolve(__dirname, '../../../templates/minimal')
const PACKAGED_TEMPLATES = path.resolve(__dirname, '../templates/minimal')

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
    assert.ok(!fs.existsSync(path.join(dir, 'context', 'PROJECT_PROFILE.yaml')))
  } finally {
    cleanup(dir)
  }
})

test('new creates a project profile and operating-context entry in both locales', () => {
  for (const locale of ['en', 'zh-CN']) {
    const dir = makeTmp()
    try {
      const r = run(['new', '--locale', locale], { cwd: dir })
      assert.equal(r.status, 0, `stderr: ${r.stderr}`)
      const profile = fs.readFileSync(path.join(dir, 'context', 'PROJECT_PROFILE.yaml'), 'utf8')
      const agents = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8')
      const index = fs.readFileSync(path.join(dir, 'context', 'INDEX.md'), 'utf8')
      assert.match(profile, /apiVersion: aief\.dev\/project-profile\/v1/)
      assert.match(profile, /stage: unknown/)
      assert.match(profile, /everReleased: null/)
      assert.match(agents, /PROJECT_PROFILE\.yaml/)
      assert.match(index, /\[PROJECT_PROFILE\.yaml\]\(PROJECT_PROFILE\.yaml\)/)
    } finally {
      cleanup(dir)
    }
  }
})



test('minimal templates mirror the canonical generator and packaged copies', () => {
  const rootAgents = fs.readFileSync(path.join(ROOT_TEMPLATES, 'AGENTS.md'), 'utf8')
  const packagedAgents = fs.readFileSync(path.join(PACKAGED_TEMPLATES, 'AGENTS.md'), 'utf8')
  const rootIndex = fs.readFileSync(path.join(ROOT_TEMPLATES, 'context', 'INDEX.md'), 'utf8')
  const packagedIndex = fs.readFileSync(path.join(PACKAGED_TEMPLATES, 'context', 'INDEX.md'), 'utf8')
  const rootProfile = fs.readFileSync(path.join(ROOT_TEMPLATES, 'context', 'PROJECT_PROFILE.yaml'), 'utf8')
  const packagedProfile = fs.readFileSync(path.join(PACKAGED_TEMPLATES, 'context', 'PROJECT_PROFILE.yaml'), 'utf8')

  assert.equal(rootAgents, packagedAgents)
  assert.equal(rootIndex, packagedIndex)
  assert.deepEqual(parseYaml(rootProfile), parseYaml(packagedProfile))

  const dir = makeTmp()
  try {
    const r = run(['new', '--locale', 'en'], { cwd: dir })
    assert.equal(r.status, 0, `stderr: ${r.stderr}`)
    assert.equal(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8'), rootAgents)
    assert.equal(fs.readFileSync(path.join(dir, 'context', 'INDEX.md'), 'utf8'), rootIndex)
    assert.deepEqual(
      parseYaml(fs.readFileSync(path.join(dir, 'context', 'PROJECT_PROFILE.yaml'), 'utf8')),
      parseYaml(rootProfile),
    )
  } finally {
    cleanup(dir)
  }
})

test('new --base-dir with --root-agents uses the scoped profile path in both locales', () => {
  for (const locale of ['en', 'zh-CN']) {
    const dir = makeTmp()
    try {
      const r = run(['new', '--base-dir', 'AIEF', '--root-agents', '--locale', locale], { cwd: dir })
      assert.equal(r.status, 0, `stderr: ${r.stderr}`)

      const rootAgents = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8')
      const scopedAgents = fs.readFileSync(path.join(dir, 'AIEF', 'AGENTS.md'), 'utf8')
      const scopedIndex = fs.readFileSync(path.join(dir, 'AIEF', 'context', 'INDEX.md'), 'utf8')
      assert.match(rootAgents, /AIEF\/context\/PROJECT_PROFILE\.yaml/)
      assert.match(rootAgents, /AIEF\/docs\/standards\/patterns\/project-operating-context\.md/)
      assert.match(scopedAgents, /context\/PROJECT_PROFILE\.yaml/)
      assert.match(rootAgents, /AIEF\/context\/business\//)
      assert.match(scopedIndex, /\[PROJECT_PROFILE\.yaml\]\(PROJECT_PROFILE\.yaml\)/)
      assert.ok(fs.existsSync(path.join(dir, 'AIEF', 'context', 'PROJECT_PROFILE.yaml')))
    } finally {
      cleanup(dir)
    }
  }
})


test('retrofit reuses an existing custom profile SSOT declared by AGENTS.md', () => {
  const dir = makeTmp()
  try {
    const created = run(['new'], { cwd: dir })
    assert.equal(created.status, 0, `stderr: ${created.stderr}`)

    const oldProfile = path.join(dir, 'context', 'PROJECT_PROFILE.yaml')
    const customRelativePath = 'docs/engineering/project-profile.yaml'
    const customProfile = path.join(dir, customRelativePath)
    fs.mkdirSync(path.dirname(customProfile), { recursive: true })
    fs.renameSync(oldProfile, customProfile)

    const agentsPath = path.join(dir, 'AGENTS.md')
    let agents = fs.readFileSync(agentsPath, 'utf8')
    agents = agents.replace('Profile: `context/PROJECT_PROFILE.yaml`', `Profile: \`${customRelativePath}\``)
    agents = agents.replace('Specification: `docs/standards/patterns/project-operating-context.md`', 'Specification: `docs/standards/patterns/project-operating-context.md`')
    fs.writeFileSync(agentsPath, agents)
    assert.ok(agents.includes('Profile: `docs/engineering/project-profile.yaml`'))

    const indexPath = path.join(dir, 'context', 'INDEX.md')
    let index = fs.readFileSync(indexPath, 'utf8')
    index = index.replace('[PROJECT_PROFILE.yaml](PROJECT_PROFILE.yaml)', '[project-profile.yaml](../docs/engineering/project-profile.yaml)')
    fs.writeFileSync(indexPath, index)

    const originalProfile = fs.readFileSync(customProfile, 'utf8')
    const retrofit = run(['retrofit', '--level', 'L0'], { cwd: dir })
    assert.equal(retrofit.status, 0, `stdout: ${retrofit.stdout} stderr: ${retrofit.stderr}`)
    assert.ok(fs.existsSync(customProfile))
    assert.ok(!fs.existsSync(oldProfile))
    assert.equal(fs.readFileSync(customProfile, 'utf8'), originalProfile)

    const doctor = run(['doctor', '--profile-path', customRelativePath, '--json'], { cwd: dir })
    assert.equal(doctor.status, 0, `stdout: ${doctor.stdout} stderr: ${doctor.stderr}`)
    const payload = JSON.parse(doctor.stdout)
    assert.ok(payload.checks.some((item) => item.id === 'project-profile-schema' && item.level === 'pass'))
  } finally {
    cleanup(dir)
  }
})

test('doctor resolves constraint provenance by stable constraint ID address', () => {
  const dir = makeTmp()
  try {
    const created = run(['new'], { cwd: dir })
    assert.equal(created.status, 0, `stderr: ${created.stderr}`)
    const profilePath = path.join(dir, 'context', 'PROJECT_PROFILE.yaml')
    let profile = fs.readFileSync(profilePath, 'utf8')
    profile = profile.replace('  constraints: []', [
      '  constraints:',
      '    - id: preserve-user-content',
      '      statement: Preserve real user-created content',
      '      scope: project_wide',
    ].join('\n'))
    profile = profile.replace('  provenance: {}', [
      '  provenance:',
      '    "/project/constraints/@preserve-user-content":',
      '      status: confirmed',
      '      source:',
      '        type: maintainer_confirmation',
      '      confirmedAt: "2026-11-13"',
    ].join('\n'))
    fs.writeFileSync(profilePath, profile)
    const r = run(['doctor', '--json'], { cwd: dir })
    assert.equal(r.status, 0, `stdout: ${r.stdout} stderr: ${r.stderr}`)
    const payload = JSON.parse(r.stdout)
    assert.ok(!payload.checks.some((item) => item.id === 'profile-constraint-unconfirmed'))
  } finally {
    cleanup(dir)
  }
})

test('retrofit L0 creates the profile without requiring higher adoption levels', () => {
  const dir = makeTmp()
  try {
    const r = run(['retrofit', '--level', 'L0'], { cwd: dir })
    assert.equal(r.status, 0, `stderr: ${r.stderr}`)
    assert.ok(fs.existsSync(path.join(dir, 'context', 'PROJECT_PROFILE.yaml')))
    assert.ok(!fs.existsSync(path.join(dir, 'context', 'tech', 'REPO_SNAPSHOT.md')))
  } finally {
    cleanup(dir)
  }
})

test('canonical project profile schema is valid JSON and declares strict contract', () => {
  const schema = JSON.parse(fs.readFileSync(PROFILE_SCHEMA, 'utf8'))
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema')
  assert.equal(schema.properties.apiVersion.const, 'aief.dev/project-profile/v1')
  assert.equal(schema.properties.kind.const, 'ProjectProfile')
  assert.equal(schema.additionalProperties, false)
  assert.ok(schema.$defs.lifecycle.properties.stage.enum.includes('mvp_development'))
  assert.equal(fs.readFileSync(PACKAGED_PROFILE_SCHEMA, 'utf8'), fs.readFileSync(PROFILE_SCHEMA, 'utf8'))
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
    assert.match(r.stdout, /\[FAIL\] project profile file: context\/PROJECT_PROFILE\.yaml/)
  } finally {
    cleanup(dir)
  }
})

test('canonical CLI doctor recognizes profile and warns about unknown facts', () => {
  const dir = makeTmp()
  try {
    const created = run(['new'], { cwd: dir })
    assert.equal(created.status, 0, `stderr: ${created.stderr}`)
    const r = run(['doctor', '--json'], { cwd: dir })
    assert.equal(r.status, 0, `stdout: ${r.stdout} stderr: ${r.stderr}`)
    const payload = JSON.parse(r.stdout)
    assert.ok(payload.checks.some((item) => item.id === 'entry-project-profile' && item.level === 'pass'))
    assert.ok(payload.checks.some((item) => item.id === 'project-profile-schema' && item.level === 'pass'))
    assert.ok(payload.checks.some((item) => item.id === 'project-profile-unknowns' && item.level === 'warn'))
    assert.ok(payload.checks.some((item) => item.id === 'profile-human-fact-unconfirmed' && item.level === 'warn'))
  } finally {
    cleanup(dir)
  }
})



test('doctor validates a project profile at an existing SSOT path', () => {
  const dir = makeTmp()
  try {
    const created = run(['new'], { cwd: dir })
    assert.equal(created.status, 0, `stderr: ${created.stderr}`)
    const profilePath = 'docs/engineering/project-operating-profile.yaml'
    const absoluteProfilePath = path.join(dir, profilePath)
    fs.mkdirSync(path.dirname(absoluteProfilePath), { recursive: true })
    fs.copyFileSync(path.join(dir, 'context', 'PROJECT_PROFILE.yaml'), absoluteProfilePath)
    fs.appendFileSync(path.join(dir, 'AGENTS.md'), `\nProject Operating Context profile: ${profilePath}\n`)
    fs.appendFileSync(path.join(dir, 'context', 'INDEX.md'), `\n- ${path.basename(profilePath)}\n`)
    const r = run(['doctor', '--profile-path', profilePath, '--json'], { cwd: dir })
    assert.equal(r.status, 0, `stdout: ${r.stdout} stderr: ${r.stderr}`)
    const payload = JSON.parse(r.stdout)
    assert.ok(payload.checks.some((item) => item.id === 'entry-project-profile' && item.level === 'pass'))
    assert.ok(payload.checks.some((item) => item.id === 'project-profile-schema' && item.level === 'pass'))
  } finally {
    cleanup(dir)
  }
})

test('doctor rejects profile paths outside the project root', () => {
  const dir = makeTmp()
  try {
    const r = run(['doctor', '--profile-path', '../outside.yaml'], { cwd: dir })
    assert.notEqual(r.status, 0)
    assert.match(r.stderr, /project-relative path|inside the project root/)
  } finally {
    cleanup(dir)
  }
})

test('doctor rejects project profiles that violate the JSON Schema', () => {
  const dir = makeTmp()
  try {
    const created = run(['new'], { cwd: dir })
    assert.equal(created.status, 0, `stderr: ${created.stderr}`)
    fs.appendFileSync(path.join(dir, 'context', 'PROJECT_PROFILE.yaml'), '\\ninvalidExtra: true\\n')
    const r = run(['doctor', '--json'], { cwd: dir })
    assert.notEqual(r.status, 0)
    const payload = JSON.parse(r.stdout)
    assert.ok(payload.checks.some((item) => item.id === 'project-profile-schema' && item.level === 'fail'))
  } finally {
    cleanup(dir)
  }
})

test('doctor rejects confirmed human facts with an AI-only evidence source', () => {
  const dir = makeTmp()
  try {
    const created = run(['new'], { cwd: dir })
    assert.equal(created.status, 0, `stderr: ${created.stderr}`)
    const profilePath = path.join(dir, 'context', 'PROJECT_PROFILE.yaml')
    let profile = fs.readFileSync(profilePath, 'utf8')
    profile = profile.replace('ownership: unknown', 'ownership: personal')
    profile = profile.replace('  provenance: {}', [
      '  provenance:',
      '    /project/identity/ownership:',
      '      status: confirmed',
      '      source:',
      '        type: repository_evidence',
      '        reference: README.md',
    ].join('\n'))
    fs.writeFileSync(profilePath, profile)
    const r = run(['doctor', '--json'], { cwd: dir })
    assert.notEqual(r.status, 0)
    const payload = JSON.parse(r.stdout)
    assert.ok(payload.checks.some((item) => item.id === 'profile-human-fact-invalid-source' && item.level === 'fail'))
  } finally {
    cleanup(dir)
  }
})


test('doctor warns when an unknown value appears inside a profile array', () => {
  const dir = makeTmp()
  try {
    const created = run(['new'], { cwd: dir })
    assert.equal(created.status, 0, `stderr: ${created.stderr}`)
    const profilePath = path.join(dir, 'context', 'PROJECT_PROFILE.yaml')
    let profile = fs.readFileSync(profilePath, 'utf8')
    const replacements = [
      ['ownership: unknown', 'ownership: personal'],
      ['horizon: unknown', 'horizon: long_term'],
      ['stage: unknown', 'stage: mvp_development'],
      ['operatingMode: unknown', 'operatingMode: feature_development'],
      ['everReleased: null', 'everReleased: false'],
      ['channel: unknown', 'channel: none'],
      ['scope: unknown', 'scope: personal'],
      ['support: unknown', 'support: none'],
      ['scope: unknown', 'scope: local_only'],
      ['classification: unknown', 'classification: disposable_test'],
      ['retention: unknown', 'retention: disposable'],
      ['recovery: unknown', 'recovery: none'],
      ['publicApi: unknown', 'publicApi: none'],
      ['internalApi: unknown', 'internalApi: none'],
      ['databaseSchema: unknown', 'databaseSchema: disposable'],
      ['userData: unknown', 'userData: disposable'],
      ['commitment: unknown', 'commitment: none'],
    ]
    for (const [from, to] of replacements) profile = profile.replace(from, to)
    fs.writeFileSync(profilePath, profile)
    const r = run(['doctor', '--json'], { cwd: dir })
    assert.equal(r.status, 0, `stdout: ${r.stdout} stderr: ${r.stderr}`)
    const payload = JSON.parse(r.stdout)
    assert.ok(payload.checks.some((item) => item.id === 'project-profile-unknowns' && item.level === 'warn'))
  } finally {
    cleanup(dir)
  }
})

test('doctor warns when a project constraint has no human-confirmed provenance', () => {
  const dir = makeTmp()
  try {
    const created = run(['new'], { cwd: dir })
    assert.equal(created.status, 0, `stderr: ${created.stderr}`)
    const profilePath = path.join(dir, 'context', 'PROJECT_PROFILE.yaml')
    let profile = fs.readFileSync(profilePath, 'utf8')
    profile = profile.replace('  constraints: []', [
      '  constraints:',
      '    - id: preserve-user-content',
      '      statement: Preserve real user-created content',
      '      scope: project_wide',
    ].join('\n'))
    fs.writeFileSync(profilePath, profile)
    const r = run(['doctor', '--json'], { cwd: dir })
    assert.equal(r.status, 0, `stdout: ${r.stdout} stderr: ${r.stderr}`)
    const payload = JSON.parse(r.stdout)
    assert.ok(payload.checks.some((item) => item.id === 'profile-constraint-unconfirmed' && item.level === 'warn'))
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
    assert.equal(payload.summary.fail, 3)
    assert.equal(payload.summary.warn, 1)
    assert.equal(payload.summary.blockingFail, 3)
  } finally {
    cleanup(dir)
  }
})
