# [项目名称] AI 编程指南

> AI 编码助手的项目入口。每次会话自动加载，详细规范按需从子目录加载。

## 项目概述

**[项目名称]** 是 [项目简介，1-2 句话描述项目做什么]。

**核心价值**：[项目解决什么问题，为谁解决]

## 语言规则

<!-- 根据团队偏好调整 -->
- 交流使用中文
- 代码、命令、标识符保留英文

---

## 知识库导航

| 目录 | 用途 | 何时加载 |
|------|------|----------|
| [context/business/](context/business/) | 业务知识 | 理解业务需求、领域模型 |
| [context/tech/](context/tech/) | 技术文档 | 架构设计、API、开发规范 |
| [context/experience/](context/experience/) | 经验库 | 避免重复踩坑 |
| [workflow/](workflow/) | 工作流程 | 复杂任务的阶段指南 |

---

## 核心开发规范

### 架构约束

<!-- 根据项目实际情况填写 -->

```
[描述项目的模块/层级结构]
```

**关键规则**：
- [规则 1]
- [规则 2]
- [规则 3]

### 测试要求

<!-- 推荐使用 TDD -->

```
1. RED    → 先写失败测试
2. GREEN  → 最小实现通过
3. REFACTOR → 优化保持绿色
```

### 代码风格

<!-- 根据技术栈填写 -->

- [语言/框架 1] 规范：参阅 `context/tech/conventions/[name].md`
- [语言/框架 2] 规范：参阅 `context/tech/conventions/[name].md`

---

## 自动行为

### 任务识别与路由

AI 在接收任务时，应自动判断任务类型并执行相应流程：

| 任务类型 | 识别信号 | 流程 |
|----------|---------|------|
| **新功能** | "添加"、"实现"、"新增" | 检查提案 → 设计 → 实现 → 测试 |
| **Bug 修复** | "修复"、"解决"、"处理" | 加载经验 → 实现 → 测试 |
| **重构** | "重构"、"优化"、"改进" | 评估影响 → 设计（如需）→ 实现 |
| **查询** | "查看"、"显示"、"解释" | 直接回答 |

详细流程参阅 [workflow/INDEX.md](workflow/INDEX.md)。

### 上下文自动加载

执行任务前，AI 应根据任务类型自动加载相关上下文：

| 任务涉及 | 自动加载 |
|----------|---------|
| 领域逻辑 | `context/business/domain-model.md` |
| API 开发 | `context/tech/api/` |
| 后端代码 | `context/tech/conventions/backend.md` |
| 前端代码 | `context/tech/conventions/frontend.md` |
| 任何实现 | `context/experience/INDEX.md`（检索相关经验）|

### 经验自动检索

执行实现类任务（新功能、Bug 修复、重构）前，应：

1. 读取 `context/experience/INDEX.md`
2. 根据任务关键词匹配相关经验
3. 加载匹配的经验文档
4. 在执行前展示相关经验摘要

**示例**：
```
任务：添加用户密码重置功能
↓ 自动检索
匹配关键词：password, reset, auth
↓ 加载经验
context/experience/lessons/auth-password-reset.md
↓ 展示摘要
"注意边界情况：Token 过期处理、重复提交防护"
↓ 执行任务（避免踩坑）
```

---

## 快速命令

```bash
# [根据项目填写常用命令]

# 构建
[build command]

# 测试
[test command]

# 运行
[run command]
```

---

## 子目录指南

<!-- 如果项目有多个子模块，可以为每个子模块创建 AGENTS.md -->

- `[module-1]/AGENTS.md` - [模块 1] 专项指南
- `[module-2]/AGENTS.md` - [模块 2] 专项指南

---

## 规范驱动（可选）

<!-- 如果使用 OpenSpec 或类似的规范驱动流程 -->

当任务涉及以下内容时，需要先创建提案：
- 新功能或新能力
- 破坏性变更
- 架构调整

参阅 [openspec/AGENTS.md](openspec/AGENTS.md) 或 [workflow/phases/proposal.md](workflow/phases/proposal.md)。

---

## 工具增强（可选）

<!-- 针对特定 AI 工具的增强配置 -->

- **Cursor**：`.ai-adapters/cursor/rules/`
- **Copilot**：`.ai-adapters/copilot/instructions.md`
- **OpenCode**：`.ai-adapters/opencode/commands/`
