# Existing Project Init (Retrofit)

目标：
- 不动现有业务代码结构
- 不要求一次性补齐文档
- 先插入口，再逐步演进
- 不覆盖已有项目事实和人工确认的画像字段

基础接入（L0）应生成：

    AGENTS.md
    context/INDEX.md
    context/PROJECT_PROFILE.yaml

PROJECT_PROFILE.yaml 是项目身份、生命周期、发布状态和责任约束的统一事实入口。若项目已有等价的权威资料，先审计并决定唯一真源；不得静默创建互相冲突的第二份画像。

推荐迁移路径：

L0：
- 新增或补齐 AGENTS.md
- 新增或补齐 context/INDEX.md
- 创建 Profile 候选模板，未知事实使用 unknown

L0+：
- 在 L0 基础上生成 context/tech/REPO_SNAPSHOT.md

L1：
- 补充核心业务说明
- 补充技术与架构说明

L2/L3：
- 按需引入 workflow、经验、标准和跨切面模式

Retrofit 约束：
- 不覆盖已有 Profile。
- 不覆盖已有 AGENTS.md 或业务文档。
- AI 可扫描仓库形成技术事实候选，但不得自动确认项目性质、生命周期、发布承诺和数据责任。
- 对已有资料与仓库证据的冲突，报告差异并等待维护者确认。

完成标准：
- AI 能通过 AGENTS.md 定位项目画像
- 项目画像明确区分 confirmed、unknown 和 proposed
- 现有项目资产未被破坏
