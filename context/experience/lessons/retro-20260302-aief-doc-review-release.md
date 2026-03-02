---
title: "复盘：AIEF 文档交叉审核与 v1.5.1 发版"
date: 2026-03-02
tags: [aief, retro, doc-review, gitflow, release, language-drift, ci]
source: conversation://2026-03-02-aief-doc-review-release
---

# 复盘：AIEF 文档交叉审核与 v1.5.1 发版

> 本次会话完成了 AIEF 项目文档的交叉审核（8 处一致性/可读性/友好性问题修复）并按 GitFlow 发布 v1.5.1。
> 复盘记录了语言漂移、手动打 tag 绕过 release script 等关键失误，沉淀为可复用资产。

---

## 一、本次会话存在什么问题

> 以下 5 条均有会话原文证据支撑。

### P1 语言漂移：Skill 文档语言污染了 Todo 输出

**证据**（会话原文）：

```
"develop 브랜치를 main과 동기화 (v1.5.0 포함)"
"feature 브랜치 정리 (삭제)"
```

加载 `git-master` skill 后，该 skill 文档中含大量韩文示例（`커밋`, `리베이스`, `정리`），
导致模型在调用 `mcp_todowrite` 时输出韩文，违反 AGENTS.md 的"交流使用中文"规定。

**影响**：Todo 内容不可读，与项目语言规范不符。

---

### P2 手动打 tag 绕过 release script，导致 CI 版本校验失败

**证据**（会话原文 & CI 日志）：

```
git tag -a v1.5.1 -m "release: v1.5.1 - doc consistency and usability fixes"
→
ERROR: @tongsh6/aief-init version (1.5.0) does not match tag (1.5.1)
ERROR: @tongsh6/ai-engineering-framework-init version (1.5.0) does not match tag (1.5.1)
```

项目已有 `scripts/release.mjs`（原子化完成版本同步+tag+push），但在 GitFlow 末尾
手动执行了 `git tag`，跳过了 package.json 版本号同步步骤。

**影响**：CI 失败，需额外 3 步修复（删 tag → bump 版本 → 重新 push）。

---

### P3 develop 分支严重落后 main，未在发版前检查

**证据**（会话原文）：

```
git checkout develop && git log --oneline -5
→ 7a107ab release: v1.3.3   ← develop 停在 v1.3.3，main 已到 v1.5.0
```

develop 落后 main 整整 2 个 minor 版本，GitFlow 合并时需要额外的同步步骤，
增加了合并冲突风险，也表明 GitFlow 日常维护流程未被执行。

**影响**：增加合并步骤，延长发版时间，潜在合并冲突风险。

---

### P4 第一次复盘深度不足，需要第二次更正式的复盘

**证据**（会话原文，用户要求）：

```
用户第一次复盘 → 8 问简答 → 创建 3 个文档
用户再次要求 → "给该项目创建官方的 AIEF Retrospective Curator，一个官方的 skills"
```

第一次复盘（8 问答环节）产出的文档虽覆盖了要点，但缺乏结构化、无 YAML frontmatter、
无 Skill/Template/Checklist 分层，导致资产不可机器检索，也不符合 AIEF 规范格式。

**影响**：复盘资产无法被 AI 工具自动检索和加载，复盘价值打折。

---

### P5 发版前无标准检查清单，操作完全依赖人工记忆

**证据**（会话原文）：

```
# 操作序列（实际执行顺序）
git checkout develop → git merge main → git merge feature/... → git push
git checkout main → git merge develop → git push
git tag -a v1.5.1 ...   ← 此处应改为 node scripts/release.mjs 1.5.1
```

没有 pre-release checklist 指导，导致关键步骤（使用 release script）被遗忘。

**影响**：可避免的 CI 失败，发版质量依赖执行者记忆而非系统保障。

---

## 二、本次会话可沉淀经验

### E1 发版操作必须原子化：release script = 唯一正确入口

手动打 tag 的本质问题是把"原子操作"拆成了"序列操作"，任何中间步骤被跳过都会造成不一致。
**规则**：凡需要 tag + 版本号同步的发版，只允许通过 `scripts/release.mjs <version>` 执行。

### E2 Skill 文档的语言 token 会污染后续输出

在含大量非项目语言 token 的 skill 上下文中，LLM 后续生成会发生语言漂移。
**规则**：加载含异语言 skill 后，在生成任何自然语言输出前，需显式重申项目语言规则。

### E3 develop 定期同步 main 是 GitFlow 健康指标

develop 落后 main 超过 1 个 minor 版本意味着 GitFlow 维护流程已中断。
**规则**：每次发版前检查 `git log develop..main --oneline` 是否有未同步提交。

### E4 CI 版本校验是事后防线，不能替代事前检查清单

CI 校验在 push tag 之后触发，属于"发现错误"而非"预防错误"。
**规则**：pre-release checklist 必须在 push 之前人工执行，CI 是补充而非替代。

### E5 复盘资产需符合 AIEF 规范才能被 AI 工具检索

