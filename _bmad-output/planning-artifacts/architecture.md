---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-05-31'
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-cherry-studio-2026-05-31/prd.md"
  - "_bmad-output/planning-artifacts/prds/prd-cherry-studio-2026-05-31/addendum.md"
  - "_bmad-output/planning-artifacts/prds/prd-cherry-studio-2026-05-31/.decision-log.md"
  - "_bmad-output/planning-artifacts/prds/prd-cherry-studio-2026-05-31/reconcile-brainstorming-session-2026-05-29-213953.md"
  - "_bmad-output/planning-artifacts/prds/prd-cherry-studio-2026-05-31/review-rubric.md"
  - "_bmad-output/planning-artifacts/prds/prd-cherry-studio-2026-05-31/validation-report.md"
  - "_bmad-output/brainstorming/brainstorming-session-2026-05-29-213953.md"
  - "docs/architecture.md"
  - "docs/integration-architecture.md"
  - "docs/data-models.md"
  - "docs/references/data/README.md"
workflowType: 'architecture'
project_name: 'cherry-studio'
user_name: 'hth'
date: '2026-05-31'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
PRD 定义了 26 个功能需求，集中在 7 类能力：企业登录与企业 Provider 激活、企业模型使用、远端知识库消费、远端技能消费、轻量企业入口、客户端纯边界与本地状态、通用状态/缓存/恢复规则。架构上，这不是重做 Cherry Studio，而是在现有 Provider、模型调用、知识库、技能、IPC/preload、Cache/Preference/DataApi 边界上增加企业接入语义和远端资源消费能力。

**Non-Functional Requirements:**
关键 NFR 主要是安全、隐私、可靠性、性能、可观测性、i18n 与可访问性。最影响架构的要求包括：OAuth state 防伪、token/刷新材料不得暴露到非必要渲染路径、日志脱敏、本地缓存不能授权执行、401/403/撤销后必须刷新资源状态、首轮资源拉取不能阻塞主界面、企业登录/资源发现/调用失败必须可诊断。

**Scale & Complexity:**
这是 brownfield Electron 桌面客户端中的企业 AI Infrastructure 接入项目。复杂度为 enterprise，原因是它横跨认证、provider/model、知识库、技能、缓存、错误状态、日志、UI 入口和上游契约，同时要求最小破坏既有个人版路径。

- Primary domain: Electron 桌面客户端 + 企业 AI 上游接入 + 远端资源消费
- Complexity level: enterprise
- Estimated architectural components: 9 个左右，包括企业登录/会话、企业 Provider/凭据解析、资源发现与缓存、模型调用接入、远端知识库适配、远端技能执行、IPC/preload 契约、轻量企业入口 UI、观测与错误状态体系

### Technical Constraints & Dependencies

- Cherry Studio 必须保持纯客户端边界，不实现企业服务端、权限治理、资源管理后台或 OAuth 授权页。
- 企业 AI Infrastructure 是身份、token、模型、知识库、技能、权限和资源可见性的唯一上游。
- Phase 0 需要冻结 OAuth、模型发现、知识库调用、技能执行、资源缓存/撤销五类契约；PRD 评审明确指出不应在这些契约未清楚前直接进入完整实现拆解。
- P0 只支持单个活跃企业账号；切换账号必须清理上一账号登录态、资源元数据缓存和企业偏好。
- 远端知识库和远端技能不复制为本地主数据，只保存必要缓存、会话引用和偏好。
- 新主进程长期资源或持续副作用应进入 lifecycle service；无 DB 支撑的外部调用和副作用不应包装成 DataApi。
- 本地状态选择必须遵守 BootConfig / Cache / Preference / DataApi 分层。
- 新 UI 应使用 `@cherrystudio/ui` 和现有设计系统，用户可见文案走 i18n。
- Provider/model 改动可能牵动 provider registry、用户 provider/model 数据、AI Core 运行时选择、模型选择 UI 和本地 HTTP API 兼容层。

### Cross-Cutting Concerns Identified

- 企业登录态生命周期：授权、回调、保存、刷新、撤销、登出、过期恢复。
- 凭据安全边界：token 存储、渲染层暴露、日志脱敏、旧凭据失效。
- 企业资源状态矩阵：可用、暂无授权资源、加载失败、无权限、登录失效、资源撤销、资源下线、调用超时、缓存过期/离线展示。
- 缓存语义：缓存只加速展示，不作为执行授权依据。
- Provider 兼容性：企业 Provider 是独立 provider type 还是现有调用形态上的 credential resolver，需要架构决策。
- 远端知识库调用形态：检索 API、问答 API、聊天上下文引用三选一或组合方式需要冻结。
- 远端技能执行契约：输入 schema、调用接口、结果 schema、同步/异步、超时和错误分类需要冻结。
- 错误分类与用户提示：401/403、429/quota、网络失败、上游业务错误、资源撤销必须稳定映射。
- 非企业路径保护：个人版 Provider 配置和既有使用路径不能被企业入口破坏。
- 可观测性：企业登录、资源拉取、模型调用、知识库调用、技能调用都需要可诊断日志和埋点口径。

