# Existing Project Init (Retrofit)

目标：
- 不动现有代码结构
- 不要求一次性补齐文档
- 先插入口，再逐步演进

铁律：
1. 不修改现有代码结构
2. 不要求一次性补齐文档
3. 先插入口，再逐步演进

推荐最小可用（L0+）应生成：

    context/tech/REPO_SNAPSHOT.md

这是 L0+ 的关键价值：提供一份可修改的初稿，避免从空白开始。

推荐迁移路径：

L0（5 分钟）：
- 新增 AGENTS.md（可空，但要存在）
- 新增 context/INDEX.md（可空，但要存在）

L0+（再 5 分钟）：
- 生成 context/tech/REPO_SNAPSHOT.md（用 templates/retrofit/ 初稿）

可选：用脚本一键生成（仅写入 AIEF 文件，不触碰业务代码）：
- node scripts/aief-init.mjs retrofit --level L0
- node scripts/aief-init.mjs retrofit --level L0+

可选：无拷贝前置的一键运行（推荐用于推广/接入）：
- npx --yes @tongsh6/aief-init@latest retrofit --level L0
- npx --yes @tongsh6/aief-init@latest retrofit --level L0+

L1（按需，通常 1-2 小时内可完成）：
- context/business/ 一页业务说明
- context/tech/ 一页技术与架构说明

L2/L3（按需增强）：
- L2：补齐 workflow、经验模板和 Skill/Command/Agent 规范
- L3：引入跨切面模式并持续沉淀经验
- 详见：`init/MIGRATION_LEVELS.md`

完成标准：
- 人能在 1 分钟内找到入口（AGENTS.md）
- L0：AI 能在 1 分钟内定位上下文入口（context/INDEX.md）
- L0+：AI 能在 1 分钟内读到仓库快照（context/tech/REPO_SNAPSHOT.md）
