# ai-engineering-framework-init

Optional bootstrap CLI for AI Engineering Framework (AIEF).

Run without copying any AIEF files into your repo:

    npx --yes @tongsh6/aief-init@latest retrofit --level L1 --locale zh-CN

Canonical package name (full):

    npx --yes @tongsh6/ai-engineering-framework-init@latest new --locale zh-CN

    npx --yes @tongsh6/ai-engineering-framework-init@latest retrofit --level L0

    npx --yes @tongsh6/ai-engineering-framework-init@latest retrofit --level L0+

    npx --yes @tongsh6/ai-engineering-framework-init@latest retrofit --level L2 --force

    npx --yes @tongsh6/ai-engineering-framework-init@latest retrofit --level L3 --force

Single-directory mode:

    npx --yes @tongsh6/ai-engineering-framework-init@latest retrofit --level L1 --base-dir AIEF

Locale options:

    --locale zh-CN   (default)
    --locale en

Base directory option:

    --base-dir AIEF
    --root-agents      # also write AGENTS.md in repo root (default skips it when --base-dir is set)

Subcommands:

    new [--locale zh-CN|en] [--base-dir <path>] [--dry-run] [--force]
    retrofit --level L0|L0+|L1|L2|L3 [--locale zh-CN|en] [--base-dir <path>] [--dry-run] [--force] [--root-agents]
    doctor [--base-dir <path>]
    validate refs [--fix] [--base-dir <path>]
    migrate [assets] --to-base-dir <path> [--dry-run] [--base-dir <path>]

Notes:
- It only writes AIEF entry files (AGENTS.md + context/*). It does not modify your existing code structure.
- By default it will not overwrite existing files. Use --force to overwrite.
- Unsupported locale values fall back to zh-CN with a warning.
