# ReleaseHub - 框架参考实现

> 展示如何将 AI 工程化框架应用到实际项目。

## 目录映射

| 框架目录 | ReleaseHub 实现 | 说明 |
|---------|----------------|------|
| `AGENTS.md` | `/AGENTS.md` | 已存在，需按框架格式优化 |
| `context/business/` | `/context/business/` | 已存在 |
| `context/tech/` | `/context/tech/` | 已存在 |
| `context/experience/` | `/context/experience/` | 已存在 |
| `workflow/` | `.ai/` + `openspec/` | 通过 OpenSpec 实现 |
| `.ai-adapters/` | `.cursor/` + `.github/` | 工具适配 |

## ReleaseHub 特色

### 1. 与 OpenSpec 集成

ReleaseHub 使用 OpenSpec 进行规范驱动开发，框架的 `workflow/` 阶段直接映射到 OpenSpec 流程：

| 框架阶段 | OpenSpec 对应 |
|---------|--------------|
| proposal | `openspec/changes/[id]/proposal.md` |
| design | `openspec/changes/[id]/design.md` |
| implement | `openspec/changes/[id]/tasks.md` |
| review | Code Review + `openspec validate` |

### 2. DDD 架构知识

ReleaseHub 的技术上下文包含完整的 DDD 分层架构知识：

```
context/tech/
├── architecture/
│   └── backend.md      # DDD 分层说明
├── conventions/
│   ├── backend.md      # Java + Spring Boot 规范
│   ├── frontend.md     # Vue 3 + TypeScript 规范
│   └── testing.md      # TDD 规范
```

### 3. 经验索引

ReleaseHub 的经验索引位于 `.ai/summaries/experience-index.md`，包含：
- 领域模型设计经验
- 状态机实现经验
- API 设计经验

## 迁移指南

如果要将 ReleaseHub 的 `.ai/` 目录迁移到框架标准：

### 保留的内容

| 原路径 | 新路径 | 说明 |
|-------|-------|------|
| `.ai/summaries/experience-index.md` | `context/experience/INDEX.md` | 经验索引 |
| `.ai/summaries/project-context.md` | 保留 | 会话上下文 |
| `.ai/reports/` | 保留 | AI 生成报告 |
| `.ai/proposals/` | 保留 | AI 生成方案 |

### 废弃的内容

| 原路径 | 原因 |
|-------|------|
| `.ai/agents/*.md` | 内化到 AGENTS.md 和 workflow/ |
| `.ai/skills/*.md` | 内化到 AGENTS.md |
| `.ai/commands/*.md` | 转为 workflow/phases/ 流程文档 |

### 迁移步骤

1. **备份当前 `.ai/` 目录**

2. **更新 AGENTS.md**
   - 添加「自动行为」部分
   - 添加任务路由规则
   - 添加上下文加载规则

3. **创建 workflow/ 目录**
   - 或保持使用 openspec/（推荐）

4. **更新经验索引格式**
   - 添加关键词字段
   - 统一索引结构

5. **清理废弃文件**
   - 归档 `.ai/agents/`
   - 归档 `.ai/skills/`
   - 归档 `.ai/commands/`

## 下一步

1. 验证框架在 ReleaseHub 中的效果
2. 收集使用反馈
3. 迭代框架设计
4. 准备独立仓库发布
