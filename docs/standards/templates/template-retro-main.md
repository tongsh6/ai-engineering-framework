---
title: "Template: 复盘主文档"
date: 2026-03-02
tags: [aief, template, retro, retrospective]
source: conversation://2026-03-02-aief-doc-review-release
---

# Template: 复盘主文档

> 可直接复制使用的会话复盘主文档模板，涵盖 8 个必填节。
> 使用 `scripts/retro/retro.sh` 自动生成骨架后，人工填充内容。

---

## Purpose

提供标准化的复盘主文档结构，确保每次复盘覆盖问题、经验、改进点、资产分类、GitFlow 产物五大维度。

## When to Use

- 执行完整会话复盘时（参见 `docs/standards/skills/skill-retrospective-curator.md`）
- 里程碑发版、功能完成、重大修复后

## When NOT to Use

- 日常小修改或单轮对话
- 已有标准化 SOP 覆盖的重复操作

## Inputs

- 会话全文或复盘笔记
- date、topic、source_id

## Outputs

- 填写完毕的 `context/experience/lessons/retro-<YYYYMMDD>-<topic>.md`

## Steps

1. 复制下方"文档骨架"
2. 替换 `<PLACEHOLDER>` 为实际内容
3. 每个必填节至少填写要求数量的条目

## Verification

- [ ] 8 个必填节全部存在
- [ ] 问题节 >= 5 条，每条有会话证据
- [ ] 经验节 >= 5 条，格式为可复用规则
- [ ] 改进点节 >= 5 条，可操作
- [ ] Best practice 节 >= 7 条

## Notes

- 问题节必须引用会话原句，不得凭记忆改写
- 资产文件（skill/template/checklist/bp）应在本文档中列出引用路径

---

## 文档骨架

```markdown
---
title: "复盘：<主题描述>"
date: <YYYY-MM-DD>
tags: [aief, retro, <topic>, ...]
source: conversation://<source_id>
---

# 复盘：<主题描述>

> 一句话总结本次会话的主要工作和关键结果。

---

## 一、本次会话存在什么问题

<!-- 必填 >=5 条，每条必须引用会话原句作为证据 -->

### P1 <问题标题>

**证据**（会话原文）：
```
<引用原句或错误信息>
```

**分析**：<技术原因 + 流程原因>

**影响**：<影响范围>

---

### P2 <问题标题>
...（P3、P4、P5 同格式）

---

## 二、本次会话可沉淀经验

<!-- 必填 >=5 条，格式：[动词] [对象]，[条件]，[原因] -->

### E1 <经验标题>
<具体规则>

### E2 <经验标题>
...

---

## 三、本次会话可改进点

<!-- 必填 >=5 条，可操作的具体建议 -->

### I1 <改进点>
<具体做法>

### I2 <改进点>
...

---

## 四、可沉淀为 Skill

<!-- 列出 Skill 文件路径 + 摘要 -->

详见：`docs/standards/skills/<skill-name>.md`

---

## 五、可沉淀为 Template

<!-- 列出 Template 文件路径 -->

详见：
- `docs/standards/templates/<template-name>.md`

---

## 六、可沉淀为 Checklist

<!-- 列出 Checklist 文件路径 + 核心检查项 -->

详见：`docs/standards/checklists/<checklist-name>.md`

---

## 七、可沉淀为 Best Practice

<!-- 必填 >=7 条，格式：| # | 规则 | Why | -->

| # | 规则 | Why |
|---|------|-----|
| BP1 | <规则> | <原因> |
...

详见：`context/experience/best-practices/<bp-name>.md`

---

## 八、可沉淀为脚本

<!-- 描述脚本功能 + 使用方法 -->

详见：`scripts/retro/retro.sh`

---

## 相关文档

- <相关文档路径 1>
- <相关文档路径 2>

---

**关键词**：`<kw1>`, `<kw2>`, `<kw3>`

**类别**：复盘报告
```
