# New Project Init

目标：
- 十分钟内完成
- 不依赖具体工具
- 不引入流程负担

初始化的唯一目标：
- 给 AI 和人类一个不会被忽略的稳定入口

最小初始化产物（必须）：

    AGENTS.md
    context/
        INDEX.md
        PROJECT_PROFILE.yaml

初始化后必须存在的目录结构（允许内容为空，但结构必须存在）：

    AGENTS.md
    context/
        INDEX.md
        PROJECT_PROFILE.yaml
        business/
        tech/
        experience/

推荐执行步骤：
1. 复制 templates/minimal/ 到项目根目录
2. 打开 AGENTS.md，填入三件事（允许很粗）：
   - 项目一句话介绍
   - 核心约束（例如：目录边界、关键规则）
   - 常用命令（build/test/run）
3. 由维护者确认 PROJECT_PROFILE.yaml 中的关键字段；未知信息保留 unknown，不让 AI 猜测。
4. 只要目录与入口存在即可结束初始化

可选：用脚本一键生成（仅写入 AIEF 文件，不触碰业务代码）：
- node scripts/aief-init.mjs new

可选：无拷贝前置的一键运行（推荐用于推广/接入）：
- npx --yes @tongsh6/aief-init@latest new

完成标准：
- AGENTS.md 在项目根目录可见
- context/INDEX.md 可作为长期上下文入口
- context/PROJECT_PROFILE.yaml 存在，未确认的项目事实保持 unknown
