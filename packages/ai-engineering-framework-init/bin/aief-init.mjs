#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

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
      '  aief-init validate refs [--fix] [--base-dir <path>]',
      '  aief-init migrate [assets] --to-base-dir <path> [--dry-run] [--base-dir <path>]',
      '',
      'Options:',
      '  --level <L0|L0+|L1|L2|L3>   Migration level for retrofit (default: L0+)',
      `  --locale <zh-CN|en>   Template locale (default: ${DEFAULT_LOCALE})`,
      '  --base-dir <path>     Place AIEF assets under this base directory (example: AIEF)',
      '  --to-base-dir <path>  Migration target base directory (for migrate)',
      '  --root-agents        Also write AGENTS.md at repo root (useful with --base-dir)',
      '  --no-root-agents     Skip writing AGENTS.md at repo root',
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
    toBaseDir: undefined,
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

function buildMinimalTemplates(locale, contextEntry) {

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
        '> Load only the context relevant to the current task — no more, no less.',
        '',
        '## Loading Strategy',
        '',
        '| Task Involves | Auto-load |',
        '|---------------|-----------|',
        '| Domain logic | `context/business/domain-model.md` |',
        '| API development | `context/tech/architecture.md` |',
        '| Any implementation | `context/experience/INDEX.md` (search for matches) |',
        '',
        '## How to Apply',
        '',
        'Reference this pattern in your `AGENTS.md` under the auto-behavior section.',
        'Specify which context files map to which task types.',
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

function initMinimal({ locale, baseDir, force, dryRun, writeRootAgents } = {}) {
  const base = normalizeBaseDir(baseDir)
  const shouldWriteRootAgents = typeof writeRootAgents === 'boolean' ? writeRootAgents : !base
  const rootContextEntry = scopedRelPath(base, 'context/INDEX.md')
  const baseContextEntry = 'context/INDEX.md'
  const rootTemplates = buildMinimalTemplates(locale, rootContextEntry)
  const baseTemplates = buildMinimalTemplates(locale, baseContextEntry)
  const bKeep = templatePath('templates/minimal/context/business/.gitkeep')
  const tKeep = templatePath('templates/minimal/context/tech/.gitkeep')
  const eKeep = templatePath('templates/minimal/context/experience/.gitkeep')

  if (base) {
    writeFile(repoPath(base, 'AGENTS.md'), `${baseTemplates.agents}\n`, { force, dryRun })
  }

  if (shouldWriteRootAgents) {
    writeFile(repoPath('', 'AGENTS.md'), `${rootTemplates.agents}\n`, { force, dryRun })
  }

  writeFile(repoPath(base, 'context/INDEX.md'), `${baseTemplates.index}\n`, { force, dryRun })

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
  initMinimal({ locale, baseDir: base, force, dryRun, writeRootAgents })

  if (level === 'L0') return
  if (level !== 'L0+' && level !== 'L1' && level !== 'L2' && level !== 'L3') {
    throw new Error(`Unsupported level: ${level}. The retrofit command supports L0, L0+, L1, L2, and L3. Use --level L1 as the recommended starting point, or L3 for the most complete setup.`)
  }

  const snapshotPath = repoPath(base, 'context/tech/REPO_SNAPSHOT.md')
  const snapshotContent = formatRepoSnapshot(process.cwd(), locale)
  writeFile(snapshotPath, snapshotContent, { force, dryRun })

  if (level === 'L1' || level === 'L2' || level === 'L3') {
    const scaffoldTemplates = buildScaffoldTemplates(locale)
    for (const [targetPath, content] of Object.entries(scaffoldTemplates)) {
      writeFile(repoPath(base, targetPath), content, { force, dryRun })
    }

    if (base) {
      ensureDir(repoPath(base, 'scripts'), { dryRun })
    }
  }

  if (level === 'L2' || level === 'L3') {
    const advancedTemplates = buildAdvancedTemplates(locale)
    for (const [targetPath, content] of Object.entries(advancedTemplates)) {
      writeFile(repoPath(base, targetPath), content, { force, dryRun })
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

    throw new Error(`Unknown command: ${opts.command}`)
  } catch (err) {
    const msg = err && err.message ? err.message : String(err)
    process.stderr.write(`${msg}\n`)
    process.exit(1)
  }
}

main()

