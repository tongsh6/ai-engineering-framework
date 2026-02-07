#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function printHelp() {
  process.stdout.write(
    [
      'aief-init (optional bootstrap)',
      '',
      'Usage:',
      '  aief-init new',
      '  aief-init retrofit --level L0',
      '  aief-init retrofit --level L0+',
      '',
      'Options:',
      '  --level <L0|L0+|L1>   Migration level for retrofit (default: L0+)',
      '  --force              Overwrite existing files',
      '  --dry-run            Print actions without writing',
      '  -h, --help           Show help',
      '',
    ].join('\n')
  )
}

function parseArgs(argv) {
  const args = argv.slice(2)

  if (args.includes('-h') || args.includes('--help')) {
    return { help: true }
  }

  const command = args[0]
  const opts = {
    command,
    level: 'L0+',
    force: false,
    dryRun: false,
  }

  for (let i = 1; i < args.length; i += 1) {
    const a = args[i]
    if (a === '--force') opts.force = true
    else if (a === '--dry-run') opts.dryRun = true
    else if (a === '--level') {
      const v = args[i + 1]
      if (!v) throw new Error('Missing value for --level')
      opts.level = v
      i += 1
    } else {
      throw new Error(`Unknown option: ${a}`)
    }
  }

  return opts
}

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

function ensureDir(dirPath, { dryRun } = {}) {
  if (dryRun) {
    process.stdout.write(`[dry-run] mkdir -p ${dirPath}\n`)
    return
  }
  fs.mkdirSync(dirPath, { recursive: true })
}

