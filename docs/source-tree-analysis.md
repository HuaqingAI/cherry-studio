# Cherry Studio 源码树分析

**日期：** 2026-05-29

## 概览

Cherry Studio 的目录结构已经明显体现出平台化趋势：`src/` 继续承载主应用代码，`packages/` 承载可复用内部库，`docs/` 承载大量参考资料，`tests/` 维持统一测试入口，而 `v2-refactor-temp/` 作为过渡区保存重构中的工具与记录。

## 关键目录树

```text
cherry-studio/
├─ .agents/                       # 仓库内代理技能与自动化能力
├─ .github/                       # CI、发布、issue/PR 模板
├─ build/                         # 打包资源、安装器脚本、图标等
├─ config/                        # 部分运行/构建配置资源
├─ docs/                          # 指南与技术参考
├─ migrations/                    # drizzle 生成的迁移输出
├─ packages/
│  ├─ ai-sdk-provider/            # CherryIN provider bundle
│  ├─ aiCore/                     # AI Core 抽象层
│  ├─ extension-table-plus/       # TipTap 表格扩展
│  ├─ mcp-trace/                  # trace-core / trace-node / trace-web
│  ├─ provider-registry/          # provider/model 注册表
│  ├─ ui/                         # 内部设计系统与组件库
│  └─ vectorstores/libsql/        # libSQL 向量存储实现
├─ resources/                     # 打包时需要保留的资源
├─ scripts/                       # OpenAPI、i18n、技能、发布等脚本
├─ src/
│  ├─ main/
│  │  ├─ apiServer/               # 本地 HTTP API 与 OpenAPI
│  │  ├─ core/                    # lifecycle / application / paths / window / preboot
│  │  ├─ data/                    # DB、DataApi、Preference、Cache、migration
│  │  ├─ knowledge/               # RAG / 知识库实现细节
│  │  ├─ mcpServers/              # 内建 MCP server
│  │  ├─ services/                # 主进程服务层
│  │  ├─ utils/                   # 主进程工具函数
│  │  └─ index.ts                 # 主进程入口
│  ├─ preload/
│  │  ├─ index.ts                 # 标准 preload，暴露 window.api
│  │  └─ simplest.ts              # 精简 preload
│  ├─ renderer/
│  │  ├─ components/              # 共享 UI 组件
│  │  ├─ data/                    # useQuery/useMutation/usePreference/useCache
│  │  ├─ pages/                   # 页面级业务域
│  │  ├─ queue/                   # 前端队列
│  │  ├─ routes/                  # 路由定义
│  │  ├─ services/                # 渲染层服务
│  │  ├─ store/                   # Redux slice
│  │  ├─ windows/                 # 多窗口入口
│  │  └─ workers/                 # Shiki / Pyodide 等 worker
│  └─ shared/
│     ├─ aiCore/                  # 共享 AI provider 工具
│     ├─ config/                  # 常量、provider 配置、logger 类型
│     ├─ data/                    # 共享 schema、类型、DataApi 协议
│     ├─ file/                    # 文件抽象与 IPC 类型
│     ├─ shortcuts/               # 快捷键定义
│     └─ IpcChannel.ts            # IPC channel 常量
├─ tests/
│  ├─ __mocks__/                  # 统一 mock 系统
│  ├─ apis/                       # HTTP 示例与接口检查
│  ├─ e2e/                        # Playwright E2E
│  └─ helpers/                    # 测试数据库与工具
├─ v2-refactor-temp/              # v2 重构临时工具与文档
├─ AGENTS.md
├─ CLAUDE.md
├─ DESIGN.md
├─ README.md
├─ electron-builder.yml
├─ electron.vite.config.ts
├─ package.json
├─ pnpm-workspace.yaml
└─ vitest.config.ts
```

## 关键目录说明

### `src/main/`

**用途：** 主进程应用平台。  
**包含：** 生命周期、窗口、数据、代理、知识库、系统集成、本地 API。  
**入口：** `src/main/index.ts`

### `src/preload/`

**用途：** 隔离上下文下的桥接层。  
**包含：** `window.api` 暴露、IPC facade、受控 Electron API。  
**集成点：** 渲染层所有需要主进程能力的功能最终都通过这里暴露。

### `src/renderer/`

**用途：** React 渲染层。  
**包含：** 页面、窗口入口、组件、store、hooks、worker。  
**组织模式：** 页面按业务域组织，窗口按独立入口组织。

