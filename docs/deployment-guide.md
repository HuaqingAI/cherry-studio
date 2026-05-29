# Cherry Studio 部署与发布指南

**日期：** 2026-05-29

## 1. 交付形态

Cherry Studio 是桌面应用，不是传统 server 部署项目。这里的“部署”主要指：

- 本地开发构建
- 多平台桌面打包
- 发布工件生成
- CI 校验与 release 工作流

## 2. 构建入口

### 应用构建

- 配置文件：`electron.vite.config.ts`
- 命令：`pnpm build`

它同时处理：

- 主进程构建
- preload 构建
- 多渲染窗口构建
- OpenAPI 生成前置步骤

### 打包配置

- 配置文件：`electron-builder.yml`

关键点：

- `appId: com.cherryai.cherrystudio`
- `productName: Cherry Studio`
- 协议：`cherrystudio`
- 平台目标：Windows / macOS / Linux

## 3. 平台目标

### Windows

- `nsis`
- `portable`

相关命令：

```bash
pnpm build:win
pnpm build:win:x64
pnpm build:win:arm64
```

### macOS

- `dmg`
- `zip`

相关命令：

```bash
pnpm build:mac
pnpm build:mac:arm64
pnpm build:mac:x64
```

### Linux

- `AppImage`
- `deb`
- `rpm`

相关命令：

```bash
pnpm build:linux
pnpm build:linux:arm64
pnpm build:linux:x64
```

## 4. 打包资源与运行时资源

`electron-builder.yml` 中声明了几类重要资源：

- `build/`：打包资源目录
- `resources/**/*`：运行时资源
- `migrations/sqlite-drizzle`：迁移输出
- `packages/provider-registry/data`：provider/model 静态注册表

这意味着：

- 数据迁移文件是桌面应用运行时的一部分
- provider registry 数据会作为额外资源一同打包

## 5. 发布前质量门

从 `package.json` 与 CI 可见，关键质量门包括：

- `pnpm test:lint`
- `pnpm format:check`
- `pnpm typecheck`
- `pnpm i18n:check`
- `pnpm i18n:hardcoded:strict`
- `pnpm openapi:check`
- `pnpm skills:check`
- 多项目 Vitest 测试

本地推荐命令：

```bash
pnpm build:check
```

## 6. CI 流程

主 CI 文件：`.github/workflows/ci.yml`

核心 job：

- `changes`：按目录检测变更范围
- `changeset-check`
- `basic-checks`
- `general-test`
- `render-test`
- `notify`

其中 `changes` 会根据变更范围决定是否跑 main / renderer / shared 相关测试，减少不必要执行。

## 7. 发布相关工作流

`.github/workflows/` 下还包含：

- `nightly-build.yml`
- `release.yml`
- `release-packages.yml`
- `prepare-release.yml`
- `snapshot.yml`
- `v2-daily-preview-build.yml`
- `update-app-upgrade-config.yml`

说明仓库已经把 nightly、snapshot、正式 release 和预览版分流管理。

## 8. 版本与升级

相关入口：

- `scripts/version.js`
- `app-upgrade-config.json`
- `docs/references/app-upgrade.md`

发布流程里还包含：

- 升级配置更新
- generic provider 发布源
- 版本记录与应用内更新

## 9. 发布源

`electron-builder.yml` 中配置：

- `publish.provider = generic`
- `publish.url = https://releases.cherry-ai.com`

这说明桌面应用更新工件通过 generic release 源分发。

## 10. 打包脚本钩子

打包钩子包括：

- `beforePack: scripts/before-pack.js`
- `afterPack: scripts/after-pack.js`
- `afterSign: scripts/notarize.js`
- `artifactBuildCompleted: scripts/artifact-build-completed.js`

改打包行为时，应优先检查这些脚本，而不只是修改 builder 配置。

## 11. 风险与注意点

- `migrations/sqlite-drizzle/` 是生成物，当前 v2 期间允许重建
- 不要误把 `docs/`、`src/`、`packages/` 等源码目录直接打进最终产物
- provider registry 数据是运行时依赖，不能漏包
- 对平台相关行为改动时，要同步验证 windows/mac/linux target

## 12. 本地验证建议

变更构建/打包相关内容后，至少建议检查：

1. `pnpm build`
2. `pnpm build:check`
3. 受影响平台的一次实际打包命令
4. 关键 extraResources 是否仍被包含

---

Cherry Studio 的“部署”本质是桌面分发流水线维护，核心关注点不是 server 环境变量编排，而是多平台构建、一致性校验、运行资源完整性和升级链路。
