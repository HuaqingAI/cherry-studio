# Cherry Studio 开发指南

**日期：** 2026-05-29

## 1. 开发前必须知道的约束

开始编码前，优先阅读这些文件：

- `CLAUDE.md`
- `DESIGN.md`
- `docs/guides/development.md`
- 当前目录或父目录内的 `README.md`

特别重要的硬约束：

- 新主进程长期资源服务必须进入 lifecycle system
- 新 UI 优先使用 `@cherrystudio/ui`
- 日志必须走 `loggerService`
- 主进程路径必须走 `application.getPath()`
- 功能改动默认需要测试

## 2. 环境要求

- Node.js `>=24.11.1`
- pnpm `10.27.0`
- Electron 桌面开发环境
- Windows 下建议开启 symlink 支持

## 3. 初始化

```bash
corepack enable
pnpm install
cp .env.example .env
```

## 4. 常用命令

### 开发

```bash
pnpm dev
pnpm debug
```

### 质量检查

```bash
pnpm lint
pnpm test
pnpm format
pnpm build:check
```

### 测试分项目运行

```bash
pnpm test:main
pnpm test:renderer
pnpm test:aicore
pnpm test:shared
pnpm test:vectorstores
pnpm test:e2e
```

### 其他高频命令

```bash
pnpm generate:openapi
pnpm i18n:check
pnpm i18n:sync
pnpm skills:check
pnpm db:migrations:generate
```

## 5. 主进程开发路径

### 新服务

若服务拥有以下任何特征，应注册到 lifecycle system：

- 长生命周期资源
- 定时器
- IPC handler / listener
- 持续副作用

步骤通常是：

1. 在 `src/main/services/` 或合适子目录创建服务
2. 按 lifecycle 规范实现
3. 注册到 `src/main/core/application/serviceRegistry.ts`
4. 通过 `application.get()` 使用

### 纯工具逻辑

如果只是纯逻辑或短生命周期 helper，可继续使用 direct-import singleton 或普通模块。

## 6. 数据层开发路径

### 新业务数据

通常需要同步改动：

1. `src/main/data/db/schemas/`
2. `src/shared/data/api/schemas/`
3. `src/main/data/api/handlers/` 或 service/repository
4. `src/renderer/data/hooks/` 消费端

### 数据系统选择

- 启动前同步配置：BootConfig
- 临时缓存：Cache
- 用户设置：Preference
- 业务数据：DataApi / SQLite

### 并发写约束

对 SQLite 并发写路径，应使用 `DbService.withWriteTx()`，不要直接假设 `db.transaction()` 足够安全。

## 7. 渲染层开发路径

### 新页面

优先判断是：

- 新窗口
- 现有窗口中的新路由页面
- 页面内局部区域

对应落点通常是：

- 新窗口：`src/renderer/windows/`
- 新页面：`src/renderer/pages/`
- 共享组件：`src/renderer/components/` 或 `packages/ui/`

### 新组件

- 通用基础组件：优先 `packages/ui`
- 应用共享业务组件：`src/renderer/components`
- 页面局部组件：尽量与页面共置

### 新状态

- UI 运行态：Cache / Redux
- 用户设置：Preference
- 业务实体：DataApi

## 8. API 与协议开发

项目内有三类常见接口边界：

- IPC / preload API
- 内部 DataApi
- 本地 HTTP API / MCP

不要混淆使用场景：

- 没有数据库实体支撑的纯副作用操作，通常不应包装成 DataApi
- 对外兼容协议需求，应考虑落到 `apiServer/` 或 `mcpServers/`

## 9. 测试策略

### 单元测试

项目使用 Vitest，多 project 运行。

### Mock 约束

不要临时手搓同类 mock。优先使用：

- `tests/__mocks__/`
- `tests/helpers/`

### 数据库测试

涉及 SQLite 的测试应优先使用 `setupTestDatabase()` 和现成 helper，而不是手写简化 SQL。

### E2E

Playwright 位于 `tests/e2e/`，页面对象模式已经搭好。

## 10. 文档与代码同步

以下改动通常值得同步文档：

- 生命周期服务模式变化
- 数据模型边界变化
- 新窗口 / 新入口
- CI / 发布流程变化
- 用户可感知 breaking change

v2 用户可感知改动还应考虑 `v2-refactor-temp/docs/breaking-changes/`。

## 11. PR 与分支背景

从现有贡献文档看，仓库当前分支策略重点是：

- `main` 进入冻结，只接关键 bugfix
- `v2` 承接主要新特性与重构工作

如果你在做功能性开发，需要先确认当前工作分支是否符合仓库策略。

## 12. 常见误区

- 在主进程模块顶层直接 `application.get()`
- 为简单配置误用 DataApi
- 在窗口业务代码里直接逃逸 `WindowManager` 抽象
- 新 UI 继续引入新的 UI 栈
- 无测试提交行为变更

---

最有效的开发方式不是“找到一个相似文件直接复制”，而是先判断这次改动属于哪一层，然后沿该层现有约束扩展。
