# Cherry Studio 数据模型概览

**日期：** 2026-05-29

## 1. 数据存储总体结构

Cherry Studio 的核心业务数据主要落在 SQLite 中，schema 由 Drizzle 定义，位于：

- `src/main/data/db/schemas/`

同时项目还依赖：

- BootConfig 文件配置
- Cache 内存/共享/持久缓存
- Preference key-value 设置

所以“数据模型”不等于“所有状态”，这里只聚焦 SQLite 业务实体。

## 2. 主实体域

从 schema 清单看，核心实体可以按域拆成以下几组。

### 对话与助手

- `assistant`
- `assistantRelations`
- `topic`
- `message`
- `group`
- `pin`
- `prompt`
- `tagging`

### 文件与知识库

- `file`
- `knowledge`
- `note`
- `miniApp`

### Provider / Model / 翻译

- `userProvider`
- `userModel`
- `translateLanguage`
- `translateHistory`
- `mcpServer`

### 代理与自动化

- `agent`
- `agentChannel`
- `agentGlobalSkill`
- `agentSession`
- `agentSessionMessage`
- `agentSkill`
- `agentTask`
- `job`

### 系统内部状态

- `preference`
- `appState`

## 3. 对话域模型

### `topic`

职责：

- 对话主题/线程容器
- 关联 assistant
- 维护 active node
- 通过 fractional indexing 支持排序

关键字段：

- `assistantId`
- `activeNodeId`
- `groupId`
- `orderKey`

### `message`

职责：

- 存储消息树
- 以 adjacency list 的 `parentId` 表示树结构
- `data` 字段保存 block JSON
- `searchableText` + FTS5 支持全文检索

关键点：

- `topicId` 级联删除
- `modelId` 引到 `userModel`
- `traceId`、`stats` 支持链路与统计
- 自定义 trigger 维护 FTS 虚表

### `assistant`

职责：

- 用户定义的助手实体
- 包含提示词、emoji、描述、model 和 settings

关键点：

- `modelId` 可为空，表示尚未选模型
- `settings` 是 JSON blob

## 4. 文件与知识库域

### `file_entry` / `file_ref`

`file.ts` 里实际定义了两个重要实体：

#### `file_entry`

表示 Cherry 管理的文件实体。

支持两类 origin：

- `internal`
- `external`

设计要点：

- internal 文件由 Cherry 持有内容
- external 文件只保存引用路径
- external 文件大小不持久化，实时从文件系统读取
- 软删除只适用于 internal

#### `file_ref`

表示业务实体对文件的多态引用：

- `fileEntryId`
- `sourceType`
- `sourceId`
- `role`

这是文件系统和业务对象之间的桥接表。

### `knowledge_base` / `knowledge_item`

知识库 durable metadata 分两层：

#### `knowledge_base`

- base 元数据
- embedding / rerank model
- chunk 策略
- 搜索模式
- 状态与错误

#### `knowledge_item`

- base 下的导入项
- 支持 file / url / note / sitemap / directory
- 管理处理状态与错误
- 通过 `(baseId, groupId)` 维护扩展子项关系

实际向量索引、chunk 和 embedding 不完全平铺在关系表里，而更多由运行态系统管理。

## 5. Agent / 自动化域

Agent 相关 schema 覆盖：

- agent 定义
- channel
- skill
- global skill
- session
- session message
- task

这说明代理系统不是“附加脚本功能”，而是已经成为数据模型中的一等领域。

另外，`job` 表说明后台任务和调度也有自己的持久化模型。

## 6. Provider / Model 域

### `userProvider`

- 用户级 provider 配置
- 包括 endpoint、鉴权与启用信息

### `userModel`

- 用户可用模型定义
- `message`、`assistant`、`knowledge_base` 等会引用它

这套模型是把静态 registry 与用户配置实例化后的业务层。

## 7. 系统状态模型

### `preference`

虽然 Preference 更像 key-value 配置系统，但底层仍会落在 SQLite。

### `appState`

用于内部 continuity marker，而不是用户面向的业务实体。常见用途是：

- 迁移状态
- seeding 状态
- 一次性流程连续性

## 8. 关系与删除语义

从已读 schema 可以看到较明确的删除策略：

- `topic -> message`：cascade
- `assistant -> topic`：set null
- `group -> topic`：set null
- `knowledge_base -> knowledge_item`：cascade
- `file_entry -> file_ref`：cascade

这类语义说明项目更倾向“保留高层业务容器，清理下游从属数据”，而不是广泛硬级联删除所有引用链。

## 9. 数据模型扩展时的检查点

新增实体时，至少自问：

1. 它应该是 Preference 还是 DataApi 业务表？
2. 它是否需要排序键？
3. 删除语义应是 cascade、set null 还是 restrict？
4. 是否需要共享到 `src/shared/data/api/schemas/`？
5. 是否涉及迁移、seed、测试和 renderer hooks？

## 10. 额外注意点

- v2 重构期间，`migrations/sqlite-drizzle/` 是可重建生成物
- FTS、trigger、virtual table 等自定义 SQL 需要额外留意
- 不要把“运行时派生数据”误塞进持久化 schema

---

最重要的理解不是每张表的字段，而是：Cherry Studio 已经把对话、文件、知识库、provider、agent、job 都建成了长期可演进的业务域，而不是零散配置。
