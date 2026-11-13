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

    new [--locale zh-CN|en] [--base-dir <path>] [--profile-path <path>] [--dry-run] [--force]
    retrofit --level L0|L0+|L1|L2|L3 [--locale zh-CN|en] [--base-dir <path>] [--profile-path <path>] [--dry-run] [--force] [--root-agents]
    doctor [--base-dir <path>] [--profile-path <path>] [--profile-only] [--json]
    validate refs [--fix] [--base-dir <path>]
    migrate [assets] --to-base-dir <path> [--dry-run] [--base-dir <path>]

Doctor defaults to `context/PROJECT_PROFILE.yaml`; use `--profile-path` for an existing project's SSOT location. The path must remain inside the project root.

## Manual Profile adoption / 手动接入画像

Projects with an established documentation layout can adopt only the Profile contract. Do not run Retrofit merely to satisfy Doctor's default scaffold checks.

Use a checked-out AIEF revision containing `--profile-only` (this does not imply an npm release). Install the canonical package dependencies in that AIEF checkout, then run from the target project's root:

```sh
node /path/to/AIEF/packages/ai-engineering-framework-init/bin/aief-init.mjs doctor \
  --profile-only --profile-path docs/engineering/project-operating-profile.yaml --json
```

- Reuses the exact same YAML parser, JSON Schema and provenance/semantic checks as full Doctor.
- Does not require or create `AGENTS.md`, `context/INDEX.md`, or any scaffold directory. Does not execute project-provided `scripts/aief.mjs`.
- Reuses an existing `Profile:` declaration when `--profile-path` is omitted. Conflicting declarations, conflicting explicit paths and out-of-root paths fail.
- Reports `scope: "profile"` and the selected `profilePath`. Full Doctor reports `scope: "project"` and retains its existing layout and delegated-reference checks.
- Missing/invalid profiles or invalid authority declarations still fail. Explicit unknowns remain warnings; a successful exit does not turn unknown facts into confirmed facts.
- This validates recorded provenance, not the authenticity of a human decision. It does not prove AGENTS loading, model behavior, product acceptance, or repository-wide CI.
- `--profile-only` is accepted only by `doctor`; it is not an option to weaken initialization, migration, or other validation commands.

已有文档 SSOT 的项目可以只接入画像契约。专项模式复用原有结构、来源权限和语义检查，但不要求默认知识树、不写文件、不执行项目脚本。JSON 明确标识 `scope=profile`，不能把专项校验通过表述为整仓 Doctor、模型行为或产品验收通过。普通 `doctor` 的既有检查不变。

Notes:
- New and retrofit create context/PROJECT_PROFILE.yaml at every adoption level, including L0.
- Retrofit reuses a custom Profile path declared by existing AGENTS.md; pass `--profile-path` when the path is maintained elsewhere or cannot be detected. It never creates a second default Profile beside a declared custom SSOT.
- Retrofit preserves existing AGENTS.md, context/INDEX.md, Profile, and existing business/technical/experience context files.
- It only writes AIEF entry/context assets. It does not modify your existing code structure.
- By default it will not overwrite existing files. Use --force to overwrite.
- Unsupported locale values fall back to zh-CN with a warning.