无 YAML frontmatter、无标准小节、未入 INDEX.md 的复盘文档对 AI 工具不可见。
**规则**：所有复盘产物必须包含 frontmatter + 7 个标准小节 + 索引注册。

### E6 GitFlow 合并与版本发布是两件独立的事

合并（git merge）负责代码集成，发版（release.mjs）负责版本管理，两者不应混淆。
**规则**：GitFlow SOP 文档中"打 tag"步骤的描述应精确为"执行 release script"。

---

## 三、本次会话可改进点

### I1 在 GitFlow 末尾打 tag 前，先 `ls scripts/` 检查 release script

进入"打 tag"步骤时，先执行 `ls scripts/` 确认是否有发版脚本，有则强制使用。

### I2 加载含异语言 skill 后，在 Todo 创建前显式重申语言

加载 git-master 等含韩文内容的 skill 后，立即输出一行确认：
`以下所有自然语言输出（含 Todo、注释、提交消息）使用中文。`

### I3 在 workflow/INDEX.md 中补充"发版任务"路由规则

当前 workflow/INDEX.md 没有"发版"任务类型，导致 AI 无参考路由。
应在"直接实现的任务"分类下补充：`发版 → 使用 release.mjs，参阅 phases/release.md`。

### I4 develop 落后 main 超过 1 个版本时，发版前强制提醒

在 release script 中添加检查：若 develop 落后 main 超过指定版本数，输出警告。

### I5 复盘文档生成应由脚本自动生成骨架，避免手写遗漏

手写复盘文档容易遗漏 YAML frontmatter 或某个标准小节，应由 `scripts/retro/retro.sh` 生成骨架，人工填充内容。

### I6 GitFlow 合并顺序应有可视化 SOP（已在 workflow/phases/release.md 中补充）

合并顺序错误（如跳过 develop 同步步骤）是本次问题的根源之一，
`workflow/phases/release.md` 的 6 步 SOP 已解决此问题。

---

## 四、可沉淀为 Skill

详见：
- `docs/standards/skills/skill-retrospective-curator.md`（主 Skill 定义）

**Skill 摘要**：

| Skill | 职责 | 输入 | 输出 |
|-------|------|------|------|
| Retrospective Curator | 将会话内容沉淀为 AIEF 可复用资产 | 会话全文 + repo_root + date + topic | retro 主文档 + skill/template/checklist/bp + 索引更新 |

---

## 五、可沉淀为 Template

详见：
- `docs/standards/templates/template-retro-main.md`（复盘主文档模板）
- `docs/standards/templates/template-session-lesson.md`（单条经验文档模板）

---

## 六、可沉淀为 Checklist

详见：
- `docs/standards/checklists/checklist-retro-execution.md`（复盘执行检查清单）

**核心检查项**（pre-release 部分）：

```
[ ] develop 已同步 main（git log develop..main 无输出）
[ ] 使用 node scripts/release.mjs <version>，不手动 git tag
[ ] CI 三个 job 全部通过
[ ] gh release list 确认新版本为 Latest
```

---

## 七、可沉淀为 Best Practice

详见：
- `context/experience/best-practices/bp-ai-session-management.md`

**7 条核心规则摘要**：

| # | 规则 | Why |
|---|------|-----|
| BP1 | 发版只走 release script | 手动 tag 会遗漏版本同步 |
| BP2 | Skill 加载后重申语言 | 异语言 token 导致语言漂移 |
| BP3 | pre-release checklist 必须人工执行 | CI 是事后防线 |
| BP4 | develop 每次发版前先同步 main | 避免合并冲突和漏同步 |
| BP5 | 复盘资产必须有 frontmatter + INDEX 注册 | AI 工具依赖元数据检索 |
| BP6 | GitFlow 合并与版本发布严格分离 | 混淆导致步骤遗漏 |
| BP7 | 复盘骨架由脚本生成，人工填充内容 | 避免格式遗漏 |

---

## 八、可沉淀为脚本

详见：
- `scripts/retro/retro.sh`（可运行，支持 --dry-run）

**脚本功能摘要**：

```bash
./scripts/retro/retro.sh \
  --date 2026-03-02 \
  --topic aief-doc-review-release \
  --source "conversation://2026-03-02" \
  --dry-run   # 只打印，不落盘
```

自动完成：
- 创建目录（skills/templates/checklists/best-practices/）
- 生成 retro 主文档骨架（含 8 节 + frontmatter）
- 生成 skill/template/checklist/bp 骨架文件
- 更新 context/experience/INDEX.md
- 打印 GitFlow 命令

---

## 相关文档

- `workflow/phases/release.md` — 发版 SOP
- `context/experience/lessons/2026-03-02-release-script-bypass.md` — release script 踩坑
- `docs/standards/skills/skill-retrospective-curator.md` — Retrospective Curator Skill
- `docs/standards/checklists/checklist-retro-execution.md` — 复盘执行清单
- `context/experience/best-practices/bp-ai-session-management.md` — AI 会话管理最佳实践

---

**关键词**：`retro`, `retrospective`, `doc-review`, `gitflow`, `release`, `language-drift`, `version-mismatch`, `ci`, `release-script`

**类别**：复盘报告
