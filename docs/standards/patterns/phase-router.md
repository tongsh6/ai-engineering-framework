# 跨切面模式：自动阶段路由（Phase Router）

> 将手动推进的工作流阶段升级为基于任务类型的自动路由。

## 概述

Phase Router 是 `workflow/` 阶段模型的**自动化实现**。传统的 workflow 需要人工判断"当前应该进入哪个阶段"，Phase Router 根据任务特征自动路由，减少人工干预。

### 与现有 workflow/ 的关系

```
现有 workflow/：
  定义了阶段（proposal → design → implement → review）
  ↓ Phase Router 增值
  自动判断任务类型 → 自动跳过不需要的阶段 → 自动传递上下文
```

Phase Router 不替代 workflow/，而是在其上增加自动化能力。

## 核心机制

### 1. 任务类型识别

Phase Router 通过关键词和上下文自动识别任务类型：

| 任务类型 | 识别信号 | 默认阶段路径 |
|----------|---------|-------------|
| **新功能** | "添加"、"实现"、"新增"、"feat" | proposal → design → implement → review |
| **Bug 修复** | "修复"、"解决"、"fix"、"bug" | implement → review |
| **重构** | "重构"、"优化"、"refactor" | design → implement → review |
| **文档** | "文档"、"说明"、"docs" | implement → review |
| **配置** | "配置"、"设置"、"config" | implement |
| **查询** | "查看"、"显示"、"解释" | （直接回答，不走阶段） |

### 2. 阶段跳过逻辑

```
输入任务 → 类型识别 → 计算阶段路径 → 依次执行阶段
                          │
                          ├── 已有提案？ → 跳过 proposal
                          ├── 改动范围小？ → 跳过 design
                          ├── 纯文档？ → 跳过 review
                          └── 全部需要？ → 完整流程
```

**跳过条件详解**：

| 阶段 | 跳过条件 | 原因 |
|------|---------|------|
| proposal | 已存在相关提案；或改动明确且范围小 | 避免重复提案 |
| design | 非架构变更；或变更影响范围 ≤ 2 个文件 | 简单改动不需要设计 |
| implement | （不可跳过） | 必须有实现 |
| review | 纯文档变更；或配置变更 | 低风险变更 |

### 3. 上下文传递

阶段间通过结构化上下文传递信息：

```typescript
interface PhaseContext {
  taskType: string;           // 任务类型
  currentPhase: string;       // 当前阶段
  completedPhases: string[];  // 已完成阶段
  skippedPhases: string[];    // 跳过的阶段
  artifacts: {                // 各阶段产出
    [phase: string]: any;
  };
  metadata: {
    startedAt: string;
    estimatedComplexity: 'low' | 'medium' | 'high';
  };
}
```

每个阶段接收前序阶段的产出，并将自己的产出追加到 `artifacts` 中。

## Phase Router Agent

Phase Router 本身是一个**编排型 Agent**：

```markdown
# Agent: Phase Router

## 角色
根据任务类型和上下文，自动判断应执行的工作流阶段并路由。

## 能力边界
**能做**：
- 识别任务类型
- 计算阶段路径（含跳过逻辑）
- 在阶段间传递上下文
- 在阶段失败时提供回退建议

**不能做**：
- 不执行具体阶段的逻辑（由对应 Agent 负责）
- 不修改阶段定义

## 触发条件
- 任何 Command 开始执行时
- 用户描述一个新任务时

## 依赖 Skills
| Skill | 用途 | 必需 |
|-------|------|------|
| （无直接 Skill 依赖） | 调用其他 Agent | - |
```

## 实施指南

### 最小实现

在 AGENTS.md 的"任务识别与路由"部分已有基础版本。升级为 Phase Router 只需：

1. **明确跳过条件**：为每个阶段定义可计算的跳过条件
2. **添加上下文传递**：在阶段间传递结构化数据（而非让 AI 从聊天上下文推断）
3. **记录路由决策**：将路由决策记录到阶段上下文，便于审计

### 渐进采纳

| 级别 | 实现方式 | 适用场景 |
|------|---------|---------|
| 基础 | AGENTS.md 中的任务路由表 | L0-L1 项目 |
| 进阶 | 独立 Phase Router Agent + 跳过条件 | L2 项目 |
| 完整 | 结构化上下文传递 + 路由日志 + 回退机制 | L3 项目 |

## 示例：Bug 修复的自动路由

```
用户输入："修复登录页面在 Safari 上的样式错位"

Phase Router 判断：
  任务类型：Bug 修复
  识别信号：包含"修复"
  默认路径：implement → review
  
  跳过检查：
    proposal → 跳过（Bug 修复不需要提案）
    design → 跳过（样式修复，影响范围 ≤ 2 文件）
    implement → 执行
    review → 执行（用户可见的 UI 变更需要审查）
  
  最终路径：implement → review
  
  上下文传递：
    artifacts.taskAnalysis = {
      type: "bugfix",
      scope: "frontend/login",
      estimatedFiles: ["src/pages/Login.css"],
      relatedExperience: ["css-safari-compatibility"]
    }
```

## 与其他模式的协作

- **经验管理模式**：Phase Router 在 implement 阶段前自动触发经验检索
- **上下文加载模式**：Phase Router 根据任务类型触发对应层的上下文加载

## 参考

- [Agent 规范标准](../agent-spec.md) — Agent 定义规范
- [Command 规范标准](../command-spec.md) — Command 编排模式
- [workflow/INDEX.md](../../workflow/INDEX.md) — 工作流阶段定义
