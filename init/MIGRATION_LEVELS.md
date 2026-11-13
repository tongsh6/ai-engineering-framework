# 迁移等级说明

迁移等级用于 Existing Project Init（Retrofit），描述 AIEF 在目标项目中的接入深度，不代表目标项目自身的生命周期或成熟度。

L0（基础入口）：
- 新增 AGENTS.md
- 新增 context/INDEX.md
- 新增 context/PROJECT_PROFILE.yaml（未知事实显式使用 unknown，不让 AI 猜测）

L0+（L0 + 仓库快照）：
- 在 L0 基础上，自动生成 context/tech/REPO_SNAPSHOT.md
- 让 AI 能快速读懂仓库技术栈和目录结构
- 推荐作为已有项目的最低接入标准

L1（最小可读性）：
- 补充 context/business/ 一页核心业务说明
- 补充 context/tech/ 一页技术与架构说明

L2（可选增强）：
- 引入 workflow/（可选）
- 引入 experience 模板
- 引入 Skill/Command/Agent 标准规范（docs/standards/）
- 可开启校验机制（例如：PR 检查、CI 校验）

L3（持续运行）：
- 持续沉淀经验
- 每个重要变更至少记录一条 experience
- 引入跨切面模式（自动阶段路由、经验管理、上下文加载）

注意：
- L0 不修改现有业务代码结构
- L0/L1 都不要求一次性补齐历史文档
- Project Profile 从 L0 即可用；生命周期与 AIEF 接入等级相互独立
- Retrofit 必须保护已有项目资料和人工确认字段

推荐命令示例：
- `npx --yes @tongsh6/aief-init@latest retrofit --level L0+ --locale zh-CN`
- `npx --yes @tongsh6/aief-init@latest retrofit --level L2 --locale zh-CN --force`
- `npx --yes @tongsh6/aief-init@latest retrofit --level L3 --locale zh-CN --force`
