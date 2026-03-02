# Initialization

这组文档用于解决 AIEF 的初始化入口问题，目标是降低第一次接入成本。

强制区分两条路径：
- New Project Init：新项目从 0 开始
- Existing Project Init（Retrofit）：已有项目渐进接入

入口：
- 新项目：init/NEW_PROJECT_INIT.md
- 已有项目：init/EXISTING_PROJECT_INIT.md
- 迁移等级：init/MIGRATION_LEVELS.md
- Repo 快照：init/RETROFIT_REPO_SNAPSHOT.md

最小可复制模板：
- templates/minimal/（只包含 AGENTS.md 与 context/INDEX.md 及空目录占位）
- templates/retrofit/（包含 REPO_SNAPSHOT.md 初稿模板）

推荐接入方式（无拷贝前置）：
- New Project: npx --yes @tongsh6/aief-init@latest new
- Existing Project (Retrofit): npx --yes @tongsh6/aief-init@latest retrofit --level L0+

说明：
- @tongsh6/aief-init 是短命令别名包
- 官方全名包：@tongsh6/ai-engineering-framework-init

引用一致性校验（迁移目录后推荐执行）：
- `node scripts/aief.mjs validate refs`
- `node scripts/aief.mjs validate refs --fix`
- `node scripts/aief.mjs verify`

一键迁移（收敛到单目录）：
- 预览：`node scripts/aief.mjs migrate --to-base-dir AIEF --dry-run`
- 执行：`node scripts/aief.mjs migrate --to-base-dir AIEF`
