# 跨切面模式：上下文自动加载（Context Loading）

> 将 `context/` 的索引导航升级为基于任务类型的自动加载策略。

## 概述

上下文自动加载模式定义了 AI 在执行任务时，如何自动选择和加载相关上下文的策略。目标是**零配置**——AI 根据任务描述自动匹配需要的上下文，无需用户手动指定。

### 与现有 context/INDEX.md 的关系

```
现有 context/INDEX.md：
  提供了知识库的索引和导航
  ↓ 上下文加载模式增值
  自动匹配 → 优先级排序 → 去重 → 按需摘要
```

上下文加载模式不替代 INDEX.md，而是定义 AI 如何"使用"这个索引。

## 五层加载模型

上下文按优先级分为 5 层，AI 根据任务需要加载对应层级：

```
第 1 层：业务上下文（Business）     —— 领域模型、术语、业务规则
第 2 层：技术上下文（Technical）     —— 架构、API、开发规范
第 3 层：经验上下文（Experience）    —— 历史经验、踩坑记录
第 4 层：会话上下文（Session）       —— 当前会话中的决策和产出
第 5 层：规范上下文（Specification） —— OpenSpec 或其他规范文档
```

### 各层详解

| 层级 | 来源 | 加载时机 | 持久性 |
|------|------|---------|--------|
| 业务 | `context/business/` | 涉及领域逻辑时 | 持久 |
| 技术 | `context/tech/` | 涉及代码实现时 | 持久 |
| 经验 | `context/experience/` | 任何实现类任务 | 持久 |
| 会话 | 当前对话历史 | 始终可用 | 临时 |
| 规范 | `openspec/` 或其他 | 涉及规范定义的功能时 | 持久 |

## 加载策略

### 1. 自动匹配规则

根据任务关键词自动匹配需要加载的上下文：

| 任务关键词 | 自动加载 |
|-----------|---------|
| 领域实体名（如"订单"、"用户"） | `context/business/domain-model.md` |
| API、接口、端点 | `context/tech/api/` |
| 后端、服务、数据库 | `context/tech/conventions/backend.md` + `context/tech/architecture/` |
| 前端、UI、组件 | `context/tech/conventions/frontend.md` |
| 测试、覆盖率 | `context/tech/conventions/testing.md` |
| 任何实现类任务 | `context/experience/INDEX.md`（通过经验管理模式检索） |

### 2. 懒加载（Lazy Loading）

不预加载所有上下文，而是按需加载：

```
阶段 1（任务分析）：加载第 1 层（业务）→ 理解需求
阶段 2（方案设计）：加载第 2 层（技术）→ 确定方案
阶段 3（实现前）：加载第 3 层（经验）→ 避免踩坑
阶段 4（实现中）：使用第 4 层（会话）→ 保持一致
阶段 5（涉及规范时）：加载第 5 层（规范）→ 遵循标准
```

### 3. 优先级排序

当多个上下文被匹配时，按以下优先级排序：

```
直接相关 > 同领域 > 同层级 > 通用
```

| 优先级 | 匹配方式 | 示例 |
|--------|---------|------|
| P0 - 直接相关 | 文件名/标题包含任务关键词 | 任务提到"订单" → `domain-model.md` 中的订单模型 |
| P1 - 同领域 | 属于同一领域分组 | 任务涉及认证 → 认证领域的所有文档 |
| P2 - 同层级 | 属于同一上下文层 | 涉及 API → 整个 `context/tech/api/` |
| P3 - 通用 | 通用规范/约定 | 编码规范、测试规范 |

### 4. 去重

多个匹配规则可能命中同一个文档，加载时自动去重：

```
规则 1 命中：domain-model.md, api-guide.md
规则 2 命中：domain-model.md, backend.md
→ 实际加载：domain-model.md, api-guide.md, backend.md
```

### 5. 摘要化

当上下文总量超过 AI 处理窗口时，按优先级保留原文，低优先级内容进行摘要：

```
P0 内容 → 保留原文
P1 内容 → 保留原文
P2 内容 → 若总量超限，摘要化（保留结构 + 关键信息）
P3 内容 → 若总量超限，仅加载标题和概述
```

## 任务类型与加载策略映射

| 任务类型 | 加载的层级 | 说明 |
|----------|-----------|------|
| 新功能 | 1 + 2 + 3 + 5 | 需要完整上下文 |
| Bug 修复 | 2 + 3 | 聚焦技术和经验 |
| 重构 | 2 + 3 | 聚焦技术和经验 |
| 文档 | 1 + 2 | 需要业务和技术知识 |
| 查询 | 按需 | 根据问题内容决定 |

## 实施指南

### 最小实现

在 AGENTS.md 中已有基础版本（"上下文自动加载"章节）。升级为完整模式需要：

1. **明确匹配规则**：在 `context/INDEX.md` 中为每个文档添加关键词标签
2. **定义加载顺序**：在任务路由后，按层级顺序加载
3. **控制加载量**：设置每层的最大加载文档数

### 渐进采纳

| 级别 | 实现方式 | 适用场景 |
|------|---------|---------|
| 基础 | AGENTS.md 中的加载表 | L0-L1 项目 |
| 进阶 | 按关键词自动匹配 + 懒加载 | L2 项目 |
| 完整 | 5 层模型 + 优先级 + 摘要化 | L3 项目 |

### 配置示例

在 `context/INDEX.md` 中添加关键词标签：

```markdown
# 知识库索引

## 业务知识

| 文档 | 关键词 | 优先级 |
|------|--------|--------|
| [domain-model.md](business/domain-model.md) | 订单, 用户, 产品, order, user, product | P0 |
| [glossary.md](business/glossary.md) | 术语, 定义, glossary | P2 |

## 技术知识

| 文档 | 关键词 | 优先级 |
|------|--------|--------|
| [architecture/README.md](tech/architecture/README.md) | 架构, 模块, 分层, architecture | P1 |
| [api/README.md](tech/api/README.md) | API, 接口, endpoint, REST | P0 |
| [conventions/backend.md](tech/conventions/backend.md) | 后端, 服务, service, backend | P1 |
| [conventions/frontend.md](tech/conventions/frontend.md) | 前端, 组件, component, frontend | P1 |
| [conventions/testing.md](tech/conventions/testing.md) | 测试, test, coverage | P1 |
```

## 与其他模式的协作

- **阶段路由模式**：Phase Router 确定任务类型后，触发对应的上下文加载策略
- **经验管理模式**：经验是第 3 层上下文，通过经验管理模式的相关度算法加载

## 参考

- [context/INDEX.md](../../../context/INDEX.md) — 知识库索引
- [经验管理模式](experience-mgmt.md) — 经验层的加载策略
- [自动阶段路由模式](phase-router.md) — 触发上下文加载的路由机制
