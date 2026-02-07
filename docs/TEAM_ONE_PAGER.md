# AIEF 团队内部推广一页说明

## 这是什么

AIEF（AI Engineering Framework）是一套“项目级 AI 协作入口规范”：用 `AGENTS.md` + `context/` 把项目规则、架构约束、经验沉淀变成 AI 与人都能稳定读取的入口，避免协作规则散落在个人 prompt 里。

## 我们为什么需要它（当前痛点）

- 规则分散：每个人都有自己的 prompt/习惯，口径不一致
- 重复解释：同一背景/约束在不同会话、不同成员之间反复讲
- 经验不复用：踩坑、决策、边界无法沉淀成团队资产
- 新人接入慢：缺一份“AI 该怎么读这个项目”的统一入口

## 它带来的变化（你会感受到的）

- 任务启动更快：AI 不再从“猜项目”开始
- 协作更稳定：项目约束不再靠记忆和临时说明
- 经验可复用：把高频坑点变成可检索、可加载的文档

## 5 分钟接入（不改代码结构）

在项目根目录执行（二选一）：

新项目：

```bash
npx --yes @tongsh6/aief-init@latest new
```

已有项目（推荐 L0+，会生成仓库快照）：

```bash
npx --yes @tongsh6/aief-init@latest retrofit --level L0+
```

你要做的最少事情：

- 打开 `AGENTS.md`，写 3 点：一句话介绍 / 关键约束 / 常用命令（build/test/run）
- 30 秒验证：`AGENTS.md`、`context/INDEX.md`（以及 L0+ 的 `context/tech/REPO_SNAPSHOT.md`）存在
- 行为验证（可选但推荐）：让 AI “把 `AGENTS.md` 里的关键约束列成 3 条 bullet”，看是否对得上你写的内容

## 渐进式接入（不用一次性写完文档）

- L0：`AGENTS.md` + `context/INDEX.md` 存在即可（最小可用）
- L0+：再加 `REPO_SNAPSHOT.md`（AI 先能“看懂仓库概况”）
- L1：补 1 页业务 + 1 页技术
- L2/L3：按需引入 workflow、持续沉淀 experience

## 安全与回滚

- 旁路式：不侵入业务代码结构，不影响 build/run
- 不用就删：删除 `AGENTS.md` 和 `context/` 即可

## 推荐团队约定（落地方式）

- 所有“让 AI 做事”的请求，默认从 `AGENTS.md` 入口开始
- 新增关键约束/踩坑后，优先沉淀到 `context/`（而不是留在聊天记录）
- PR/技术决策完成后，补一条可复用经验（可从模板开始）

## 常见疑问（FAQ）

Q：会不会变成写文档负担？

A：不会。L0 只要存在入口文件；内容允许很粗，短 bullet 即可。

Q：我们的 AI 工具会自动读 `AGENTS.md` 吗？

A：有的工具原生读，有的需要明确指定“从 `AGENTS.md` 开始”。必要时启用 `.ai-adapters/`。

Q：和现有开发流程冲突吗？

A：不冲突。AIEF 是入口与上下文层，可与现有流程并行。

## 立刻的下一步（建议）

1) 选 1 个项目先做 L0+（10 分钟内）
2) 用同一个真实任务做对比：接入前 vs 接入后 AI 的启动成本
3) 形成团队约定：以后新增约束/踩坑沉淀到 `context/experience/`