## Starter Template Evaluation

### Primary Technology Domain

Primary domain 是 brownfield Electron 桌面应用，而不是新建项目。当前仓库已经使用 Electron、electron-vite、React、TypeScript、Tailwind CSS、Drizzle/SQLite、Vitest、Playwright，以及内部 workspace 包 `@cherrystudio/ui`、`@cherrystudio/ai-core`、`@cherrystudio/provider-registry`。

### Starter Options Considered

**Option 1: electron-vite official quick-start**

- 当前 electron-vite 文档提供 `npm create @quick-start/electron@latest` / `pnpm create @quick-start/electron`，可选择 `react-ts` 等模板。
- 该 starter 适合新建 Electron + Vite + React 项目。
- 不适合当前项目，因为 Cherry Studio 已经使用 electron-vite，并且已有多窗口、preload、workspace alias、构建、打包和测试体系。

**Option 2: Electron Forge first-party templates**

- Electron Forge 当前提供 `create-electron-app`，包括 `vite` 和 `vite-typescript` 模板。
- Forge Vite 模板适合新建标准 Electron 项目。
- 不适合当前项目，因为会引入另一套 packaging/plugin 约定，与当前 electron-vite + electron-builder + 自定义 workspace 架构冲突。

**Option 3: Tauri React TypeScript starter**

- Tauri 的 `create-tauri-app` 支持 `react-ts`。
- 它适合作为轻量桌面壳的新项目基础。
- 不适合当前项目，因为 PRD 要求最小改造现有 Cherry Studio；迁移到 Tauri 会重写主进程、preload、窗口、文件、知识库、MCP、本地 HTTP API 和原生依赖边界。

**Option 4: Existing Cherry Studio repository foundation**

- 当前工程已经具备 P0 所需基础：Electron 多进程、lifecycle service、provider/model 系统、AI Core、知识库、agent/skill 数据域、Cache/Preference/DataApi 分层、内部 UI 组件库、测试和构建质量门。
- 这是唯一符合 brownfield 最小改造策略的 foundation。

### Selected Starter: Existing Cherry Studio Brownfield Foundation

**Rationale for Selection:**
本项目不是从零开发，而是在现有 Cherry Studio 中接入企业 AI Infrastructure。采用外部 starter 会丢失已有架构资产，并制造迁移成本。架构应基于现有工程继续演进，把企业接入能力落在既有 provider、数据、IPC、知识库、技能和 UI 边界内。

**Initialization Command:**

```bash
# No new project initialization.
# Continue from the existing Cherry Studio repository.
pnpm install
pnpm dev
```

**Architectural Decisions Provided by Existing Foundation:**

**Language & Runtime:**
TypeScript, Electron desktop runtime, Node.js >= 24.11.1, pnpm 10.27.0.

**Styling Solution:**
Tailwind CSS v4 and `@cherrystudio/ui`; new UI must not introduce antd, HeroUI, styled-components, or page-local design systems.

**Build Tooling:**
electron-vite with explicit main/preload/renderer configuration, multi-window renderer inputs, workspace aliases, and electron-builder packaging.

**Testing Framework:**
Vitest projects for main/renderer/shared/aiCore/ui/vectorstores, plus Playwright E2E and repository-specific quality scripts.

**Code Organization:**
Main process services use lifecycle where they own long-lived resources or persistent side effects. Renderer accesses main capabilities through preload/IPC, DataApi hooks, Preference hooks, and Cache hooks. Shared contracts live under `src/shared`.

**Development Experience:**
Use existing commands: `pnpm dev`, `pnpm lint`, `pnpm test`, `pnpm format`, `pnpm build:check`. Implementation stories should begin by identifying the correct existing boundary, not by scaffolding a new app.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

