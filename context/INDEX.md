# 知识库导航

> 项目知识的入口索引，帮助 AI 快速定位相关上下文。

## 项目运行上下文

- [PROJECT_PROFILE.yaml](PROJECT_PROFILE.yaml) — 项目身份、生命周期、发布状态、责任约束和事实来源。工程决策前必须读取。
- [Project Operating Context](../docs/standards/patterns/project-operating-context.md) — 项目画像解释、工程策略推导和冲突处理规范。

## 业务知识 (business/)
| 文档 | 内容 | 适用场景 |
|---|---|---|
| domain-model.md | 核心领域模型、实体关系、业务规则 | 理解业务逻辑、实现领域代码 |
| glossary.md | 项目术语表、概念定义 | 统一术语、避免歧义 |

## 技术知识 (tech/)
| 文档 | 内容 | 适用场景 |
|---|---|---|
| architecture/README.md | 系统架构、模块边界、技术选型 | 技术决策、模块设计 |
| api/ | API 文档、接口规范 | API 开发、集成 |
| conventions/ | 开发、测试和数据库规范 | 技术实现与验证 |

## 经验知识 (experience/)
| 文档 | 内容 | 适用场景 |
|---|---|---|
| INDEX.md | 经验索引 | 检索相关经验 |
| lessons/ | 经验文档 | 深入了解问题和决策 |
| best-practices/ | 最佳实践 | 执行操作前查阅 |
| reports/ | 审计报告 | 查阅审计结果 |

## 加载优先级

1. AGENTS.md、PROJECT_PROFILE.yaml 和 Project Operating Context 规范。
2. 当前任务直接相关的业务、技术和规范文档。
3. 匹配的历史经验。
4. 其他背景知识按需加载。

项目画像不替代任务状态、仓库快照或技术文档；这些信息各自保持原有职责。
