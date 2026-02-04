# 测试规范

> 项目测试策略和编写规范。

## 测试策略

### 测试金字塔

```
        /\
       /  \
      / E2E \        少量：关键用户流程
     /------\
    /  集成   \      适量：模块间协作
   /----------\
  /   单元测试  \    大量：业务逻辑
 /--------------\
```

### 测试覆盖策略

| 层级 | 测试类型 | 覆盖率目标 | 重点 |
|------|---------|-----------|------|
| 领域层 | 单元测试 | 90%+ | 业务规则、状态流转 |
| 应用层 | 单元/集成 | 80%+ | 用例编排、事务 |
| 接口层 | 集成测试 | 70%+ | 请求/响应格式 |
| 前端 | 组件测试 | 关键组件 | 用户交互 |

## TDD 流程

```
1. RED    → 先写失败测试
2. GREEN  → 最小实现通过
3. REFACTOR → 优化保持绿色
```

### TDD 示例

```
需求：用户密码长度至少 8 位

1. RED
   test: "should reject password shorter than 8 chars"
   → 运行测试，失败 ✗

2. GREEN
   实现最小代码使测试通过
   → 运行测试，通过 ✓

3. REFACTOR
   优化代码结构，保持测试绿色
   → 运行测试，仍通过 ✓
```

## 命名规范

### 测试文件

| 类型 | 后端 | 前端 |
|------|------|------|
| 单元测试 | `*Test.java` | `*.spec.ts` |
| 集成测试 | `*IntegrationTest.java` | `*.e2e.ts` |

### 测试方法

**推荐格式**：`should_[期望行为]_when_[条件]`

```
✓ should_return_error_when_password_too_short
✓ should_create_user_when_valid_input
✗ testCreateUser (不够描述性)
```

## 测试结构

### Arrange-Act-Assert (AAA)

```
// Arrange - 准备测试数据和环境
[setup code]

// Act - 执行被测试的行为
[action code]

// Assert - 验证结果
[assertion code]
```

### Given-When-Then (BDD)

```
// Given - 初始状态
[precondition]

// When - 触发行为
[action]

// Then - 期望结果
[expected outcome]
```

## 测试数据

### 测试数据原则

- 使用有意义的测试数据（不用 `test1`, `abc123`）
- 使用工厂方法或 Builder 创建测试对象
- 避免测试间共享可变数据

### 示例

```
// 不推荐
User user = new User("test", "test@test.com", "123");

// 推荐
User user = UserTestFactory.createValidUser()
    .withEmail("john@example.com")
    .build();
```

## Mock 策略

### 何时使用 Mock

| 场景 | 是否 Mock | 理由 |
|------|----------|------|
| 外部 API | ✅ Mock | 不稳定、慢、有成本 |
| 数据库 | 看情况 | 单元测试 Mock，集成测试用真实 DB |
| 当前模块内部类 | ❌ 不 Mock | 测试实现而非接口 |
| 纯工具函数 | ❌ 不 Mock | 快速且确定性 |

### Mock 原则

- 只 Mock 你不拥有的代码（外部依赖）
- 不要 Mock 值对象
- Mock 的行为应该反映真实行为

## 常见反模式

| 反模式 | 问题 | 正确做法 |
|--------|------|---------|
| 测试实现细节 | 重构就破坏测试 | 测试行为和结果 |
| 过度 Mock | 测试没有意义 | 只 Mock 必要的依赖 |
| 测试间依赖 | 执行顺序影响结果 | 每个测试独立 |
| 忽略边界情况 | 遗漏 Bug | 测试边界值和异常 |
