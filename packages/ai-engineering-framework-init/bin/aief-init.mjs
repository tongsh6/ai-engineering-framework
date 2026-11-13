#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import Ajv2020 from 'ajv/dist/2020.js'
import { parse as parseYaml } from 'yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PROJECT_PROFILE_SCHEMA_PATH = path.resolve(__dirname, '../schemas/project-profile.schema.json')
const projectProfileSchema = JSON.parse(fs.readFileSync(PROJECT_PROFILE_SCHEMA_PATH, 'utf8'))
const profileAjv = new Ajv2020({ allErrors: true, strict: false })
profileAjv.addFormat('date', {
  type: 'string',
  validate: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)),
})
profileAjv.addFormat('date-time', {
  type: 'string',
  validate: (value) => /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value)),
})
const validateProjectProfile = profileAjv.compile(projectProfileSchema)

const HUMAN_CONFIRMED_PROFILE_PATHS = [
  '/project/identity/name',
  '/project/identity/description',
  '/project/identity/ownership',
  '/project/identity/purposes',
  '/project/identity/productForms',
  '/project/identity/audiences',
  '/project/identity/horizon',
  '/project/lifecycle/stage',
  '/project/release/everReleased',
  '/project/release/channel',
  '/project/commitments/users/scope',
  '/project/commitments/users/support',
  '/project/commitments/deployment/scope',
  '/project/commitments/data/classification',
  '/project/commitments/data/retention',
  '/project/commitments/data/recovery',
  '/project/commitments/compatibility/publicApi',
  '/project/commitments/compatibility/internalApi',
  '/project/commitments/compatibility/databaseSchema',
  '/project/commitments/compatibility/userData',
  '/project/commitments/maintenance/commitment',
]

function readJsonPointer(target, pointer) {
  return pointer.split('/').slice(1).reduce((value, part) => {
    if (value === null || value === undefined) return undefined
    return value[part.replace(/~1/g, '/').replace(/~0/g, '~')]
  }, target)
}

function containsUnknownValue(value) {
  if (value === 'unknown') return true
  if (Array.isArray(value)) return value.some(containsUnknownValue)
  if (value && typeof value === 'object') return Object.values(value).some(containsUnknownValue)
  return false
}

function inspectProjectProfileSemantics(profile) {
  const findings = []
  const provenance = profile.governance?.provenance ?? {}
  const unresolved = (value) =>
    value === undefined ||
    value === null ||
    value === 'unknown' ||
    (Array.isArray(value) && (value.length === 0 || value.includes('unknown')))

  for (const pointer of HUMAN_CONFIRMED_PROFILE_PATHS) {
    const value = readJsonPointer(profile, pointer)
    if (unresolved(value)) continue
    const entry = provenance[pointer]
    if (!entry || entry.status !== 'confirmed') {
      findings.push({
        id: 'profile-human-fact-unconfirmed',
        level: 'warn',
        message: `Human-confirmed field ${pointer} has no confirmed provenance.`,
      })
      continue
    }
    if (!['maintainer_confirmation', 'user_instruction'].includes(entry.source?.type)) {
      findings.push({
        id: 'profile-human-fact-invalid-source',
        level: 'error',
        message: `Human-confirmed field ${pointer} must cite maintainer_confirmation or user_instruction.`,
      })
    }
  }

  for (const pointer of ['/project/lifecycle/operatingMode', '/project/currentFocus']) {
    const value = readJsonPointer(profile, pointer)
    if (unresolved(value)) continue
    const entry = provenance[pointer]
    if (!entry || entry.status !== 'confirmed' || !entry.source?.reference) {
      findings.push({
        id: 'profile-ai-fact-missing-evidence',
        level: 'warn',
        message: `AI-maintained field ${pointer} needs confirmed provenance with a source reference.`,
      })
    }
  }

  const constraintIds = (profile.project?.constraints ?? []).map((item) => item.id)
  if (new Set(constraintIds).size !== constraintIds.length) {
    findings.push({
      id: 'profile-duplicate-constraint-id',
      level: 'error',
      message: 'Project constraint IDs must be unique.',
    })
  }

  for (const constraint of profile.project?.constraints ?? []) {
    const pointer = `/project/constraints/${constraint.id}`
    const entry = provenance[pointer]
    if (!entry || entry.status !== 'confirmed') {
      findings.push({
        id: 'profile-constraint-unconfirmed',
        level: 'warn',
        message: `Human-confirmed constraint ${constraint.id} has no confirmed provenance.`,
      })
      continue
    }
    if (!['maintainer_confirmation', 'user_instruction'].includes(entry.source?.type)) {
      findings.push({
        id: 'profile-constraint-invalid-source',
        level: 'error',
        message: `Human-confirmed constraint ${constraint.id} must cite maintainer_confirmation or user_instruction.`,
      })
    }
  }

  const data = profile.project?.commitments?.data
  const compatibility = profile.project?.commitments?.compatibility
  const nonDisposableData = ['personal_real_data', 'user_content', 'business_confidential', 'regulated_sensitive', 'mixed']
  if (nonDisposableData.includes(data?.classification) && data?.retention === 'disposable') {
    findings.push({
      id: 'profile-data-retention-conflict',
      level: 'warn',
      message: 'Non-disposable data classification conflicts with disposable retention.',
    })
  }
  if (nonDisposableData.includes(data?.classification) && compatibility?.userData === 'disposable') {
    findings.push({
      id: 'profile-user-data-compatibility-conflict',
      level: 'warn',
      message: 'Non-disposable data classification conflicts with disposable user-data compatibility.',
    })
  }

  return findings
}

const DEFAULT_LOCALE = 'zh-CN'
const SUPPORTED_LOCALES = new Set(['zh-CN', 'en'])
const LOCALE_ALIASES = new Map([
  ['zh', 'zh-CN'],
  ['zh-cn', 'zh-CN'],
  ['en-us', 'en'],
  ['en-gb', 'en'],
])

