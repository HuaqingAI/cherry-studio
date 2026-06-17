---
title: 'Fix default assistant model on assistant create'
type: 'bugfix'
created: '2026-06-17T00:00:00+08:00'
status: 'done'
baseline_commit: '2be3e15a033b33f7da706ae528dffac607c45c91'
context:
  - '{project-root}/CLAUDE.md'
  - '{project-root}/docs/references/naming-conventions.md'
  - '{project-root}/tests/__mocks__/README.md'
  - '{project-root}/docs/references/testing/database-testing.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 用户在“默认助手模型”里配置默认模型后，从助手库创建新助手时没有生效。新助手应在用户未显式选择模型时自动继承 `chat.default_model_id`，否则默认模型设置会显得“保存了但没用”。

**Approach:** 保持后端 `AssistantDataService.resolveCreateModelId` 作为默认模型注入的权威边界，修正创建助手表单/提交路径，确保未显式选择模型时真正省略 `modelId` 而不是发送 `null` 或旧值；如果用户显式选择模型，则仍按该模型保存。

## Boundaries & Constraints

**Always:** 改动必须保持外科手术式：不重写助手编辑器、不改变 persisted assistant schema、不改变 `chat.default_model_id` preference key。默认模型注入只在 create DTO 省略 `modelId` 时发生；显式 model id 仍要经过 `user_model` 校验。新增或调整测试必须使用现有 mock/DB 测试体系。

**Ask First:** 如果发现修复需要改数据库 schema、改 DataApi assistant create contract、迁移已有 assistant 数据，或重新定义“创建助手时是否允许显式无模型”的产品语义，先停下询问用户。

**Never:** 不要把默认模型硬编码成某个具体模型；不要在创建助手页面直接读 Redux/v1 `llm.defaultModel` 作为回退；不要改变编辑已有助手的 `modelId` 更新语义；不要引入 unrelated UI 重构或新增 provider 渠道。

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Create assistant with configured default model | `chat.default_model_id = 'openai::gpt-4'` exists in Preference and `user_model` has that row; create assistant form is saved without explicitly selecting a model | Create DTO omits `modelId`; main service injects `openai::gpt-4`; returned assistant has `modelId='openai::gpt-4'` and matching `modelName` | Existing validation and transaction rollback behavior stay unchanged |
| Create assistant with explicit model override | User selects a specific model in the create form | Create DTO includes that selected `modelId`; backend validates and persists it instead of using default preference | Invalid model id still returns existing field-scoped validation error |
| Create assistant with stale default preference | `chat.default_model_id` references a missing `user_model` row; form omits `modelId` | Assistant is created with `modelId=null`; warning remains centralized in `AssistantDataService` | No raw FK/Drizzle error leaks |

</frozen-after-approval>

## Code Map

- `src/renderer/services/AssistantService.ts` -- bridge `SharedAssistant.modelId` returned by DataApi back into the legacy `assistant.model` field after create.
- `src/renderer/services/__tests__/AssistantService.test.ts` -- focused renderer coverage proving the created assistant keeps the default model returned by DataApi.
- `src/main/data/services/AssistantService.ts` -- authoritative backend default model injection via `resolveCreateModelId`; unchanged.
- `src/main/data/services/__tests__/AssistantService.test.ts` -- existing DB-backed coverage for default preference injection, stale preference, and explicit `null`.

## Tasks & Acceptance

**Execution:**
- [x] Confirm backend DataApi create already injects `chat.default_model_id` and returns it as `modelId`.
- [x] Fix the renderer `AssistantService.createAssistant` compatibility bridge so the returned default `modelId` becomes legacy `assistant.model`.
- [x] Add focused renderer regression coverage for the created assistant preserving the default model.
- [x] Keep existing backend default-model injection tests green.

**Acceptance Criteria:**
- Given a valid `chat.default_model_id`, when a user creates a new assistant without touching the model field, then the created assistant uses that default model.
- Given a user explicitly selects a model while creating an assistant, when saving, then that selected model overrides the global default.

## Spec Change Log

- 2026-06-17: Investigation showed the create payload/backend injection path was already correct; the bug was in the renderer service adapter dropping returned `modelId` when converting `SharedAssistant` to the legacy assistant shape.

## Design Notes

The default model fix should keep the main process as the source of truth because it already validates `user_model` and handles stale preferences safely. Renderer create mode should express user intent only: omitted means “use global default”; a real id means “override”; explicit `null` should remain a deliberate unbind/update concept, not the default create payload.

## Verification

**Commands:**
- `pnpm exec vitest run --project renderer src/renderer/services/__tests__/AssistantService.test.ts --reporter=basic` -- passed, 1 file / 2 tests.
- `pnpm exec vitest run --project main src/main/data/services/__tests__/AssistantService.test.ts --reporter=basic` -- passed, 1 file / 70 tests.
- `pnpm format` -- passed, no fixes applied.
- `pnpm lint` -- passed with existing warnings and Node engine warning.
- `pnpm test` -- passed on final full run, 708 files / 9792 tests / 76 skipped.
- `pnpm build:check` -- lint/typecheck/i18n/format/OpenAPI checks passed, then `docs:check-links` stopped on pre-existing broken template links under `.agents/skills`.
