---
title: "Best Practices: AI 会话管理与发版操作"
date: 2026-03-02
tags: [aief, best-practice, release, gitflow, language, session-management]
source: conversation://2026-03-02-aief-doc-review-release
---

# Best Practices: AI 会话管理与发版操作

> 从 AIEF 项目实际运营中提炼的 9 条短规则，覆盖发版操作、AI 语言管理、复盘机制三大领域。

---

## Purpose

提供可直接引用的规则集，供 AI 助手在执行发版、管理会话、执行复盘时遵守。
每条规则包含：原则 + Why + 反例。

## When to Use

- AI 助手准备执行 GitFlow 发版流程时
- 加载含非项目语言的 Skill 文档时
- 执行会话复盘时

## When NOT to Use

- 完全不涉及 git 操作的纯查询会话

## Inputs

- 当前操作上下文（发版 / 加载 Skill / 复盘）

## Outputs

- 遵循规则后的正确操作序列

## Steps

执行操作前查阅对应类别的规则，逐条确认。

## Verification

对照规则检查操作方案是否存在已知反模式。

## Notes

- 规则按重要程度排序，BP1-BP3 为最高优先级
- 反例描述的是真实发生过的错误，不是假设

---

## 发版操作规则

### BP1 发版只走 release script，禁止手动 git tag

**原则**：执行 `node scripts/release.mjs <version>`，不执行 `git tag -a`。

**Why**：`scripts/release.mjs` 将版本同步（package.json 更新）、commit、tag、push 原子化绑定。
手动 `git tag` 跳过了版本号同步步骤，导致 CI 版本校验失败。

**反例**：

```bash
# ❌ 错误：手动打 tag，未更新 package.json
git tag -a v1.5.1 -m "release: v1.5.1"
git push origin v1.5.1
# → CI 报错：package.json(1.5.0) != tag(1.5.1)

# ✅ 正确：release script 原子化操作
node scripts/release.mjs 1.5.1
```

---

### BP2 在 GitFlow 末尾打 tag 前，先检查是否有 release script

**原则**：进入"打 tag"步骤时，先执行 `ls scripts/` 确认是否有发版脚本，有则强制使用。

**Why**：项目可能已有封装好的发版工具，但在执行序列中容易被遗忘。

**反例**：直接执行 `git tag`，未检查 `scripts/` 目录。

---

### BP3 develop 每次发版前先同步 main

**原则**：执行 `git log develop..main --oneline`，有输出则先合并 main 到 develop。

**Why**：develop 落后 main 意味着 hotfix 或并行发布的变更未被集成，
合并 develop→main 时会引入意外的 revert 或冲突。

**反例**：

```bash
# ❌ 错误：develop 停在 v1.3.3，直接合并到 main（main 已到 v1.5.0）
# 会把 v1.3.3 之后 main 上的变更当作"新增"合并，产生混乱的 diff

# ✅ 正确：先同步
git checkout develop
git merge main --no-ff -m "merge: sync develop with main vX.Y.Z"
# 再合并 feature 到 develop，再合并 develop 到 main
```

---

### BP4 pre-release checklist 必须人工执行，CI 是事后防线

**原则**：发版前人工逐项确认 `docs/standards/checklists/checklist-retro-execution.md` 的 Pre-Release 部分。

**Why**：CI 版本校验在 push tag 之后触发，属于"发现错误"。
人工 checklist 在操作执行前运行，属于"预防错误"。两者作用不同，不可互相替代。

**反例**：跳过 checklist，"CI 会帮我发现问题" → CI 失败 → 需要删 tag 重来。

---

## AI 语言管理规则

### BP5 加载含异语言 Skill 后，必须显式重申项目语言

**原则**：加载含大量非中文 token 的 Skill 文档后，在生成任何自然语言输出前（包括 Todo），
显式输出确认语句：`以下所有自然语言输出（含 Todo、注释）使用中文。`

**Why**：LLM 的输出语言受上下文 token 分布影响，大量韩文（或英文）示例会导致语言漂移，
模型会在"中文环境"中意外输出韩文或其他语言。

**反例**：

```
加载 git-master skill（含大量韩文：커밋、리베이스、정리）
→ 创建 Todo
→ Todo 内容输出为韩文：
  "develop 브랜치를 main과 동기화 (v1.5.0 포함)"  ← 应为中文
```

---

### BP6 Todo 内容使用项目约定语言，不受 Skill 语言影响

**原则**：`mcp_todowrite` 的 `content` 字段始终使用项目约定语言（本项目为中文）。

**Why**：Todo 是用户可见的进度追踪，必须遵循 AGENTS.md 的语言规定，
与 Skill 文档内部语言无关。

**反例**：`content: "develop 브랜치를 main과 동기화"` → 应为 `content: "将 develop 与 main 同步"`

---

## 复盘机制规则

### BP7 复盘资产必须有 YAML frontmatter + 注册到 INDEX

**原则**：所有复盘产物（retro/skill/template/checklist/bp）必须包含 YAML frontmatter 并在
`context/experience/INDEX.md` 注册。

**Why**：AI 工具通过元数据检索经验库，无 frontmatter 或未注册的文档对 AI 不可见，
复盘价值为零。

**反例**：创建了 `lessons/xxx.md` 但未更新 INDEX.md → AI 下次不会加载这条经验。

---

### BP8 GitFlow 合并（git merge）与版本发布（release script）严格分离

**原则**：合并步骤只使用 `git merge`；版本发布步骤只使用 `scripts/release.mjs`。
不在 merge commit 中附带版本 bump；不在 release script 外手动操作版本。

**Why**：混淆两个操作会导致其中一个步骤被跳过，引发版本不一致或遗漏合并。

**反例**：在 `git merge develop` 之后直接 `git tag`，跳过 release script。

---

### BP9 复盘骨架由 retro.sh 生成，人工填充内容

**原则**：执行 `bash scripts/retro/retro.sh --date <date> --topic <topic>` 生成骨架，
人工填充各节内容，不手写文件结构。

**Why**：手写复盘文档容易遗漏 frontmatter 或某个标准小节，
自动生成骨架保证格式一致性。

**反例**：手写复盘文档，遗漏 `When NOT to Use` 节或 frontmatter 中的 `source` 字段。
