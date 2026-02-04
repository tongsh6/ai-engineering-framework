# 前端开发规范

> 前端代码的编写规范和最佳实践。

## 代码组织

### 目录结构

```
src/
├── views/          # 页面组件
├── components/     # 通用组件
├── api/            # API 客户端
├── stores/         # 状态管理
├── router/         # 路由配置
├── utils/          # 工具函数
└── types/          # TypeScript 类型
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `UserProfile.vue` |
| 工具文件 | camelCase | `dateUtils.ts` |
| 类型文件 | camelCase | `user.types.ts` |
| CSS 类名 | kebab-case | `user-profile` |

## 组件规范

### 组件结构

```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup lang="ts">
// 1. imports
// 2. props/emits
// 3. state (ref/reactive)
// 4. computed
// 5. methods
// 6. lifecycle hooks
</script>

<style scoped>
/* 样式 */
</style>
```

### 状态管理

| 状态类型 | 管理方式 | 示例 |
|---------|---------|------|
| 页面局部状态 | `ref`/`reactive` | 表单数据、加载状态 |
| 跨组件共享 | Props/Events | 父子组件通信 |
| 全局状态 | Pinia Store | 用户信息、主题 |

### Props 定义

```typescript
// 使用 TypeScript 类型
interface Props {
  userId: string
  showAvatar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAvatar: true
})
```

## TypeScript 规范

### 类型定义

```typescript
// 优先使用 interface
interface User {
  id: string
  name: string
  email: string
}

// 联合类型使用 type
type Status = 'active' | 'inactive' | 'pending'
```

### 禁止事项

- ❌ 使用 `any` 类型
- ❌ 使用 `@ts-ignore`
- ❌ 省略函数返回类型（公共函数）

## API 调用

### 封装规范

```typescript
// api/modules/user.ts
import { get, post } from '@/api/http'
import type { User, CreateUserReq } from '@/types/user'

export function getUser(id: string): Promise<User> {
  return get(`/users/${id}`)
}

export function createUser(data: CreateUserReq): Promise<User> {
  return post('/users', data)
}
```

### 错误处理

```typescript
try {
  const user = await getUser(id)
} catch (error) {
  // 全局拦截器处理通用错误
  // 这里处理业务特定错误
  if (error.code === 'USER_NOT_FOUND') {
    // ...
  }
}
```

## 测试规范

### 单元测试

- 测试文件命名：`[ComponentName].spec.ts`
- 测试工具类和纯函数
- 测试关键业务逻辑

### 组件测试

```typescript
import { mount } from '@vue/test-utils'
import UserProfile from './UserProfile.vue'

describe('UserProfile', () => {
  it('renders user name', () => {
    const wrapper = mount(UserProfile, {
      props: { user: { name: 'John' } }
    })
    expect(wrapper.text()).toContain('John')
  })
})
```

## 常见反模式

| 反模式 | 问题 | 正确做法 |
|--------|------|---------|
| Prop Drilling | 多层传递 props | 使用 provide/inject 或 store |
| 巨型组件 | 组件超过 300 行 | 拆分为子组件 |
| 直接修改 props | 违反单向数据流 | emit 事件给父组件处理 |
