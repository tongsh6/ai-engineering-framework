# Project Operating Context

> AIEF 基础能力：让 AI 根据项目真实性质、生命周期和责任约束选择适当的工程方法。

## 1. 目标与范围

Project Operating Context为 AI 提供项目级事实和决策约束。它回答：

1. 项目是什么、服务谁、由谁负责？
2. 项目处于什么生命周期阶段，当前主要工作模式是什么？
3. 项目承担哪些用户、数据、兼容、部署和维护责任？
4. 这些事实如何改变当前任务的设计、实现、验证和交付方式？

本能力是 AIEF 的基础上下文能力，不依赖 AIEF L0-L3 接入等级，也不替代项目管理、任务跟踪、Workflow、Harness 或 Runtime。

## 2. 唯一事实来源

项目级画像唯一事实源为 `context/PROJECT_PROFILE.yaml`。

- `AGENTS.md` 只定义入口与消费规则，不复制画像字段。
- `context/INDEX.md` 负责导航，不复制画像内容。
- `context/tech/REPO_SNAPSHOT.md` 描述仓库可观察的技术现状，不替代项目画像。
- 任务计划和任务文件继续管理当前任务进度。
- aief-pm 的 `PROFILE.json` 是上下文编译配置，不是本协议的项目画像。

如果项目已有等价的权威资料，接入时先审计并明确唯一真源；禁止静默建立第二份互相竞争的项目画像。

## 3. 三个独立维度

不得混淆：

- Project Lifecycle：项目生命周期。
- AIEF Adoption Level：AIEF 接入深度（L0、L0+、L1、L2、L3）。
- Workflow Phase：当前任务阶段（proposal、design、implement、review 等）。

生命周期字段：
- `project.lifecycle.stage`：discovery、poc、mvp_development、pre_release、validation、production、maintenance、sunset、unknown。
- `project.lifecycle.operatingMode`：normal_development、feature_development、system_refactoring、migration、release_preparation、incident_response、maintenance、sunset_preparation、unknown。

发布事实独立记录：
- `project.release.everReleased`：true / false / null（未知）。
- `project.release.channel`：none、internal、private_beta、public_beta、stable、unknown。
- false 必须对应 none；true 不得对应 none；null 表示历史发布事实未知，不允许推断为从未发布。

生命周期不是单向状态机。项目可因重构、迁移、维护或业务变化改变工作模式；重大生命周期和发布状态变更须人工确认。

## 4. Profile 契约

Schema：`docs/standards/schemas/project-profile.schema.json`。

实例：`context/PROJECT_PROFILE.yaml`。

协议标识：
- apiVersion：`aief.dev/project-profile/v1`
- kind：`ProjectProfile`
- schemaVersion：`1.0`

必填事实缺乏信息时使用显式 `unknown`；发布历史未知时 `everReleased: null`。禁止把缺失、unknown、none、not_applicable 混为一谈。当前 Schema 不定义 not_applicable；确实不适用的维度应在规范中说明理由，不得伪造 none。

Profile 只存项目事实、责任、稳定约束、当前关注点和事实治理元数据。不存任务执行进度、会话摘要、技术栈快照、Harness 模型配置或每次策略推导结果。

## 5. 字段权限与事实治理

字段权限由本规范固定定义，项目 Profile 不得自行声明或修改权限。

### 5.1 human_confirmed

必须由维护者确认：
- `project.identity.*`
- `project.lifecycle.stage`
- `project.release.*`
- `project.commitments.*`
- `project.constraints`

AI 可以收集证据并提出 pending change，但不得直接修改已生效值。

### 5.2 ai_maintained

AI 可以在有来源证据时更新：
- `project.lifecycle.operatingMode`（必须依据当前已确认工作计划；明显改变工作模式时提示维护者）
- `project.currentFocus`
- `governance.provenance`
- `governance.pendingChanges`

AI 不得仅凭代码规模、版本号或仓库活跃度推断项目生命周期、发布承诺或用户责任。

### 5.3 Provenance

每个关键事实应在 `governance.provenance` 中按 JSON Pointer 风格字段路径记录来源，例如 `/project/identity/ownership`。

状态：
- confirmed：来源足以支持当前值。
- proposed：候选值，不能参与正式策略推导。
- unknown：尚无可靠事实。
- stale：来源可能过期，必须谨慎使用并提示复核。

来源类型：
- maintainer_confirmation
- user_instruction
- current_work_plan
- repository_evidence
- ci_evidence
- manual_document
- unknown

人工字段只有在 provenance.status=confirmed 且来源为 maintainer_confirmation 或明确的 user_instruction 时才可视为确认事实。AI 维护字段必须有可定位来源；没有证据时应保持 unknown 或 proposed。

不得通过修改 provenance 改变字段权限。pendingChanges 仅记录提议，不能覆盖正式值。

## 6. Effective Operating Policy

AI 在重要工程任务开始时按以下顺序推导策略：

1. 加载 Profile 和本规范。
2. 识别 confirmed、proposed、unknown、stale 事实。
3. 根据 lifecycle.stage 选择生命周期默认策略。
4. 根据已确认 commitments 和 constraints 修正对应决策领域。
5. 结合 operatingMode、当前任务影响面、风险和可逆性。
6. 应用明确、限于当前任务的 Task Adjustment。
7. 检查冲突并给出执行方案与验证要求。

