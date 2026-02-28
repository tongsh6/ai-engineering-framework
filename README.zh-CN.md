# AI Engineering Framework (AIEF)

> 项目级上下文层，让 AI 编码助手真正理解你的代码库。

5 分钟把项目变成 AI 可协作模式。

[![Tool Agnostic](https://img.shields.io/badge/Tool-Agnostic-blue.svg)](https://github.com/anthropics/claude-code/blob/main/AGENTS.md)
[![npm](https://img.shields.io/npm/v/@tongsh6/aief-init)](https://www.npmjs.com/package/@tongsh6/aief-init)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[English](README.md)**

---

## 这是什么？

AI 编码助手（Cursor、Copilot、Claude Code 等）可以读取代码文件，但通常缺少稳定的项目上下文：业务边界、架构决策和团队踩坑经验。

**AIEF** 为你的项目提供一个结构化入口 - 一个 `AGENTS.md` 文件加一个 `context/` 知识库 - 让 AI 稳定、持续地加载正确上下文。

`AGENTS.md` 是跨工具约定（有的工具原生读取，有的工具需要明确指定入口），不绑定单一厂商。

多数情况下你不需要适配层。如果你的工具默认不会读取 `AGENTS.md`，可以启用适配层（见 `.ai-adapters/`），或明确要求从 `AGENTS.md` 作为入口开始。

AIEF 关注的是稳定协作上下文，而不是让模型“更聪明”。

团队选择它的原因：

- AI 会话更快，重复解释更少
- 项目规则在团队和工具之间统一
- 可渐进接入（先最小可用，再按需扩展）

## 它解决什么问题？

在多数团队的日常 AI 开发里，常见问题是：

- **规则分散** - prompt 与约定散落在个人习惯里
- **上下文反复解释** - 每次任务都从部分理解重新开始
- **知识不复利** - 决策与踩坑无法沉淀为团队资产
- **新人接入脆弱** - 新成员无法复用既有 AI 协作模式

本框架通过一个稳定的项目级入口解决这些问题。

## 5 分钟快速开始

二选一即可。两条路径都不改你的业务代码结构。

Retrofit 等级速记：

- `L0`：仅生成最小入口文件
- `L0+`：`L0` + 自动生成仓库快照

### 场景 A：新项目

```bash
# 第 1 步 - 在项目根目录执行
npx --yes @tongsh6/aief-init@latest new --locale zh-CN
```

这会生成 `AGENTS.md` 和 `context/INDEX.md`。

第 2 步 - 打开生成的 `AGENTS.md` 模板，填写：

1. 项目一句话介绍
2. 核心约束（如：目录边界、关键规则）
3. 常用命令（`build` / `test` / `run`）

允许很粗：短 bullet 就足够完成 L0。

第 3 步 - 30 秒验证：

- 项目根目录存在 `AGENTS.md`
- 存在 `context/INDEX.md`

可选：验证工具行为：

- 让你的 AI 工具执行："把 `AGENTS.md` 里的关键约束列成 3 条 bullet"，并检查是否与原文一致。

完成。开始从这个固定入口发起 AI 协作。

### 场景 B：已有项目（Retrofit）

```bash
# 第 1 步 - 在项目根目录执行
# L0+ 不改业务代码，同时生成仓库快照
npx --yes @tongsh6/aief-init@latest retrofit --level L1 --locale zh-CN
```

这会生成 `AGENTS.md`、`context/INDEX.md` 以及 `context/tech/REPO_SNAPSHOT.md`。

第 2 步 - 检查生成文件：

1. `AGENTS.md` - 填入项目信息
2. `context/tech/REPO_SNAPSHOT.md` - 检查自动识别的技术栈、目录结构与 CI 配置线索（GitHub Actions、scripts、Makefile 等）

第 3 步 - 30 秒验证：

- 项目根目录存在 `AGENTS.md`
- 存在 `context/INDEX.md`
- `L0+` 场景下存在 `context/tech/REPO_SNAPSHOT.md`

可选：验证工具行为：

- 让你的 AI 工具执行："把 `AGENTS.md` 里的关键约束列成 3 条 bullet"，并检查是否与原文一致。

完成。开始从这个固定入口发起 AI 协作。

### 本地化支持（`--locale`）

`aief-init` 支持按语言生成模板：

```bash
# 中文模板（默认）
npx --yes @tongsh6/aief-init@latest new --locale zh-CN

# 英文模板
npx --yes @tongsh6/aief-init@latest retrofit --level L1 --locale en
```

说明：
- 支持的 locale：`zh-CN`、`en`
- 默认 locale：`zh-CN`
- 不支持的 locale 会自动回退到 `zh-CN` 并输出 warning
- `L1` 会输出本地化模板到 `context/`、`workflow/`、`docs/standards/`、`templates/`

### 单目录模式（`--base-dir`）

可将 AIEF 资产直接生成到单一目录：

```bash
# 将 AIEF 资产集中生成到 AIEF/
npx --yes @tongsh6/aief-init@latest retrofit --level L1 --base-dir AIEF
```

指定 `--base-dir AIEF` 后，资产会生成到：
- `AIEF/context/`
- `AIEF/workflow/`
- `AIEF/docs/standards/`
- `AIEF/templates/`
- `AIEF/scripts/`

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
                                 │       └── REPO_SNAPSHOT.md  <- 自动生成（仅 retrofit `L0+`）
                                 └── ...
```

增加少量入口文件后，AI 就有了稳定、可复用的项目读取路径。

> **手动安装**（离线/内网场景）：`git clone` AIEF 仓库，然后将 `AGENTS.md` 和 `context/` 复制到你的项目。详见 [init/](init/)。

<details>
<summary><strong>包名说明</strong></summary>

- 短命令别名包：`@tongsh6/aief-init`
- canonical 包名：`@tongsh6/ai-engineering-framework-init`

</details>

## 核心概念

AIEF 建立在三个长期存在的工程事实之上：

1. AI 需要稳定的项目读取入口
2. 项目需要长期上下文索引
3. 经验必须可复用、可继承

对应实现约定：

- `AGENTS.md` 作为项目级 AI 入口
- `context/` 作为长期上下文承载
- `context/experience/` 作为经验复利机制
- `workflow/` 作为可选协作增强

## 仓库结构与阅读顺序

你不需要第一天就使用全部文件。推荐阅读/使用顺序：

1. `AGENTS.md`
2. `context/INDEX.md`
3. `context/business/`
4. `context/tech/`
5. `context/experience/`
6. `workflow/`（可选）
7. `docs/standards/`（L1/L2 标准规范，可选）
8. `.ai-adapters/`（按工具启用，可选）

精简目录概览：

```
your-project/
├── AGENTS.md                    # AI 入口（工具无关）
├── context/                     # 项目知识库
│   ├── INDEX.md                 # 导航索引
│   ├── business/                # 领域模型、术语表
│   ├── tech/                    # 架构、API、开发规范
│   └── experience/              # 经验沉淀（复利）
├── workflow/                    # 多阶段工作流（可选）
├── docs/standards/              # Skill/Command/Agent 规范与模式（可选）
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
| **L2** | 可选 | + 工作流、经验模板、Skill/Command/Agent 标准规范 |
| **L3** | 持续 | + 持续经验复利、跨切面模式（自动路由/经验管理/上下文加载） |

从 L0 开始。感到需要时再升级。

只要 `AGENTS.md` 和 `context/INDEX.md` 存在，即视为 L0 接入完成。

## 引用校验

当目录迁移（例如迁移到 `AIEF/`）后，可用以下命令校验并修复引用：

```bash
# 仅校验
node scripts/aief.mjs validate refs

# 校验并自动修复可确定场景
node scripts/aief.mjs validate refs --fix

# 统一校验入口（包含 refs 校验）
node scripts/aief.mjs verify
```

校验覆盖：
- Markdown 中的 AIEF 路径引用
- `package.json` scripts 内的 AIEF 路径
- AIEF 脚本中的 `templatePath(...)` 常量
- `context/experience/INDEX.md` 的链接完整性

## 资产迁移

将 AIEF 资产集中迁移到单一目录，并自动修复引用：

```bash
# 仅预览迁移计划
node scripts/aief.mjs migrate --to-base-dir AIEF --dry-run

# 执行迁移 + 自动修复引用 + 自动校验
node scripts/aief.mjs migrate --to-base-dir AIEF
```

行为说明：
- 迁移 `context/`、`workflow/`、`docs/`、`templates/` 以及 `scripts/` 下 AIEF 相关脚本
- 迁移后自动执行引用修复
- 自动执行 `aief verify` 并输出迁移摘要
- 命令幂等，可重复执行

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
- [认知重建：Speckit 用了三个月，我放弃了](https://zhuanlan.zhihu.com/p/1993009461451831150) - 核心思想来源，从工具思维到工程思维的转变历程

## License

MIT
