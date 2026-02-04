# Copilot Instructions

Please refer to the project root's AGENTS.md for complete development guidelines.

## Quick Reference

- **Knowledge Base**: `context/` directory
- **Workflow**: `workflow/` directory  
- **Experience Index**: `context/experience/INDEX.md`

## Key Conventions

1. Follow coding conventions in `context/tech/conventions/`
2. Check experience index before implementing new features
3. Use TDD (Test-Driven Development) for all implementations
4. Load relevant context before starting any task

## Context Loading

Before implementing, load relevant context:

| Task Type | Load |
|-----------|------|
| Domain logic | `context/business/domain-model.md` |
| API development | `context/tech/api/` |
| Backend code | `context/tech/conventions/backend.md` |
| Frontend code | `context/tech/conventions/frontend.md` |
| Any implementation | `context/experience/INDEX.md` (search for related experiences) |