1. 企业接入采用 dedicated enterprise provider 语义：用户侧是“企业 AI”，内部复用现有 provider/model/AI Core 调用链。
2. OAuth、token 刷新、资源发现和远端调用必须由主进程服务承接，渲染层不持有 raw token。
3. 企业 AI Infrastructure 是权限和资源 source of truth；本地缓存只用于展示和恢复，不授权执行。
4. 远端知识库和远端技能不写入本地 `knowledge_base` / `agent_global_skill` 作为主数据。
5. Phase 0 必须冻结 OAuth、模型发现、知识库调用、技能执行、缓存/撤销契约后才能拆实现故事。

**Important Decisions (Shape Architecture):**

1. 企业模型可同步到现有 `user_provider` / `user_model` 作为运行所需的本地 operational metadata，但必须标记为企业来源并由上游刷新/撤销控制。
2. 远端资源元数据通过企业资源客户端层和 CacheService 缓存，不通过 DataApi 建成本地 CRUD 资源。
3. 远端知识库和远端技能通过现有 UI 入口做展示适配，但执行走专用企业调用接口。
4. 所有企业资源状态使用统一状态矩阵和错误分类。
5. 轻量企业入口只落在聊天未登录空状态和设置页次入口，不重做首页。

**Deferred Decisions (Post-MVP):**

- 多企业账号并存。
- 企业管理员后台。
- 首页 Agent、岗位能力包、助手/工作流/MCP 远端接入。
- 专业模式。
- 将远端技能注册为本地 MCP 工具或 Agent workflow primitive。

### Data Architecture

**Decision: Use existing data systems, but separate local business data from remote enterprise resources.**

- `user_provider` / `user_model` 继续承接企业模型调用所需的 provider/model operational metadata。
- 远端知识库、远端技能不复制到 `knowledge_base`、`knowledge_item`、`agent_global_skill` 或 `agent_skill`。
- 企业资源列表使用 CacheService，并带 `fresh/stale/offline/revoked` 等状态。
- 企业账号展示信息和非敏感偏好可进入 Preference。
- token / refresh material 只能由主进程企业认证服务读取，不能通过普通 DataApi 暴露给 renderer。
- 切换企业账号时清理企业 session、资源 cache、企业偏好和企业 provider/model operational rows。

### Authentication & Security

**Decision: Create or generalize a main-process enterprise auth service based on the CherryIN OAuth pattern.**

- OAuth 使用 PKCE + state。
- 授权 URL、回调 scheme、token exchange、refresh、revoke 和错误返回必须由 Phase 0 冻结。
- token exchange 在主进程执行。
- OAuth callback 只回传给发起窗口，不广播给所有窗口。
- 允许的 OAuth/API host 必须有 allowlist 或受控配置。
- 401 后最多刷新并重试一次；刷新失败后清理本地企业登录态并进入重新登录状态。
- 日志必须通过 `loggerService`，并脱敏 Authorization、access token、refresh token、api key、authorization code。

### API & Communication Patterns

**Decision: Use dedicated IPC/main-process service APIs for enterprise side effects, not DataApi.**

- 企业登录、资源刷新、远端知识库调用、远端技能执行都走 dedicated IPC/main service。
- DataApi 只用于已有本地业务数据和 provider/model operational metadata，不包装外部服务调用。
- 上游响应使用 Zod schema 验证。
- 共享契约放在 `src/shared`，包括 resource metadata、resource status、error code、invoke request/response types。
- 错误统一映射为：login expired、permission denied、no assigned resource、resource revoked、resource offline/down、quota/rate limited、network failed、upstream failed、contract invalid。

**Remote knowledge decision:**
P0 不接入本地向量库。架构内建立 `RemoteKnowledgeClient` 抽象，最终上游模式在 Phase 0 从 retrieval API / QA API / chat-context reference 中冻结一种。

**Remote skill decision:**
P0 使用远端可执行入口：metadata、input schema、invoke API、result schema、sync/async mode、timeout、error mapping。不注册成本地 MCP 工具，不进入本地 Agent 编排。

### Frontend Architecture

**Decision: Add a lightweight enterprise entry and source-aware resource UI adapters.**

- 不新增完整首页。
- 未登录主入口在聊天主界面空状态；设置页保留次入口。
- 企业模型进入现有模型选择体验，但隐藏 Provider/API Key/Base URL 等员工不应理解的概念。
- 企业知识库和企业技能在现有入口展示为 source-aware items，带企业来源标识和状态。
- UI 状态使用现有 React/hooks/store 模式；服务数据通过 IPC hooks 和 Cache/Preference hooks。
- 新 UI 使用 `@cherrystudio/ui` + Tailwind，用户可见文本走 i18n。

### Infrastructure & Deployment

**Decision: No new client-owned backend or deployment surface.**

