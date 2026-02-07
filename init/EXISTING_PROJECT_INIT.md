# Existing Project Init (Retrofit)

目标：
- 不动现有代码结构
- 不要求一次性补齐文档
- 先插入口，再逐步演进

铁律：
1. 不修改现有代码结构
2. 不要求一次性补齐文档
3. 先插入口，再逐步演进

初始化必须至少生成：

    context/tech/REPO_SNAPSHOT.md

这是 Retrofit 的突破点：提供一份可修改的初稿，避免从空白开始。

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

完成标准：
- 人能在 1 分钟内找到入口（AGENTS.md）
- AI 能在 1 分钟内读到仓库快照（context/tech/REPO_SNAPSHOT.md）
