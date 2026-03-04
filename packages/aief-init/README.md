# aief-init

This is the short alias package for:

    @tongsh6/ai-engineering-framework-init

Since v1.8.0, this package is a thin wrapper that delegates all CLI logic to the canonical package above.

Recommended usage:

    npx --yes @tongsh6/aief-init@latest new --locale zh-CN

    npx --yes @tongsh6/aief-init@latest retrofit --level L0

    npx --yes @tongsh6/aief-init@latest retrofit --level L0+

Single-directory mode:

    npx --yes @tongsh6/aief-init@latest retrofit --level L1 --base-dir AIEF

Locale options:

    --locale zh-CN   (default)
    --locale en

Base directory option:

    --base-dir AIEF
    --root-agents      # also write AGENTS.md in repo root (default skips it when --base-dir is set)

Additional commands:

    npx --yes @tongsh6/aief-init@latest validate refs [--fix]
    npx --yes @tongsh6/aief-init@latest migrate --to-base-dir AIEF [--dry-run]

Notes:
- Use `--force` when upgrading to `retrofit --level L2` or `L3` if files already exist.
- Unsupported locale values fall back to `zh-CN` with a warning.
