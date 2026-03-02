---
title: "Skill: AIEF Retrospective Curator（复盘沉淀执行器）"
date: 2026-03-02
tags: [aief, skill, retro, retrospective, experience-management]
source: conversation://2026-03-02-aief-doc-review-release
---

# Skill: AIEF Retrospective Curator（复盘沉淀执行器）

> 将会话全文沉淀为 AIEF 可复用资产（experience / skill / template / checklist / best-practice / script），并更新索引确保可检索、可加载、可复用。

---

## Purpose

执行结构化会话复盘，将一次 AI 编码会话的经验自动转化为 AIEF 标准格式的知识资产。
确保每次有价值的会话都能以可检索、可机器加载的形式沉淀到知识库，实现经验复利。

---

## When to Use

- 完成一个完整的功能开发、问题修复、或重要决策会话之后
- 会话中出现了失误、踩坑、或重要学习点
- 需要将会话产出正式化为团队可复用资产
- 定期复盘（每周/每月）或里程碑发版后

## When NOT to Use

- 纯信息查询会话（无实质操作）
- 单次简单问答（不超过 5 轮）
- 已有完整文档的标准操作（不产生新知识）

---

## Inputs

```typescript
interface RetroInput {
  conversation: string;      // 会话全文（逐轮消息）
  repo_root: string;         // 本地仓库根目录路径
  date: string;              // YYYY-MM-DD，默认取今天
  topic: string;             // 主题标识符，由会话推断（如 "aief-doc-review-release"）
  source_id: string;         // conversation://<id>，若无则用 date-topic
}
```

---

## Outputs

```typescript
interface RetroOutput {
  retro_doc: string;         // context/experience/lessons/retro-<YYYYMMDD>-<topic>.md
  skill_docs: string[];      // docs/standards/skills/<skill-name>.md（>=1 个）
  template_docs: string[];   // docs/standards/templates/<template-name>.md（>=2 个）
  checklist_docs: string[];  // docs/standards/checklists/<checklist-name>.md（>=1 个）
  bp_docs: string[];         // context/experience/best-practices/<bp-name>.md（>=1 个）
  script: string;            // scripts/retro/retro.sh（可运行）
  index_updates: string[];   // 更新的 INDEX 文件列表
  gitflow_commands: string;  // 可执行的 GitFlow 提交命令序列
}
```

---

## Steps

### Step 1：会话分析

从会话全文提取以下维度的信息：

```
1. 主要操作序列（按时间顺序）
2. 失误/踩坑点（有"错误"、"CI 失败"、"问题"等信号词）
3. 修复步骤（如何解决问题）
4. 关键决策点（选择了某方案）
5. 未被充分利用的工具/脚本（如本次的 release.mjs）
```

### Step 2：问题分析（>=5 条）

对每个问题：
- 定位会话原句作为证据
- 分析技术原因 + 流程原因
- 评估影响范围（严重/中/轻）

### Step 3：经验抽象（>=5 条）

将问题提炼为"可复用规则"：

```
格式：[动词] [对象]，[条件]，[原因]
示例：发版只走 release script，禁止手动 git tag，因为手动操作会遗漏版本号同步。
```

### Step 4：资产分类

按以下决策树将每条经验路由到正确的资产类型：

```
经验 → 是否可训练/可执行？
  YES → Skill（含 Input/Output/Steps/Verification）
  NO  → 是否是可填空模板？
    YES → Template
    NO  → 是否是阶段性闸门项？
      YES → Checklist
      NO  → 是否是短规则（原则+why+反例）？
        YES → Best Practice
        NO  → 写入 retro 主文档的经验列表
```

### Step 5：写文件（并行）

按以下顺序写所有资产文件（顺序无依赖，可并行）：

```
1. retro 主文档（包含 8 个必填节）
2. skill 文档（含 YAML frontmatter + 7 个标准节）
3. template 文档
4. checklist 文档
5. best practice 文档
6. retro.sh 脚本
```

**每个文件必须包含 YAML frontmatter**：