- Cherry Studio 继续作为 Electron 桌面客户端发布。
- 企业能力是否展示由构建配置、运行时配置或上游配置控制。
- CI/质量门沿用现有 `pnpm lint`、`pnpm test`、`pnpm format`、`pnpm build:check`。
- 架构需要为企业 AI Infrastructure 提供 mock/contract fixture，支持本地开发和 ATDD。
- 观测沿用 `loggerService`、现有 trace/analytics 能力，新增企业登录、资源发现、模型调用、知识库调用、技能调用事件。

### Decision Impact Analysis

**Implementation Sequence:**

1. Phase 0 contract freeze and mock fixtures.
2. Enterprise auth service and session lifecycle.
3. Enterprise provider/model operational sync.
4. Enterprise resource discovery/cache/status layer.
5. Remote knowledge adapter.
6. Remote skill adapter.
7. Lightweight enterprise entry and source-aware selectors.
8. Error/status/i18n/observability hardening.
9. ATDD scenarios and regression coverage.

**Cross-Component Dependencies:**

- Auth service gates all enterprise provider/resource calls.
- Provider/model sync depends on model discovery contract.
- Knowledge and skill UI adapters depend on resource metadata and status matrix.
- Error UX depends on shared error taxonomy.
- Cache invalidation depends on account switching and upstream revocation semantics.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
12 类：命名、数据库/缓存边界、IPC/DataApi 选择、共享契约、错误格式、资源状态、OAuth 流程、日志脱敏、UI 展示、loading/retry、测试组织、路径访问。

### Naming Patterns

**Database Naming Conventions:**

- 沿用现有 Drizzle 风格：表名使用 `snake_case` 单数领域名，例如 `user_provider`、`user_model`、`knowledge_base`。
- TS 字段使用 `camelCase`；需要显式 DB 列名时用 Drizzle column name 映射，例如 `endpointConfigs: text('endpoint_configs')`。
- 不为远端企业知识库/技能新增本地主数据表，除非后续架构文档显式改变该决策。

**API Naming Conventions:**

- DataApi path 使用 plural + kebab-case；path params/query/body 使用 camelCase。
- 企业登录、资源刷新、远端知识库调用、远端技能执行使用 IPC，不新增 DataApi endpoint。
- IPC channel 必须集中加入 `src/shared/IpcChannel.ts`，使用稳定领域前缀，例如 `enterprise:*` 或 Phase 0 冻结后的 provider 前缀；不得在组件内手写字符串 channel。

**Code Naming Conventions:**

- 遵守 `docs/references/naming-conventions.md`。
- Stateful domain capability 默认用 `Service`；只有实例池/注册表协调类使用 `Manager`。
- React hook 用 `useXxx.ts`；业务组件用 `PascalCase.tsx`；`packages/ui` 内继续用 kebab-case 文件。

### Structure Patterns

**Project Organization:**

- 主进程长期资源、IPC handler、token/session 生命周期归 lifecycle service。
- 纯转换、分类、schema helper 放在 feature-local `utils/` 或现有 shared/data 类型位置。
- Renderer 不创建单独 “enterprise client” 直连上游；只通过 preload/IPC 调主进程能力。
- 测试优先 colocated `__tests__/`；使用 `*.test.ts(x)`，不用 `.spec.*`。

**File Structure Patterns:**

- 新路径只能通过 `application.getPath()` 和 path registry；不得用 `app.getPath()`、`os.homedir()` 或 ad hoc 用户目录拼接。
- 不新增 top-level directory，除非 PR 明确证明现有 bucket 无法承载。
- 企业资源 UI 以 source-aware adapter 接入现有模型/知识库/技能入口，不复制一套平行 UI 树。

### Format Patterns

**API Response Formats:**

- 上游响应进入主进程后必须先经 Zod schema 验证，再映射为内部 DTO。
- Renderer 只接收内部稳定 DTO 和错误码，不直接消费上游原始 payload。
- DataApi 错误继续遵守 `SerializedDataApiError`；企业 IPC 错误也必须映射到共享 error code + user-safe message + diagnostic context。

**Data Exchange Formats:**

- 内部 DTO 使用 camelCase。
- 时间使用 ISO string 或既有项目类型，不在同一资源中混用 epoch/ISO。
- 资源状态必须统一使用 shared enum：`available`、`empty`、`loadFailed`、`permissionDenied`、`loginExpired`、`revoked`、`offline`、`timeout`、`stale`。
- 缓存条目必须包含 freshness/status，不允许只缓存裸数组。

### Communication Patterns

**Event System Patterns:**