八个决策领域：
- product：需求和范围。
- architecture：模块边界、抽象和演进。
- implementation：实现深度、复用和重构。
- quality：测试、审查和验收。
- compatibility：API、Schema 和消费者兼容。
- data：保留、迁移、备份和恢复。
- delivery：构建、部署、发布和回滚。
- maintenance：文档、可维护性和支持责任。

### 6.1 生命周期默认策略

| 领域 | discovery / poc | mvp_development | validation | production |
|---|---|---|---|---|
| product | 验证假设 | 实现核心闭环 | 基于反馈调整 | 控制需求变更 |
| architecture | 解决关键未知 | 建立必要结构 | 控制演进风险 | 长期可维护 |
| implementation | 快速验证 | 完整实现核心行为 | 稳定迭代 | 风险受控 |
| quality | 验证关键假设 | 核心行为与必要回归 | 增强自动化验证 | 持续质量保障 |
| compatibility | 按实际契约 | 按实际契约 | 保护真实依赖 | 履行正式契约 |
| data | 按数据责任 | 按数据责任 | 保护用户资产 | 保护用户资产 |
| delivery | 实验性交付 | 按发布目标 | 完整发布准备 | 正式交付治理 |
| maintenance | 避免提前建设 | 维护必要文档 | 用户和维护文档 | 长期维护能力 |

maintenance 阶段：控制新增范围，优先必要修复，履行既有支持承诺。

sunset 阶段：停止无必要的新功能，优先处理用户通知、数据导出/保留/处置、依赖解除和安全下线。

pre_release 阶段：检查核心闭环、安装/部署、发布说明、数据迁移和回滚准备；要求按实际部署与责任裁剪，不默认引入企业级发布体系。

### 6.2 全局工程原则

- Correctness First：项目早期也不能忽略核心正确性。
- Data Protection：数据要求由数据性质和责任决定，不由生命周期降低。
- Commitment Preservation：已确认的外部承诺不可被生命周期默认值覆盖。
- Proportional Engineering：工程复杂度匹配真实需求、已知风险和已确认演进。
- Evidence-based Decisions：重要决策必须区分事实、推断和未知。
- No Speculative Complexity：不为未经确认的未来可能性提前建设复杂抽象。
- No Under-design：不能因追求快速交付而遗漏必要设计和验证。
- Reversibility Awareness：不可逆操作需要更强的论证、保护和验证。

### 6.3 责任修正

责任按领域修正策略，而不是给项目贴一个统一的“质量等级”：

- 真实用户数据 / preserve：不得把重置或删除数据作为默认方案。
- 备份或恢复要求：按承诺设计和验证。
- 公开 API：检查实际消费者、破坏性变更和迁移方案。
- 数据库兼容承诺：设计迁移或兼容方案。
- SLA：增加可用性、监控、恢复和发布验证。
- 公开用户：验证真实用户路径和必要使用文档。
- 长期维护：保持必要的架构可理解性和维护文档。
- 多人协作：增加与风险相称的评审和交接。
- 客户交付：履行已确认的验收和交付责任。

若责任字段为 unknown 或 provenance 不可信，不得推导为无责任。应指出未知及其对决策的影响；必要时先询问维护者。

## 7. 冲突解决

不可覆盖约束：
1. 安全边界、数据保护和系统不变量。
2. 已确认的外部、法律、组织和用户责任。

普通策略合并顺序：
1. 项目明确约束（只能强化不可覆盖约束）。
2. AIEF 全局工程原则。
3. 生命周期默认策略。
4. 任务级调整。
5. AI 默认偏好。

任务级调整可以改变当前任务的工作方式，例如省略非必要的独立文档，但不得静默绕过安全、数据保护或已确认外部承诺。调整必须说明理由、作用域和失效条件；默认作用域为当前任务，任务结束即失效，不回写 Profile。

发生冲突时：
- 说明冲突事实和来源。
- 说明受影响的决策领域。
- 阻止默认的高风险或破坏性动作。
- 提供符合更高优先级约束的替代方案。
- 需要人工裁决时明确请求确认。

## 8. Context Loading 与 Harness

所有 Harness 统一遵循项目根目录 AGENTS.md：
1. 读取 `context/PROJECT_PROFILE.yaml`。
2. 读取本规范（若该规范已安装；否则遵循 AGENTS.md 中内嵌的基础规则）。
3. 读取任务入口和任务文件。
4. 按任务需要懒加载 business、tech、experience、specification 上下文。
5. 运行现有 Phase Router，选择 Workflow Phase。

简单查询可按需加载，但涉及设计、实现、重构、数据、兼容、发布的任务必须使用 Profile 中相关事实。AGENTS.md 是跨 Harness 入口，不要求 Harness 专用插件。

## 9. 初始化与维护

- New：生成带 unknown 值的 Profile 模板；不得替用户猜测。
- Retrofit：先检查现有权威资料，生成候选画像；不得覆盖现有 AGENTS、业务资料或人工确认值。
- AI 更新：仅更新 ai_maintained 字段，并记录来源。
- 关键变化：写入 pendingChanges，等待维护者确认。
- Profile 与仓库证据矛盾：报告差异，不静默覆盖。

## 10. 验收场景

行为测试基线见 `docs/standards/checklists/project-operating-context-acceptance.md`。Schema 结构测试与策略行为测试分开执行。

## 11. 非目标

第一版不实现数据库、后台管理 UI、自动生命周期状态机、独立 Policy Engine、Harness 专用插件、项目任务管理、会话记忆或 aief-pm 编译 Profile 集成。
