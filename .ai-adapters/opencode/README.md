# OpenCode 增强配置

> 利用 OpenCode 的 delegate_task 能力实现多 Agent 协作。

## 任务委派映射

OpenCode 支持通过 `delegate_task` 将任务委派给不同类型的 Agent：

| 项目阶段 | OpenCode Category | 推荐 Skills |
|---------|-------------------|-------------|
| 提案/文档撰写 | `writing` | - |
| 技术设计 | `deep` | - |
| 后端实现 | `quick` / `unspecified-low` | - |
| 前端实现 | `visual-engineering` | `frontend-ui-ux` |
| 复杂架构问题 | `ultrabrain` | - |
| 代码审查 | - | 使用内置 `code-reviewer` |

## 使用示例

### 前端功能实现

```typescript
delegate_task(
  category="visual-engineering",
  load_skills=["frontend-ui-ux"],
  prompt="实现用户列表页面，要求：\n1. 支持分页\n2. 支持搜索\n3. 遵循 context/tech/conventions/frontend.md 规范",
  run_in_background=false
)
```

### 后端简单功能

```typescript
delegate_task(
  category="quick",
  load_skills=[],
  prompt="为 User 实体添加 updateEmail() 方法，遵循 DDD 模式",
  run_in_background=false
)
```

### 技术设计咨询

```typescript
delegate_task(
  subagent_type="oracle",
  load_skills=[],
  prompt="评估以下两种缓存策略的优劣：\n1. 本地缓存\n2. Redis 分布式缓存\n考虑：并发、一致性、成本",
  run_in_background=false
)
```

### 并行探索

```typescript
// 同时探索多个方向
delegate_task(
  subagent_type="explore",
  load_skills=[],
  prompt="查找项目中所有使用 @Transactional 的地方",
  run_in_background=true
)

delegate_task(
  subagent_type="explore", 
  load_skills=[],
  prompt="查找项目中所有 Repository 接口的实现",
  run_in_background=true
)
```

## 委派时的上下文传递

委派任务时，必须在 prompt 中包含：

1. **相关规范文件路径**
   - 如：`遵循 context/tech/conventions/backend.md 规范`

2. **项目约束**
   - 如：`使用 TDD 方式开发`

3. **参考代码路径**
   - 如：`参考 src/domain/user/User.java 的实现模式`

## 命令定义

可以在此目录下创建自定义命令，格式参考 `.ai/commands/` 目录的现有命令。
