# [Project Name] AI Guide

This is the project-level entry for AI-assisted engineering.

## Project Operating Context

Before design, implementation, refactoring, data, compatibility, or release work:

1. Read `context/PROJECT_PROFILE.yaml` for project identity, lifecycle, release status, and commitments.
2. Follow `docs/standards/patterns/project-operating-context.md` when installed.
3. Distinguish confirmed facts, proposals, unknowns, and stale information. Never interpret unknown as none.
4. Lifecycle provides defaults only; real data responsibilities and confirmed external commitments take precedence.
5. Task-level adjustments must state their reason and scope. They must not silently change the project profile or bypass data, security, or external commitments.
6. Never change human-confirmed fields autonomously. Propose a pending change when evidence suggests they are stale.

The project profile is the single source of truth for project-level facts. Do not duplicate profile fields in AGENTS.md.

Profile: `context/PROJECT_PROFILE.yaml`
Specification: `docs/standards/patterns/project-operating-context.md`

Language:
- Use Chinese for communication by default
- Keep code/commands/identifiers in English

Quick Commands:
- build:
- test:
- run:

Context Entry:
- context/INDEX.md
- context/PROJECT_PROFILE.yaml

Knowledge Base:
| Directory | Purpose | When to Load |
|---|---|---|
| context/PROJECT_PROFILE.yaml | Project identity, lifecycle, commitments | Before engineering decisions |
| context/business/ | Business knowledge | Requirements and domain models |
| context/tech/ | Technical docs | Architecture, APIs, conventions |
| context/experience/ | Experience library | Before implementation |
| workflow/ | Workflows | Complex task phase guides (optional) |
| docs/standards/ | Standards | Load as needed |