```yaml
---
title: "..."
date: YYYY-MM-DD
tags: [aief, retro, <topic>, ...]
source: <source_id>
---
```

**每个文件必须包含 7 个标准小节**：
`Purpose / When to Use / When NOT to Use / Inputs / Outputs / Steps / Verification / Notes`

### Step 6：更新索引

A. 更新 `context/experience/INDEX.md`：
  - 在"经验列表"章节顶部添加新条目
  - 在"按类别索引"添加对应条目
  - 在"审计报告"表格添加 retro 引用

B. 更新 `context/INDEX.md`（若新增子目录）：
  - 在目录结构树中补充新目录
  - 在"经验知识"表格补充新路径

C. 在 `AGENTS.md` 快速命令区块补充（可选）：

```bash
# 复盘沉淀
bash scripts/retro/retro.sh --date $(date +%Y-%m-%d) --topic <topic>
```

### Step 7：生成 GitFlow 命令

输出可直接粘贴执行的命令序列：

```bash
git checkout -b feature/retro-<YYYYMMDD>-<topic>

# 提交 1：内容文件
git add context/experience/lessons/retro-*.md \
        docs/standards/skills/ \
        docs/standards/templates/ \
        docs/standards/checklists/ \
        context/experience/best-practices/
git commit -m "docs(retro): add <date> <topic> retrospect assets"

# 提交 2：脚本
git add scripts/retro/
git commit -m "chore(scripts): add retro automation script"

# 提交 3：索引更新
git add context/experience/INDEX.md context/INDEX.md
git commit -m "docs(aief): update experience index with retro assets for <topic>"
```

### Step 8：验收（Verification）

```bash
# 检查所有文件已创建
ls context/experience/lessons/retro-*.md
ls docs/standards/skills/skill-*.md
ls docs/standards/templates/template-*.md
ls docs/standards/checklists/checklist-*.md
ls context/experience/best-practices/bp-*.md
ls scripts/retro/retro.sh

# 检查 retro.sh 可执行
bash scripts/retro/retro.sh --dry-run --date <date> --topic <topic>

# 检查 INDEX 已更新
grep "retro-<date>" context/experience/INDEX.md
```

---

## Verification

复盘产物验收标准（全部满足才算完成）：

```
[ ] retro 主文档存在，包含 8 个必填节
[ ] 每个文件有 YAML frontmatter（含 title/date/tags/source）
[ ] 每个文件有 7 个标准小节
[ ] retro.sh 支持 --dry-run 参数且可运行
[ ] context/experience/INDEX.md 已更新，包含新 retro 条目
[ ] skill/template/checklist/bp 内容重复不超过 30%
[ ] 所有文件已通过 git add 加入暂存区
[ ] GitFlow 命令已生成并可执行
```

---

## Notes

- **去重规则**：skill/template/checklist/best-practice 之间内容重复不得超过 30%
- **最小产出**：每次复盘至少产出 1 个 retro 主文档 + 1 个 skill + 2 个 template + 1 个 checklist + 7 条 best practice
- **语言规则**：所有自然语言内容使用中文，代码/命令/标识符使用英文
- **AIEF 路由**：复盘任务属于"文档更新 + 经验沉淀"，走 `implement → review`，不需要 `proposal`
- **来源引用**：`source` 字段必须填写，格式为 `conversation://<id>` 或 `date-topic`

---

## 与 AIEF 的关系

- 本 Skill 是 L2 级别的高级可选组件，用于 AI 协作成熟团队的经验复利机制
- 依赖 `context/experience/` 目录结构（L0 已建立）
- 产出物通过 `context/experience/INDEX.md` 被 AGENTS.md 的"自动行为"检索加载

---

## 参考

- `docs/standards/skill-spec.md` — Skill 规范标准
- `workflow/phases/release.md` — 发版 SOP（复盘触发场景之一）
- `context/experience/INDEX.md` — 经验索引（复盘产物注册点）
- `scripts/retro/retro.sh` — 自动化脚本（本 Skill 的执行器）
