# Cherry Studio 项目概览

**日期：** 2026-05-29  
**主项目类型：** Electron 桌面应用  
**架构类型：** 分层桌面应用 + 生命周期服务容器 + 内部 workspace 库

## 执行摘要

Cherry Studio 是一个跨平台 AI 桌面客户端，目标是把多模型聊天、助手、知识库、MCP 工具、代理自动化和本地文件能力整合到一个本地优先的 Electron 应用里。仓库表面上是一个桌面应用，但内部实际上已经演化出较清晰的平台结构：主进程负责生命周期、窗口、数据与系统集成；渲染层负责多窗口 UI 与交互；`packages/` 则沉淀成可复用的 UI、AI provider、provider registry、追踪和编辑器扩展库。

项目当前处于 v2 重构中，很多约束已经稳定下来，尤其是数据分层、生命周期系统、WindowManager、路径管理和日志规范；但仍有一些历史兼容层和待迁移区域存在，文档与实现并非完全静态。

## 项目分类

- **仓库形态：** 单仓库桌面应用，附带多个内部 workspace 包
- **核心交付物：** Cherry Studio 桌面客户端（Windows / macOS / Linux）
- **主要语言：** TypeScript
- **主技术栈：** Electron 41、React 19、TanStack Router、Tailwind CSS v4、Drizzle ORM、Vitest、Playwright
- **数据存储：** SQLite（`@libsql/client` + Drizzle），并辅以 Cache / Preference / BootConfig 分层
- **架构模式：** Electron 多进程 + IoC/lifecycle + 主进程数据服务 + 渲染层 hooks

## 仓库结构认知

虽然 `packages/` 下有多个内部包，但从运行形态和变更边界看，这个仓库更适合被理解为“一个主桌面应用 + 多个内建库”，而不是传统的前后端分离 monorepo。多数业务功能仍以桌面应用为中心组织：

- `src/main/` 是主进程系统中枢
- `src/preload/` 是受控 IPC 暴露层
- `src/renderer/` 是多窗口 React UI
- `src/shared/` 提供跨进程共享类型、schema 和常量
- `packages/` 为应用提供内部复用能力

## 技术栈摘要

| 类别 | 主要技术 | 说明 |
| --- | --- | --- |
| 桌面壳 | Electron 41、electron-vite、electron-builder | 应用运行、打包与窗口管理 |
| 渲染层 | React 19、TanStack Router、Redux、React Query | 多窗口 UI、路由、局部状态与服务数据访问 |
| 样式/UI | Tailwind CSS v4、`@cherrystudio/ui`、Ant Design（历史共存） | 新 UI 优先走内部设计系统，仍存在历史 antd 使用 |
| 数据层 | SQLite、Drizzle ORM、libsql | 业务数据持久化与 schema 管理 |
| 配置/缓存 | BootConfig、Cache、Preference、DataApi | 明确分工的四套数据系统 |
| AI / 模型 | Vercel AI SDK、`@cherrystudio/ai-core`、provider-registry | 模型调用抽象、provider 注册、工具/插件能力 |
| 知识库 | 向量存储、文件处理、RAG 流程 | 文档导入、切块、嵌入、检索 |
| 工具协议 | MCP、OpenClaw / CherryClaw、HTTP API | 本地工具、代理通道、本地开放接口 |
| 工具链 | pnpm 10、Biome、ESLint、Oxlint、Vitest、Playwright | 构建、格式、静态检查与测试 |

## 关键能力域

### 1. 多模型与 Provider 管理

- 支持 OpenAI、Anthropic、Google、xAI 等多家 provider
- 同时维护用户自定义 provider/model 数据
- 通过 `packages/provider-registry` 提供静态注册表
- 通过 `packages/aiCore` 和 `packages/ai-sdk-provider` 管理调用抽象

### 2. 对话、主题与助手系统

- `topic` / `message` 组织对话树
- `assistant` 保存用户定义的角色、提示词、模型与配置
- 渲染层通过 Redux 与 DataApi hooks 协同 UI 和持久化数据

### 3. 知识库与文件系统

- 文件实体通过 `file_entry` / `file_ref` 管理
- 知识库通过 `knowledge_base` / `knowledge_item` 描述 durable metadata
- 实际向量索引和运行态处理由主进程服务层负责

### 4. 代理、MCP 与自动化

- 内建 MCP server 与本地 HTTP API
- 代理系统包含 agent、session、skill、channel、task 等实体
- 提供 Claw MCP over HTTP、OpenClaw 网关、会话流订阅等能力

### 5. 多窗口桌面体验

- 主窗口、设置窗口、快速助手、选区工具栏、Trace 窗口等独立入口
- 统一由 WindowManager / MainWindowService 等主进程服务管理

## 架构亮点

- **启动分相明确：** preboot、bootstrap、running 三个阶段清晰分离
- **生命周期系统成熟：** 主进程的长期资源服务统一注册到 `serviceRegistry.ts`
- **路径与日志有强约束：** 路径走 `application.getPath()`，日志走 `loggerService`
- **数据系统切分清楚：** BootConfig / Cache / Preference / DataApi 职责边界明确
- **多窗口结构规范化：** 每个渲染窗口遵循 `index.html -> entryPoint.tsx -> XxxApp.tsx` 模式
- **内部包沉淀可复用：** UI、AI provider、模型注册、trace、编辑器扩展都被单独抽出

## 开发概览

### 前置条件

- Node.js `>=24.11.1`
- pnpm `10.27.0`
- Windows 环境需启用 symlink 支持
- 推荐先阅读 `CLAUDE.md`、`DESIGN.md` 和相关目录 README

### 启动项目

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

### 关键命令

- **本地开发：** `pnpm dev`
- **调试模式：** `pnpm debug`
- **全量测试：** `pnpm test`
- **静态检查：** `pnpm lint`
- **格式化：** `pnpm format`
- **构建前检查：** `pnpm build:check`
- **E2E：** `pnpm test:e2e`

## 主要目录摘要

- `src/main/`：主进程核心、数据层、服务、API、MCP、知识库
- `src/preload/`：受控 Electron API 暴露层
- `src/renderer/`：页面、窗口、组件、store、数据 hooks、AI UI
- `src/shared/`：跨进程共享 schema、类型、协议、配置
- `packages/ui/`：内部设计系统与组件库
- `packages/aiCore/`：统一 AI provider 调用核心
- `packages/provider-registry/`：provider / model 静态注册表
- `tests/`：mocks、helpers、e2e、API HTTP 样例
- `docs/`：指南与技术参考
- `v2-refactor-temp/`：v2 重构临时工件

## 建议的阅读顺序

1. [文档索引](./index.md)
2. [系统架构](./architecture.md)
3. [源码树分析](./source-tree-analysis.md)
4. [数据模型概览](./data-models.md)
5. [开发指南](./development-guide.md)

---

这份概览适合作为第一次进入仓库时的“地图页”，后续做具体修改时再跳转到对应专题文档和原生参考文档。
