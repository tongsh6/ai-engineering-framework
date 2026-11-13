# 跨切面模式：上下文自动加载（Context Loading）

> 根据项目事实和任务类型加载必要上下文，避免遗漏关键责任，也避免无关上下文膨胀。

## 基础上下文（工程任务必须）

1. 项目根目录 AGENTS.md。
2. context/PROJECT_PROFILE.yaml。
3. docs/standards/patterns/project-operating-context.md（若项目已安装）。
4. 当前任务入口和任务文件。

项目画像用于理解项目身份、生命周期、发布状态和责任约束。它不替代任务状态、仓库快照或技术架构文档。

## 任务相关上下文（按需懒加载）

| 任务涉及 | 加载内容 |
|---|---|
| 领域逻辑 | context/business/domain-model.md、相关业务文档 |
| API 开发 | context/tech/api/ |
| 后端实现 | context/tech/conventions/backend.md、相关架构文档 |
| 前端实现 | context/tech/conventions/frontend.md |
| 数据库变更 | context/tech/conventions/database.md、数据责任与兼容约束 |
| 测试 | context/tech/conventions/testing.md |
| 任何实现类任务 | context/experience/INDEX.md，并检索相关经验 |
| 规范驱动任务 | OpenSpec 或项目实际采用的规范 |

## 项目画像的使用

- 设计、实现、重构、数据、兼容和发布任务必须使用 Profile 中相关事实。
- 简单查询可按需加载，但不得忽略已经明确出现在会话中的关键责任。
- unknown、proposed、stale 不得当作已确认事实。
- 项目画像与代码或其他证据冲突时，报告差异，不静默覆盖。
- 生命周期只提供默认策略；数据责任和外部承诺按 Project Operating Context 规范处理。

## 任务类型与加载策略

| 任务类型 | 加载策略 |
|---|---|
| 新功能 | 项目画像 + 业务 + 技术 + 经验 + 相关规范 |
| Bug 修复 | 项目画像 + 技术 + 经验 |
| 重构 | 项目画像 + 架构 + 技术 + 经验 |
| 数据迁移 | 项目画像 + 数据责任 + 数据库规范 + 相关架构 |
| 发布 | 项目画像 + 发布责任 + 部署/回滚规范 |
| 文档 | 项目画像（涉及产品/承诺时）+ 相关业务或技术知识 |
| 查询 | 按问题需要加载 |

## 与现有机制的关系

- Phase Router 仍负责根据任务类型选择 proposal、design、implement、review 等工作阶段。
- Project Operating Context 负责确定项目默认工程策略与责任约束。
- Experience Management 仍负责经验索引和检索。
- 本模式只定义加载顺序，不创建新的上下文存储或任务状态系统。
