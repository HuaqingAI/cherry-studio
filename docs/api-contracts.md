# Cherry Studio API 契约概览

**日期：** 2026-05-29

## 1. API 面分类

Cherry Studio 有三类不同的接口边界：

1. **Preload / IPC API**
2. **内部 DataApi**
3. **本地 HTTP API / MCP**

它们的目的、调用方和稳定性都不同，不能混为一谈。

## 2. Preload / IPC API

`src/preload/index.ts` 暴露了大型 `window.api` 接口面，主要分类包括：

- `application`
- `file`
- `tree`
- `knowledgeBase`
- `preference`
- `dataApi`
- `apiServer`
- `skill`
- `agentSessionStream`
- `trace`
- `ocr`
- `webSearch`
- `window`
- `selection`
- `openclaw`

这个接口面服务于渲染层，是桌面应用内部最核心的 API 契约。

## 3. 内部 DataApi

### 位置

- 共享 schema：`src/shared/data/api/schemas/`
- 主进程实现：`src/main/data/api/`
- 渲染层消费：`src/renderer/data/hooks/useDataApi.ts`

### 已注册的主要资源域

从 `src/shared/data/api/schemas/index.ts` 看，目前整合的资源包括：

- topics
- messages
- temporaryChats
- models
- providers
- translate
- files
- mcpServers
- knowledges
- miniApps
- notes
- assistants
- tags
- prompts
- groups
- pins
- agents
- agentChannels
- jobs

### 设计意图

DataApi 用于 SQLite-backed business data，不适合：

- 纯副作用控制
- 无数据库实体的流程
- 纯外部 API proxy

## 4. 本地 HTTP API

位置：`src/main/apiServer/`

### 公共路由

- `GET /health`
- `GET /`
- `GET /api-docs`
- `GET /api-docs.json`

### 受保护的 `v1` 路由

- `POST /v1/chat/completions`
- `POST /v1/messages`
- `POST /:provider/v1/messages`
- `GET /v1/mcps`
- `GET /v1/mcps/:server_id`
- `GET /v1/knowledge-bases`
- `GET /v1/knowledge-bases/:id`
- `POST /v1/knowledge-bases/search`
- `PUT /v1/agents/reorder`
- `PUT /v1/agents/:agentId/sessions/reorder`

### 认证

`createApp()` 中对 provider-specific messages route 和 `/v1` router 统一挂载了 `authMiddleware`。

## 5. 关键 HTTP 契约说明

### Chat Completions

`/v1/chat/completions` 目标是兼容 OpenAI 风格接口：

- 支持流式与非流式响应
- 统一错误映射
- Swagger 注解完整

### Messages

`/v1/messages` 与 `/:provider/v1/messages` 目标是兼容 Anthropic 风格接口：

- 支持 provider:model_id 格式校验
- 也支持 URL path 指定 provider
- 支持流式响应

### Knowledge Bases

knowledge 路由支持：

- 列表
- 单个 base 查询
- 搜索

搜索结果会回传来源 knowledge base 信息与警告信息。

### MCP

`/v1/mcps` 和 `/v1/mcps/:server_id` 暴露当前活跃 MCP server 信息。

## 6. Claw MCP over HTTP

`src/main/apiServer/routes/claw-mcp.ts` 提供按 agentId 建立 session 的 MCP HTTP transport：

- 每个 session 拥有独立 Server + Transport
- 使用 `mcp-session-id`
- 支持 POST / GET / DELETE
- 会在 JSON-RPC request `_meta` 中注入 `agentId`

这不是常规 REST，而是带 session 语义的 MCP transport。

## 7. OpenAPI 文档

项目会生成：

- `src/main/apiServer/generated/openapi-spec.json`

相关命令：

```bash
pnpm generate:openapi
pnpm openapi:check
```

因此改 HTTP API 时，除了改 route 实现，还要注意 Swagger 注解与生成产物一致性。

## 8. API 开发建议

- 对渲染层内部业务操作，优先判断是否应走 DataApi
- 对外兼容协议或标准模型接口，优先放到 `apiServer/`
- 对工具协议或代理通道，优先判断是否应走 MCP / session stream
- 无状态 REST 与带 session 的 transport 要分清设计边界

---

这份 API 文档是一个“边界地图”，帮助你先判断接口应归属哪一层，而不是替代每个 schema 和 route 文件本身。
