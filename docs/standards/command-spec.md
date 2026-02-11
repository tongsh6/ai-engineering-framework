# Command 规范标准

> 定义 Command（用户入口层）的标准格式、编排模式和与 Agent 的区别。

## 概述

Command 是 AIEF 三层架构中的**入口层**，代表用户可直接触发的操作。Command 负责编排 Agent 和 Skill，定义完整的工作流程。

### 定位

```
Command（入口层）→ Agent（决策层）→ Skill（执行层）
^^^^^^^^
当前规范
```

## 标准格式

每个 Command 文档应包含以下章节：

```markdown
# Command: {Name}

## 用法
# 触发方式和参数

## 工作流程
# 阶段列表（含跳过条件）

## 调用链
# 引用的 Agent 和 Skill

## 快速判断规则
# 任务分类逻辑（可选）

## 产出物
# 每个阶段的输出
```

### 必填章节

| 章节 | 必填 | 说明 |
|------|------|------|
| 用法 | 是 | 触发方式、参数、前置条件 |
| 工作流程 | 是 | 有序的阶段列表 |
| 调用链 | 是 | 引用了哪些 Agent 和 Skill |
| 快速判断规则 | 否 | 需要分类的 Command 才需要 |
| 产出物 | 是 | 每个阶段产出什么 |

## 命名约定

### 文件名

```
command-{action}.md
```

**动作选择**：

| 动作 | 适用场景 | 示例 |
|------|---------|------|
| `release` | 发布相关 | `command-release.md` |
| `review` | 审查相关 | `command-review.md` |
| `deploy` | 部署相关 | `command-deploy.md` |
| `init` | 初始化 | `command-init.md` |
| `migrate` | 迁移相关 | `command-migrate.md` |
| `diagnose` | 诊断/排查 | `command-diagnose.md` |
| `sync` | 同步相关 | `command-sync.md` |

### 目录位置

```
.ai/commands/           # 推荐位置
  command-{action}.md
```

## 三种编排模式

### 1. 顺序执行（Sequential）

所有阶段按顺序执行，不跳过。

```
阶段 1 → 阶段 2 → 阶段 3 → 完成
```

**适用**：固定流程，如初始化、部署

### 2. 条件跳过（Conditional Skip）

根据条件跳过某些阶段。

```
阶段 1 → [条件] → 阶段 2（可跳过）→ 阶段 3 → 完成
```

**适用**：大多数 Command，如发布流程（已有 changelog 则跳过生成）

**跳过条件格式**：

```markdown
### 阶段 2：生成 Changelog
- **跳过条件**：`CHANGELOG.md` 中已有当前版本的条目
- **执行**：调用 `skill-generate-changelog`
```

### 3. 分支执行（Branch）

根据判断结果走不同路径。

```
阶段 1 → [判断] ─→ 路径 A → 完成
                  └→ 路径 B → 完成
```

**适用**：需要分类的 Command，如诊断（根据错误类型走不同修复路径）

## Command vs Agent

| 维度 | Command | Agent |
|------|---------|-------|
| 触发 | 用户直接触发 | 被 Command 或其他 Agent 调用 |
| 职责 | 编排流程 | 执行决策 |
| 粒度 | 粗粒度（完整任务） | 细粒度（单一领域） |
| 状态 | 管理流程状态 | 无状态或领域状态 |
| 类比 | 控制器/路由 | 服务/处理器 |

**判定规则**：

- 用户会直接说"帮我 XX" → Command
- 是完整工作流的一部分 → Command
- 只处理某个领域的决策 → Agent
- 被多个 Command 复用 → Agent

## 完整示例

```markdown
# Command: Release

## 用法

/release [version] [--dry-run]

- version: 版本号（可选，自动推断）
- --dry-run: 预演模式，不实际执行

**前置条件**：
- 当前在 main 或 release/* 分支
- 工作区干净（无未提交的更改）

## 工作流程

### 阶段 1：版本分析
- **执行**：调用 `agent-version-analyzer`
- **输入**：最近的 commits、当前版本
- **输出**：建议的新版本号、变更类型

### 阶段 2：Changelog 生成
- **跳过条件**：CHANGELOG.md 已包含目标版本的条目
- **执行**：调用 `skill-generate-changelog`
- **输入**：commits、版本号
- **输出**：changelog 内容

### 阶段 3：版本号更新
- **执行**：调用 `skill-update-version`
- **输入**：新版本号、需要更新的文件列表
- **输出**：更新后的文件

### 阶段 4：发布确认
- **跳过条件**：--dry-run 模式
- **执行**：创建 tag、推送、创建 GitHub Release
- **输出**：发布 URL

## 调用链

Command: Release
├── Agent: Version Analyzer     # 决策：确定版本号
│   └── Skill: Parse Commit     # 解析 commit
├── Skill: Generate Changelog   # 生成 changelog
├── Skill: Update Version       # 更新版本号
└── (Git/GitHub 操作)           # 阶段 4

## 快速判断规则

| 变更类型 | 版本递增 | 依据 |
|---------|---------|------|
| BREAKING CHANGE | major | commit footer 或 `!` |
| feat | minor | commit type |
| fix, perf | patch | commit type |
| 其他 | patch | 默认 |

## 产出物

| 阶段 | 产出 | 格式 |
|------|------|------|
| 版本分析 | 版本号建议 | `{ current, next, reason }` |
| Changelog | changelog 内容 | Markdown |
| 版本更新 | 更新后的文件 | 文件路径列表 |
| 发布确认 | 发布 URL | URL |
```

## 与 AIEF 的关系

- Command 规范是 **L1 级别**（推荐采纳）的标准
- Command 与 `workflow/` 中的阶段定义互补：workflow 定义通用阶段，Command 定义具体流程
- 在使用 OpenSpec 的项目中，Command 可以引用 OpenSpec 的提案和规范
- Command 是用户与 AI 系统交互的入口点

## 参考

- [Skill 规范标准](skill-spec.md) — 执行层规范
- [Agent 规范标准](agent-spec.md) — 决策层规范
- [自动阶段路由模式](patterns/phase-router.md) — 阶段自动流转
