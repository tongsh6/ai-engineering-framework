# Skill 规范标准

> 定义 Skill（执行层原子单元）的标准格式、命名约定和设计原则。

## 概述

Skill 是 AIEF 三层架构中的**执行层**，代表一个原子化的、可复用的能力单元。Skill 不做决策，只执行明确定义的任务。

### 定位

```
Command（入口层）→ Agent（决策层）→ Skill（执行层）
                                      ^^^^^^^^
                                      当前规范
```

## 标准格式

每个 Skill 文档应包含以下章节：

```markdown
# Skill: {Name}

## 功能
# 单一职责描述（一句话）

## 输入
# TypeScript 接口定义

## 输出
# TypeScript 接口定义

## 执行策略
# 具体算法/规则（可选，复杂 Skill 需要）

## 示例
# 完整 Input → Output 示例

## 边界约束
# 不做什么（可选，明确边界）
```

### 必填章节

| 章节 | 必填 | 说明 |
|------|------|------|
| 功能 | 是 | 一句话描述，必须是单一职责 |
| 输入 | 是 | TypeScript 接口，明确每个字段 |
| 输出 | 是 | TypeScript 接口，明确每个字段 |
| 执行策略 | 否 | 复杂逻辑时需要，简单 CRUD 可省略 |
| 示例 | 是 | 至少一个完整的 Input → Output |
| 边界约束 | 否 | 有歧义时明确"不做什么" |

## 命名约定

### 文件名

```
skill-{verb}-{noun}.md
```

**动词选择**：

| 动词 | 适用场景 | 示例 |
|------|---------|------|
| `generate` | 从输入生成新内容 | `skill-generate-changelog.md` |
| `validate` | 检查输入是否合规 | `skill-validate-schema.md` |
| `parse` | 从原始数据提取结构 | `skill-parse-commit.md` |
| `format` | 转换输出格式 | `skill-format-markdown.md` |
| `calculate` | 计算/推导结果 | `skill-calculate-version.md` |
| `extract` | 从复杂结构中提取子集 | `skill-extract-breaking-changes.md` |
| `merge` | 合并多个输入 | `skill-merge-configs.md` |
| `resolve` | 解决冲突/歧义 | `skill-resolve-conflicts.md` |

### 目录位置

```
.ai/skills/           # 推荐位置
  skill-{verb}-{noun}.md
```

## 设计原则

### 1. 原子化（Atomic）

每个 Skill 只做一件事。如果描述中包含"和"、"并且"，应拆分。

```
❌ "解析 commit 并生成 changelog"
✅ "解析 commit message 为结构化数据" (skill-parse-commit)
✅ "从结构化 commit 生成 changelog" (skill-generate-changelog)
```

### 2. 无状态（Stateless）

Skill 不依赖外部状态，不产生副作用。相同输入永远产生相同输出。

```
❌ 读取数据库、调用 API、修改文件
✅ 接收数据，返回结果
```

### 3. 可复用（Reusable）

Skill 不绑定特定 Command 或 Agent，可被任意上层调用。

### 4. 明确 I/O（Explicit I/O）

输入和输出使用 TypeScript 接口明确定义，不使用 `any` 或隐含约定。

## 判定规则

### 这是 Skill 吗？

| 问题 | 是 Skill | 不是 Skill |
|------|---------|-----------|
| 需要判断接下来做什么？ | - | Agent |
| 有多个步骤需要编排？ | - | Command |
| 可以用一个函数签名描述？ | Skill | - |
| 输入输出明确？ | Skill | - |
| 需要访问外部系统？ | - | 需要包装 |

### Skill vs Agent 区别

| 维度 | Skill | Agent |
|------|-------|-------|
| 决策 | 不做决策 | 做决策 |
| 输入 | 明确定义 | 可能模糊 |
| 输出 | 确定性 | 可能变化 |
| 复用 | 高复用 | 领域绑定 |
| 类比 | 纯函数 | 有状态服务 |

## 完整示例

```markdown
# Skill: Parse Commit

## 功能

将 Git commit message 解析为结构化数据（遵循 Conventional Commits）。

## 输入

interface ParseCommitInput {
  rawMessage: string;       // 原始 commit message
  includeBody?: boolean;    // 是否包含 body，默认 true
  includeFooter?: boolean;  // 是否包含 footer，默认 true
}

## 输出

interface ParseCommitOutput {
  type: string;             // feat, fix, chore, etc.
  scope?: string;           // 可选的作用域
  subject: string;          // 简短描述
  body?: string;            // 详细描述
  footer?: string;          // 脚注（BREAKING CHANGE 等）
  isBreaking: boolean;      // 是否为破坏性变更
}

## 执行策略

1. 按 Conventional Commits 规范解析第一行：`type(scope): subject`
2. 空行后为 body
3. 最后一段以 `token: value` 格式的为 footer
4. 包含 `BREAKING CHANGE:` 或 `type!:` 时，isBreaking = true
5. 无法解析时，type = "other"，subject = 完整 message

## 示例

Input:
  rawMessage: "feat(auth): add OAuth2 login\n\nSupport Google and GitHub providers.\n\nBREAKING CHANGE: removed legacy login endpoint"

Output:
  type: "feat"
  scope: "auth"
  subject: "add OAuth2 login"
  body: "Support Google and GitHub providers."
  footer: "BREAKING CHANGE: removed legacy login endpoint"
  isBreaking: true

## 边界约束

- 不验证 type 是否在允许列表中（由 validate-commit skill 负责）
- 不处理多行 footer（只取最后一段）
- 不处理 merge commit 的特殊格式
```

## 与 AIEF 的关系

- Skill 规范是 **L1 级别**（推荐采纳）的标准
- 项目在 L0/L1 阶段可以不定义 Skill，直接在 AGENTS.md 中描述能力
- 进入 L2 阶段（多 Agent 协作）后，标准化 Skill 定义能显著提升复用性
- Skill 被 Agent 调用，Agent 被 Command 编排

## 参考

- [Conventional Commits](https://www.conventionalcommits.org/) — commit 解析的事实标准
- [Agent 规范标准](agent-spec.md) — 决策层规范
- [Command 规范标准](command-spec.md) — 入口层规范
