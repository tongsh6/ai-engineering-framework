# AI Engineering Framework (AIEF)

> A project-level context layer that makes AI coding assistants truly understand your codebase.

Get your project AI-ready in 5 minutes.

[![Tool Agnostic](https://img.shields.io/badge/Tool-Agnostic-blue.svg)](https://github.com/anthropics/claude-code/blob/main/AGENTS.md)
[![npm](https://img.shields.io/npm/v/@tongsh6/aief-init)](https://www.npmjs.com/package/@tongsh6/aief-init)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[中文文档](README.zh-CN.md)**

---

## What Is This?

AI coding assistants (Cursor, Copilot, Claude Code, etc.) can read files, but they still miss stable project context: business boundaries, architecture decisions, and hard-won team lessons.

**AIEF** gives your project a structured entry point - an `AGENTS.md` file plus a `context/` knowledge base - so AI can load the right context consistently.

`AGENTS.md` is a cross-tool convention used by mainstream AI coding tools. No vendor lock-in.

If your tool does not read `AGENTS.md` by default, enable an adapter (see `.ai-adapters/`) or instruct the tool to start from `AGENTS.md`.

AIEF focuses on stable collaboration context, not model cleverness.

Why teams adopt it:

- Faster AI sessions with less repeated prompting
- Shared project rules across people and tools
- Incremental adoption (start small, expand when needed)

## The Problem

Most teams using AI in daily development hit the same issues:

- **Rules are scattered** - prompts and conventions live in personal habits
- **Context is repeatedly re-explained** - each task restarts from partial understanding
- **Knowledge does not compound** - decisions and pitfalls are not captured as team assets
- **Onboarding is fragile** - new members cannot reuse prior AI collaboration patterns

This framework solves these with one stable, project-level entry point.

## 5-Minute Quick Start

Choose one path. Both are non-invasive and do not change your business code structure.

Level cheat sheet for retrofit:

- `L0`: create the minimum entry files only
- `L0+`: `L0` plus an auto-generated repo snapshot

### Option A: New Project

```bash
# Step 1 - Run this in your project root
npx --yes @tongsh6/aief-init@latest new
```

Step 2 - Open the generated `AGENTS.md` template and fill in:

1. One-line project description
2. Key constraints (e.g., directory boundaries, critical rules)
3. Common commands (`build` / `test` / `run`)

Keep it rough - short bullets are enough for L0.

Step 3 - Verify in 30 seconds:

- `AGENTS.md` exists in project root
- `context/INDEX.md` exists

Optional: Verify behavior in your AI tool:

- Ask: "Summarize the project rules from `AGENTS.md`." It should mention the constraints you wrote.

Done. Start coding with your AI assistant from this fixed entry point.

### Option B: Existing Project (Retrofit)

```bash
# Step 1 - Run this in your project root
# L0+ keeps code untouched and also generates a repo snapshot
npx --yes @tongsh6/aief-init@latest retrofit --level L0+
```

Step 2 - Check generated files:

1. `AGENTS.md` - fill in your project info
2. `context/tech/REPO_SNAPSHOT.md` - review auto-detected stack, directory layout, and CI clues

Step 3 - Verify in 30 seconds:

- `AGENTS.md` exists in project root
- `context/INDEX.md` exists
- `context/tech/REPO_SNAPSHOT.md` exists (for `L0+`)

Optional: Verify behavior in your AI tool:

- Ask: "Summarize the project rules from `AGENTS.md`." It should mention the constraints you wrote.

Done. Start coding with your AI assistant from this fixed entry point.

### Before / After

```
Before:                          After:
your-project/                    your-project/
├── src/                         ├── src/
├── package.json                 ├── package.json
└── ...                          ├── AGENTS.md            <- AI entry point
                                 ├── context/
                                 │   ├── INDEX.md         <- knowledge base nav
                                 │   └── tech/
                                 │       └── REPO_SNAPSHOT.md  <- auto-generated (retrofit `L0+` only)
                                 └── ...
```

A few files added. AI now has a stable, reusable way to read your project context.

> **Manual install** (offline / intranet): `git clone` the AIEF repository, then copy `AGENTS.md` and `context/` into your project. See [init/](init/) for details.

<details>
<summary><strong>Package names</strong></summary>

- Short alias package: `@tongsh6/aief-init`
- Canonical package: `@tongsh6/ai-engineering-framework-init`

</details>

## Core Concept

AIEF is built around three long-term engineering facts:

1. AI needs a stable entry point to read project rules
2. Projects need a long-lived context index
3. Experience must be reusable across tasks and people

These are implemented with:

- `AGENTS.md` as the project-level AI entry point
- `context/` as long-term context storage
- `context/experience/` as the compounding mechanism
- `workflow/` as an optional collaboration enhancer

## Repository Structure and Read Order

You do not need every file on day one. Recommended read/use order:

1. `AGENTS.md`
2. `context/INDEX.md`
3. `context/business/`
4. `context/tech/`
5. `context/experience/`
6. `workflow/` (optional)
7. `.ai-adapters/` (tool-specific, optional)

Condensed structure overview:

```
your-project/
├── AGENTS.md                    # AI entry point (tool-agnostic)
├── context/                     # Project knowledge base
│   ├── INDEX.md                 # Navigation index
│   ├── business/                # Domain models, glossary
│   ├── tech/                    # Architecture, API, conventions
│   └── experience/              # Lessons learned (compounding)
├── workflow/                    # Multi-phase workflows (optional)
└── .ai-adapters/                # Tool-specific configs (optional)
```

Only `AGENTS.md` and `context/INDEX.md` are required. Everything else is opt-in.

## Going Further

### Context Library (`context/`)

Organize project knowledge into three layers:

| Layer | Contents | Update Frequency |
|-------|----------|-----------------|
| **Business** | Domain models, user stories, business rules | Low |
| **Tech** | Architecture, API docs, coding conventions | Medium |
| **Experience** | Lessons learned, best practices, post-mortems | High |

AI loads the right context automatically based on the task at hand - see `AGENTS.md` for the routing rules.

### Experience Compounding (`context/experience/`)

The real power: every time AI completes a task, valuable lessons get captured and indexed. Next time a similar task comes up, AI loads the relevant experience automatically.

```
First time  -> Establish experience index
Second time -> Reuse experience, lower cost
Nth time    -> Near-zero marginal cost
```

### Workflow (`workflow/`, optional)

A built-in multi-phase workflow for complex tasks:

```
Trigger -> Route -> Phase Execution -> Validate -> Next Phase / Done
```

Built-in phases: `proposal` -> `design` -> `implement` -> `review`

You can also use [OpenSpec](https://openspec.dev), your own workflow, or skip this entirely.

### Tool Adapters (`.ai-adapters/`, optional)

All tools that support AGENTS.md work out of the box. For tool-specific enhancements:

| Tool | Config Path |
|------|------------|
| Cursor | `.ai-adapters/cursor/rules/` |
| GitHub Copilot | `.ai-adapters/copilot/instructions.md` |
| OpenCode | `.ai-adapters/opencode/commands/` |

### OpenSpec Integration

Works with [OpenSpec](https://openspec.dev) for spec-driven development:

```
your-project/
├── AGENTS.md           # AI Engineering entry point
├── context/            # Knowledge base
└── openspec/           # Spec-driven development
    ├── specs/
    └── changes/
```

## Migration Levels

For existing projects, adopt incrementally:

| Level | Effort | What You Get |
|-------|--------|-------------|
| **L0** | 5 min | `AGENTS.md` + `context/INDEX.md` (empty but present) |
| **L0+** | 10 min | + auto-generated `REPO_SNAPSHOT.md` |
| **L1** | 1-2 hrs | + one-page business doc + one-page tech doc |
| **L2** | Optional | + workflow, experience templates, CI checks |
| **L3** | Ongoing | + continuous experience compounding |

Start at L0. Move up when you feel the need.

L0 is considered adopted once `AGENTS.md` and `context/INDEX.md` exist.

## Rollback and Safety

AIEF is a sidecar-style convention and does not modify your business code structure.

If you stop using it, remove:

- `AGENTS.md`
- `context/`

Build, runtime, and git history remain unaffected.

---

<details>
<summary><strong>Best Practices</strong></summary>

### Start from real scenarios
- Do not adopt the framework for its own sake
- Extract patterns from how your most effective team members work
- Turn those effective workflows into AI-readable context

### Encode knowledge into documents
- Turn experience into searchable docs
- Turn conventions into explicit rules
- Turn context into auto-loading strategies

### Pursue decreasing marginal cost
- After each task, ask: what experience can be captured?
- Periodically organize the experience index
- Delete outdated knowledge

### Keep it simple
- Start with the minimal config
- Add complexity only when needed
- Regularly clean up unused configs

</details>

<details>
<summary><strong>Branch Strategy & Contributing</strong></summary>

| Branch | Purpose | Notes |
|--------|---------|-------|
| `main` | Stable release | What users get by default |
| `develop` | Development | Integration testing for new features |
| `feature/*` | Feature branches | Created from develop, merged back |

**Version tags**: Semantic versioning - `v1.0.0`, `v1.1.0`, etc.

### Contributing

1. Fork the repo
2. Create a feature branch from `develop`
3. Submit PR to `develop`
4. Maintainers periodically merge `develop` -> `main` and tag releases

</details>

---

## References

- [AGENTS.md Standard](https://github.com/anthropics/claude-code/blob/main/AGENTS.md) - Tool-agnostic AI guide standard
- [Context Engineering](https://context.engineering) - Context engineering methodology
- [OpenSpec](https://openspec.dev) - Spec-driven development framework

## License

MIT
