# Roadmap v1.9.0

Goal: improve operability after adoption (`retrofit` -> verify -> migrate -> maintain).

## Scope

### 1) `aief-init doctor` command (high priority)

Add a diagnostic command to provide one-shot health checks for AIEF assets.

Proposed checks:
- required entry files (`AGENTS.md`, `context/INDEX.md`)
- reference consistency (`validate refs` equivalent summary)
- migration readiness (`--base-dir` move impact preview)
- script availability (`scripts/aief.mjs` exists for delegated commands)

Output style:
- clear pass/fail sections
- actionable fix hints per failed check
- non-zero exit code when blocking issues exist

### 2) Improve migration UX (medium priority)

- add a concise migration summary table (moved files, fixed refs, skipped items)
- expose "next steps" hints after migrate success
- keep idempotency guarantees and explicit dry-run parity

### 3) Strengthen test coverage (medium priority)

- add doctor command tests
- extend canonical package smoke tests for retrofit L0+/L1 paths
- keep CI runtime lightweight (< 2 min target)

## Non-goals

- no breaking CLI syntax changes in v1.9.0
- no redesign of templates/content model
- no tool-specific adapter expansion in this iteration

## Acceptance Criteria

- `doctor` command released and documented in both README languages
- test workflow passes for alias + canonical packages
- post-release checklist script validates v1.9.0 successfully
