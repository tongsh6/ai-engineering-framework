# New Project Init

目标：
- 十分钟内完成
- 不依赖具体工具
- 不引入流程负担

初始化的唯一目标：
- 给 AI 和人类一个稳定入口
- 建立最小项目画像，让 AI 不必猜测项目性质和责任

最小初始化产物（必须）：

    AGENTS.md
    context/
        INDEX.md
        PROJECT_PROFILE.yaml

PROJECT_PROFILE.yaml 的未知字段使用显式 unknown；初始化不得替维护者决定所有权、项目目的、生命周期、发布状态或外部承诺。

初始化后建议存在：

    AGENTS.md
    context/
        INDEX.md
        PROJECT_PROFILE.yaml
        business/
        tech/
        experience/

推荐执行步骤：
1. 复制 templates/minimal/ 到项目根目录，或运行初始化 CLI。
2. 在 AGENTS.md 填写项目一句话介绍和常用命令。
3. 由维护者确认 Profile 中的关键字段；暂时未知的字段保留 unknown。
4. 根据任务需要逐步补充业务和技术上下文。

完成标准：
- AGENTS.md 在项目根目录可见
- context/INDEX.md 可作为长期上下文入口
- context/PROJECT_PROFILE.yaml 存在且未知事实未被猜测
