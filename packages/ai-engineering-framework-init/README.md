# ai-engineering-framework-init

Optional bootstrap CLI for AI Engineering Framework (AIEF).

Run without copying any AIEF files into your repo:

    npx --yes @tongsh6/aief-init@latest retrofit --level L1 --locale zh-CN

Canonical package name (full):

    npx --yes @tongsh6/ai-engineering-framework-init@latest new --locale zh-CN

    npx --yes @tongsh6/ai-engineering-framework-init@latest retrofit --level L0

    npx --yes @tongsh6/ai-engineering-framework-init@latest retrofit --level L0+

Single-directory mode:

    npx --yes @tongsh6/ai-engineering-framework-init@latest retrofit --level L1 --base-dir AIEF

Locale options:

    --locale zh-CN   (default)
    --locale en

Base directory option:

    --base-dir AIEF

Notes:
- It only writes AIEF entry files (AGENTS.md + context/*). It does not modify your existing code structure.
- By default it will not overwrite existing files. Use --force to overwrite.
- Unsupported locale values fall back to zh-CN with a warning.
