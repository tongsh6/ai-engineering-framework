#!/usr/bin/env node

// Compatibility entry point for repository-local usage.
// Keep all initialization behavior in the canonical package CLI.
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const canonicalCli = path.resolve(
  __dirname,
  '../packages/ai-engineering-framework-init/bin/aief-init.mjs'
)

const result = spawnSync(process.execPath, [canonicalCli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: process.cwd(),
})

process.exit(result.status ?? 1)