- OAuth callback 只发回发起窗口，不广播。
- IPC payload 必须有共享类型和 Zod 输入校验；不得用 `any` 透传上游响应。
- 状态刷新事件按资源域拆分：models、knowledgeBases、skills，不用一个泛化 “resources updated” 承接全部语义。

**State Management Patterns:**

- 企业资源列表用 CacheService；企业偏好用 Preference；本地业务数据才用 DataApi。
- Renderer loading/error 由 hook 返回的明确状态驱动，不用散落的 `isLoadingX` + `hasErrorY` 组合猜状态。
- 账号切换必须统一触发 session/cache/preference/provider-model 清理流程，不由各 UI 入口各自清。

### Process Patterns

**Error Handling Patterns:**

- 401：刷新一次；失败后清 session 并返回 `loginExpired`。
- 403：返回 `permissionDenied`，并刷新对应资源可见状态。
- 404/410 或上游撤销：标记 `revoked`，缓存不可继续调用。
- 429：映射 `quotaOrRateLimited`。
- 网络失败和上游 5xx 分开记录和展示。
- 日志使用 `loggerService.withContext()`，不得 `console.log`；Authorization、token、api key、code 必须脱敏。

**Loading State Patterns:**

- 登录、资源发现、模型调用、知识库调用、技能调用分别有独立 loading/status。
- 首轮资源拉取不得阻塞主界面可交互；允许先展示登录成功和默认模型状态，再异步刷新知识库/技能。
- retry 只能在主进程服务内集中实现；UI 不重复实现 token refresh 或资源撤销恢复。

### Enforcement Guidelines

**All AI Agents MUST:**

- 先判断改动属于 DataApi、IPC、Cache、Preference 还是 provider/model operational metadata。
- 不把远端企业知识库/技能写入本地主数据表。
- 不让 renderer 持有 raw token 或直接调用企业上游。
- 不新增 UI 文案绕过 i18n。
- 不新增硬编码路径或 `console.log`。
- 不添加 feature-specific lifecycle service 到全局 `tests/__mocks__`。

**Pattern Enforcement:**

- PR/故事必须说明使用了哪个边界：DataApi、IPC、Cache、Preference、provider/model。
- 新 shared schema 必须有 Zod validation 或明确说明只用于 main -> renderer trusted response。
- 新企业错误码、资源状态、IPC channel 必须集中定义并测试。
- 违反模式时优先修正架构边界，不在下游 UI 做补丁。

### Pattern Examples

**Good Examples:**

- `EnterpriseAuthService` 在 main process 处理 OAuth + refresh，并通过 `IpcChannel.Enterprise_StartOAuthFlow` 暴露。
- `RemoteKnowledgeClient` 返回内部 `RemoteKnowledgeResource[]`，renderer 只展示 source-aware selector item。
- 企业资源 cache 形如 `{ status, freshness, resources, fetchedAt, accountId }`。

**Anti-Patterns:**

