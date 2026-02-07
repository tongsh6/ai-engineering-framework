# Migration Levels

迁移等级用于 Existing Project Init（Retrofit），用于降低接入阻力。

L0（插入口，不要求内容）：
- 新增 AGENTS.md
- 新增 context/INDEX.md

L1（最小可读性）：
- 补充 context/business/ 一页核心业务说明
- 补充 context/tech/ 一页技术与架构说明

L2（可选增强）：
- 引入 workflow/（可选）
- 引入 experience 模板
- 可开启校验机制（例如：PR 检查、CI 校验）

L3（持续运行）：
- 持续沉淀经验
- 每个重要变更至少记录一条 experience

注意：
- L0 不修改现有代码结构
- L0/L1 都不要求一次性补齐历史文档