function printHelp() {
  process.stdout.write(
    [
      'aief-init (optional bootstrap)',
      '',
      'Usage:',
      '  aief-init new',
      '  aief-init retrofit --level L0',
      '  aief-init retrofit --level L0+',
      '  aief-init doctor [--base-dir <path>] [--profile-path <path>]',
      '  aief-init validate refs [--fix] [--base-dir <path>]',
      '  aief-init migrate [assets] --to-base-dir <path> [--dry-run] [--base-dir <path>]',
      '',
      'Options:',
      '  --level <L0|L0+|L1|L2|L3>   Migration level for retrofit (default: L0+)',
      `  --locale <zh-CN|en>   Template locale (default: ${DEFAULT_LOCALE})`,
      '  --base-dir <path>     Place AIEF assets under this base directory (example: AIEF)',
      '  --profile-path <path> Profile path relative to the project root (default: context/PROJECT_PROFILE.yaml; doctor only)',
      '  --to-base-dir <path>  Migration target base directory (for migrate)',
      '  --root-agents        Also write AGENTS.md at repo root (useful with --base-dir)',
      '  --no-root-agents     Skip writing AGENTS.md at repo root',
      '  --json               Print doctor result as JSON (for doctor)',
      '  --fix                Auto-fix deterministic reference issues (for validate refs)',
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
    subcommand: undefined,
    level: 'L0+',
    locale: DEFAULT_LOCALE,
    baseDir: '',
    force: false,
    dryRun: false,
    fix: false,
    json: false,
    toBaseDir: undefined,
    profilePath: undefined,
  }

  let start = 1
  if (command === 'validate') {
    opts.subcommand = args[1]
    start = 2
  } else if (command === 'migrate') {
    if (args[1] && !args[1].startsWith('-')) {
      opts.subcommand = args[1]
      start = 2
    }
  }

  for (let i = start; i < args.length; i += 1) {
    const a = args[i]
    if (a === '--force') opts.force = true
    else if (a === '--dry-run') opts.dryRun = true
    else if (a === '--json') opts.json = true
    else if (a === '--fix') opts.fix = true
    else if (a === '--level') {
      const v = args[i + 1]
      if (!v) throw new Error('Missing value for --level')
      opts.level = v
      i += 1
    } else if (a === '--locale') {
      const v = args[i + 1]
      if (!v) throw new Error('Missing value for --locale')
      opts.locale = v
      i += 1
    } else if (a === '--profile-path') {
      const v = args[i + 1]
      if (!v) throw new Error('Missing value for --profile-path')
      opts.profilePath = v
      i += 1
    } else if (a === '--base-dir') {
      const v = args[i + 1]
      if (!v) throw new Error('Missing value for --base-dir')
      opts.baseDir = v
      i += 1
    } else if (a === '--to-base-dir') {
      const v = args[i + 1]
      if (!v) throw new Error('Missing value for --to-base-dir')
      opts.toBaseDir = v
      i += 1
    } else if (a === '--root-agents') {
      opts.rootAgents = true
    } else if (a === '--no-root-agents') {
      opts.rootAgents = false
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

function isFile(p) {
  try {
    return fs.statSync(p).isFile()
  } catch {
    return false
  }
}

function resolveProjectRelativePath(projectRoot, input) {
  const value = String(input || '').trim()
  if (!value || path.isAbsolute(value) || /^[A-Za-z]:/.test(value)) {
    throw new Error('Profile path must be a non-empty project-relative path.')
  }
  const resolved = path.resolve(projectRoot, value)
  const relative = path.relative(projectRoot, resolved)
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('Profile path must stay inside the project root.')
  }
  return resolved
}

function runDoctor({ baseDir, json, profilePath }) {
  const projectRoot = baseDir ? path.resolve(process.cwd(), baseDir) : process.cwd()
  const agentsPath = path.join(projectRoot, 'AGENTS.md')
  const contextIndexPath = path.join(projectRoot, 'context', 'INDEX.md')
  const resolvedProfilePath = resolveProjectRelativePath(projectRoot, profilePath || 'context/PROJECT_PROFILE.yaml')
  const profilePathLabel = profilePath || 'context/PROJECT_PROFILE.yaml'
  const scriptPath = path.join(projectRoot, 'scripts', 'aief.mjs')

  const checks = []

  checks.push({
    id: 'entry-agents',
    label: 'AGENTS.md entry file',
    level: isFile(agentsPath) ? 'pass' : 'fail',
    blocking: true,
    hint: 'Run `aief-init new` or `aief-init retrofit --level L0+` to scaffold entry files.',
  })

  checks.push({
    id: 'entry-context-index',
    label: 'context/INDEX.md entry file',
    level: isFile(contextIndexPath) ? 'pass' : 'fail',
    blocking: true,
    hint: 'Run `aief-init new` or `aief-init retrofit --level L0+` to scaffold context index.',
  })

  if (isFile(agentsPath)) {
    const agentsText = readText(agentsPath)
    const hasProfileInstruction = agentsText.includes(profilePathLabel) || agentsText.includes(path.basename(profilePathLabel))
    const hasOperatingContext = agentsText.toLowerCase().includes('project operating context')
    checks.push({
      id: 'agents-project-operating-context',
      label: 'AGENTS.md loads project operating context',
      level: hasProfileInstruction && hasOperatingContext ? 'pass' : 'warn',
      blocking: false,
      hint: hasProfileInstruction && hasOperatingContext ? '' : `Add the Project Operating Context entry rules and profile path (${profilePathLabel}) to AGENTS.md.`,
    })
  }

  if (isFile(contextIndexPath)) {
    const indexText = readText(contextIndexPath)
    const hasProfileNavigation = indexText.includes(path.basename(profilePathLabel))
    checks.push({
      id: 'context-index-project-profile',
      label: 'context/INDEX.md navigates to project profile',
      level: hasProfileNavigation ? 'pass' : 'warn',
      blocking: false,
      hint: hasProfileNavigation ? '' : `Add ${profilePathLabel} to the context index.`,
    })
  }

  checks.push({
    id: 'entry-project-profile',
    label: `project profile file: ${profilePathLabel}`,
    level: isFile(resolvedProfilePath) ? 'pass' : 'fail',
    blocking: true,
    hint: `Create the Project Profile at ${profilePathLabel} using the AIEF Project Profile schema.`,
  })

  if (isFile(resolvedProfilePath)) {
    const profileText = readText(resolvedProfilePath)
    let profile
    try {
      profile = parseYaml(profileText)
      const valid = validateProjectProfile(profile)
      checks.push({
        id: 'project-profile-schema',
        label: 'project profile YAML and JSON Schema',
        level: valid ? 'pass' : 'fail',
        blocking: true,
        hint: valid ? '' : (validateProjectProfile.errors ?? []).slice(0, 5).map((issue) => `${issue.instancePath || '/'} ${issue.message}`).join('; '),
      })

      if (valid) {
        const semanticFindings = inspectProjectProfileSemantics(profile)
        for (const finding of semanticFindings) {
          checks.push({
            id: finding.id,
            label: finding.message,
            level: finding.level === 'error' ? 'fail' : 'warn',
            blocking: finding.level === 'error',
            hint: finding.level === 'error' ? 'Correct the Profile governance or conflicting facts before relying on this profile.' : 'Review the fact and record its source or resolve the conflict.',
          })
        }
        checks.push({
          id: 'project-profile-unknowns',
          label: 'project profile contains unresolved values',
          level: containsUnknownValue(profile) || profile.project?.release?.everReleased === null ? 'warn' : 'pass',
          blocking: false,
          hint: 'Confirm unknown project facts before relying on lifecycle or commitment policies.',
        })
      }
    } catch (err) {
      checks.push({
        id: 'project-profile-yaml-parse',
        label: 'project profile YAML parsing',
        level: 'fail',
        blocking: true,
        hint: err instanceof Error ? err.message : String(err),
      })
    }
  }

  if (!isFile(scriptPath)) {
    checks.push({
      id: 'script-aief',
      label: 'scripts/aief.mjs available',
      level: 'warn',
      blocking: false,
      hint: 'Run `aief-init retrofit --level L1` to enable `validate`/`migrate` delegation.',
    })
  } else {
    const result = spawnSync(process.execPath, [scriptPath, 'validate', 'refs'], {
      cwd: projectRoot,
      encoding: 'utf8',
    })

    const validateOk = result.status === 0
    checks.push({
      id: 'refs-validate',
      label: 'reference consistency (validate refs)',
      level: validateOk ? 'pass' : 'fail',
      blocking: true,
      hint: validateOk
        ? ''
        : 'Run `aief-init validate refs --fix` to auto-fix deterministic reference issues.',
      detail: validateOk ? '' : (result.stderr || result.stdout || '').trim().split('\n')[0],
    })
  }

  let passCount = 0
  let warnCount = 0
  let failCount = 0
  let blockingFails = 0

  for (const item of checks) {
    if (item.level === 'pass') passCount += 1
    else if (item.level === 'warn') warnCount += 1
    else failCount += 1

    if (item.level === 'fail' && item.blocking) blockingFails += 1
  }

  if (json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          projectRoot,
          checks,
          summary: {
            pass: passCount,
            warn: warnCount,
            fail: failCount,
            blockingFail: blockingFails,
          },
        },
        null,
        2
      )}\n`
    )
  } else {
    process.stdout.write(`Doctor report for ${projectRoot}\n`)
    for (const item of checks) {
      const tag =
        item.level === 'pass' ? '[PASS]' : item.level === 'warn' ? '[WARN]' : '[FAIL]'
      process.stdout.write(`${tag} ${item.label}\n`)
      if (item.detail) process.stdout.write(`       ${item.detail}\n`)
      if (item.hint && item.level !== 'pass') process.stdout.write(`       hint: ${item.hint}\n`)
    }

    process.stdout.write(
      `Summary: pass=${passCount}, warn=${warnCount}, fail=${failCount}, blockingFail=${blockingFails}\n`
    )
  }

  if (blockingFails > 0) {
    process.exit(1)
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

function formatRepoSnapshot(rootDir, locale) {
  const tech = detectTech(rootDir)
  const topLevel = listTopLevel(rootDir)
  const modules = detectModules(rootDir)
  const isZh = locale === 'zh-CN'

  const fmtList = (set) => {
    const arr = Array.from(set)
    return arr.length ? arr.join(', ') : ''
  }

  const unknown = isZh ? '未知' : 'unknown'
  const noneDetected = isZh ? '(未检测到)' : '(none detected)'

  const lines = []
  lines.push(isZh ? '# 仓库快照' : '# Repo Snapshot')
  lines.push('')
  lines.push(
    isZh
      ? '该文件由 retrofit 初始化生成，作为起始草稿，可按需自由修改。'
      : 'This file is generated as a retrofit starter draft. Edit freely.'
  )
  lines.push('')
  lines.push(isZh ? '## 技术栈（自动识别）' : '## Tech Stack (Detected)')
  lines.push(`- ${isZh ? '语言' : 'Language'}: ${fmtList(tech.languages) || unknown}`)
  lines.push(`- ${isZh ? '框架' : 'Framework'}: ${fmtList(tech.frameworks) || unknown}`)
  lines.push(`- ${isZh ? '构建工具' : 'Build Tool'}: ${fmtList(tech.buildTools) || unknown}`)
  lines.push(`- ${isZh ? '运行时' : 'Runtime'}: ${fmtList(tech.runtimes) || unknown}`)
  if (tech.packageManagers.size) {
    lines.push(`- ${isZh ? '包管理器' : 'Package Manager'}: ${fmtList(tech.packageManagers)}`)
  }
  lines.push('')
  lines.push(isZh ? '## 仓库结构（顶层）' : '## Repo Layout (Top Level)')
  for (const e of topLevel) {
    lines.push(`- ${e.isDir ? e.name + '/' : e.name}`)
  }
  lines.push('')
  lines.push(isZh ? '## 模块 / 服务（启发式识别）' : '## Modules / Services (Heuristics)')
  if (!modules.length) {
    lines.push(`- ${noneDetected}`)
  } else {
    for (const m of modules) {
      lines.push(`- ${m.name} (${m.path})`)
    }
  }
  lines.push('')
  lines.push(isZh ? '## 基础设施与 CI（自动识别）' : '## Infra & CI (Detected)')
  lines.push(`- CI: ${fmtList(tech.ci) || unknown}`)
  lines.push(`- Docker: ${fmtList(tech.docker) || unknown}`)
  lines.push('')
  lines.push(isZh ? '## 命令（请补充）' : '## Commands (Fill In)')
  lines.push('- build:')
  lines.push('- test:')
  lines.push('- run:')
  lines.push('')

  return lines.join('\n')
}

function normalizeBaseDir(input) {
  const raw = String(input || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+$/, '')
  if (!raw || raw === '.') return ''
  return raw
}

function scopedRelPath(baseDir, rel) {
  const base = normalizeBaseDir(baseDir)
  if (!base) return rel
  return `${base}/${rel}`
}

function repoPath(baseDir, rel) {
  return path.resolve(process.cwd(), scopedRelPath(baseDir, rel))
}

function templatePath(rel) {
  return path.resolve(__dirname, '..', rel)
}

function normalizeLocale(input) {
  const raw = String(input || '').trim()
  if (!raw) return DEFAULT_LOCALE
  if (SUPPORTED_LOCALES.has(raw)) return raw
  const alias = LOCALE_ALIASES.get(raw.toLowerCase())
  return alias || raw
}

function resolveLocale(input) {
  const requested = String(input || '').trim()
  const normalized = normalizeLocale(requested)
  if (SUPPORTED_LOCALES.has(normalized)) {
    return {
      locale: normalized,
      requested,
      usedFallback: false,
    }
  }

  return {
    locale: DEFAULT_LOCALE,
    requested,
    usedFallback: Boolean(requested),
  }
}

function buildMinimalTemplates(
  locale,
  contextEntry,
  profileEntry = 'context/PROJECT_PROFILE.yaml',
  operatingContextSpecEntry = 'docs/standards/patterns/project-operating-context.md',
  profileIndexEntry = 'PROJECT_PROFILE.yaml',
  contextPrefix = '',
) {
  const profile = [
    'apiVersion: aief.dev/project-profile/v1',
    'kind: ProjectProfile',
    '',
    'metadata:',
    '  name: example-project',
    '  schemaVersion: "1.0"',
    '',
    'project:',
    '  identity:',
    '    name: Example Project',
    '    description: Replace with a concise project description.',
    '    ownership: unknown',
    '    purposes: [unknown]',
    '    productForms: [unknown]',
    '    audiences: [unknown]',
    '    horizon: unknown',
    '  lifecycle:',
    '    stage: unknown',
    '    operatingMode: unknown',
    '  release:',
    '    everReleased: null',
    '    channel: unknown',
    '  commitments:',
    '    users: { scope: unknown, support: unknown }',
    '    deployment: { scope: unknown }',
    '    data: { classification: unknown, retention: unknown, recovery: unknown }',
    '    compatibility: { publicApi: unknown, internalApi: unknown, databaseSchema: unknown, userData: unknown }',
    '    maintenance: { commitment: unknown }',
    '  constraints: []',
    '',
    'governance:',
    '  provenance: {}',
    '  pendingChanges: []',
  ].join('\n')

  if (locale === 'en') {
    return {
      agents: [
        '# [Project Name] AI Guide',
        '',
        'This is the project-level entry for AI-assisted engineering.',
        '',
        '## Project Operating Context',
        '',
        'Before design, implementation, refactoring, data, compatibility, or release work:',
        '',
        '1. Read `' + profileEntry + '` for project identity, lifecycle, release status, and commitments.',
        '2. Follow `' + operatingContextSpecEntry + '` when installed.',
        '3. Distinguish confirmed facts, proposals, unknowns, and stale information. Never interpret unknown as none.',
        '4. Lifecycle provides defaults only; real data responsibilities and confirmed external commitments take precedence.',
        '5. Task-level adjustments must state their reason and scope. They must not silently change the project profile or bypass data, security, or external commitments.',
        '6. Never change human-confirmed fields autonomously. Propose a pending change when evidence suggests they are stale.',
        '',
        'The project profile is the single source of truth for project-level facts. Do not duplicate profile fields in AGENTS.md.',
        '',
        'Profile: `' + profileEntry + '`',
        'Specification: `' + operatingContextSpecEntry + '`',
        '',
        'Language:',
        '- Use Chinese for communication by default',
        '- Keep code/commands/identifiers in English',
        '',
        'Quick Commands:',
        '- build:',
        '- test:',
        '- run:',
        '',
        'Context Entry:',
        '- ' + contextEntry,
        '- ' + profileEntry,
        '',
        'Knowledge Base:',
        '| Directory | Purpose | When to Load |',
        '|---|---|---|',
        '| ' + profileEntry + ' | Project identity, lifecycle, commitments | Before engineering decisions |',
        '| ' + contextPrefix + 'context/business/ | Business knowledge | Requirements and domain models |',
        '| ' + contextPrefix + 'context/tech/ | Technical docs | Architecture, APIs, conventions |',
        '| ' + contextPrefix + 'context/experience/ | Experience library | Before implementation |',
        '| ' + contextPrefix + 'workflow/ | Workflows | Complex task phase guides (optional) |',
        '| ' + contextPrefix + 'docs/standards/ | Standards | Load as needed |',
      ].join('\n'),
      index: [
        '# Context Index',
        '',
        'This is the navigation entry for long-term project context.',
        '',
        '## Project Operating Context',
        '',
        '- [' + profileIndexEntry + '](' + profileIndexEntry + ') — project identity, lifecycle, release status, and commitments. Read before engineering decisions.',
        '',
        'Directories:',
        '',
        '    context/',
        '        business/',
        '        tech/',
        '        experience/',
        '',
        'Suggested next documents (optional):',
        '- context/business/DOMAIN.md',
        '- context/tech/ARCHITECTURE.md',
        '- context/experience/INDEX.md',
      ].join('\n'),
      profile,
    }
  }

  return {
    agents: [
      '# [项目名称] AI 编程指南',
      '',
      '这是项目级 AI 协作入口。',
      '',
      '## Project Operating Context',
      '',
      '进行设计、实现、重构、数据、兼容或发布工作前：',
      '',
      '1. 读取 `' + profileEntry + '`，了解项目身份、生命周期、发布状态和责任约束。',
      '2. 遵循 `' + operatingContextSpecEntry + '`（若已安装）。',
      '3. 区分已确认事实、候选推断、未知和过期信息；不得把 unknown 当作 none。',
      '4. 生命周期只提供默认策略；真实数据责任和已确认外部承诺优先。',
      '5. 任务级调整必须说明理由和作用域，不得静默改变项目画像或绕过数据、安全及外部责任。',
      '6. 不得自行修改人工确认字段；发现变化时提出待确认建议。',
      '',
      '项目画像是项目级事实的唯一来源。AGENTS.md 不复制画像字段。',
      '',
      '画像：`' + profileEntry + '`',
      '规范：`' + operatingContextSpecEntry + '`',
      '',
      '语言规则：',
      '- 交流默认使用中文',
      '- 代码/命令/标识符保持英文',
      '',
      '常用命令：',
      '- build:',
      '- test:',
      '- run:',
      '',
      '上下文入口：',
      '- ' + contextEntry,
      '- ' + profileEntry,
      '',
      '知识库导航：',
      '| 目录 | 用途 | 何时加载 |',
      '|---|---|---|',
      '| ' + profileEntry + ' | 项目身份、生命周期和责任约束 | 工程决策前 |',
      '| ' + contextPrefix + 'context/business/ | 业务知识 | 理解需求和领域模型 |',
      '| ' + contextPrefix + 'context/tech/ | 技术文档 | 架构、API、开发规范 |',
      '| ' + contextPrefix + 'context/experience/ | 经验库 | 实现前检索相关经验 |',
      '| ' + contextPrefix + 'workflow/ | 工作流 | 复杂任务阶段指南（可选）|',
      '| ' + contextPrefix + 'docs/standards/ | 规范标准 | 按需加载 |',
    ].join('\n'),
    index: [
      '# 上下文索引',
      '',
      '这是项目长期上下文的导航入口。',
      '',
      '## 项目运行上下文',
      '',
      '- [' + profileIndexEntry + '](' + profileIndexEntry + ')：项目身份、生命周期、发布状态和责任约束；工程决策前必须读取。',
      '',
      '目录结构：',
      '',
      '    context/',
      '        business/',
      '        tech/',
      '        experience/',
      '',
      '建议补充的文档（可选）：',
      '- context/business/DOMAIN.md',
      '- context/tech/ARCHITECTURE.md',
      '- context/experience/INDEX.md',
    ].join('\n'),
    profile,
  }
}

function buildScaffoldTemplates(locale) {
  if (locale === 'en') {
    return {
      'context/business/domain-model.md': '# Domain Model\n\n- Core entities:\n- Key relationships:\n- Business rules:\n',
      'context/tech/architecture.md': '# Architecture\n\n## Modules\n\n## Boundaries\n\n## Risks\n',
      'context/experience/INDEX.md': '# Experience Index\n\n- Capture lessons, pitfalls, and reusable patterns.\n',
      'workflow/INDEX.md': '# Workflow Index\n\n- proposal -> design -> implement -> review\n',
      'workflow/phases/proposal.md': '# Proposal Phase\n\nDescribe why this change is needed and expected outcomes.\n',
      'workflow/phases/design.md': '# Design Phase\n\nDocument trade-offs, decisions, and interfaces.\n',
      'workflow/phases/implement.md': '# Implement Phase\n\nTrack implementation scope, tests, and verification.\n',
      'workflow/phases/review.md': '# Review Phase\n\nRecord review checklist and acceptance notes.\n',
      'docs/standards/skill-spec.md': '# Skill Spec\n\nDefine scope, inputs, outputs, and constraints.\n',
      'docs/standards/command-spec.md': '# Command Spec\n\nDefine command intent, args, and expected behavior.\n',
      'docs/standards/agent-spec.md': '# Agent Spec\n\nDefine agent role, boundaries, and quality bar.\n',
      'docs/standards/patterns/phase-router.md': '# Pattern: Phase Router\n\nMap request signals to workflow phases.\n',
      'docs/standards/patterns/experience-mgmt.md': '# Pattern: Experience Management\n\nCapture, index, and retrieve lessons learned.\n',
      'docs/standards/patterns/context-loading.md': '# Pattern: Context Loading\n\nLoad only relevant context for each task.\n',
      'templates/minimal/AGENTS.md': '# AI Guide Template\n\nTemplate starter for project-level AI entry.\n',
      'templates/minimal/context/INDEX.md': '# Context Index Template\n\nTemplate starter for context navigation.\n',
    }
  }

  return {
    'context/business/domain-model.md': '# 领域模型\n\n- 核心实体：\n- 关键关系：\n- 业务规则：\n',
    'context/tech/architecture.md': '# 技术架构\n\n## 模块划分\n\n## 边界约束\n\n## 风险点\n',
    'context/experience/INDEX.md': '# 经验索引\n\n- 记录可复用经验、踩坑和最佳实践。\n',
    'workflow/INDEX.md': '# 工作流索引\n\n- proposal -> design -> implement -> review\n',
    'workflow/phases/proposal.md': '# 提案阶段\n\n描述变更动机、目标收益和影响范围。\n',
    'workflow/phases/design.md': '# 设计阶段\n\n记录方案权衡、关键决策和接口约束。\n',
    'workflow/phases/implement.md': '# 实现阶段\n\n跟踪实现范围、测试策略和验证结果。\n',
    'workflow/phases/review.md': '# 审查阶段\n\n记录评审清单和验收结论。\n',
    'docs/standards/skill-spec.md': '# Skill 规范\n\n定义适用范围、输入输出与约束。\n',
    'docs/standards/command-spec.md': '# Command 规范\n\n定义命令意图、参数和期望行为。\n',
    'docs/standards/agent-spec.md': '# Agent 规范\n\n定义角色边界、职责与质量要求。\n',
    'docs/standards/patterns/phase-router.md': '# 模式：阶段路由\n\n将任务信号映射到对应工作流阶段。\n',
    'docs/standards/patterns/experience-mgmt.md': '# 模式：经验管理\n\n沉淀、索引与复用项目经验。\n',
    'docs/standards/patterns/context-loading.md': '# 模式：上下文加载\n\n工程决策前先读取 context/PROJECT_PROFILE.yaml，识别项目生命周期和责任约束；再按任务加载业务、技术和经验上下文。Phase Router 负责任务阶段，Project Operating Context 负责项目级工程策略。\n',
    'templates/minimal/AGENTS.md': '# AI 编程指南模板\n\n项目级 AI 入口模板起点。\n',
    'templates/minimal/context/INDEX.md': '# 上下文索引模板\n\n上下文导航模板起点。\n',
  }
}


function buildAdvancedTemplates(locale) {
  if (locale === 'en') {
    return {
      'docs/standards/skill-spec.md': [
        '# Skill Spec Standard',
        '',
        '> Skill is the execution layer in the AIEF three-tier architecture.',
        '> It represents an atomic, reusable capability unit.',
        '',
        '## Standard Format',
        '',
        '```markdown',
        '# Skill: {Name}',
        '',
        '## Purpose',
        '# Single-responsibility description (one sentence)',
        '',
        '## Input',
        '# TypeScript interface definition',
        '',
        '## Output',
        '# TypeScript interface definition',
        '',
        '## Execution Strategy',
        '# Specific algorithm/rules (optional for complex Skills)',
        '',
        '## Example',
        '# Complete Input → Output example',
        '',
        '## Constraints',
        '# What this Skill does NOT do (optional)',
        '```',
        '',
        '## Naming Convention',
        '',
        '- File: `docs/standards/skills/{verb}-{noun}.md` (e.g., `search-codebase.md`)',
        '- One Skill per file',
      ].join('\n'),
      'docs/standards/command-spec.md': [
        '# Command Spec Standard',
        '',
        '> Command is the entry layer — the interface between user intent and agent behavior.',
        '',
        '## Standard Format',
        '',
        '```markdown',
        '# Command: /{name}',
        '',
        '## Intent',
        '# What this command triggers (one sentence)',
        '',
        '## Arguments',
        '# Parameters and their types',
        '',
        '## Expected Behavior',
        '# Step-by-step description of what the agent should do',
        '',
        '## Example',
        '# Usage example with sample output',
        '```',
      ].join('\n'),
      'docs/standards/agent-spec.md': [
        '# Agent Spec Standard',
        '',
        '> Agent is the decision layer — it orchestrates Skills and produces outcomes.',
        '',
        '## Standard Format',
        '',
        '```markdown',
        '# Agent: {Name}',
        '',
        '## Role',
        '# What problem this agent solves (one sentence)',
        '',
        '## Scope',
        '# What it handles and what it delegates',
        '',
        '## Input',
        '# Trigger condition and input format',
        '',
        '## Output',
        '# Expected deliverable',
        '',
        '## Quality Bar',
        '# Acceptance criteria',
        '```',
      ].join('\n'),
      'context/experience/INDEX.md': [
        '# Experience Index',
        '',
        '> Searchable index of lessons, pitfalls, and reusable patterns.',
        '> Format: keyword | file | summary',
        '',
        '## By Domain',
        '',
        '| Keywords | File | Summary |',
        '|----------|------|---------|',
        '| example, pattern | lessons/example.md | Replace with real entries |',
        '',
        '## Recent Reports',
        '',
        '| Date | File | Topic |',
        '|------|------|-------|',
        '| YYYY-MM | reports/example.md | Replace with real entries |',
      ].join('\n'),
    }
  }

  return {
    'docs/standards/skill-spec.md': [
      '# Skill 规范标准',
      '',
      '> Skill 是 AIEF 三层架构中的执行层，代表原子化、可复用的能力单元。',
      '',
      '## 标准格式',
      '',
      '```markdown',
      '# Skill: {Name}',
      '',
      '## 功能',
      '# 单一职责描述（一句话）',
      '',
      '## 输入',
      '# TypeScript 接口定义',
      '',
      '## 输出',
      '# TypeScript 接口定义',
      '',
      '## 执行策略',
      '# 具体算法/规则（复杂 Skill 需要）',
      '',
      '## 示例',
      '# 完整 Input → Output 示例',
      '',
      '## 边界约束',
      '# 不做什么（有歧义时填写）',
      '```',
      '',
      '## 命名约定',
      '',
      '- 文件：`docs/standards/skills/{动词}-{名词}.md`（例：`search-codebase.md`）',
      '- 每个文件只定义一个 Skill',
    ].join('\n'),
    'docs/standards/command-spec.md': [
      '# Command 规范标准',
      '',
      '> Command 是入口层——用户意图与 Agent 行为之间的接口。',
      '',
      '## 标准格式',
      '',
      '```markdown',
      '# Command: /{name}',
      '',
      '## 意图',
      '# 这个命令触发什么（一句话）',
      '',
      '## 参数',
      '# 参数列表及类型',
      '',
      '## 期望行为',
      '# Agent 应该逐步执行什么',
      '',
      '## 示例',
      '# 使用示例及预期输出',
      '```',
    ].join('\n'),
    'docs/standards/agent-spec.md': [
      '# Agent 规范标准',
      '',
      '> Agent 是决策层——编排 Skill 并交付结果。',
      '',
      '## 标准格式',
      '',
      '```markdown',
      '# Agent: {Name}',
      '',
      '## 角色',
      '# 解决什么问题（一句话）',
      '',
      '## 职责范围',
      '# 处理什么、委托什么',
      '',
      '## 输入',
      '# 触发条件与输入格式',
      '',
      '## 输出',
      '# 期望交付物',
      '',
      '## 质量要求',
      '# 验收标准',
      '```',
    ].join('\n'),
    'context/experience/INDEX.md': [
      '# 经验索引',
      '',
      '> 可检索的经验、踩坑与可复用模式索引。',
      '> 格式：关键词 | 文件 | 摘要',
      '',
      '## 按领域分类',
      '',
      '| 关键词 | 文件 | 摘要 |',
      '|--------|------|------|',
      '| 示例, 模式 | lessons/example.md | 替换为真实条目 |',
      '',
      '## 近期报告',
      '',
      '| 日期 | 文件 | 主题 |',
      '|------|------|------|',
      '| YYYY-MM | reports/example.md | 替换为真实条目 |',
    ].join('\n'),
  }
}

