---
title: 'Add hth model provider'
type: 'feature'
created: '2026-06-17T00:00:00+08:00'
status: 'done'
baseline_commit: '2be3e15a033b33f7da706ae528dffac607c45c91'
context:
  - '{project-root}/CLAUDE.md'
  - '{project-root}/docs/references/naming-conventions.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 模型服务列表缺少用户需要的 `hth` 渠道。用户希望新增一个名为 `hth` 的渠道，行为复制 `new-api`，并使用 `/Users/chenkangping/Desktop/logo.png` 作为渠道 logo。

**Approach:** 将 `hth` 增加为系统 provider id，但不创建新的 provider type；它复用 `new-api` 的运行时类型、Provider Extension、模型 endpoint type 表单和默认空模型列表。Logo 进入仓库资源或生成产物，不运行时依赖桌面路径。

## Boundaries & Constraints

**Always:** `hth` 对用户显示为 `hth`，系统 provider id 为 `hth`，运行时 `type` 为 `new-api`。默认 host、registry baseUrl、文档/官网链接暂复制 `new-api`。用户可见 label 走 i18n；图标使用 `packages/ui` 现有 provider icon 流程或最小等价产物。保留第一个默认模型修复的未提交改动，不回滚。

**Ask First:** 如果实现过程中发现 `hth` 需要不同 base URL、不同鉴权、不同 provider type、不同模型发现协议、或需要改变 DataApi provider/model schema，先停下询问用户。

**Never:** 不要复制一套新的 AI Core provider implementation；不要把 `hth` 特判成 OpenAI-only；不要修改自动生成的 data-classify 文件；不要引入新 UI 库；不要改动与 `hth` 无关的 `new-api` 行为。

## I/O & Edge Cases

- Provider settings shows `hth` as a disabled system provider with HTH logo and NewAPI-equivalent defaults.
- Adding a model under `hth` shows NewAPI endpoint type controls and preserves endpoint types in the create payload.
- Chat with an `hth` model uses existing NewAPI runtime config and sends provider-facing model id through `apiModelId`.
- Registry/API compatibility recognizes `hth` as system/NewAPI-compatible where intended; unrelated unsupported-provider errors stay unchanged.

</frozen-after-approval>

## Code Map

- `src/renderer/types/provider.ts` -- add `hth` to system provider ids; keep provider type unchanged.
- `src/renderer/config/providers.ts` and `src/renderer/config/models/default.ts` -- legacy provider catalog, URLs, and empty default models.
- `packages/provider-registry/data/providers.json` -- v2 static provider registry entry copied from `new-api` with id/name/description changed to `hth`.
- `src/renderer/pages/settings/ProviderSettings/utils/provider.ts`, `src/renderer/utils/provider.ts`, `src/renderer/components/Popups/SelectModelPopup/v2ModelPopupAdapter.ts`, `src/renderer/pages/settings/ProviderSettings/utils/v1ProviderShim.ts`, `src/renderer/aiCore/services/listModels.ts` -- classify `hth` as NewAPI-family where behavior is intended.
- `src/main/apiServer/utils/index.ts`, `src/main/services/AgentBootstrapService.ts`, `src/shared/config/providers.ts`, `src/renderer/pages/code/index.ts` -- provider allowlists/switches that should include `hth` if they include NewAPI-family providers.
- `src/main/data/db/seeding/seeders/presetProviderOrderSeeder.ts` and `src/renderer/store/migrate.ts` -- keep `hth` first for existing and migrated provider lists.
- `packages/ui/icons/providers/light/hth.svg` plus generated provider icon registration.
- `src/renderer/i18n/label.ts`, `src/renderer/i18n/locales/*.json`, `src/renderer/i18n/translate/*.json` -- provider label key `provider.hth`.
- Existing tests near provider helpers, shims, popup adapter, provider config/listModels, and model drawer -- focused regression coverage.

## Tasks & Acceptance

**Execution:**
- [x] Register `hth` as a system provider in shared/renderer provider ids, legacy provider config, default model config, provider registry JSON, and relevant allowlists.
- [x] Update NewAPI-family detection/adapter paths so `hth` gets `type: 'new-api'`, NewAPI list-model behavior, and model drawer endpoint type UI.
- [x] Add HTH provider logo by converting `/Users/chenkangping/Desktop/logo.png` into repo icon assets and registering it in `@cherrystudio/ui` provider icon lookup.
- [x] Place `hth` first in default provider ordering and seed that order for existing databases.
- [x] Add i18n provider label entries for `hth`.
- [x] Add focused tests for `hth` provider detection, v2-to-v1 shim or popup adapter behavior, model drawer endpoint type payload, and provider config/list model routing where practical.

**Acceptance Criteria:** Provider settings lists `hth` with logo/defaults; model add flow exposes endpoint type controls and preserves them; chat runtime uses the existing NewAPI implementation.

## Spec Change Log

- 2026-06-17: Vectorizing `/Users/chenkangping/Desktop/logo.png` through the existing UI script produced oversized SVGs, so the implemented logo uses a compact embedded 256px PNG inside `packages/ui/icons/providers/light/hth.svg`, then runs the existing provider icon generators. `pnpm i18n:sync` added placeholder translate entries for non-primary locales.
- 2026-06-17: Follow-up requested `hth` first; registry/default order, v1 migration order, and a one-shot provider-order seeder now place `hth` before `new-api`.

## Design Notes

`hth` is a new system provider id, not a new provider type. The PNG logo should be converted through the existing UI icon pipeline when possible; if that path is blocked, document the minimal fallback in the change log.

## Verification

**Commands:**

- `pnpm --dir packages/ui exec tsx scripts/generate-icons.ts --type=providers --only=hth`
- `pnpm --dir packages/ui exec tsx scripts/generate-avatars.ts --type=providers`
- `pnpm exec vitest run --project renderer src/renderer/utils/__tests__/provider.test.ts src/renderer/pages/settings/ProviderSettings/utils/__tests__/v1ProviderShim.test.ts src/renderer/components/Popups/SelectModelPopup/__tests__/ChatModelPopup.test.tsx src/renderer/pages/settings/ProviderSettings/ModelList/__tests__/ModelDrawer.test.tsx src/renderer/aiCore/services/__tests__/listModels.test.ts src/renderer/aiCore/provider/__tests__/providerConfig.test.ts --reporter=basic`
- `pnpm exec vitest run --project ui packages/ui/src/components/icons/__tests__/svgIds.test.ts --reporter=basic`
- `pnpm i18n:sync`
- `pnpm format`
- `pnpm lint`
- `pnpm test`

**Result:** Focused tests passed, `pnpm format` passed, `pnpm lint` passed after `pnpm i18n:sync` sorted locale keys, and the final full `pnpm test` run passed with 708 test files and 9792 tests passing, 76 skipped. `pnpm build:check` passed lint/typecheck/i18n/format/OpenAPI checks, then stopped on pre-existing `docs:check-links` failures in `.agents/skills` template links.
