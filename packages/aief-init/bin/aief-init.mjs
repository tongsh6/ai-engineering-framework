#!/usr/bin/env node
// Thin wrapper — delegates all logic to the canonical package.
// Keeping code in one place: @tongsh6/ai-engineering-framework-init

import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

let canonicalBin
try {
  canonicalBin = require.resolve('@tongsh6/ai-engineering-framework-init/bin/aief-init.mjs')
} catch {
  // Fallback: same monorepo layout (dev / local link)
  canonicalBin = path.join(
    __dirname, '..', '..', 'ai-engineering-framework-init', 'bin', 'aief-init.mjs'
  )
}

const result = spawnSync(process.execPath, [canonicalBin, ...process.argv.slice(2)], {
  stdio: 'inherit',
})
process.exit(result.status ?? 1)
