# AI Engineering Framework

> 一套通用的 AI 工程化标准，让 AI 编码助手更懂你的项目。

[![Tool Agnostic](https://img.shields.io/badge/Tool-Agnostic-blue.svg)](https://github.com/anthropics/claude-code/blob/main/AGENTS.md)
[![Context Engineering](https://img.shields.io/badge/Context-Engineering-green.svg)](https://context.engineering)
[![Multi-Agent](https://img.shields.io/badge/Multi-Agent-Workflow-orange.svg)](https://www.anthropic.com/research/multi-agent-collaboration)

## 核心理念

### 问题

传统 AI 编码助手的痛点：
- **上下文缺失**：AI 看不到历史经验、业务边界、技术规范
- **知识不沉淀**：每次都从头开始，边际成本恒定
- **工具碎片化**：每个 AI 工具有不同的配置方式

### 解决方案

三大核心能力：

| 能力 | 描述 | 实现 |
|------|------|------|
| **上下文工程** | AI 自动获取完整、相关的信息 | `context/` 知识库 |
| **多 Agent 协作** | 复杂任务自动分解、阶段流转 | `workflow/` 工作流 |
| **工具无关** | 一次编写，适配所有 AI 工具 | AGENTS.md 标准 |

## 快速开始

### 安装

```bash
# 方式 1：degit（推荐）
npx degit your-org/ai-engineering-framework my-project/.ai-framework
cd my-project && mv .ai-framework/* .

# 方式 2：手动复制
git clone https://github.com/your-org/ai-engineering-framework
cp -r ai-engineering-framework/{AGENTS.md,context,workflow} your-project/
```

### 初始化项目

1. **编辑 AGENTS.md**：填入你的项目概述和核心规范
2. **填充 context/**：添加业务知识、技术文档、开发规范
3. **配置 workflow/**：根据项目需要调整工作流阶段

## 目录结构

```
<project-root>/
├── AGENTS.md                    # AI 主入口（工具无关）
│
├── context/                     # 项目知识库（上下文工程）
│   ├── INDEX.md                 # 知识库导航
│   ├── business/                # 业务知识
│   │   ├── domain-model.md      # 领域模型
│   │   └── glossary.md          # 术语表
│   ├── tech/                    # 技术知识
│   │   ├── architecture.md      # 架构设计
│   │   └── conventions/         # 开发规范
│   └── experience/              # 经验知识（复利）
│       ├── INDEX.md             # 经验索引
│       └── lessons/             # 经验文档
│
├── workflow/                    # 工作流定义（多 Agent 协作）
│   ├── INDEX.md                 # 工作流导航
│   └── phases/                  # 阶段定义
│
└── .ai-adapters/                # 工具适配层（可选）
    ├── cursor/                  # Cursor IDE
    ├── copilot/                 # GitHub Copilot
    └── opencode/                # OpenCode
```

## 核心概念

### 1. 上下文工程 (Context Engineering)

让 AI 自动获取完整信息，而非每次从头开始。

**三层上下文**：

| 层级 | 内容 | 更新频率 |
|------|------|---------|
| 业务上下文 | 领域模型、用户故事、业务规则 | 低频 |
| 技术上下文 | 架构、API、开发规范 | 中频 |
| 经验上下文 | 踩坑记录、最佳实践 | 高频 |

### 2. 多 Agent 协作 (Workflow)

复杂任务自动分解、阶段流转、知识传递。

**阶段模型**：

```
触发 → 路由 → 阶段执行 → 验证 → 下一阶段/完成
```

**内置阶段**：
- `proposal` - 提案阶段
- `design` - 设计阶段
- `implement` - 实现阶段
- `review` - 审查阶段

### 3. 经验复利 (Experience Compounding)

每次 AI 执行任务后，有价值的经验被沉淀，降低下次成本。

```
第一次做 → 建立经验索引
第二次做 → 复用经验，成本降低
第 N 次做 → 接近零成本
```

### 4. 工具无关 (Tool Agnostic)

基于 [AGENTS.md 标准](https://github.com/anthropics/claude-code/blob/main/AGENTS.md)，被主流 AI 工具支持：

- Cursor
- GitHub Copilot
- Claude Code
- Windsurf
- Aider
- OpenCode

## 工具适配

### 基础适配（自动生效）

所有支持 AGENTS.md 的工具会自动读取项目根目录的 AGENTS.md。

### 增强适配（可选）

针对特定工具的增强配置：

```bash
# Cursor
.ai-adapters/cursor/rules/project.mdc

# GitHub Copilot
.ai-adapters/copilot/instructions.md

# OpenCode (支持 delegate_task)
.ai-adapters/opencode/commands/
```

## 与 OpenSpec 集成

本框架可与 [OpenSpec](https://openspec.dev) 规范驱动开发框架配合使用：

```
<project-root>/
├── AGENTS.md           # AI 工程化入口
├── context/            # 项目知识库
├── workflow/           # 工作流定义
└── openspec/           # 规范驱动（OpenSpec）
    ├── specs/          # 功能规范
    └── changes/        # 变更提案
```

在 AGENTS.md 中引用：

```markdown
## 规范驱动

当任务涉及新功能或重大变更时，参阅 `openspec/AGENTS.md`。
```

## 最佳实践

### 1. 从真实场景出发

- 不要为了用框架而用框架
- 从高效的人的工作流程中提取模式
- 把高效流程 AI 化

### 2. 知识编码进文档

- 把经验编码成可检索的文档
- 把规范编码成明确的规则
- 把上下文编码成自动加载策略

### 3. 追求边际成本递减

- 每次任务后考虑：有什么经验可以沉淀？
- 定期整理经验索引
- 删除过时的知识

### 4. 保持简单

- 从最小配置开始
- 按需添加复杂度
- 定期清理无用配置

## 参考资源

- [AGENTS.md 标准](https://github.com/anthropics/claude-code/blob/main/AGENTS.md) - 工具无关的 AI 指南标准
- [Context Engineering](https://context.engineering) - 上下文工程方法论
- [OpenSpec](https://openspec.dev) - 规范驱动开发框架
- [认知重建：Speckit 用了三个月，我放弃了](https://zhuanlan.zhihu.com/p/1993009461451831150) - 核心思想来源

## License

MIT
