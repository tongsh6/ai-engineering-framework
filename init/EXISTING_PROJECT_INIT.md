# Existing Project Init (Retrofit)

目标：
- 不动现有代码结构
- 不要求一次性补齐文档
- 先插入口，再逐步演进

铁律：
1. 不修改现有代码结构
2. 不要求一次性补齐文档
3. 先插入口，再逐步演进

推荐最小可用（L0）应生成：

    context/PROJECT_PROFILE.yaml

画像应保留未知字段，不得自动猜测项目性质、生命周期、发布承诺和数据责任。若已有等价权威资料，先审计并确定唯一真源。若现有 `AGENTS.md` 已声明自定义 Profile 路径，Retrofit 会复用该路径，不会额外创建默认画像；无法自动识别时使用 `--profile-path <path>` 明确指定。

推荐 L0+ 还会生成：

    context/tech/REPO_SNAPSHOT.md

这是 L0+ 的关键价值：提供一份可修改的初稿，避免从空白开始。

推荐迁移路径：

L0（5 分钟）：
- 新增 AGENTS.md（可空，但要存在）
- 新增 context/INDEX.md（可空，但要存在）
- 新增 context/PROJECT_PROFILE.yaml（未知事实使用 unknown）

L0+（再 5 分钟）：
- 生成 context/tech/REPO_SNAPSHOT.md（用 templates/retrofit/ 初稿）

本仓库源码调试时，先运行 `npm install --prefix packages/ai-engineering-framework-init`，再使用本地脚本。普通项目接入优先使用下方 npx 命令。

可选：用脚本一键生成（仅写入 AIEF 文件，不触碰业务代码）：
- node scripts/aief-init.mjs retrofit --level L0
- node scripts/aief-init.mjs retrofit --level L0+

可选：无拷贝前置的一键运行（推荐用于推广/接入）：
- npx --yes @tongsh6/aief-init@latest retrofit --level L0
- npx --yes @tongsh6/aief-init@latest retrofit --level L0+
- npx --yes @tongsh6/aief-init@latest retrofit --level L0 --profile-path docs/engineering/project-profile.yaml

L1（按需，通常 1-2 小时内可完成）：
- context/business/ 一页业务说明
- context/tech/ 一页技术与架构说明

L2/L3（按需增强）：
- L2：补齐 workflow、经验模板和 Skill/Command/Agent 规范
- L3：引入跨切面模式并持续沉淀经验
- 详见：`init/MIGRATION_LEVELS.md`

Retrofit 不得覆盖已有 Profile、AGENTS.md、context/INDEX.md 或项目维护的 business/tech/experience 文档；仓库扫描结果只能作为候选事实，关键字段需要人工确认。

完成标准：
- 人能在 1 分钟内找到入口（AGENTS.md）
- L0：AI 能在 1 分钟内定位上下文入口（context/INDEX.md）
- L0+：AI 能在 1 分钟内读到仓库快照（context/tech/REPO_SNAPSHOT.md）
