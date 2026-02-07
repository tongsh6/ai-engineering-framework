# Repo Snapshot (Retrofit)

目的：
- 为 Existing Project Init 提供“可修改初稿”
- 让 AI 与人类快速理解仓库事实，而不是从空白开始

必须产物：

    context/tech/REPO_SNAPSHOT.md

信息来源（只取可快速确认的事实）：
- 构建文件体现的技术栈（例如：package.json、pom.xml、go.mod、pyproject.toml 等）
- 顶层目录结构
- 服务或模块划分
- 基础设施与 CI 线索（例如：Dockerfile、compose、.github/workflows、Jenkinsfile）

模板（复制到 context/tech/REPO_SNAPSHOT.md 后再补充）：

    # Repo Snapshot

    ## Tech Stack
    - Language:
    - Framework:
    - Build Tool:
    - Runtime:

    ## Repo Layout (Top Level)
    - /

    ## Modules / Services
    - name:
      - path:
      - responsibility:
      - owner (optional):

    ## Infra & CI
    - CI:
    - Docker:
    - Deploy:

    ## Commands (If Known)
    - build:
    - test:
    - run:

约束：
- 只写“能被仓库证据支持”的内容
- 不做设计推断，不做重构建议
