#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const IGNORE_DIRS = new Set([
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

const AIEF_PATH_PREFIX = 'AIEF/'
const AIEF_TOP_LEVEL = new Set([
  'AGENTS.md',
  'context',
  'workflow',
  'docs',
  'templates',
  '.ai-adapters',
  'init',
  'AIEF',
])

function printHelp() {
  process.stdout.write(
    [
      'aief',
      '',
      'Usage:',
      '  aief validate refs [--fix] [--base-dir <path>]',
      '  aief verify [--fix] [--base-dir <path>]',
      '  aief migrate [assets] --to-base-dir <path> [--dry-run] [--base-dir <path>]',
      '',
      'Options:',
      '  --fix                 Auto-fix deterministic path issues',
      '  --dry-run             Preview changes without writing files',
      '  --to-base-dir <path>  Migration target base directory (for migrate)',
      '  --base-dir <path>     Validate target repository root (default: cwd)',
      '  -h, --help            Show help',
      '',
    ].join('\n')
  )
}

function parseArgs(argv) {
  const args = argv.slice(2)
  if (!args.length || args.includes('-h') || args.includes('--help')) {
    return { help: true }
  }

  const command = args[0]
  const opts = {
    command,
    subcommand: undefined,
    fix: false,
    dryRun: false,
    toBaseDir: undefined,
    baseDir: process.cwd(),
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
    if (a === '--fix') {
      opts.fix = true
    } else if (a === '--dry-run') {
      opts.dryRun = true
    } else if (a === '--to-base-dir') {
      const v = args[i + 1]
      if (!v) throw new Error('Missing value for --to-base-dir')
      opts.toBaseDir = v
      i += 1
    } else if (a === '--base-dir') {
      const v = args[i + 1]
      if (!v) throw new Error('Missing value for --base-dir')
      opts.baseDir = path.resolve(process.cwd(), v)
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

function isFile(p) {
  try {
    return fs.statSync(p).isFile()
  } catch {
    return false
  }
}

function isDirectory(p) {
  try {
    return fs.statSync(p).isDirectory()
  } catch {
    return false
  }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function writeText(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8')
}

function copyPathRecursive(src, dst) {
  const st = fs.statSync(src)
  if (st.isDirectory()) {
    ensureDir(dst)
    const entries = fs.readdirSync(src, { withFileTypes: true })
    for (const entry of entries) {
      copyPathRecursive(path.join(src, entry.name), path.join(dst, entry.name))
    }
    return
  }

  ensureDir(path.dirname(dst))
  fs.copyFileSync(src, dst)
}

function removePathRecursive(p) {
  fs.rmSync(p, { recursive: true, force: true })
}

function movePathWithFallback(src, dst) {
  ensureDir(path.dirname(dst))
  try {
    fs.renameSync(src, dst)
    return
  } catch (err) {
    if (err && err.code === 'EXDEV') {
      copyPathRecursive(src, dst)
      removePathRecursive(src)
      return
    }
    throw err
  }
}

function toPosix(p) {
  return p.replace(/\\/g, '/')
}

function rel(baseDir, p) {
  return toPosix(path.relative(baseDir, p))
}

function isInsideRoot(targetPath, projectRoot) {
  const relPath = path.relative(projectRoot, targetPath)
  if (!relPath) return true
  if (relPath.startsWith('..')) return false
  return !path.isAbsolute(relPath)
}

function walkFiles(rootDir, shouldInclude) {
  const out = []

  function walk(current) {
    let entries = []
    try {
      entries = fs.readdirSync(current, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue
        walk(path.join(current, entry.name))
        continue
      }

      const filePath = path.join(current, entry.name)
      if (shouldInclude(filePath)) out.push(filePath)
    }
  }

  walk(rootDir)
  return out
}

function isExternalRef(target) {
  if (!target) return true
  if (target.startsWith('#')) return true
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target)) return true
  return false
}

function parseLinkTarget(rawTarget) {
  const trimmed = rawTarget.trim()
  const unwrapped =
    trimmed.startsWith('<') && trimmed.endsWith('>')
      ? trimmed.slice(1, -1).trim()
      : trimmed

  const firstSpace = unwrapped.search(/\s/)
  const target = firstSpace >= 0 ? unwrapped.slice(0, firstSpace) : unwrapped

  const hashIdx = target.indexOf('#')
  const queryIdx = target.indexOf('?')
  let cut = -1
  if (hashIdx >= 0 && queryIdx >= 0) cut = Math.min(hashIdx, queryIdx)
  else cut = Math.max(hashIdx, queryIdx)

  if (cut >= 0) {
    return {
      full: target,
      basePath: target.slice(0, cut),
      suffix: target.slice(cut),
    }
  }

  return { full: target, basePath: target, suffix: '' }
}

function isPlaceholderPath(refPath) {
  const p = toPosix(String(refPath || ''))
  if (!p) return true
  if (p.includes('[') || p.includes(']')) return true
  if (p.includes('{') || p.includes('}')) return true
  if (/\bxxx\b/i.test(p)) return true
  return false
}

function firstSegment(refPath) {
  const normalized = toPosix(refPath).replace(/^\/+/, '')
  return normalized.split('/').filter(Boolean)[0] || ''
}

function isAiefReference(basePath, fileDir, projectRoot) {
  if (!basePath) return false
  if (isPlaceholderPath(basePath)) return false

  const posix = toPosix(basePath)
  if (posix.startsWith(AIEF_PATH_PREFIX)) return true

  if (posix.startsWith('./') || posix.startsWith('../') || posix.startsWith('/')) {
    const resolved = resolvePathRef(fileDir, posix, projectRoot)
    if (!resolved) return false
    const relPath = rel(projectRoot, resolved)
    const seg = firstSegment(relPath)
    return AIEF_TOP_LEVEL.has(seg)
  }

  return AIEF_TOP_LEVEL.has(firstSegment(posix))
}

function isAiefScriptToken(token, fileDir, projectRoot) {
  if (!token || isPlaceholderPath(token)) return false
  const posix = toPosix(token)
  if (posix.startsWith(AIEF_PATH_PREFIX) || posix.startsWith(`./${AIEF_PATH_PREFIX}`)) return true

  const seg = firstSegment(posix)
  if (AIEF_TOP_LEVEL.has(seg)) return true

  const resolved = resolvePathRef(fileDir, posix, projectRoot)
  if (!resolved) return false
  const relPath = rel(projectRoot, resolved)
  return AIEF_TOP_LEVEL.has(firstSegment(relPath))
}

function resolvePathRef(baseDirForFile, refPath, projectRoot) {
  if (!refPath) return null
  if (path.isAbsolute(refPath)) return refPath
  if (refPath.startsWith('/')) return path.resolve(projectRoot, `.${refPath}`)
  return path.resolve(baseDirForFile, refPath)
}

function buildToggleCandidates(refPath) {
  const out = []
  const v = toPosix(refPath)

  if (v.startsWith(`${AIEF_PATH_PREFIX}`)) {
    out.push(v.slice(AIEF_PATH_PREFIX.length))
  } else if (v.startsWith(`./${AIEF_PATH_PREFIX}`)) {
    out.push(`./${v.slice(`./${AIEF_PATH_PREFIX}`.length)}`)
  }

  if (!v.startsWith(AIEF_PATH_PREFIX) && !v.startsWith(`./${AIEF_PATH_PREFIX}`)) {
    if (v.startsWith('./')) out.push(`./${AIEF_PATH_PREFIX}${v.slice(2)}`)
    else if (!v.startsWith('../') && !v.startsWith('/')) out.push(`${AIEF_PATH_PREFIX}${v}`)
  }

  return Array.from(new Set(out)).filter(Boolean)
}

function buildRelativeDepthCandidates(refPath) {
  const out = []
  const v = toPosix(refPath)

  if (v.startsWith('./') || v.startsWith('../')) {
    let add = v
    for (let i = 0; i < 5; i += 1) {
      add = `../${add}`
      out.push(add)
    }

    let remove = v
    for (let i = 0; i < 5; i += 1) {
      if (!remove.startsWith('../')) break
      remove = remove.slice(3)
      out.push(remove || './')
    }

    return out
  }

  const seg = firstSegment(v)
  if (AIEF_TOP_LEVEL.has(seg)) {
    for (let i = 1; i <= 6; i += 1) {
      out.push(`${'../'.repeat(i)}${v}`)
    }
  }

  return out
}

function chooseFixCandidate(baseDirForFile, refPath, projectRoot) {
  const candidates = [
    ...buildToggleCandidates(refPath),
    ...buildRelativeDepthCandidates(refPath),
  ]
  const existing = candidates.filter((c) => {
    const resolved = resolvePathRef(baseDirForFile, c, projectRoot)
    if (!resolved) return false
    if (!isInsideRoot(resolved, projectRoot)) return false
    return exists(resolved)
  })
  if (existing.length === 1) return existing[0]
  return null
}

function collectMarkdownFiles(projectRoot) {
  return walkFiles(projectRoot, (filePath) => filePath.toLowerCase().endsWith('.md'))
}

function collectPackageJsonFiles(projectRoot) {
  return walkFiles(projectRoot, (filePath) => path.basename(filePath) === 'package.json')
}

function collectScriptFiles(projectRoot) {
  return walkFiles(projectRoot, (filePath) => {
    const p = toPosix(filePath)
    return p.endsWith('.mjs') && (p.includes('/scripts/') || p.includes('/packages/'))
  })
}

function normalizeTargetBaseDir(input) {
  const original = String(input || '').trim()
  if (!original) return null
  if (path.isAbsolute(original)) return null
  const raw = toPosix(original).replace(/^\.\//, '').replace(/\/+$/, '')
  if (!raw) return null
  if (raw === '.' || raw === '/') return null
  return raw
}

function isAiefScriptAssetName(name) {
  return /aief/i.test(name)
}

function listScriptAssetsForMigration(projectRoot) {
  const srcDir = path.join(projectRoot, 'scripts')
  if (!isDirectory(srcDir)) return []

  const entries = fs.readdirSync(srcDir, { withFileTypes: true })
  return entries
    .filter((e) => isAiefScriptAssetName(e.name))
    .map((e) => ({
      relPath: `scripts/${e.name}`,
      source: path.join(srcDir, e.name),
      type: e.isDirectory() ? 'dir' : 'file',
    }))
}

function collectMigrationAssets(projectRoot) {
  const assets = []
  const core = ['context', 'workflow', 'docs', 'templates']
  for (const item of core) {
    assets.push({
      relPath: item,
      source: path.join(projectRoot, item),
      type: 'dir',
    })
  }

  assets.push(...listScriptAssetsForMigration(projectRoot))
  return assets
}

function executeMigration(projectRoot, targetBaseRel, dryRun) {
  const targetBaseAbs = path.join(projectRoot, targetBaseRel)
  const assets = collectMigrationAssets(projectRoot)
  const moved = []
  const alreadyMigrated = []
  const skipped = []
  const conflicts = []

  if (!dryRun) ensureDir(targetBaseAbs)

  for (const asset of assets) {
    const src = asset.source
    const dst = path.join(targetBaseAbs, asset.relPath)
    const srcExists = exists(src)
    const dstExists = exists(dst)

    if (!srcExists && dstExists) {
      alreadyMigrated.push(asset.relPath)
      continue
    }

    if (!srcExists && !dstExists) {
      skipped.push({
        path: asset.relPath,
        reason: 'source_missing',
      })
      continue
    }

    if (srcExists && dstExists) {
      conflicts.push({
        path: asset.relPath,
        reason: 'target_exists',
      })
      continue
    }

    if (dryRun) {
      moved.push({ path: asset.relPath, dryRun: true })
      continue
    }

    movePathWithFallback(src, dst)
    moved.push({ path: asset.relPath, dryRun: false })
  }

  return {
    targetBaseRel,
    targetBaseAbs,
    moved,
    alreadyMigrated,
    skipped,
    conflicts,
  }
}

function validateMarkdownRefs(projectRoot, applyFixes) {
  const invalidRefs = []
  const fixedChanges = []
  const markdownFiles = collectMarkdownFiles(projectRoot)
  const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g

  for (const filePath of markdownFiles) {
    const original = readText(filePath)
    let content = original
    let updated = false
    const dir = path.dirname(filePath)

    content = content.replace(linkRegex, (fullMatch, rawTarget) => {
      const parsed = parseLinkTarget(rawTarget)
      if (!parsed.basePath) return fullMatch
      if (isExternalRef(parsed.basePath)) return fullMatch
      if (!isAiefReference(parsed.basePath, dir, projectRoot)) return fullMatch

      const resolved = resolvePathRef(dir, parsed.basePath, projectRoot)
      if (resolved && exists(resolved)) return fullMatch

      const fixCandidate = chooseFixCandidate(dir, parsed.basePath, projectRoot)
      if (fixCandidate && applyFixes) {
        const nextTarget = `${fixCandidate}${parsed.suffix}`
        const fixedMatch = fullMatch.replace(rawTarget, nextTarget)
        fixedChanges.push({
          type: 'markdown_ref',
          file: rel(projectRoot, filePath),
          from: parsed.basePath,
          to: fixCandidate,
        })
        updated = true
        return fixedMatch
      }

      invalidRefs.push({
        type: 'markdown_ref',
        file: rel(projectRoot, filePath),
        ref: parsed.basePath,
        suggestion:
          fixCandidate !== null
            ? `Use ${fixCandidate}`
            : 'Check path or add/remove AIEF/ prefix manually',
      })
      return fullMatch
    })

    if (updated && content !== original) {
      writeText(filePath, content)
    }
  }

  return { invalidRefs, fixedChanges }
}

function extractScriptPathTokens(scriptValue) {
  const tokens = scriptValue.match(/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+/g) || []
  return tokens.filter((token) => {
    if (!token.includes('/')) return false
    if (token.includes('://')) return false
    if (token.startsWith('@')) return false
    if (token.startsWith('node:')) return false
    return true
  })
}

function validatePackageScriptRefs(projectRoot, applyFixes) {
  const invalidRefs = []
  const fixedChanges = []
  const packageJsonFiles = collectPackageJsonFiles(projectRoot)

  for (const pkgPath of packageJsonFiles) {
    let pkg
    try {
      pkg = JSON.parse(readText(pkgPath))
    } catch {
      continue
    }

    if (!pkg.scripts || typeof pkg.scripts !== 'object') continue
    const pkgDir = path.dirname(pkgPath)
    let changed = false

    for (const [name, value] of Object.entries(pkg.scripts)) {
      if (typeof value !== 'string') continue
      let nextValue = value
      const tokens = extractScriptPathTokens(value)

      for (const token of tokens) {
        if (!isAiefScriptToken(token, pkgDir, projectRoot)) continue
        const resolved = resolvePathRef(pkgDir, token, projectRoot)
        if (resolved && exists(resolved)) continue

        const fixCandidate = chooseFixCandidate(pkgDir, token, projectRoot)
        if (fixCandidate && applyFixes) {
          const updatedToken = token.replace(token, fixCandidate)
          if (nextValue.includes(token)) {
            nextValue = nextValue.split(token).join(updatedToken)
            fixedChanges.push({
              type: 'package_script_ref',
              file: rel(projectRoot, pkgPath),
              script: name,
              from: token,
              to: fixCandidate,
            })
            changed = true
          }
          continue
        }

        invalidRefs.push({
          type: 'package_script_ref',
          file: rel(projectRoot, pkgPath),
          script: name,
          ref: token,
          suggestion:
            fixCandidate !== null
              ? `Use ${fixCandidate}`
              : 'Check package script path or add/remove AIEF/ prefix manually',
        })
      }

      if (nextValue !== value) {
        pkg.scripts[name] = nextValue
      }
    }

    if (changed) {
      writeText(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
    }
  }

  return { invalidRefs, fixedChanges }
}

function validateTemplatePathConstants(projectRoot, applyFixes) {
  const invalidRefs = []
  const fixedChanges = []
  const scripts = collectScriptFiles(projectRoot)
  const regex = /templatePath\((['"])([^'"\n]+)\1\)/g

  for (const filePath of scripts) {
    const original = readText(filePath)
    let content = original
    let changed = false
    const baseDirForTemplate = path.resolve(path.dirname(filePath), '..')

    content = content.replace(regex, (full, quote, rawRef) => {
      const resolved = path.resolve(baseDirForTemplate, rawRef)
      if (exists(resolved)) return full

      const fixCandidate = chooseFixCandidate(baseDirForTemplate, rawRef, projectRoot)
      if (fixCandidate && applyFixes) {
        changed = true
        fixedChanges.push({
          type: 'script_template_ref',
          file: rel(projectRoot, filePath),
          from: rawRef,
          to: fixCandidate,
        })
        return `templatePath(${quote}${fixCandidate}${quote})`
      }

      invalidRefs.push({
        type: 'script_template_ref',
        file: rel(projectRoot, filePath),
        ref: rawRef,
        suggestion:
          fixCandidate !== null
            ? `Use ${fixCandidate}`
            : 'Check templatePath constant or add/remove AIEF/ prefix manually',
      })
      return full
    })

    if (changed && content !== original) {
      writeText(filePath, content)
    }
  }

  return { invalidRefs, fixedChanges }
}

function validateExperienceIndex(projectRoot) {
  const invalidRefs = []
  const missingRefs = []
  const rootIndex = path.join(projectRoot, 'context', 'experience', 'INDEX.md')
  const aiefIndex = path.join(projectRoot, AIEF_PATH_PREFIX, 'context', 'experience', 'INDEX.md')
  const indexPath = isFile(rootIndex) ? rootIndex : isFile(aiefIndex) ? aiefIndex : null

  if (!isFile(indexPath)) {
    return {
      invalidRefs,
      missingRefs: [
        {
          type: 'experience_index_missing_file',
          file: 'context/experience/INDEX.md or AIEF/context/experience/INDEX.md',
          detail: 'Missing required experience index file',
          suggestion: 'Create context/experience/INDEX.md (or move it under AIEF/context/experience/INDEX.md)',
        },
      ],
    }
  }

  const content = readText(indexPath)
  const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g
  const referenced = new Set()
  const indexDir = path.dirname(indexPath)

  let match
  while ((match = linkRegex.exec(content)) !== null) {
    const parsed = parseLinkTarget(match[1])
    const target = toPosix(parsed.basePath)
    if (!(target.startsWith('lessons/') || target.startsWith('reports/'))) continue
    if (isPlaceholderPath(target)) continue
    referenced.add(target)

    const resolved = resolvePathRef(indexDir, target, projectRoot)
    if (!resolved || !exists(resolved)) {
      invalidRefs.push({
        type: 'experience_index_ref',
        file: rel(projectRoot, indexPath),
        ref: target,
        suggestion: 'Fix link path to an existing file under context/experience',
      })
    }
  }

  const checkDirs = [
    path.join(path.dirname(indexPath), 'lessons'),
    path.join(path.dirname(indexPath), 'reports'),
  ]

  for (const dir of checkDirs) {
    if (!exists(dir)) continue
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile()) continue
      if (!entry.name.toLowerCase().endsWith('.md')) continue
      if (entry.name === '_template.md') continue

      const relPath = toPosix(path.join(path.basename(dir), entry.name))
      if (!referenced.has(relPath)) {
        missingRefs.push({
          type: 'experience_index_unreferenced_doc',
          file: rel(projectRoot, indexPath),
          ref: relPath,
          suggestion: `Add a link entry for ${relPath} in context/experience/INDEX.md`,
        })
      }
    }
  }

  return { invalidRefs, missingRefs }
}

function runValidation(projectRoot, applyFixes) {
  const markdown = validateMarkdownRefs(projectRoot, applyFixes)
  const pkgScripts = validatePackageScriptRefs(projectRoot, applyFixes)
  const scriptRefs = validateTemplatePathConstants(projectRoot, applyFixes)
  const exp = validateExperienceIndex(projectRoot)

  return {
    invalidRefs: [
      ...markdown.invalidRefs,
      ...pkgScripts.invalidRefs,
      ...scriptRefs.invalidRefs,
      ...exp.invalidRefs,
    ],
    missingRefs: [...exp.missingRefs],
    fixedChanges: [
      ...markdown.fixedChanges,
      ...pkgScripts.fixedChanges,
      ...scriptRefs.fixedChanges,
    ],
  }
}

function printReport(result, { mode, projectRoot }) {
  process.stdout.write(`Target: ${projectRoot}\n`)
  process.stdout.write(`Mode: ${mode}\n\n`)

  process.stdout.write(`Invalid references: ${result.invalidRefs.length}\n`)
  for (const item of result.invalidRefs) {
    const extra = item.script ? ` script=${item.script}` : ''
    process.stdout.write(
      `- [${item.type}] ${item.file}${extra} -> ${item.ref}\n  suggestion: ${item.suggestion}\n`
    )
  }

  process.stdout.write(`\nMissing references: ${result.missingRefs.length}\n`)
  for (const item of result.missingRefs) {
    process.stdout.write(`- [${item.type}] ${item.file} -> ${item.ref || item.detail}\n  suggestion: ${item.suggestion}\n`)
  }

  process.stdout.write(`\nAuto-fix changes: ${result.fixedChanges.length}\n`)
  for (const item of result.fixedChanges) {
    const extra = item.script ? ` script=${item.script}` : ''
    process.stdout.write(`- [${item.type}] ${item.file}${extra}: ${item.from} -> ${item.to}\n`)
  }

  if (!result.invalidRefs.length && !result.missingRefs.length) {
    process.stdout.write('No blocking reference issues found.\n')
  }

  process.stdout.write('\n')
}

function runValidateRefs(opts, config = {}) {
  const { silent = false } = config
  const projectRoot = opts.baseDir
  if (!exists(projectRoot) || !fs.statSync(projectRoot).isDirectory()) {
    throw new Error(`Invalid --base-dir: ${projectRoot}`)
  }

  let pre = runValidation(projectRoot, false)
  let fixedChanges = []

  if (opts.fix) {
    const fixed = runValidation(projectRoot, true)
    fixedChanges = fixed.fixedChanges
    pre = runValidation(projectRoot, false)
  }

  const report = {
    invalidRefs: pre.invalidRefs,
    missingRefs: pre.missingRefs,
    fixedChanges,
  }

  if (!silent) {
    printReport(report, {
      mode: opts.fix ? 'validate refs --fix' : 'validate refs',
      projectRoot,
    })
  }

  return report
}

function runVerify(opts, config = {}) {
  const { silent = false } = config
  const report = runValidateRefs({ ...opts, command: 'validate', subcommand: 'refs' }, { silent })
  const failed = report.invalidRefs.length > 0 || report.missingRefs.length > 0

  if (!silent) {
    if (failed) {
      process.stdout.write('aief verify: FAILED\n')
    } else {
      process.stdout.write('aief verify: PASSED\n')
    }
  }

  return report
}

function printMigrationReport(migration, refsReport, verifyReport, opts) {
  process.stdout.write(`Target: ${opts.baseDir}\n`)
  process.stdout.write(`Mode: migrate -> ${migration.targetBaseRel}${opts.dryRun ? ' (dry-run)' : ''}\n\n`)

  process.stdout.write(`Moved assets: ${migration.moved.length}\n`)
  for (const item of migration.moved) {
    process.stdout.write(`- ${item.path}${item.dryRun ? ' (dry-run)' : ''}\n`)
  }

  process.stdout.write(`\nAlready migrated: ${migration.alreadyMigrated.length}\n`)
  for (const item of migration.alreadyMigrated) {
    process.stdout.write(`- ${item}\n`)
  }

  process.stdout.write(`\nSkipped assets: ${migration.skipped.length}\n`)
  for (const item of migration.skipped) {
    process.stdout.write(`- ${item.path} (${item.reason})\n`)
  }

  process.stdout.write(`\nConflicts: ${migration.conflicts.length}\n`)
  for (const item of migration.conflicts) {
    process.stdout.write(`- ${item.path} (${item.reason})\n`)
  }

  if (opts.dryRun) {
    process.stdout.write('\nReference fix/verify skipped in dry-run mode.\n\n')
    return
  }

  process.stdout.write(`\nAuto-fixed references: ${refsReport.fixedChanges.length}\n`)
  for (const item of refsReport.fixedChanges) {
    const extra = item.script ? ` script=${item.script}` : ''
    process.stdout.write(`- [${item.type}] ${item.file}${extra}: ${item.from} -> ${item.to}\n`)
  }

  process.stdout.write(`\nRemaining invalid references: ${verifyReport.invalidRefs.length}\n`)
  for (const item of verifyReport.invalidRefs) {
    const extra = item.script ? ` script=${item.script}` : ''
    process.stdout.write(`- [${item.type}] ${item.file}${extra} -> ${item.ref}\n  suggestion: ${item.suggestion}\n`)
  }

  process.stdout.write(`\nRemaining missing references: ${verifyReport.missingRefs.length}\n`)
  for (const item of verifyReport.missingRefs) {
    process.stdout.write(`- [${item.type}] ${item.file} -> ${item.ref || item.detail}\n  suggestion: ${item.suggestion}\n`)
  }

  if (!verifyReport.invalidRefs.length && !verifyReport.missingRefs.length) {
    process.stdout.write('\naief verify: PASSED\n\n')
  } else {
    process.stdout.write('\naief verify: FAILED\n\n')
  }
}

function runMigrate(opts) {
  const projectRoot = opts.baseDir
  if (!exists(projectRoot) || !isDirectory(projectRoot)) {
    throw new Error(`Invalid --base-dir: ${projectRoot}`)
  }

  const targetBaseRel = normalizeTargetBaseDir(opts.toBaseDir)
  if (!targetBaseRel) {
    throw new Error('Missing or invalid --to-base-dir (example: --to-base-dir AIEF)')
  }

  const migration = executeMigration(projectRoot, targetBaseRel, opts.dryRun)
  if (opts.dryRun) {
    printMigrationReport(migration, { fixedChanges: [] }, { invalidRefs: [], missingRefs: [] }, opts)
    return {
      migration,
      refsReport: { fixedChanges: [], invalidRefs: [], missingRefs: [] },
      verifyReport: { invalidRefs: [], missingRefs: [] },
      ok: true,
    }
  }

  const refsReport = runValidateRefs({ ...opts, command: 'validate', subcommand: 'refs', fix: true }, { silent: true })
  const verifyReport = runVerify({ ...opts, command: 'verify' }, { silent: true })
  const ok = verifyReport.invalidRefs.length === 0 && verifyReport.missingRefs.length === 0

  printMigrationReport(migration, refsReport, verifyReport, opts)
  return {
    migration,
    refsReport,
    verifyReport,
    ok,
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

  if (opts.help) {
    printHelp()
    process.exit(0)
  }

  try {
    if (opts.command === 'validate' && opts.subcommand === 'refs') {
      const report = runValidateRefs(opts)
      if (report.invalidRefs.length || report.missingRefs.length) process.exit(1)
      process.exit(0)
    }

    if (opts.command === 'verify') {
      const report = runVerify(opts)
      if (report.invalidRefs.length || report.missingRefs.length) process.exit(1)
      process.exit(0)
    }

    if (opts.command === 'migrate') {
      if (opts.subcommand && opts.subcommand !== 'assets') {
        throw new Error(`Unknown subcommand for migrate: ${opts.subcommand}`)
      }
      const report = runMigrate(opts)
      if (!report.ok) process.exit(1)
      process.exit(0)
    }

    throw new Error(
      opts.command === 'validate'
        ? `Unknown subcommand for validate: ${opts.subcommand || '(empty)'}`
        : `Unknown command: ${opts.command}`
    )
  } catch (err) {
    process.stderr.write(`${err.message}\n`)
    process.exit(1)
  }
}

main()