function writeFile(filePath, content, { force, dryRun } = {}) {
  if (dryRun) {
    process.stdout.write(`[dry-run] write ${filePath}\n`)
    return
  }

  ensureDir(path.dirname(filePath))
  const flags = force ? 'w' : 'wx'
  fs.writeFileSync(filePath, content, { encoding: 'utf8', flag: flags })
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function copyFile(src, dst, { force, dryRun } = {}) {
  if (dryRun) {
    process.stdout.write(`[dry-run] copy ${src} -> ${dst}\n`)
    return
  }
  ensureDir(path.dirname(dst))
  const flags = force ? 0 : fs.constants.COPYFILE_EXCL
  fs.copyFileSync(src, dst, flags)
}

function listTopLevel(rootDir) {
  const ignore = new Set([
    '.git',
    'node_modules',
    'dist',
    'build',
    'out',
    'target',
    '.venv',
    'venv',
    '__pycache__',
    '.idea',
    '.vscode',
  ])

  const entries = fs.readdirSync(rootDir, { withFileTypes: true })
  return entries
    .filter((e) => !ignore.has(e.name))
    .map((e) => ({ name: e.name, isDir: e.isDirectory() }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function detectTech(rootDir) {
  const f = (name) => exists(path.join(rootDir, name))
  const d = (name) => exists(path.join(rootDir, name)) && fs.statSync(path.join(rootDir, name)).isDirectory()

  const tech = {
    languages: new Set(),
    frameworks: new Set(),
    buildTools: new Set(),
    runtimes: new Set(),
    packageManagers: new Set(),
    ci: new Set(),
    docker: new Set(),
  }

  if (f('package.json')) {
    tech.languages.add('JavaScript/TypeScript')
    tech.buildTools.add('npm-compatible')
    tech.runtimes.add('Node.js')
    tech.packageManagers.add('npm')

    if (f('pnpm-lock.yaml')) tech.packageManagers.add('pnpm')
    if (f('yarn.lock')) tech.packageManagers.add('yarn')
    if (f('bun.lockb')) tech.packageManagers.add('bun')

    try {
      const pkg = JSON.parse(readText(path.join(rootDir, 'package.json')))
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }
      const has = (k) => Boolean(deps && Object.prototype.hasOwnProperty.call(deps, k))
      if (has('react')) tech.frameworks.add('React')
      if (has('next')) tech.frameworks.add('Next.js')
      if (has('vue')) tech.frameworks.add('Vue')
      if (has('nuxt')) tech.frameworks.add('Nuxt')
      if (has('@nestjs/core')) tech.frameworks.add('NestJS')
      if (has('express')) tech.frameworks.add('Express')
      if (has('fastify')) tech.frameworks.add('Fastify')
    } catch {
      // best-effort only
    }
  }

  if (f('pyproject.toml') || f('requirements.txt') || f('poetry.lock')) {
    tech.languages.add('Python')
    tech.buildTools.add('pip/poetry')
    if (f('poetry.lock')) tech.packageManagers.add('poetry')
  }

  if (f('go.mod')) {
    tech.languages.add('Go')
    tech.buildTools.add('go')
  }

  if (f('Cargo.toml')) {
    tech.languages.add('Rust')
    tech.buildTools.add('cargo')
  }

  if (f('pom.xml')) {
    tech.languages.add('Java')
    tech.buildTools.add('maven')
  }
  if (f('build.gradle') || f('build.gradle.kts')) {
    tech.languages.add('Java/Kotlin')
    tech.buildTools.add('gradle')
  }

  if (d('.github') && d('.github/workflows')) tech.ci.add('GitHub Actions')
  if (f('.gitlab-ci.yml')) tech.ci.add('GitLab CI')
  if (f('Jenkinsfile')) tech.ci.add('Jenkins')
  if (d('.circleci')) tech.ci.add('CircleCI')
  if (f('azure-pipelines.yml')) tech.ci.add('Azure Pipelines')

  if (f('Dockerfile')) tech.docker.add('Dockerfile')
  if (f('docker-compose.yml') || f('compose.yml')) tech.docker.add('Docker Compose')

  return tech
}

function detectModules(rootDir) {
  const candidates = ['apps', 'services', 'packages', 'modules']
  const modules = []

  for (const base of candidates) {
    const basePath = path.join(rootDir, base)
    if (!exists(basePath)) continue
    if (!fs.statSync(basePath).isDirectory()) continue

    const children = fs
      .readdirSync(basePath, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b))

    for (const name of children) {
      modules.push({ name, path: `./${base}/${name}` })
    }
  }

  return modules
}

function formatRepoSnapshot(rootDir) {
  const tech = detectTech(rootDir)
  const topLevel = listTopLevel(rootDir)
  const modules = detectModules(rootDir)

  const fmtList = (set) => {
    const arr = Array.from(set)
    return arr.length ? arr.join(', ') : ''
  }

  const lines = []
  lines.push('# Repo Snapshot')
  lines.push('')
  lines.push('This file is generated as a retrofit starter draft. Edit freely.')
  lines.push('')
  lines.push('## Tech Stack (Detected)')
  lines.push(`- Language: ${fmtList(tech.languages) || 'unknown'}`)
  lines.push(`- Framework: ${fmtList(tech.frameworks) || 'unknown'}`)
  lines.push(`- Build Tool: ${fmtList(tech.buildTools) || 'unknown'}`)
  lines.push(`- Runtime: ${fmtList(tech.runtimes) || 'unknown'}`)
  if (tech.packageManagers.size) lines.push(`- Package Manager: ${fmtList(tech.packageManagers)}`)
  lines.push('')
  lines.push('## Repo Layout (Top Level)')
  for (const e of topLevel) {
    lines.push(`- ${e.isDir ? e.name + '/' : e.name}`)
  }
  lines.push('')
  lines.push('## Modules / Services (Heuristics)')
  if (!modules.length) {
    lines.push('- (none detected)')
  } else {
    for (const m of modules) {
      lines.push(`- ${m.name} (${m.path})`)
    }
  }
  lines.push('')
  lines.push('## Infra & CI (Detected)')
  lines.push(`- CI: ${fmtList(tech.ci) || 'unknown'}`)
  lines.push(`- Docker: ${fmtList(tech.docker) || 'unknown'}`)
  lines.push('')
  lines.push('## Commands (Fill In)')
  lines.push('- build:')
  lines.push('- test:')
  lines.push('- run:')
  lines.push('')

  return lines.join('\n')
}

function repoPath(rel) {
  return path.resolve(process.cwd(), rel)
}

function templatePath(rel) {
  return path.resolve(__dirname, '..', rel)
}

function initMinimal({ force, dryRun } = {}) {
  const agentsSrc = templatePath('templates/minimal/AGENTS.md')
  const indexSrc = templatePath('templates/minimal/context/INDEX.md')
  const bKeep = templatePath('templates/minimal/context/business/.gitkeep')
  const tKeep = templatePath('templates/minimal/context/tech/.gitkeep')
  const eKeep = templatePath('templates/minimal/context/experience/.gitkeep')

  if (exists(agentsSrc)) copyFile(agentsSrc, repoPath('AGENTS.md'), { force, dryRun })
  else writeFile(repoPath('AGENTS.md'), '# AI Guide\n', { force, dryRun })

  if (exists(indexSrc)) copyFile(indexSrc, repoPath('context/INDEX.md'), { force, dryRun })
  else writeFile(repoPath('context/INDEX.md'), '# Context Index\n', { force, dryRun })

  ensureDir(repoPath('context/business'), { dryRun })
  ensureDir(repoPath('context/tech'), { dryRun })
  ensureDir(repoPath('context/experience'), { dryRun })

  if (exists(bKeep)) copyFile(bKeep, repoPath('context/business/.gitkeep'), { force, dryRun })
  if (exists(tKeep)) copyFile(tKeep, repoPath('context/tech/.gitkeep'), { force, dryRun })
  if (exists(eKeep)) copyFile(eKeep, repoPath('context/experience/.gitkeep'), { force, dryRun })
}

function initRetrofit({ level, force, dryRun } = {}) {
  initMinimal({ force, dryRun })

  if (level === 'L0') return
  if (level !== 'L0+' && level !== 'L1') {
    throw new Error(`Unsupported level: ${level}`)
  }

  const snapshotPath = repoPath('context/tech/REPO_SNAPSHOT.md')
  const snapshotContent = formatRepoSnapshot(process.cwd())
  writeFile(snapshotPath, snapshotContent, { force, dryRun })
}

function main() {
  let opts
  try {
    opts = parseArgs(process.argv)
  } catch (err) {
    process.stderr.write(`${err.message}\n`)
    printHelp()
    process.exit(1)
  }

  if (opts.help || !opts.command) {
    printHelp()
    process.exit(0)
  }

  try {
    if (opts.command === 'new') {
      initMinimal({ force: opts.force, dryRun: opts.dryRun })
      process.stdout.write('Done. Created minimal AIEF entry (AGENTS.md + context/).\n')
      return
    }

    if (opts.command === 'retrofit') {
      initRetrofit({ level: opts.level, force: opts.force, dryRun: opts.dryRun })
      process.stdout.write(`Done. Retrofit init at level ${opts.level}.\n`)
      return
    }

    throw new Error(`Unknown command: ${opts.command}`)
  } catch (err) {
    const msg = err && err.message ? err.message : String(err)
    process.stderr.write(`${msg}\n`)
    process.exit(1)
  }
}

main()
