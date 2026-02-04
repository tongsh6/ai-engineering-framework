# 知识库导航

> 项目知识的入口索引，帮助 AI 快速定位相关文档。

## 目录结构

```
context/
├── INDEX.md           # 本文件
├── business/          # 业务知识
│   ├── domain-model.md    # 领域模型
│   └── glossary.md        # 术语表
├── tech/              # 技术知识
│   ├── architecture.md    # 架构设计
│   ├── api/               # API 文档
│   └── conventions/       # 开发规范
└── experience/        # 经验知识
    ├── INDEX.md           # 经验索引
    └── lessons/           # 经验文档
```

## 业务知识 (business/)

| 文档 | 内容 | 适用场景 |
|------|------|---------|
| `domain-model.md` | 核心领域模型、实体关系、业务规则 | 理解业务逻辑、实现领域代码 |
| `glossary.md` | 项目术语表、概念定义 | 统一术语、避免歧义 |

## 技术知识 (tech/)

| 文档 | 内容 | 适用场景 |
|------|------|---------|
| `architecture.md` | 系统架构、模块边界、技术选型 | 技术决策、模块设计 |
| `api/` | API 文档、接口规范 | API 开发、集成 |
| `conventions/backend.md` | 后端开发规范 | 编写后端代码 |
| `conventions/frontend.md` | 前端开发规范 | 编写前端代码 |
| `conventions/testing.md` | 测试规范 | 编写测试 |
| `conventions/database.md` | 数据库规范 | 数据库设计、迁移 |

## 经验知识 (experience/)

| 文档 | 内容 | 适用场景 |
|------|------|---------|
| `INDEX.md` | 经验索引、按领域/类型分类 | 检索相关经验 |
| `lessons/` | 具体经验文档 | 深入了解某个经验 |

## 加载优先级

AI 加载上下文时，按以下优先级：

1. **当前任务直接相关**（最高）
   - 任务提到的具体文档
   - 任务涉及领域的规范

2. **历史经验**
   - 从 experience/INDEX.md 检索匹配的经验

3. **通用规范**
   - 项目级开发规范
   - 架构约束

4. **背景知识**（按需）
   - 领域模型
   - 术语表
