# Agent 规范标准

> 定义 Agent（决策层角色）的标准格式、分类方式和依赖声明规范。

## 概述

Agent 是 AIEF 三层架构中的**决策层**，代表一个具有领域知识的决策角色。Agent 根据上下文做出判断，调用 Skill 执行具体任务。

### 定位

```
Command（入口层）→ Agent（决策层）→ Skill（执行层）
                   ^^^^^^^
                   当前规范
```

## 标准格式

每个 Agent 文档应包含以下章节：

```markdown
# Agent: {Name}

## 角色
# 职责描述（一句话）

## 能力边界
# 能做什么 / 不能做什么

## 触发条件
# 何时被激活

## 工作流程
# 执行步骤（可选，复杂 Agent 需要）

## 依赖 Skills
# 显式声明使用的 Skill
```

### 必填章节

| 章节 | 必填 | 说明 |
|------|------|------|
| 角色 | 是 | 一句话职责描述 |
| 能力边界 | 是 | 明确能做和不能做的事 |
| 触发条件 | 是 | 被谁、在什么条件下调用 |
| 工作流程 | 否 | 复杂 Agent 需要，简单的可省略 |
| 依赖 Skills | 是 | 显式列出所有依赖的 Skill |

## 命名约定

### 文件名

```
agent-{domain}.md
```

**领域选择**：

| 领域 | 适用场景 | 示例 |
|------|---------|------|
| `version-analyzer` | 版本决策 | `agent-version-analyzer.md` |
| `code-reviewer` | 代码审查 | `agent-code-reviewer.md` |
| `phase-router` | 阶段路由 | `agent-phase-router.md` |
| `experience-curator` | 经验管理 | `agent-experience-curator.md` |
| `test-strategist` | 测试策略 | `agent-test-strategist.md` |
| `security-auditor` | 安全审计 | `agent-security-auditor.md` |

### 目录位置

```
.ai/agents/             # 推荐位置
  agent-{domain}.md
```

## Agent 分类

### 编排型 Agent（Orchestrator）

负责协调其他 Agent 或管理流程，自身不直接执行业务逻辑。

**特征**：
- 调用其他 Agent
- 管理流程状态
- 做路由/分发决策

**示例**：Phase Router Agent、Release Coordinator Agent

### 执行型 Agent（Executor）

负责特定领域的决策和执行，直接调用 Skill 完成任务。

**特征**：
- 直接调用 Skill
- 领域知识密集
- 输出明确的决策结果

**示例**：Version Analyzer Agent、Code Reviewer Agent

### 分类对照

| 维度 | 编排型 | 执行型 |
|------|--------|--------|
| 调用对象 | 其他 Agent | Skill |
| 决策类型 | 流程决策（做什么） | 领域决策（怎么做） |
| 复用性 | 低（流程特定） | 高（领域通用） |
| 数量 | 少（1-2 个） | 多（按领域划分） |

## 依赖声明规范

每个 Agent 必须显式声明依赖的 Skill，格式如下：

```markdown
## 依赖 Skills

| Skill | 用途 | 必需 |
|-------|------|------|
| `skill-parse-commit` | 解析 commit message | 是 |
| `skill-calculate-version` | 计算版本号 | 是 |
| `skill-validate-schema` | 验证配置格式 | 否 |
```

### 依赖规则

1. **只依赖 Skill，不直接依赖其他执行型 Agent**（编排型除外）
2. **循环依赖禁止**：A → B → A 不允许
3. **可选依赖标注**：非必需的 Skill 标记为可选
4. **版本兼容**：标注依赖 Skill 的最低版本（如有）

## 三层关系

```
Command ──调用──→ Agent ──调用──→ Skill
  │                 │                │
  │ 编排流程         │ 做决策          │ 执行任务
  │ 管理状态         │ 调用 Skill      │ 无状态
  │ 面向用户         │ 面向领域         │ 面向数据
```

### 层级间通信

| 方向 | 传递内容 | 格式 |
|------|---------|------|
| Command → Agent | 任务上下文 | 结构化参数 |
| Agent → Skill | 明确输入 | Skill 定义的 Input 接口 |
| Skill → Agent | 执行结果 | Skill 定义的 Output 接口 |
| Agent → Command | 决策结果 | 结构化返回 |

## 完整示例

```markdown
# Agent: Version Analyzer

## 角色

分析 Git commit 历史，决策下一个语义化版本号。

## 能力边界

**能做**：
- 解析 commit 历史，识别变更类型
- 根据 Semantic Versioning 规则推断版本号
- 识别 BREAKING CHANGE
- 处理预发布版本（alpha, beta, rc）

**不能做**：
- 不修改任何文件（由 skill-update-version 负责）
- 不生成 changelog（由 skill-generate-changelog 负责）
- 不处理 Git 操作（tag, push 等）

## 触发条件

- 被 `command-release` 在"版本分析"阶段调用
- 被 `command-diagnose` 在"版本检查"阶段调用

## 工作流程

1. 获取上次 release tag 到当前的所有 commits
2. 对每个 commit 调用 `skill-parse-commit` 解析
3. 统计变更类型分布
4. 调用 `skill-calculate-version` 得到新版本号
5. 返回版本建议和变更摘要

## 依赖 Skills

| Skill | 用途 | 必需 |
|-------|------|------|
| `skill-parse-commit` | 解析 commit message | 是 |
| `skill-calculate-version` | 根据变更类型计算版本 | 是 |
```

## 与 AIEF 的关系

- Agent 规范是 **L1 级别**（推荐采纳）的标准
- 在简单项目中，Agent 的职责可以内联在 AGENTS.md 的任务路由规则中
- 进入 L2 阶段后，独立的 Agent 定义能支持多 Agent 协作
- Agent 可以被多个 Command 复用，实现能力共享
- 编排型 Agent（如 Phase Router）与 `workflow/` 配合，实现自动化流程

## 参考

- [Skill 规范标准](skill-spec.md) — 执行层规范
- [Command 规范标准](command-spec.md) — 入口层规范
- [自动阶段路由模式](patterns/phase-router.md) — 编排型 Agent 的典型实例