function buildExpertTemplates(locale) {
  if (locale === 'en') {
    return {
      'docs/standards/patterns/phase-router.md': [
        '# Pattern: Phase Router',
        '',
        '> Automatically route tasks to the correct workflow phase based on task type.',
        '',
        '## Task Type Recognition',
        '',
        '| Task Type | Signals | Phase Path |',
        '|-----------|---------|------------|',
        '| New feature | "add", "implement", "feat" | proposal → design → implement → review |',
        '| Bug fix | "fix", "resolve", "bug" | implement → review |',
        '| Refactor | "refactor", "optimize" | design → implement → review |',
        '| Docs | "document", "explain" | implement → review |',
        '| Query | "show", "list", "explain" | direct answer (no phases) |',
        '',
        '## Skip Conditions',
        '',
        '| Phase | Skip When |',
        '|-------|-----------|',
        '| proposal | Change is clearly scoped and small |',
        '| design | Non-architectural change; ≤ 2 files affected |',
        '| review | Pure docs or config change |',
        '',
        '## How to Use',
        '',
        'Reference this pattern in your `AGENTS.md` under the auto-behavior section.',
        'The AI assistant will apply the routing logic automatically.',
      ].join('\n'),
      'docs/standards/patterns/experience-mgmt.md': [
        '# Pattern: Experience Management',
        '',
        '> Organize `context/experience/` into a three-tier searchable structure.',
        '',
        '## Three-Tier Structure',
        '',
        '```',
        'context/experience/',
        '  INDEX.md          ← searchable index (keywords → files)',
        '  lessons/          ← individual lesson files',
        '  reports/          ← periodic review reports',
        '```',
        '',
        '## Adding a Lesson',
        '',
        '1. Create `context/experience/lessons/{topic}.md`',
        '2. Add a row to `INDEX.md`: `| keywords | lessons/{topic}.md | one-line summary |`',
        '',
        '## Adding a Report',
        '',
        '1. Create `context/experience/reports/YYYY-MM.md`',
        '2. Add a row to the Reports section of `INDEX.md`',
      ].join('\n'),
      'docs/standards/patterns/context-loading.md': [
        '# Pattern: Context Loading',
        '',
        '> Load project operating context before task-specific knowledge.',
        '',
        '## Mandatory Project Context',
        '',
        '- Read `context/PROJECT_PROFILE.yaml` before engineering decisions.',
        '- Follow the Project Operating Context rules in AGENTS.md.',
        '- Never interpret unknown as none; preserve confirmed commitments.',
        '',
        '## Task-specific Loading',
        '',
        '| Task Involves | Auto-load |',
        '|---------------|-----------|',
        '| Domain logic | `context/business/domain-model.md` |',
        '| API development | `context/tech/api/` and architecture docs |',
        '| Data changes | Project data commitments and database conventions |',
        '| Any implementation | `context/experience/INDEX.md` (search for matches) |',
        '',
        'Phase Router selects workflow phases; Project Operating Context selects project-level engineering defaults.',
      ].join('\n'),
      '.ai-adapters/README.md': [
        '# AI Adapter Configurations',
        '',
        '> Tool-specific configurations that point your AI assistant to `AGENTS.md`.',
        '',
        '## Cursor',
        '',
        'Create `.cursor/rules/aief.mdc` with:',
        '```',
        'Always start every session by reading AGENTS.md at the project root.',
        '```',
        '',
        '## GitHub Copilot',
        '',
        'Create `.github/copilot-instructions.md` with:',
        '```',
        'Always start every session by reading AGENTS.md at the project root.',
        '```',
        '',
        '## Claude Code',
        '',
        'Claude Code reads `AGENTS.md` natively. No adapter needed.',
      ].join('\n'),
    }
  }

  return {
    'docs/standards/patterns/phase-router.md': [
      '# 模式：阶段路由（Phase Router）',
      '',
      '> 根据任务类型自动路由到正确的工作流阶段。',
      '',
      '## 任务类型识别',
      '',
      '| 任务类型 | 识别信号 | 阶段路径 |',
      '|----------|---------|---------|',
      '| 新功能 | "添加"、"实现"、"feat" | proposal → design → implement → review |',
      '| Bug 修复 | "修复"、"解决"、"fix" | implement → review |',
      '| 重构 | "重构"、"优化"、"refactor" | design → implement → review |',
      '| 文档 | "文档"、"说明" | implement → review |',
      '| 查询 | "查看"、"显示"、"解释" | 直接回答（不走阶段） |',
      '',
      '## 跳过条件',
      '',
      '| 阶段 | 跳过条件 |',
      '|------|---------|',
      '| proposal | 改动范围明确且较小 |',
      '| design | 非架构变更；影响文件 ≤ 2 个 |',
      '| review | 纯文档或配置变更 |',
      '',
      '## 使用方法',
      '',
      '在 `AGENTS.md` 的自动行为章节引用此模式，AI 助手将自动应用路由逻辑。',
    ].join('\n'),
    'docs/standards/patterns/experience-mgmt.md': [
      '# 模式：三层经验管理（Experience Management）',
      '',
      '> 将 `context/experience/` 升级为可检索的三层结构。',
      '',
      '## 三层结构',
      '',
      '```',
      'context/experience/',
      '  INDEX.md          ← 可检索索引（关键词 → 文件）',
      '  lessons/          ← 具体经验文档',
      '  reports/          ← 定期总结报告',
      '```',
      '',
      '## 添加经验',
      '',
      '1. 创建 `context/experience/lessons/{主题}.md`',
      '2. 在 `INDEX.md` 添加一行：`| 关键词 | lessons/{主题}.md | 一句话摘要 |`',
      '',
      '## 添加报告',
      '',
      '1. 创建 `context/experience/reports/YYYY-MM.md`',
      '2. 在 `INDEX.md` 的报告区域添加一行',
    ].join('\n'),
    'docs/standards/patterns/context-loading.md': [
      '# 模式：上下文加载（Context Loading）',
      '',
      '> 按任务最小化加载相关上下文——不多也不少。',
      '',
      '## 加载策略',
      '',
      '| 任务涉及 | 自动加载 |',
      '|----------|---------|',
      '| 领域逻辑 | `context/business/domain-model.md` |',
      '| API 开发 | `context/tech/architecture.md` |',
      '| 任何实现 | `context/experience/INDEX.md`（检索匹配条目）|',
      '',
      '## 使用方法',
      '',
      '在 `AGENTS.md` 的自动加载章节引用此模式，指定哪类任务加载哪些上下文文件。',
    ].join('\n'),
    '.ai-adapters/README.md': [
      '# AI 适配器配置',
      '',
      '> 将 AI 工具指向 `AGENTS.md` 的工具特定配置。',
      '',
      '## Cursor',
      '',
      '创建 `.cursor/rules/aief.mdc`，内容：',
      '```',
      '每次会话开始时，先读取项目根目录的 AGENTS.md。',
      '```',
      '',
      '## GitHub Copilot',
      '',
      '创建 `.github/copilot-instructions.md`，内容：',
      '```',
      '每次会话开始时，先读取项目根目录的 AGENTS.md。',
      '```',
      '',
      '## Claude Code',
      '',
      'Claude Code 原生读取 `AGENTS.md`，无需适配器。',
    ].join('\n'),
  }
}

