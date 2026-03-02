# 经验索引

> 项目经验的可检索索引。AI 执行任务前应检索此索引，加载相关经验，避免重复踩坑。

## 使用说明

### AI 检索流程

```
1. 提取任务关键词
2. 匹配下方索引的「关键词」字段
3. 加载相关经验文档
4. 在执行任务前展示经验摘要
```

### 索引格式

每条经验包含：
- **标题**：经验的简短描述
- **类别**：问题类型（Bug 修复、性能优化、设计决策、踩坑记录、复盘报告）
- **关键词**：用于检索匹配
- **摘要**：经验的核心要点
- **文档**：详细经验文档路径

---

## 经验列表

<!-- 按时间倒序排列，最新的在前 -->

### AIEF 文档交叉审核与 v1.5.1 发版复盘

- **类别**：复盘报告
- **日期**：2026-03-02
- **关键词**：`retro`, `doc-review`, `gitflow`, `release`, `language-drift`, `version-mismatch`, `ci`
- **摘要**：完成 AIEF 文档交叉审核（8 处修复）并发布 v1.5.1。记录语言漂移、手动打 tag 绕过 release script 两大失误，以及发版 SOP、复盘 Skill 等沉淀资产。
- **文档**：`lessons/retro-20260302-aief-doc-review-release.md`

### 手动打 tag 绕过 release script 导致版本不一致

- **类别**：踩坑记录
- **日期**：2026-03-02
- **关键词**：`release`, `tag`, `version`, `package.json`, `CI`, `GitFlow`, `npm publish`
- **摘要**：发版时跳过 `scripts/release.mjs`，直接使用 `git tag`，导致 package.json 版本未同步，CI 版本校验失败，需手动删 tag 重来。
- **文档**：`lessons/2026-03-02-release-script-bypass.md`

---

## 按类别索引

### 复盘报告

| 经验 | 关键词 | 摘要 |
|------|--------|------|
| [AIEF 文档审核与 v1.5.1 发版复盘](lessons/retro-20260302-aief-doc-review-release.md) | `retro`, `release`, `gitflow` | 语言漂移 + 手动 tag 两大失误，沉淀发版 SOP + Retrospective Curator Skill |

### 踩坑记录

| 经验 | 关键词 | 摘要 |
|------|--------|------|
| [手动打 tag 绕过 release script](lessons/2026-03-02-release-script-bypass.md) | `release`, `tag`, `version`, `CI` | 发版必须用 release script，手动 tag 会跳过版本号同步 |

### Bug 修复

| 经验 | 关键词 | 摘要 |
|------|--------|------|
| （暂无）| - | - |

### 设计决策

| 经验 | 关键词 | 摘要 |
|------|--------|------|
| （暂无）| - | - |

---

## 按领域索引

### 发版与 CI

- [手动打 tag 绕过 release script](lessons/2026-03-02-release-script-bypass.md) - 关键词：`release`, `tag`, `CI`
- [AIEF 文档审核与 v1.5.1 发版复盘](lessons/retro-20260302-aief-doc-review-release.md) - 关键词：`retro`, `gitflow`, `release`

### AI 会话管理

- [AIEF 文档审核与 v1.5.1 发版复盘](lessons/retro-20260302-aief-doc-review-release.md) - 关键词：`language-drift`, `skill-loading`

---

## 审计报告

> 项目/模块审计分析报告，使用 `reports/_template.md` 模板。

| 报告 | 日期 | 范围 | 摘要 |
|------|------|------|------|
| [文档一致性审计](reports/2026-03-02-docs-cross-review.md) | 2026-03-02 | 全量文档 | 修复 8 处一致性/可读性/友好性问题，发布 v1.5.1 |

---

## 新增经验

当发现有价值的经验时，按以下步骤添加：

1. 运行 `bash scripts/retro/retro.sh --date YYYY-MM-DD --topic <topic>` 生成骨架
2. 填充各文档的实际内容
3. 在本索引文件"经验列表"顶部添加新条目
4. 确保包含足够的关键词以便检索

或手动在 `lessons/` 目录创建文档，参考 `lessons/_template.md` 模板。