- 在 React 组件里 `fetch(enterpriseApiUrl, { Authorization })`。
- 把远端知识库插入 `knowledge_base` 并禁用本地编辑按钮来伪装远端资源。
- 为远端技能创建 `agent_global_skill` 行再绕过执行逻辑。
- 在 DataApi 下新增 `POST /auth/login` 或 `POST /skills/:id/invoke` 调外部服务。
- 缓存资源数组但不记录 stale/revoked 状态。

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
cherry-studio/
├── package.json
├── electron.vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── src/
│   ├── shared/
│   │   ├── IpcChannel.ts
│   │   └── enterprise/
│   │       ├── auth.ts
│   │       ├── resources.ts
│   │       ├── errors.ts
│   │       ├── schemas.ts
│   │       └── index.ts
│   ├── main/
│   │   ├── core/application/serviceRegistry.ts
│   │   ├── services/
│   │   │   ├── EnterpriseAuthService.ts
│   │   │   ├── enterprise/
│   │   │   │   ├── EnterpriseResourceService.ts
│   │   │   │   ├── EnterpriseModelClient.ts
│   │   │   │   ├── RemoteKnowledgeClient.ts
│   │   │   │   ├── RemoteSkillClient.ts
│   │   │   │   ├── enterpriseErrorMapper.ts
│   │   │   │   └── __tests__/
│   │   │   ├── knowledge/
│   │   │   └── agents/skills/
│   │   └── data/
│   │       ├── CacheService.ts
│   │       ├── PreferenceService.ts
│   │       ├── services/ProviderService.ts
│   │       └── db/schemas/
│   ├── preload/
│   │   └── index.ts
│   └── renderer/
│       ├── data/hooks/
│       ├── hooks/enterprise/
│       │   ├── useEnterpriseSession.ts
│       │   ├── useEnterpriseResources.ts
│       │   └── useEnterpriseResourceStatus.ts
│       ├── pages/home/
│       │   ├── Inputbar/
│       │   └── components/
│       ├── pages/knowledge/
│       ├── pages/settings/ProviderSettings/
│       ├── pages/settings/EnterpriseSettings/
│       └── i18n/
├── packages/
│   ├── aiCore/
│   ├── provider-registry/
│   └── ui/
├── tests/__mocks__/
└── docs/references/
```

### Architectural Boundaries

**API Boundaries:**

- 企业登录、token refresh、资源发现、远端知识库调用、远端技能执行全部走 main-process lifecycle service + IPC。
- `src/shared/IpcChannel.ts` 集中定义 `enterprise:*` 通道，不允许 renderer 手写 channel 字符串。
- 上游响应进入 renderer 前必须经过 main process Zod schema 校验和 DTO 映射。
- DataApi 不包装 OAuth、资源刷新、知识库远端调用、技能远端执行等外部副作用。

**Component Boundaries:**

- `src/renderer/pages/home/` 承接聊天未登录空状态、默认企业模型、输入框资源入口。
- `src/renderer/pages/knowledge/` 只做远端知识库 source-aware 展示和选择，不把远端知识库伪装成本地可编辑知识库。
- `src/renderer/pages/settings/EnterpriseSettings/` 承接企业账号状态、重新登录、登出、诊断状态。
- `src/renderer/pages/settings/ProviderSettings/` 可以展示企业 Provider 诊断态，但不暴露 API Key、Base URL 给普通员工路径。
- 新 UI 使用 `@cherrystudio/ui` 和 Tailwind，用户可见文案全部进入 `src/renderer/i18n/`。

**Service Boundaries:**

- `EnterpriseAuthService`：OAuth/PKCE/state/token exchange/refresh/revoke/session cleanup。
- `EnterpriseResourceService`：统一模型、知识库、技能资源发现、缓存刷新、状态矩阵。
- `EnterpriseModelClient`：模型发现结果到 provider/model operational metadata 的同步。
- `RemoteKnowledgeClient`：远端知识库 metadata 和调用，不写入 `knowledge_base` 主数据。
- `RemoteSkillClient`：远端技能 metadata 和 invoke，不写入 `agent_global_skill` 或本地 MCP 工具。
- 长生命周期和 IPC handler 服务注册到 `serviceRegistry.ts`，通过 `application.get()` 访问。

**Data Boundaries:**

- Token/refresh material 仅 main process 服务可读，不通过 DataApi 暴露给 renderer。
- 企业资源 metadata 使用 CacheService，必须包含 `status`、`freshness`、`fetchedAt`、`accountId`。
- 企业账号非敏感展示信息和偏好使用 PreferenceService。
- 企业模型调用所需 provider/model operational metadata 可进入现有 provider/model 数据系统，但必须标记 enterprise source，并受上游刷新/撤销控制。
- 远端知识库和远端技能不进入本地 durable 主数据表作为 source of truth。

### Requirements to Structure Mapping

**Feature/Epic Mapping:**

- FR-1 至 FR-5 企业登录与企业 Provider 激活：
  - `src/main/services/EnterpriseAuthService.ts`
  - `src/shared/enterprise/auth.ts`
  - `src/shared/IpcChannel.ts`
  - `src/renderer/hooks/enterprise/useEnterpriseSession.ts`
  - `src/renderer/pages/settings/EnterpriseSettings/`
  - `src/renderer/pages/home/` 未登录空状态入口
- FR-6 至 FR-9 企业模型使用：
  - `src/main/services/enterprise/EnterpriseModelClient.ts`
  - `src/main/data/services/ProviderService.ts`
  - `packages/provider-registry/`
  - `packages/aiCore/`
  - `src/renderer/pages/home/Inputbar/`
  - `src/renderer/pages/settings/ProviderSettings/`
- FR-10 至 FR-13 远端知识库消费：
  - `src/main/services/enterprise/RemoteKnowledgeClient.ts`
  - `src/main/services/knowledge/` source-aware 适配点
  - `src/renderer/pages/knowledge/`
  - `src/renderer/pages/home/Inputbar/tools/knowledgeBaseTool.tsx`
- FR-14 至 FR-17 远端技能消费：
  - `src/main/services/enterprise/RemoteSkillClient.ts`
  - `src/main/services/agents/skills/` source-aware 适配点
  - `src/renderer/pages/settings/SkillsSettings/`
  - `src/renderer/pages/home/Inputbar/tools/resourceTool.tsx`
- FR-18 至 FR-20 轻量企业入口：
  - `src/renderer/pages/home/components/`
  - `src/renderer/pages/settings/EnterpriseSettings/`
  - 不新增完整首页 Agent，不新增独立企业工作台路由。
- FR-21 至 FR-26 客户端边界、状态、缓存与恢复：
  - `src/shared/enterprise/resources.ts`
  - `src/shared/enterprise/errors.ts`
  - `src/main/services/enterprise/enterpriseErrorMapper.ts`
  - `src/main/data/CacheService.ts`
  - `src/main/data/PreferenceService.ts`

**Cross-Cutting Concerns:**

- 安全：`EnterpriseAuthService`、host allowlist、日志脱敏、PKCE/state 校验。
- 观测：所有企业登录、资源发现、模型调用、知识库调用、技能调用日志通过 `loggerService.withContext()`。
- i18n：企业入口、错误状态、空状态、重新登录提示进入 `src/renderer/i18n/`。
- 测试：main service 单测 colocated `__tests__`；renderer hooks/components 用 Vitest；关键路径补 ATDD/E2E。

### Integration Points

**Internal Communication:**

- Renderer 通过 preload 暴露的 enterprise IPC facade 调 main service。
- Main service 内部通过 `application.get('CacheService')`、`application.get('PreferenceService')`、`application.get('WindowManager')` 协调状态。
- provider/model operational sync 通过现有 `ProviderService`，不绕过数据服务直接写库。
- AI Core 调用继续复用现有 provider/model 调用链。

**External Integrations:**

- 企业 AI Infrastructure OAuth 授权、token exchange、refresh、revoke。
- 企业模型发现接口。
- 企业知识库 metadata 与 P0 选定调用接口。
- 企业技能 metadata、input schema、invoke、result schema。
- 所有上游 host 需要 allowlist 或受控配置。

**Data Flow:**

1. 用户点击企业登录。
2. Renderer 调 `enterprise:start-oauth-flow`。
3. Main process 生成 PKCE/state，打开授权 URL。
4. Protocol callback 回到 main process，校验 state，交换 token。
5. Main process 保存 session，拉取模型/知识库/技能 metadata。
6. 模型 operational metadata 同步到 provider/model 系统；知识库/技能 metadata 写入 CacheService。
7. Renderer 通过 hooks 展示企业账号、默认模型、远端知识库、远端技能。
8. 实际调用时 main process 携带 token 调上游；缓存不作为授权依据。

### File Organization Patterns

**Configuration Files:**

- 根目录继续使用现有 `package.json`、`electron.vite.config.ts`、`vitest.config.ts`、`playwright.config.ts`。
- 企业 P0 不新增独立构建系统。
- 如果需要企业能力开关，优先使用受控运行时配置或 Preference/BootConfig 既有路径，具体归属按是否需 pre-lifecycle 决定。

**Source Organization:**

- 共享契约集中在 `src/shared/enterprise/`。
- 主进程企业服务集中在 `src/main/services/enterprise/`，认证入口服务可独立放在 `src/main/services/EnterpriseAuthService.ts` 并注册 lifecycle。
- Renderer 企业 hooks 集中在 `src/renderer/hooks/enterprise/`。
- 页面改动落在现有 home、knowledge、settings、skills/provider 入口，不新增平行产品树。

**Test Organization:**

- Main service 测试放在 `src/main/services/enterprise/__tests__/`。
- Shared schema/error 测试放在 `src/shared/enterprise/__tests__/`。
- Renderer hooks 和页面组件测试放在对应目录 `__tests__/`。
- 不向全局 `tests/__mocks__` 添加 feature-specific mock；仅在需要统一基础设施 mock 时扩展。
- ATDD 覆盖首次企业登录默认模型对话、远端知识库调用、远端技能执行。

**Asset Organization:**

- 企业标识、状态 icon 优先使用现有 icon/UI 组件。
- 如需静态资源，放入对应 renderer 页面或 `src/renderer/assets/`，不建立独立品牌资产系统。

### Development Workflow Integration

**Development Server Structure:**

- 沿用 `pnpm dev` 和 electron-vite 多进程结构。
- 企业上游依赖通过 contract fixture/mock server 支持本地开发，不阻塞主界面启动。

**Build Process Structure:**

- 沿用 `pnpm build`、`pnpm lint`、`pnpm test`、`pnpm format`、`pnpm build:check`。
- 新增 shared schema、IPC、service registry、i18n key 后必须纳入现有类型检查和 i18n 检查。

**Deployment Structure:**

- 不新增 Cherry Studio 自有服务端部署面。
- 企业能力随 Electron 客户端发布。
- 企业 AI Infrastructure 继续拥有 OAuth 页面、资源治理、权限、可见性和服务端策略。

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
现有 Electron + electron-vite + React + TypeScript + lifecycle service + Cache/Preference/DataApi 分层与企业 P0 决策兼容。企业认证和远端调用放在 main process，renderer 只通过 IPC/preload 消费，符合安全边界。

**Pattern Consistency:**
命名、IPC/DataApi 选择、错误映射、资源状态、日志脱敏、测试组织和 UI/i18n 规则相互一致。远端知识库和远端技能不写入本地主数据，和“上游 source of truth”决策一致。

**Structure Alignment:**
Step 6 的结构能承载所有关键边界：shared 契约、main enterprise services、renderer hooks/UI adapters、provider/model operational sync、Cache/Preference 状态分层。

### Requirements Coverage Validation ✅

**Feature Coverage:**
FR-1 至 FR-26 均已映射到具体结构和服务边界：企业登录、模型、远端知识库、远端技能、轻量入口、客户端纯边界、缓存/恢复规则都有架构支撑。

**Functional Requirements Coverage:**
核心 happy path 和异常路径均有落点。特别是 OAuth、token refresh、401/403、撤销、缓存不授权执行、单企业账号清理都有明确模式。

**Non-Functional Requirements Coverage:**
安全、隐私、可靠性、性能、可观测性、i18n、可访问性均被纳入架构约束。性能阈值和埋点字段需在 Phase 0 / 测试计划中冻结。

### Implementation Readiness Validation ✅

**Decision Completeness:**
关键方向已完整：现有 Cherry Studio brownfield foundation、main-process enterprise auth/resource services、专用 IPC、Cache/Preference/DataApi 边界、远端资源 source-aware UI。

**Structure Completeness:**
项目结构足够指导 AI agent 落点，不要求新建独立 app 或服务端。新增文件位置、现有适配点、测试位置均已指定。

**Pattern Completeness:**
主要冲突点已覆盖：命名、状态、错误、缓存、日志、OAuth、loading/retry、UI、测试、路径访问。

### Gap Analysis Results

**Critical Gaps:**
无架构级 critical gap。限制是：只能先进入 Phase 0 契约冻结，不能直接进入完整功能实现。

**Important Gaps:**

- 五类上游契约需要冻结产物：OAuth、模型发现、知识库调用、技能执行、资源缓存/撤销。
- 企业 provider stable id、错误码、资源状态枚举需要在 Phase 0 固化。
- 负向 ATDD、性能基线和观测字段需要补进测试计划。
- UX 仍需把资源状态矩阵转成文案、动作和禁用规则。

**Nice-to-Have Gaps:**

- 后续可补 `docs/references/enterprise/`，沉淀企业接入实现规范。
- mock fixture 路径可在 Phase 0 后固定到测试工具目录。
- 可增加 PR 模板检查项：DataApi/IPC/Cache/Preference/provider-model 边界声明。

### Validation Issues Addressed

PRD 验证报告指出“不应直接进入完整实现拆解”。本架构通过把 Phase 0 contract freeze 设为第一实现优先级解决该风险。后续故事必须先交付契约、mock、状态矩阵和负向验收，再进入业务功能实现。

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

范围限定：ready for Phase 0 contract freeze and mock fixtures. Feature implementation beyond Phase 0 must wait for contract freeze outputs.

**Confidence Level:** high

**Key Strengths:**

- 清楚保护现有个人版路径。
- 明确 main process 安全边界，renderer 不持有 raw token。
- 明确远端资源不变成本地主数据。
- 明确 DataApi/IPC/Cache/Preference 使用边界。
- 结构能直接指导后续故事拆分。

**Areas for Future Enhancement:**

- 多企业账号并存。
- 企业资源目录或工作台。
- 远端技能接入 Agent/MCP/workflow 编排。
- 更完整的企业观测和试点指标体系。

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented.
- Start with Phase 0 contract freeze and mock fixtures.
- Do not implement renderer-side enterprise upstream fetches.
- Do not persist remote knowledge bases or remote skills as local master data.
- Keep all enterprise errors, statuses, IPC channels, and schemas centrally defined.
- Use `loggerService`, `application.get()`, lifecycle services, and existing data boundaries.

**First Implementation Priority:**
Phase 0 contract freeze and mock fixtures for OAuth, model discovery, remote knowledge invocation, remote skill invocation, and resource cache/revocation semantics.
