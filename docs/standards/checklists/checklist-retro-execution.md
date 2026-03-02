---
title: "Checklist: 复盘执行检查清单"
date: 2026-03-02
tags: [aief, checklist, retro, release, gitflow]
source: conversation://2026-03-02-aief-doc-review-release
---

# Checklist: 复盘执行检查清单

> 阶段化闸门清单，确保复盘过程完整、产物符合 AIEF 规范，以及发版前关键步骤不被遗漏。

---

## Purpose

提供可逐项勾选的发版前检查清单和复盘执行检查清单，防止关键步骤遗漏（如 release script 未使用、INDEX 未更新）。

## When to Use

- 每次执行 GitFlow 发版流程之前（Pre-Release 部分）
- 每次执行会话复盘之后（Retro 产物验收部分）
- 复盘脚本执行完毕后的手动验证

## When NOT to Use

- 纯文档修改无需发版的场景（跳过 Pre-Release 部分）
- 单轮对话无实质操作（无需复盘）

## Inputs

- 当前 git 状态
- 已生成的复盘产物文件列表

## Outputs

- 所有检查项已勾选 → 可执行 git commit / push

## Steps

按顺序执行各阶段的检查项。

## Verification

所有 `[ ]` 变为 `[x]` 后，进入下一步骤。

## Notes

- Pre-Release 部分必须在执行 `git push origin v<version>` 之前完成
- Retro 产物验收部分必须在执行 `git commit` 之前完成

---

## 阶段一：Pre-Release 检查（发版前必须通过）

### GitFlow 分支状态

```
[ ] 所有计划合并的 feature 分支已合并到 develop
[ ] git log develop..main --oneline 无输出（develop 已同步 main）
[ ] develop 已成功合并到 main（git log --oneline -3 确认 merge commit）
[ ] 当前在 main 分支：git rev-parse --abbrev-ref HEAD == "main"
[ ] 工作区干净：git status --porcelain 无输出
```

### 版本号与发版工具

```
[ ] 版本号已决策（patch / minor / major，根据变更类型）
[ ] 使用 node scripts/release.mjs <version>，不手动 git tag
[ ] scripts/release.mjs 执行成功（无错误退出）
```

### CI 验证

```
[ ] CI 三个 job 全部通过：
    [ ] ✓ Verify version consistency
    [ ] ✓ Publish to npm
    [ ] ✓ Create GitHub Release
[ ] gh release list --limit 1 确认新版本为 Latest
```

---

## 阶段二：Retro 产物验收

### 文件存在性

```
[ ] retro 主文档已创建：context/experience/lessons/retro-<date>-<topic>.md
[ ] skill 文档已创建：docs/standards/skills/skill-*.md（>=1 个）
[ ] template 文档已创建：docs/standards/templates/template-*.md（>=2 个）
[ ] checklist 文档已创建：docs/standards/checklists/checklist-*.md（>=1 个）
[ ] best practice 文档已创建：context/experience/best-practices/bp-*.md（>=1 个）
[ ] retro 脚本已创建：scripts/retro/retro.sh
```

### 文件格式

```
[ ] 每个文件有 YAML frontmatter（含 title/date/tags/source）
[ ] 每个文件有 7 个标准小节（Purpose/When to Use/Inputs/Outputs/Steps/Verification/Notes）
[ ] retro 主文档有 8 个必填节（问题/经验/改进/skill/template/checklist/BP/脚本）
[ ] 问题节每条有会话原文证据
```

### 内容质量

```
[ ] 问题节 >= 5 条
[ ] 经验节 >= 5 条，格式为可复用规则
[ ] 改进点节 >= 5 条，可操作
[ ] best practice >= 7 条，格式：原则 + why + 反例
[ ] skill/template/checklist/bp 内容重复不超过 30%
```

### 索引更新

```
[ ] context/experience/INDEX.md 已更新，包含 retro 条目（含路径+摘要+关键词）
[ ] context/INDEX.md 已更新（若新增子目录）
```

### 脚本验证

```
[ ] bash scripts/retro/retro.sh --dry-run --date <date> --topic <topic> 无错误退出
[ ] retro.sh 支持 --date / --topic / --source / --dry-run 四个参数
```

---

## 阶段三：GitFlow 提交确认

```
[ ] feature 分支已创建：feature/retro-<date>-<topic>
[ ] 提交 1（内容文件）：git commit -m "docs(retro): add <date> <topic> retrospect assets"
[ ] 提交 2（脚本）：git commit -m "chore(scripts): add retro automation script"
[ ] 提交 3（索引）：git commit -m "docs(aief): update experience index for <topic>"
[ ] feature 分支已合并到 develop
[ ] develop 已合并到 main
```
