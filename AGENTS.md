# [项目名称] AI 编程指南

> AI 编码助手的项目入口。每次会话自动加载，详细规范按需从子目录加载。

## 项目概述

**[项目名称]** 是 [项目简介]。
**核心价值**：[项目解决什么问题，为谁解决]

## Project Operating Context

在设计、实现、重构、数据、兼容或发布相关工作前：

1. 读取 `context/PROJECT_PROFILE.yaml`，理解项目性质、生命周期、发布状态和责任约束。
2. 遵循 `docs/standards/patterns/project-operating-context.md`；若该规范未安装，至少遵循本节规则。
3. 区分已确认事实、候选推断、未知和过期信息；不得把 unknown 当作 none。
4. 生命周期只提供默认工程策略；真实数据责任和已确认外部承诺优先。
5. 任务级调整必须说明理由和作用域，不得静默改变项目画像或绕过数据、安全及外部责任。
6. 不得自行修改人工确认字段；发现变化时提出待确认建议。

项目画像是项目级事实的唯一来源。AGENTS.md 不复制画像字段，任务状态仍由现有任务体系维护。

画像：`context/PROJECT_PROFILE.yaml`
规范：`docs/standards/patterns/project-operating-context.md`

## 语言规则

- 交流使用中文
- 代码、命令、标识符保留英文

## 知识库导航

| 目录 | 用途 | 何时加载 |
|------|------|----------|
| context/PROJECT_PROFILE.yaml | 项目身份、生命周期、责任约束 | 工程决策前 |
| context/business/ | 业务知识 | 理解业务需求、领域模型 |
| context/tech/ | 技术文档 | 架构设计、API、开发规范 |
| context/experience/ | 经验库 | 避免重复踩坑 |
| workflow/ | 工作流程 | 复杂任务的阶段指南 |
| docs/standards/ | 规范标准 | 按任务需要加载 |

## 核心开发规范

- 工程投入应与真实需求、已知风险和已确认演进相匹配。
- 不为未经确认的未来可能性提前建设复杂抽象。
- 不因项目早期而忽略核心正确性、数据保护和外部承诺。
- 详细技术规范按需从 context/tech/ 加载。

## 自动行为

先使用 Project Operating Context 确定项目级默认策略和责任约束，再由现有 Phase Router 根据任务类型选择工作阶段。二者职责不同，不得合并。

详细流程参阅 workflow/INDEX.md 和 docs/standards/patterns/context-loading.md。

## 快速命令

根据项目实际情况填写 build、test、run 命令。
