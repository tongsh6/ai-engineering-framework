# AI Engineering Framework

> 项目级上下文层，让 AI 编码助手真正理解你的代码库。

5 分钟把项目变成 AI 可协作模式。

[![Tool Agnostic](https://img.shields.io/badge/Tool-Agnostic-blue.svg)](https://github.com/anthropics/claude-code/blob/main/AGENTS.md)
[![npm](https://img.shields.io/npm/v/@tongsh6/aief-init)](https://www.npmjs.com/package/@tongsh6/aief-init)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[English](README.md)**

---

## 这是什么？

AI 编码助手（Cursor、Copilot、Claude Code 等）每次开启会话时，对你的业务规则、架构决策和踩过的坑一无所知。

**AI Engineering Framework** 为你的项目提供一个结构化入口 - 一个 `AGENTS.md` 文件加一个 `context/` 知识库 - 让 AI 能自动加载所需的上下文。不绑定任何工具，支持所有兼容 [AGENTS.md 标准](https://github.com/anthropics/claude-code/blob/main/AGENTS.md) 的 AI 工具。

AIEF 关注的是稳定协作上下文，而不是让模型“更聪明”。

团队选择它的原因：

- AI 会话更快，重复解释更少
- 项目规则在团队和工具之间统一
- 可渐进接入（先最小可用，再按需扩展）

## 5 分钟快速开始

### 场景 A：新项目

```bash
# 第 1 步 - 在项目根目录执行
npx --yes @tongsh6/aief-init@latest new
```

然后打开生成的 `AGENTS.md`，填写：

1. 项目一句话介绍
2. 核心约束（如：目录边界、关键规则）
3. 常用命令（`build` / `test` / `run`）

完成。开始用 AI 助手编码。

### 场景 B：已有项目（Retrofit）

```bash
# 第 1 步 - 在项目根目录执行
npx --yes @tongsh6/aief-init@latest retrofit --level L0+
```

然后检查：

1. `AGENTS.md` - 填入项目信息
2. `context/tech/REPO_SNAPSHOT.md` - 检查自动生成的仓库快照

完成。开始用 AI 助手编码。

### Before / After

```
之前:                            之后:
your-project/                    your-project/
├── src/                         ├── src/
├── package.json                 ├── package.json
└── ...                          ├── AGENTS.md            <- AI 入口
                                 ├── context/
                                 │   ├── INDEX.md         <- 知识库导航
                                 │   └── tech/
                                 │       └── REPO_SNAPSHOT.md  <- 自动生成
                                 └── ...
```

加上少量入口文件后，AI 就能理解你的项目。

> **手动安装**（离线/内网场景）：`git clone` 本仓库，然后将 `AGENTS.md` 和 `context/` 复制到你的项目。详见 [init/](init/)。

## 它解决什么问题？

每次开启新的 AI 编码会话：

- **上下文丢失** - AI 看不到你过去的决策、业务边界和编码规范
- **知识不复利** - 你反复解释同样的事情，边际成本恒定
- **工具碎片化** - 每个 AI 工具有不同的配置格式

本框架用一个工具无关的统一入口解决以上三个问题。

## 核心概念

AIEF 建立在三个长期存在的工程事实之上：

1. AI 需要稳定的项目读取入口
2. 项目需要长期上下文索引
3. 经验必须可复用、可继承

对应实现约定：

- `AGENTS.md` 作为项目级 AI 入口
- `context/` 作为长期上下文承载
- `experience/` 作为经验复利机制
- `workflow/` 作为可选协作增强

## 仓库结构与阅读顺序

你不需要第一天就使用全部文件。推荐阅读/使用顺序：

1. `AGENTS.md`
2. `context/INDEX.md`
3. `context/business/`
4. `context/tech/`
5. `context/experience/`
6. `workflow/`（可选）
7. `.ai-adapters/`（按工具启用，可选）

目录结构概览：

```
your-project/
├── AGENTS.md                    # AI 入口（工具无关）
├── context/                     # 项目知识库
│   ├── INDEX.md                 # 导航索引
│   ├── business/                # 领域模型、术语表
│   ├── tech/                    # 架构、API、开发规范
│   └── experience/              # 经验沉淀（复利）
├── workflow/                    # 多阶段工作流（可选）
└── .ai-adapters/                # 工具特定配置（可选）
```

只有 `AGENTS.md` 和 `context/INDEX.md` 是必须的。其他全部按需添加。

## 进阶使用

### 知识库（`context/`）

将项目知识组织为三层：

| 层级 | 内容 | 更新频率 |
|------|------|---------|
| **业务** | 领域模型、用户故事、业务规则 | 低频 |
| **技术** | 架构设计、API 文档、开发规范 | 中频 |
| **经验** | 踩坑记录、最佳实践、复盘 | 高频 |

AI 根据任务类型自动加载对应的上下文 - 详见 `AGENTS.md` 中的路由规则。

### 经验复利（`context/experience/`）

核心价值：每次 AI 完成任务后，有价值的经验被捕获并索引。下次遇到类似任务，AI 自动加载相关经验。

```
第一次做 -> 建立经验索引
第二次做 -> 复用经验，成本降低
第 N 次做 -> 接近零边际成本
```

### 工作流（`workflow/`，可选）

内置多阶段工作流，用于复杂任务：

```
触发 -> 路由 -> 阶段执行 -> 验证 -> 下一阶段/完成
```

内置阶段：`proposal` -> `design` -> `implement` -> `review`

你也可以使用 [OpenSpec](https://openspec.dev)、自定义方案，或完全不用。

### 工具适配（`.ai-adapters/`，可选）

所有支持 AGENTS.md 的工具开箱即用。如需工具特定增强：

| 工具 | 配置路径 |
|------|---------|
| Cursor | `.ai-adapters/cursor/rules/` |
| GitHub Copilot | `.ai-adapters/copilot/instructions.md` |
| OpenCode | `.ai-adapters/opencode/commands/` |

### OpenSpec 集成

与 [OpenSpec](https://openspec.dev) 配合使用，实现规范驱动开发：

```
your-project/
├── AGENTS.md           # AI 工程化入口
├── context/            # 知识库
└── openspec/           # 规范驱动
    ├── specs/
    └── changes/
```

## 迁移等级

已有项目可渐进式接入：

| 等级 | 耗时 | 获得 |
|------|------|------|
| **L0** | 5 分钟 | `AGENTS.md` + `context/INDEX.md`（可以是空的） |
| **L0+** | 10 分钟 | + 自动生成的 `REPO_SNAPSHOT.md` |
| **L1** | 1-2 小时 | + 一页业务文档 + 一页技术文档 |
| **L2** | 可选 | + 工作流、经验模板、CI 校验 |
| **L3** | 持续 | + 持续经验复利 |

从 L0 开始。感到需要时再升级。

只要 `AGENTS.md` 和 `context/INDEX.md` 存在，即视为 L0 接入完成。

## 回滚与安全性

AIEF 是旁路式规范，不会侵入你的业务代码结构。

如果你决定停止使用，只需删除：

- `AGENTS.md`
- `context/`

不会影响构建、运行和历史提交。

---

<details>
<summary><strong>最佳实践</strong></summary>

### 从真实场景出发
- 不要为了用框架而用框架
- 从团队中高效成员的工作流中提取模式
- 把高效流程转化为 AI 可读的上下文

### 把知识编码进文档
- 把经验编码为可检索的文档
- 把规范编码为明确的规则
- 把上下文编码为自动加载策略

### 追求边际成本递减
- 每次任务完成后，问：有什么经验可以沉淀？
- 定期整理经验索引
- 删除过时的知识

### 保持简单
- 从最小配置开始
- 按需添加复杂度
- 定期清理无用配置

</details>

<details>
<summary><strong>分支策略与贡献</strong></summary>

| 分支 | 用途 | 说明 |
|------|------|------|
| `main` | 稳定版本 | 用户默认获取 |
| `develop` | 开发分支 | 新功能集成测试 |
| `feature/*` | 功能分支 | 从 develop 创建，完成后合并回 develop |

**版本标签**：语义化版本 - `v1.0.0`, `v1.1.0` 等。

### 贡献流程

1. Fork 仓库
2. 从 `develop` 创建 feature 分支
3. 提交 PR 到 `develop`
4. 维护者定期将 `develop` 合并到 `main` 并打标签

</details>

---

## 参考资源

- [AGENTS.md 标准](https://github.com/anthropics/claude-code/blob/main/AGENTS.md) - 工具无关的 AI 指南标准
- [Context Engineering](https://context.engineering) - 上下文工程方法论
- [OpenSpec](https://openspec.dev) - 规范驱动开发框架

## License

MIT
