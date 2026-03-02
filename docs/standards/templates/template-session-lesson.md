---
title: "Template: 单条经验文档"
date: 2026-03-02
tags: [aief, template, lesson, experience]
source: conversation://2026-03-02-aief-doc-review-release
---

# Template: 单条经验文档

> 记录单个踩坑或重要学习点的标准模板。
> 适合从复盘主文档中提炼出值得单独归档的关键经验。

---

## Purpose

为单条经验提供标准化的归档格式，确保包含"如何复现"、"根本原因"、"解决方案"和"检查清单"，使后续遭遇相同问题的人能快速理解和解决。

## When to Use

- 发现了可复现的踩坑
- 某个修复步骤有通用价值
- 一个设计决策需要记录决策依据

## When NOT to Use

- 临时性问题，不会再次出现
- 仅限当前项目特殊场景，无通用价值

## Inputs

- 问题描述 + 原始错误信息
- 复现步骤
- 修复方案

## Outputs

- 填写完毕的 `context/experience/lessons/<YYYY-MM-DD>-<slug>.md`
- `context/experience/INDEX.md` 中的新条目

## Steps

1. 复制下方"文档骨架"到 `context/experience/lessons/` 目录
2. 填写所有 PLACEHOLDER
3. 更新 `context/experience/INDEX.md`

## Verification

- [ ] frontmatter 完整（title/date/tags/source）
- [ ] 复现条件具体可执行
- [ ] 检查清单可逐项验证
- [ ] 已更新 INDEX.md

## Notes

- 文件名格式：`YYYY-MM-DD-<简短英文描述>.md`
- 标题格式：`[动词] [对象] [导致结果]`，如"手动打 tag 绕过 release script 导致版本不一致"
- 必须包含证据（原始错误信息或原文引用）

---

## 文档骨架

```markdown
---
title: "<问题标题>"
date: <YYYY-MM-DD>
tags: [aief, lesson, <topic>, ...]
source: <source_id>
---

# <问题标题>

> 一句话总结：<做了什么> 导致 <什么结果>，解决方法是 <核心解法>。

## 背景

- 项目/模块：<涉及模块>
- 时间：<YYYY-MM-DD>
- 影响：<影响范围和严重程度>

## 问题

<具体问题描述>

### 症状

- <症状 1>
- <症状 2>

### 复现条件

```
<如何复现>
```

## 原因

### 技术原因

<技术层面的原因>

### 流程原因

<流程/习惯层面的原因>

## 解决方案

```bash
# 修复步骤
<命令序列>
```

### 正确做法

<应该如何操作>

## 教训

### 应该做

- <应该做 1>
- <应该做 2>

### 不应该做

- <不应该做 1>
- <不应该做 2>

### 检查清单

- [ ] <检查项 1>
- [ ] <检查项 2>
- [ ] <检查项 3>

## 相关

- <相关文档路径>
- <相关脚本路径>

---

**关键词**：`<kw1>`, `<kw2>`, `<kw3>`

**类别**：踩坑记录 / 设计决策 / 性能优化 / Bug 修复
```
