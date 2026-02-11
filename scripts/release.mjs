#!/usr/bin/env node

/**
 * Release script — synchronises package versions, commits, tags, and pushes.
 *
 * Usage:
 *   node scripts/release.mjs <version>
 *
 * Example:
 *   node scripts/release.mjs 1.4.0
 *
 * What it does:
 *   1. Validates the version format (semver, no "v" prefix)
 *   2. Ensures you are on the main branch with a clean working tree
 *   3. Updates both package.json files to the target version
 *   4. Commits: "release: v<version>"
 *   5. Tags: v<version>
 *   6. Pushes commit + tag to origin
 *
 * After push, GitHub Actions (.github/workflows/release.yml) will:
 *   - Verify version consistency
 *   - npm publish both packages
 *   - Create a GitHub Release with auto-generated notes
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf-8', cwd: ROOT, ...opts }).trim()
}

function fail(msg) {
  console.error(`\n❌  ${msg}\n`)
  process.exit(1)
}

function info(msg) {
  console.log(`  ✓ ${msg}`)
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const version = process.argv[2]
if (!version) {
  fail('Usage: node scripts/release.mjs <version>  (e.g. 1.4.0)')
}

if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  fail(`Invalid semver: "${version}". Use format like 1.4.0 or 2.0.0-beta.1`)
}

// Must be on main
const branch = run('git rev-parse --abbrev-ref HEAD')
if (branch !== 'main') {
  fail(`Must be on "main" branch (currently on "${branch}").`)
}

// Working tree must be clean
const status = run('git status --porcelain')
if (status) {
  fail('Working tree is not clean. Commit or stash changes first.')
}

// Tag must not already exist
const existingTags = run('git tag --list').split('\n')
if (existingTags.includes(`v${version}`)) {
  fail(`Tag v${version} already exists.`)
}

// ---------------------------------------------------------------------------
// Update package.json files
// ---------------------------------------------------------------------------

const PACKAGES = [
  'packages/aief-init/package.json',
  'packages/ai-engineering-framework-init/package.json',
]

console.log(`\nReleasing v${version}\n`)

for (const rel of PACKAGES) {
  const abs = path.join(ROOT, rel)
  const pkg = JSON.parse(fs.readFileSync(abs, 'utf-8'))
  const old = pkg.version
  pkg.version = version
  fs.writeFileSync(abs, JSON.stringify(pkg, null, 2) + '\n')
  info(`${pkg.name}: ${old} → ${version}`)
}

// ---------------------------------------------------------------------------
// Git commit, tag, push
// ---------------------------------------------------------------------------

run(`git add ${PACKAGES.join(' ')}`)
run(`git commit -m "release: v${version}"`)
info(`Committed "release: v${version}"`)

run(`git tag v${version} -m "v${version}"`)
info(`Tagged v${version}`)

run('git push origin main')
run(`git push origin v${version}`)
info('Pushed to origin (commit + tag)')

console.log(`
🎉  Done! GitHub Actions will now:
    1. Verify version consistency
    2. Publish to npm
    3. Create GitHub Release

    Track progress: https://github.com/tongsh6/ai-engineering-framework/actions
`)
