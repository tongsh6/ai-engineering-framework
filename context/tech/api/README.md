# API 文档

> 项目 API 设计与规范。

## API 风格

<!-- REST / GraphQL / gRPC 等 -->

- 风格：[REST / GraphQL / gRPC]
- 版本策略：[URL 路径 / Header / 无版本]
- 认证方式：[JWT / OAuth / API Key]

## 端点列表

| 模块 | 文档 | 描述 |
|------|------|------|
| [模块1] | [module1-api.md](module1-api.md) | [模块1功能] |
| [模块2] | [module2-api.md](module2-api.md) | [模块2功能] |

## 通用约定

### 请求格式

```json
{
  "field1": "value1",
  "field2": "value2"
}
```

### 响应格式

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### 分页格式

```json
{
  "success": true,
  "data": [...],
  "page": {
    "page": 1,
    "size": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 错误码

| 错误码 | 含义 | HTTP 状态码 |
|--------|------|------------|
| [CODE_001] | [错误描述] | [4xx/5xx] |
| [CODE_002] | [错误描述] | [4xx/5xx] |
