import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse, stringify } from 'yaml'

const CLI = fileURLToPath(new URL('../bin/aief-init.mjs', import.meta.url))
const stagePointer = '/project/lifecycle/stage'

function run(args, cwd) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' })
}

function withProfile(check) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aief-lifecycle-test-'))
  try {
    const init = run(['new', '--locale', 'en'], dir)
    assert.equal(init.status, 0, init.stderr)
    const file = path.join(dir, 'context/PROJECT_PROFILE.yaml')
    const profile = parse(fs.readFileSync(file, 'utf8'))
    check({ dir, file, profile })
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

for (const [everReleased, channel] of [[false, 'none'], [true, 'stable']]) {
  test(`confirmed development is independent of release history (${everReleased})`, () => {
    withProfile(({ dir, file, profile }) => {
      profile.project.lifecycle.stage = 'development'
      profile.project.lifecycle.operatingMode = 'system_refactoring'
      profile.project.release = { everReleased, channel }
      profile.project.commitments.data.classification = 'user_content'
      profile.project.commitments.data.retention = 'preserve'
      profile.project.commitments.compatibility.userData = 'preserve'
      profile.governance.provenance[stagePointer] = {
        status: 'confirmed',
        source: { type: 'maintainer_confirmation', reference: '2026-11-13: 我认为是在研发中' },
        confirmedAt: '2026-11-13',
      }
      fs.writeFileSync(file, stringify(profile))
      const before = fs.readFileSync(file, 'utf8')
      const result = run(['doctor', '--json'], dir)
      assert.equal(result.status, 0, result.stdout + result.stderr)
      const report = JSON.parse(result.stdout)
      assert.ok(report.checks.some((c) => c.id === 'project-profile-schema' && c.level === 'pass'))
      assert.ok(!report.checks.some((c) => c.id === 'profile-human-fact-unconfirmed' && c.label.includes(stagePointer)))
      assert.equal(fs.readFileSync(file, 'utf8'), before, 'Doctor must not rewrite lifecycle, release, or commitments')
    })
  })
}

for (const stage of ['mvp_development', 'unknown']) {
  test(`existing lifecycle value ${stage} remains valid`, () => {
    withProfile(({ dir, file, profile }) => {
      assert.equal(profile.project.lifecycle.stage, 'unknown', 'new projects must not assume development')
      profile.project.lifecycle.stage = stage
      fs.writeFileSync(file, stringify(profile))
      const result = run(['doctor', '--json'], dir)
      assert.equal(result.status, 0, result.stdout + result.stderr)
      assert.equal(parse(fs.readFileSync(file, 'utf8')).project.lifecycle.stage, stage)
    })
  })
}

test('development confirmation still requires a human-authorized source', () => {
  withProfile(({ dir, file, profile }) => {
    profile.project.lifecycle.stage = 'development'
    profile.governance.provenance[stagePointer] = {
      status: 'confirmed',
      source: { type: 'repository_evidence', reference: 'README.md' },
    }
    fs.writeFileSync(file, stringify(profile))
    const result = run(['doctor', '--json'], dir)
    assert.notEqual(result.status, 0)
    assert.ok(JSON.parse(result.stdout).checks.some((c) => c.id === 'profile-human-fact-invalid-source' && c.label.includes(stagePointer)))
  })
})

test('adding development does not weaken the lifecycle enum contract', () => {
  withProfile(({ dir, file, profile }) => {
    profile.project.lifecycle.stage = 'arbitrary_stage'
    fs.writeFileSync(file, stringify(profile))
    const result = run(['doctor', '--json'], dir)
    assert.notEqual(result.status, 0)
    assert.ok(JSON.parse(result.stdout).checks.some((c) => c.id === 'project-profile-schema' && c.level === 'fail'))
  })
})