### `src/shared/`

**用途：** 主/渲染/测试/内部包共享类型与协议。  
**包含：** DataApi schema、文件协议、配置类型、快捷键、IPC channel。  
**重要性：** 这是跨层协作的契约层，很多改动都要同步这里。

### `packages/ui/`

**用途：** 内部 UI 设计系统。  
**包含：** 组件、hooks、icons、styles、storybook、生成脚本。  
**规则：** 新 UI 默认优先落在这里，而不是继续扩散到历史组件栈。

### `packages/aiCore/`

**用途：** 模型调用抽象与插件系统。  
**包含：** provider、plugins、runtime、models、agents。  
**集成点：** 渲染层发起模型请求时会依赖这层抽象。

### `src/main/data/db/schemas/`

**用途：** Drizzle schema 定义。  
**包含：** 对话、文件、知识库、代理、作业、provider、设置等实体表。  
**注意：** migration SQL 是生成物，不应手改。

### `src/renderer/windows/`

**用途：** 多窗口入口编排。  
**包含：** `main`、`settings`、`quickAssistant`、`selection`、`trace` 等。  
**约定：** 每个窗口目录遵循三层启动模式。

### `tests/`

**用途：** 测试基础设施与端到端测试。  
**包含：** mocks、数据库 helper、Playwright 页面对象、API 样例。

## 入口点

- **主进程入口：** `src/main/index.ts`
- **主 preload：** `src/preload/index.ts`
- **渲染主窗口入口：** `src/renderer/windows/main/index.html`
- **设置窗口入口：** `src/renderer/windows/settings/index.html`
- **Trace 窗口入口：** `src/renderer/windows/trace/index.html`
- **构建入口配置：** `electron.vite.config.ts`
- **打包入口配置：** `electron-builder.yml`
- **workspace 入口：** 各包的 `src/index.ts`

## 文件组织模式

### 1. 主进程以职责分层

- `core/` 放平台基础设施
- `data/` 放数据能力
- `services/` 放业务服务
- `apiServer/` 放本地 HTTP API

### 2. 渲染层以业务域和运行入口分层

- `pages/` 放业务页面
- `components/` 放共享 UI
- `windows/` 放独立窗口入口
- `data/` 放跨页面数据访问模式

### 3. 共享协议集中放在 `src/shared/`

跨进程、跨包、跨测试边界的 schema/类型优先收敛到这里，避免主渲染各自复制类型。

### 4. 内部可复用能力抽出到 `packages/`

这是一条明确趋势：UI、AI、registry、trace 都已从主应用代码中抽出。

## 关键文件类型

### 构建与工作区

- `package.json`：顶层命令、依赖与质量门
- `pnpm-workspace.yaml`：workspace 定义
- `electron.vite.config.ts`：主/预加载/渲染构建入口
- `electron-builder.yml`：桌面打包目标与资源清单

### 规范与约束

- `CLAUDE.md`：仓库最重要的开发约束
- `DESIGN.md`：UI 设计规范
- `docs/references/**`：架构、数据、生命周期、窗口等专题文档

### 测试与质量

- `vitest.config.ts`：Vitest multi-project 配置
- `playwright.config.ts`：E2E 配置
- `.github/workflows/ci.yml`：CI 质量门与按目录分流测试

## 配置文件清单

- `package.json`：主命令与依赖图
- `pnpm-workspace.yaml`：workspace 包范围
- `.node-version` / `.nvmrc`：Node 版本
- `biome.jsonc`：格式化与 lint 规则
- `eslint.config.mjs`：ESLint 规则
- `electron.vite.config.ts`：构建入口与 alias
- `electron-builder.yml`：打包、发布、extraResources
- `app-upgrade-config.json`：升级相关配置

## 对开发最重要的结构结论

- 改主进程长期资源能力时，优先看 `src/main/core/` 与 `src/main/services/`
- 改数据协议时，通常要同步 `src/shared/`、`src/main/data/`、`src/renderer/data/`
- 改 UI 时，先判断应放 `packages/ui` 还是 `src/renderer/components`
- 改桌面窗口行为时，优先看 `WindowManager` 和 `windowRegistry.ts`
- 改代理/MCP 时，主入口在 `src/main/services/agents/`、`src/main/services/mcp/`、`src/main/mcpServers/`

---

如果只能记住一件事：这个仓库不是“随便在 `src/` 里加代码”的结构，而是一个已经形成明确层次和边界约束的桌面应用平台。
