#!/usr/bin/env node

import { execSync } from 'node:child_process'

const repo = process.env.AIEF_REPO || 'tongsh6/ai-engineering-framework'
const version = process.argv[2]

if (!version || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  console.error('Usage: node scripts/post-release-check.mjs <version>')
  console.error('Example: node scripts/post-release-check.mjs 1.8.1')
  process.exit(1)
}

const tag = `v${version}`
const pkgAlias = '@tongsh6/aief-init'
const pkgCanonical = '@tongsh6/ai-engineering-framework-init'

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim()
}

function check(name, fn) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    return true
  } catch (err) {
    const msg = err && err.message ? err.message : String(err)
    console.error(`  ✗ ${name}\n    ${msg.split('\n')[0]}`)
    return false
  }
}

console.log(`\nPost-release checks for ${tag} (${repo})\n`)

const checks = []

checks.push(
  check('Git tag exists', () => {
    const out = run(`gh api repos/${repo}/git/ref/tags/${tag} --jq '.ref'`)
    if (out !== `refs/tags/${tag}`) throw new Error(`Unexpected tag ref: ${out}`)
  })
)

checks.push(
  check('GitHub Release published', () => {
    const out = run(
      `gh release view ${tag} --repo ${repo} --json tagName,isDraft,isPrerelease --jq '[.tagName, .isDraft, .isPrerelease] | @tsv'`
    )
    const [tagName, isDraft, isPrerelease] = out.split('\t')
    if (tagName !== tag) throw new Error(`Release tag mismatch: ${tagName}`)
    if (isDraft !== 'false') throw new Error('Release is still draft')
    if (isPrerelease !== 'false') throw new Error('Release is marked as prerelease')
  })
)

checks.push(
  check('Release & Publish workflow succeeded for tag', () => {
    const out = run(
      `gh run list --repo ${repo} --workflow "Release & Publish" --limit 30 --json headBranch,conclusion,status,url --jq '.[] | select(.headBranch == "${tag}") | [.status, .conclusion, .url] | @tsv'`
    )
    if (!out) throw new Error(`No Release & Publish run found for ${tag}`)
    const [status, conclusion] = out.split('\t')
    if (status !== 'completed' || conclusion !== 'success') {
      throw new Error(`Run not successful: status=${status}, conclusion=${conclusion}`)
    }
  })
)

checks.push(
  check(`${pkgAlias} version matches`, () => {
    const out = run(`npm view ${pkgAlias} version`)
    if (out !== version) throw new Error(`npm version=${out}, expected=${version}`)
  })
)

checks.push(
  check(`${pkgCanonical} version matches`, () => {
    const out = run(`npm view ${pkgCanonical} version`)
    if (out !== version) throw new Error(`npm version=${out}, expected=${version}`)
  })
)

const pass = checks.filter(Boolean).length
const total = checks.length
if (pass !== total) {
  console.error(`\n❌ Post-release checks failed: ${pass}/${total} passed\n`)
  process.exit(1)
}

console.log(`\n✅ Post-release checks passed: ${pass}/${total}\n`)