function initMinimal({ locale, baseDir, force, dryRun, writeRootAgents, preserveExisting = false } = {}) {
  const base = normalizeBaseDir(baseDir)
  const shouldWriteRootAgents = typeof writeRootAgents === 'boolean' ? writeRootAgents : !base
  const rootContextEntry = scopedRelPath(base, 'context/INDEX.md')
  const rootProfileEntry = scopedRelPath(base, 'context/PROJECT_PROFILE.yaml')
  const rootSpecEntry = scopedRelPath(base, 'docs/standards/patterns/project-operating-context.md')
  const baseContextEntry = 'context/INDEX.md'
  const baseTemplates = buildMinimalTemplates(locale, baseContextEntry)
  const rootTemplates = buildMinimalTemplates(locale, rootContextEntry, rootProfileEntry, rootSpecEntry, 'PROJECT_PROFILE.yaml', base ? base + '/' : '')
  const bKeep = templatePath('templates/minimal/context/business/.gitkeep')
  const tKeep = templatePath('templates/minimal/context/tech/.gitkeep')
  const eKeep = templatePath('templates/minimal/context/experience/.gitkeep')

  if (base) {
    const target = repoPath(base, 'AGENTS.md')
    if (!preserveExisting || !exists(target)) writeFile(target, `${baseTemplates.agents}\n`, { force, dryRun })
    else process.stdout.write(`[skip] preserve existing ${target}\n`)
  }

  if (shouldWriteRootAgents) {
    const target = repoPath('', 'AGENTS.md')
    if (!preserveExisting || !exists(target)) writeFile(target, `${rootTemplates.agents}\n`, { force, dryRun })
    else process.stdout.write(`[skip] preserve existing ${target}\n`)
  }

  const indexTarget = repoPath(base, 'context/INDEX.md')
  if (!preserveExisting || !exists(indexTarget)) writeFile(indexTarget, `${baseTemplates.index}\n`, { force, dryRun })
  else process.stdout.write(`[skip] preserve existing ${indexTarget}\n`)

  const profileTarget = repoPath(base, 'context/PROJECT_PROFILE.yaml')
  if (!exists(profileTarget)) writeFile(profileTarget, `${baseTemplates.profile}\n`, { force, dryRun })
  else process.stdout.write(`[skip] preserve existing project profile ${profileTarget}\n`)

  ensureDir(repoPath(base, 'context/business'), { dryRun })
  ensureDir(repoPath(base, 'context/tech'), { dryRun })
  ensureDir(repoPath(base, 'context/experience'), { dryRun })

  if (exists(bKeep)) copyFile(bKeep, repoPath(base, 'context/business/.gitkeep'), { force, dryRun })
  if (exists(tKeep)) copyFile(tKeep, repoPath(base, 'context/tech/.gitkeep'), { force, dryRun })
  if (exists(eKeep)) copyFile(eKeep, repoPath(base, 'context/experience/.gitkeep'), { force, dryRun })

  if (base) {
    ensureDir(repoPath(base, 'scripts'), { dryRun })
  }
}

