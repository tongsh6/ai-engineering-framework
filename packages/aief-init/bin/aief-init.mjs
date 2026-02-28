#!/usr/bin/env node

// Keep logic identical to the canonical package.

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
      '',
      'Options:',
      '  --level <L0|L0+|L1>   Migration level for retrofit (default: L0+)',
      `  --locale <zh-CN|en>   Template locale (default: ${DEFAULT_LOCALE})`,
      '  --base-dir <path>     Place AIEF assets under this base directory (example: AIEF)',
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
    locale: DEFAULT_LOCALE,
    baseDir: '',
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
    } else if (a === '--locale') {
      const v = args[i + 1]
      if (!v) throw new Error('Missing value for --locale')
      opts.locale = v
      i += 1
    } else if (a === '--base-dir') {
      const v = args[i + 1]
      if (!v) throw new Error('Missing value for --base-dir')
      opts.baseDir = v
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

function buildMinimalTemplates(locale, baseDir) {
  const contextEntry = scopedRelPath(baseDir, 'context/INDEX.md')

  if (locale === 'en') {
    return {
      agents: [
        '# [Project Name] AI Guide',
        '',
        'This is the project-level entry for AI-assisted engineering.',
        '',
        'Language:',
        '- Use Chinese for communication by default',
        '- Keep code/commands/identifiers in English',
        '',
        'Project:',
        '- One-liner:',
        '- Core value:',
        '',
        'Quick Commands:',
        '- build:',
        '- test:',
        '- run:',
        '',
        'Context Entry:',
        `- ${contextEntry}`,
        '',
      ].join('\n'),
      index: [
        '# Context Index',
        '',
        'This is the navigation entry for long-term project context.',
        '',
        'Directories:',
        '',
        '    context/',
        '        business/',
        '        tech/',
        '        experience/',
        '',
      ].join('\n'),
    }
  }

  return {
    agents: [
      '# [项目名称] AI 编程指南',
      '',
      '这是项目级 AI 协作入口。',
      '',
      '语言规则：',
      '- 交流默认使用中文',
      '- 代码/命令/标识符保持英文',
      '',
      '项目信息：',
      '- 项目一句话介绍：',
      '- 核心价值：',
      '',
      '常用命令：',
      '- build:',
      '- test:',
      '- run:',
      '',
      '上下文入口：',
      `- ${contextEntry}`,
      '',
    ].join('\n'),
    index: [
      '# 上下文索引',
      '',
      '这是项目长期上下文的导航入口。',
      '',
      '目录结构：',
      '',
      '    context/',
      '        business/',
      '        tech/',
      '        experience/',
      '',
    ].join('\n'),
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
    'docs/standards/patterns/context-loading.md': '# 模式：上下文加载\n\n按任务最小化加载相关上下文。\n',
    'templates/minimal/AGENTS.md': '# AI 编程指南模板\n\n项目级 AI 入口模板起点。\n',
    'templates/minimal/context/INDEX.md': '# 上下文索引模板\n\n上下文导航模板起点。\n',
  }
}

function initMinimal({ locale, baseDir, force, dryRun } = {}) {
  const base = normalizeBaseDir(baseDir)
  const minimal = buildMinimalTemplates(locale, base)
  const bKeep = templatePath('templates/minimal/context/business/.gitkeep')
  const tKeep = templatePath('templates/minimal/context/tech/.gitkeep')
  const eKeep = templatePath('templates/minimal/context/experience/.gitkeep')

  writeFile(repoPath('', 'AGENTS.md'), `${minimal.agents}\n`, { force, dryRun })
  writeFile(repoPath(base, 'context/INDEX.md'), `${minimal.index}\n`, { force, dryRun })

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

function initRetrofit({ level, locale, baseDir, force, dryRun } = {}) {
  const base = normalizeBaseDir(baseDir)
  initMinimal({ locale, baseDir: base, force, dryRun })

  if (level === 'L0') return
  if (level !== 'L0+' && level !== 'L1') {
    throw new Error(`Unsupported level: ${level}`)
  }

  const snapshotPath = repoPath(base, 'context/tech/REPO_SNAPSHOT.md')
  const snapshotContent = formatRepoSnapshot(process.cwd(), locale)
  writeFile(snapshotPath, snapshotContent, { force, dryRun })

  if (level === 'L1') {
    const scaffoldTemplates = buildScaffoldTemplates(locale)
    for (const [targetPath, content] of Object.entries(scaffoldTemplates)) {
      writeFile(repoPath(base, targetPath), content, { force, dryRun })
    }

    if (base) {
      ensureDir(repoPath(base, 'scripts'), { dryRun })
    }
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

  const localeResult = resolveLocale(opts.locale)
  const baseDir = normalizeBaseDir(opts.baseDir)
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
      })
      process.stdout.write(
        `Done. Created minimal AIEF entry (AGENTS.md + ${scopedRelPath(baseDir, 'context/')}). Locale: ${localeResult.locale}.\n`
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
      })
      process.stdout.write(
        `Done. Retrofit init at level ${opts.level}. Base dir: ${baseDir || '.'}. Locale: ${localeResult.locale}.\n`
      )
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
