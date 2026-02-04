# 数据库规范

> 数据库设计和迁移规范。

## 命名规范

### 表命名

| 规则 | 示例 |
|------|------|
| 使用 snake_case | `user_profile` |
| 使用复数形式 | `users`, `orders` |
| 关联表使用两个表名 | `user_roles` |

### 字段命名

| 规则 | 示例 |
|------|------|
| 使用 snake_case | `created_at` |
| 主键统一用 `id` | `id` |
| 外键用 `[表名]_id` | `user_id` |
| 布尔字段用 `is_`/`has_` | `is_active` |
| 时间字段用 `_at` | `created_at`, `updated_at` |

### 索引命名

| 类型 | 格式 | 示例 |
|------|------|------|
| 主键 | `pk_[table]` | `pk_users` |
| 唯一索引 | `uk_[table]_[columns]` | `uk_users_email` |
| 普通索引 | `idx_[table]_[columns]` | `idx_orders_user_id` |
| 外键 | `fk_[table]_[ref_table]` | `fk_orders_users` |

## 设计规范

### 必备字段

每个表应包含：

```sql
id          -- 主键（UUID 或自增）
created_at  -- 创建时间
updated_at  -- 更新时间
```

### 软删除

如需软删除：

```sql
deleted_at  -- 删除时间，NULL 表示未删除
```

### 数据类型选择

| 场景 | 推荐类型 | 不推荐 |
|------|---------|--------|
| 主键 | UUID / BIGINT | INT |
| 金额 | DECIMAL(19,4) | FLOAT |
| 状态 | VARCHAR(20) | INT |
| 时间 | TIMESTAMP WITH TIME ZONE | DATETIME |
| 长文本 | TEXT | VARCHAR(MAX) |

## 迁移规范

### 文件命名

```
V{version}__{description}.sql

示例：
V001__create_users_table.sql
V002__add_email_to_users.sql
V003__create_orders_table.sql
```

### 迁移原则

1. **只增不改**：已发布的迁移不可修改
2. **幂等性**：考虑重复执行的情况
3. **可回滚**：重要变更准备回滚脚本
4. **小步快跑**：每次迁移做一件事

### 危险操作

| 操作 | 风险 | 安全做法 |
|------|------|---------|
| DROP COLUMN | 数据丢失 | 先软删除，确认后再删 |
| RENAME COLUMN | 应用兼容 | 新增列 → 迁移数据 → 删除旧列 |
| 修改类型 | 数据损坏 | 新增列 → 转换数据 → 删除旧列 |

### 大表操作

大表（>100万行）的变更需要特殊处理：

```sql
-- 不推荐：长时间锁表
ALTER TABLE large_table ADD COLUMN new_col VARCHAR(100);

-- 推荐：分批处理或使用 pt-online-schema-change
```

## 查询规范

### 索引使用

```sql
-- 确保 WHERE 条件有索引
SELECT * FROM orders WHERE user_id = ?;  -- idx_orders_user_id

-- 避免索引失效
SELECT * FROM users WHERE LOWER(email) = ?;  -- ❌ 函数使索引失效
SELECT * FROM users WHERE email = LOWER(?);  -- ✓ 应用层处理
```

### N+1 问题

```sql
-- 不推荐：循环查询
for user in users:
    orders = SELECT * FROM orders WHERE user_id = user.id

-- 推荐：批量查询
SELECT * FROM orders WHERE user_id IN (?, ?, ?)
```

## 常见反模式

| 反模式 | 问题 | 正确做法 |
|--------|------|---------|
| 过度范式化 | 查询复杂、性能差 | 适度冗余 |
| 存储 JSON | 查询困难 | 只用于真正非结构化数据 |
| 无约束设计 | 数据不一致 | 添加外键、CHECK 约束 |
| 万能表 | 难以维护 | 拆分为专用表 |