function initRetrofit({ level, locale, baseDir, force, dryRun, writeRootAgents } = {}) {
  const base = normalizeBaseDir(baseDir)
  initMinimal({ locale, baseDir: base, force, dryRun, writeRootAgents, preserveExisting: true })

  if (level === 'L0') return
  if (level !== 'L0+' && level !== 'L1' && level !== 'L2' && level !== 'L3') {
    throw new Error(`Unsupported level: ${level}. The retrofit command supports L0, L0+, L1, L2, and L3. Use --level L1 as the recommended starting point, or L3 for the most complete setup.`)
  }

  const snapshotPath = repoPath(base, 'context/tech/REPO_SNAPSHOT.md')
  const snapshotContent = formatRepoSnapshot(process.cwd(), locale)
  if (!exists(snapshotPath)) writeFile(snapshotPath, snapshotContent, { force, dryRun })
  else process.stdout.write('[skip] preserve existing ' + snapshotPath + '\n')

  if (level === 'L1' || level === 'L2' || level === 'L3') {
    const scaffoldTemplates = buildScaffoldTemplates(locale)
    for (const [targetPath, content] of Object.entries(scaffoldTemplates)) {
      const destination = repoPath(base, targetPath)
      const isProjectKnowledge = /^context\/(business|tech|experience)\//.test(targetPath)
      if (exists(destination) && (isProjectKnowledge || !force)) {
        process.stdout.write('[skip] preserve existing ' + destination + '\n')
        continue
      }
      writeFile(destination, content, { force, dryRun })
    }

    if (base) {
      ensureDir(repoPath(base, 'scripts'), { dryRun })
    }
  }

  if (level === 'L2' || level === 'L3') {
    const advancedTemplates = buildAdvancedTemplates(locale)
    for (const [targetPath, content] of Object.entries(advancedTemplates)) {
      const destination = repoPath(base, targetPath)
      if (exists(destination) && targetPath.startsWith('context/')) {
        process.stdout.write('[skip] preserve existing ' + destination + '\n')
        continue
      }
      writeFile(destination, content, { force, dryRun })
    }
    ensureDir(repoPath(base, 'context/experience/lessons'), { dryRun })
    ensureDir(repoPath(base, 'context/experience/reports'), { dryRun })
  }

  if (level === 'L3') {
    const expertTemplates = buildExpertTemplates(locale)
    for (const [targetPath, content] of Object.entries(expertTemplates)) {
      writeFile(repoPath(base, targetPath), content, { force, dryRun })
    }
    ensureDir(repoPath(base, '.ai-adapters'), { dryRun })
  }
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

  // validate and migrate delegate to scripts/aief.mjs in the project root
  if (opts.command === 'validate' || opts.command === 'migrate') {
    const projectRoot = opts.baseDir ? path.resolve(process.cwd(), opts.baseDir) : process.cwd()
    const scriptPath = path.join(projectRoot, 'scripts', 'aief.mjs')
    if (!exists(scriptPath)) {
      process.stderr.write(
        `Error: scripts/aief.mjs not found at ${scriptPath}.\n` +
          'Run `aief-init retrofit --level L1` first to scaffold the scripts directory.\n'
      )
      process.exit(1)
    }
    const forwardArgs = process.argv.slice(2)
    const result = spawnSync(process.execPath, [scriptPath, ...forwardArgs], {
      stdio: 'inherit',
      cwd: projectRoot,
    })
    process.exit(result.status ?? 1)
  }

  const localeResult = resolveLocale(opts.locale)
  const baseDir = normalizeBaseDir(opts.baseDir)
  const writeRootAgents = typeof opts.rootAgents === 'boolean' ? opts.rootAgents : !baseDir
  if (localeResult.usedFallback) {
    process.stdout.write(
      `[warn] Unsupported locale "${localeResult.requested}". Falling back to ${DEFAULT_LOCALE}.\n`
    )
  }

  try {
    if (opts.command === 'new') {
      initMinimal({
        locale: localeResult.locale,
        baseDir,
        force: opts.force,
        dryRun: opts.dryRun,
        writeRootAgents,
      })
      process.stdout.write(
        `Done. Created minimal AIEF entry (${scopedRelPath(baseDir, 'AGENTS.md')} + ${scopedRelPath(baseDir, 'context/')}). Locale: ${localeResult.locale}.\n`
      )
      return
    }

    if (opts.command === 'retrofit') {
      initRetrofit({
        level: opts.level,
        locale: localeResult.locale,
        baseDir,
        force: opts.force,
        dryRun: opts.dryRun,
        writeRootAgents,
      })
      process.stdout.write(
        `Done. Retrofit init at level ${opts.level}. Base dir: ${baseDir || '.'}. Locale: ${localeResult.locale}.\n`
      )
      return
    }

    if (opts.command === 'doctor') {
      runDoctor({ baseDir, json: opts.json, profilePath: opts.profilePath })
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
