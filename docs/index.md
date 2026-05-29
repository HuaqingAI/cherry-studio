# Cherry Studio 项目文档索引

**仓库类型：** 单仓库桌面应用（含内部 workspace 包）  
**主项目类型：** Electron 桌面应用  
**主语言：** TypeScript  
**当前状态：** v2 重构进行中  
**最后更新：** 2026-05-29

## 项目概览

Cherry Studio 是一个跨平台 AI 桌面客户端，核心能力包括多模型接入、对话与助手系统、知识库/RAG、MCP 工具集成、本地 HTTP API、代理/自动化能力，以及多窗口桌面交互。仓库主体是一个 Electron 应用，`packages/` 下维护若干内部库，用于 UI、AI provider 适配、provider registry、追踪与编辑器扩展。

这套文档的目标不是替代仓库里已有的详细参考资料，而是提供一层更适合 AI 和新贡献者快速取用的“系统导航 + 约束摘要 + 扩展入口”。

## 快速定位

- 应用主入口：`src/main/index.ts`
- 预加载桥接：`src/preload/index.ts`
- 渲染层窗口入口：`src/renderer/windows/*/index.html` 与 `entryPoint.tsx`
- 主进程服务注册表：`src/main/core/application/serviceRegistry.ts`
- 数据库 schema：`src/main/data/db/schemas/`
- 共享 DataApi schema：`src/shared/data/api/schemas/`
- 设计系统包：`packages/ui`
- AI Core 包：`packages/aiCore`
- Provider 注册表：`packages/provider-registry`
- 打包配置：`electron-builder.yml`
- Vite/Electron 构建入口：`electron.vite.config.ts`

## 生成文档

- [项目概览](./project-overview.md)
- [系统架构](./architecture.md)
- [源码树分析](./source-tree-analysis.md)
- [组件清单](./component-inventory.md)
- [开发指南](./development-guide.md)
- [部署与发布指南](./deployment-guide.md)
- [贡献指南摘要](./contribution-guide.md)
- [API 契约概览](./api-contracts.md)
- [数据模型概览](./data-models.md)
- [集成架构](./integration-architecture.md)
- [项目结构元数据](./project-parts.json)

## 已有文档入口

### 顶层入口

- [仓库 README](../README.md)
- [开发约束与架构规则](../CLAUDE.md)
- [设计规范](../DESIGN.md)
- [贡献指南](../CONTRIBUTING.md)
- [安全说明](../SECURITY.md)

### 文档导航中心

- [docs/README](./README.md)
- [开发指南目录](./guides/development.md)
- [系统架构参考](./references/architecture-overview.md)
- [数据系统参考](./references/data/README.md)
- [生命周期参考](./references/lifecycle/README.md)
- [窗口管理参考](./references/window-manager/README.md)
- [AI Core 架构](./references/ai-core-architecture.md)
- [CherryClaw / 代理系统](./references/cherryclaw/overview.md)
- [Job 与调度系统](./references/job-and-scheduler/README.md)

## 面向 AI 的使用建议

### 做 UI 改动时

- 先读 [系统架构](./architecture.md) 中的渲染层与窗口章节
- 再读 [组件清单](./component-inventory.md)
- 最后回到 [`DESIGN.md`](../DESIGN.md) 和 `packages/ui`

### 做数据层改动时

- 先读 [数据模型概览](./data-models.md)
- 再读 [数据系统参考](./references/data/README.md)
- 对数据库写路径，优先检查 `DbService.withWriteTx()` 约束

### 做主进程服务改动时

- 先读 [系统架构](./architecture.md) 中的启动与生命周期章节
- 再读 [生命周期参考](./references/lifecycle/README.md)
- 新增长期资源服务时，默认走 lifecycle system，而不是手写 singleton

### 做 Agent / MCP / 工具链改动时

- 先读 [集成架构](./integration-architecture.md)
- 再读 `src/main/services/agents/README.md`、`docs/references/cherryclaw/`、`src/main/mcpServers/`

### 做打包、发布、CI 改动时

- 先读 [部署与发布指南](./deployment-guide.md)
- 再看 `electron-builder.yml` 与 `.github/workflows/`

## 当前重要背景

- 这是一个正在进行 v2 重构的仓库，旧数据栈与新数据栈处于并存阶段。
- `CLAUDE.md` 中对路径、日志、窗口、数据系统、测试、提交规范有硬约束。
- `docs/` 下原有参考文档已经很多；新增文档应优先扮演导航和摘要角色，避免重复维护。

---

这份索引是后续 AI 辅助开发、Brownfield PRD、代码导航和架构问答的首选入口。
