# Cherry Studio 贡献指南摘要

**日期：** 2026-05-29

## 1. 先读什么

提交代码前，建议至少阅读：

- `CONTRIBUTING.md`
- `docs/guides/contributing.md`
- `CLAUDE.md`
- `DESIGN.md`

## 2. 核心贡献原则

- 只做和需求直接相关的改动
- 新功能默认需要测试
- 新 UI 默认使用 `@cherrystudio/ui`
- 主进程长期资源服务走 lifecycle system
- 路径统一走 `application.getPath()`
- 日志统一走 `loggerService`

## 3. 分支策略背景

根据现有贡献文档：

- `main` 分支处于 code freeze，只接受关键 bugfix
- `v2` 分支承接主要新功能、重构和优化

这意味着功能性开发通常不应直接以 `main` 为目标。

## 4. 本地自检

建议至少运行：

```bash
pnpm lint
pnpm test
pnpm format
pnpm build:check
```

## 5. 提交流程要求

- 提交应尽量小而聚焦
- 提交信息使用 Conventional Commit
- 提交需要 `--signoff`

示例：

```bash
git commit --signoff -m "fix(window-manager): handle pooled reuse edge case"
```

## 6. 测试要求

- “没有测试的功能视为不存在”
- 优先使用统一 mock 系统
- 涉及 SQLite 的测试优先用 `setupTestDatabase()`
- E2E 测试位于 `tests/e2e/`

## 7. 文档要求

以下情况通常应补文档：

- 新系统约束
- 新窗口或新数据边界
- 用户可见行为变化
- v2 breaking changes

## 8. PR 阶段建议

- 改动尚未收敛时，可以先开 draft PR
- 涉及方向性不确定的问题，先讨论再扩写代码
- 变更范围跨多个层次时，要在说明里讲清边界与验证方式

## 9. 适合新贡献者的入口

现有贡献文档推荐优先看：

- `good-first-issue`
- `help-wanted`
- `kind/bug`

## 10. 仓库内最重要的额外约束

相比常规开源项目，这个仓库还有几条特别重要：

- 目录级 README 和 `docs/references/` 是一等文档源
- v2 重构期间，不要为旧栈做额外防守式补丁
- migration SQL 是生成物，不是手工维护资产

---

如果你只记住一句话：Cherry Studio 欢迎贡献，但它不是“随手改一处就发 PR”的仓库，先理解约束再改，会少很多返工。
