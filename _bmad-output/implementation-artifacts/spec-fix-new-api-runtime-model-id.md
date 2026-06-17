---
title: 'Fix new-api runtime model id'
type: 'bugfix'
created: '2026-06-17T00:00:00+08:00'
status: 'done'
baseline_commit: '6df278ebe4f9d0d318da68fbfa09c8a4d109a048'
context:
  - '{project-root}/CLAUDE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After adding a default assistant and selecting the GPT 5.4 model from the v2 model list, sending a message fails with `model_not_found` because the request uses the internal unique id `new-api::gpt-5.4` instead of the provider-facing model id `gpt-5.4`. The model/provider configuration is valid; the runtime request path is using the wrong identifier.

**Approach:** Preserve internal unique model ids for UI selection, assistant state, message metadata, and DataApi records, but translate models to their provider-facing API id at the final runtime call boundary. Cover this with focused unit tests so new-api composite ids continue to route through the right provider while sending `apiModelId`.

## Boundaries & Constraints

**Always:** Keep the change surgical; do not redesign model storage or assistant creation. Keep `model.id` as the stable internal identifier everywhere except provider API calls. Use existing v2 model fields (`apiModelId`) when present and fall back to the existing `id` for legacy models. Route logging through `loggerService`; no `console.log`.

**Ask First:** If the fix requires changing persisted assistant/message model ids, changing the v2 model schema, or rewriting the model selector contract, stop and ask before proceeding.

**Never:** Do not special-case only GPT 5.4 string literals. Do not strip `provider::` by ad hoc string replacement in UI code. Do not add fallbacks to legacy v1 data stores or alter unrelated model capability logic.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| New-api composite model | Assistant model `{ id: 'new-api::gpt-5.4', provider: 'new-api', apiModelId: 'gpt-5.4' }` | Runtime completion call uses provider `new-api` and sends model id `gpt-5.4`; stored/UI model id remains `new-api::gpt-5.4` | Existing provider/API errors propagate unchanged |
| Legacy model without apiModelId | Assistant model `{ id: 'gpt-4o', provider: 'openai' }` | Runtime completion call continues to send `gpt-4o` | Existing provider/API errors propagate unchanged |
| Runtime provider lookup fallback | DataApi provider lookup fails | Existing legacy provider fallback still runs and uses the same provider-facing model id fallback rules | Existing warning log remains centralized |

</frozen-after-approval>

## Code Map

- `src/renderer/components/Popups/SelectModelPopup/v2ModelPopupAdapter.ts` -- converts v2 runtime models into legacy popup models and already carries `apiModelId`.
- `src/renderer/services/runtimeProviderResolver.ts` -- resolves v2 providers for selected models before request execution; good home for runtime-id helper or result shape if provider and request id should be resolved together.
- `src/renderer/aiCore/prepareParams/parameterBuilder.ts` -- currently returns `modelId: model.id`, which sends internal unique ids to the AI SDK.
- `src/renderer/services/ApiService.ts` -- creates `AiProvider` and calls `AI.completions(modelId, ...)`; also has check/summarize/generate call paths that pass `model.id` directly.
- `src/renderer/aiCore/AiProvider.ts` -- sends the supplied `modelId` into `executor.streamText({ model })`; should receive the provider-facing id.

## Tasks & Acceptance

**Execution:**
- [x] `src/renderer/types/index.ts` or a narrow helper module -- add `apiModelId?: string` support to the legacy `Model` type/helper surface so existing popup adapter casts are unnecessary or runtime helpers can type-check cleanly.
- [x] `src/renderer/services/runtimeProviderResolver.ts` or a new adjacent helper -- expose a small `getModelApiId(model)` / runtime model resolution helper that returns `model.apiModelId?.trim() || model.id`.
- [x] `src/renderer/aiCore/prepareParams/parameterBuilder.ts` -- return the provider-facing runtime id while leaving `assistant.model.id` unchanged for capability checks and UI metadata.
- [x] `src/renderer/services/ApiService.ts` -- update direct `AI.completions(...)` and `getEmbeddingDimensions(...)` request call sites to use the provider-facing model id where they bypass `buildStreamTextParams`.
- [x] Focused tests -- add or update tests that prove `new-api::gpt-5.4` with `apiModelId: 'gpt-5.4'` sends `gpt-5.4`, while legacy models still send their `id`.

**Acceptance Criteria:**
- Given a default assistant selects the v2 new-api GPT 5.4 model, when the user sends a chat message, then the outbound AI SDK call uses `model: 'gpt-5.4'` rather than `model: 'new-api::gpt-5.4'`.
- Given the same assistant/model, when the UI renders model names or stores message metadata, then the internal model id remains `new-api::gpt-5.4`.
- Given a legacy model without `apiModelId`, when any updated runtime call path executes, then it sends the original `model.id`.

## Spec Change Log

- 2026-06-17: Implementation completed. `getModelApiId()` lives in `src/renderer/utils/model.ts` so runtime code can share the provider-facing id translation without coupling to provider resolution.
- 2026-06-17: Review step completed by local self-review because the available subagent tool requires explicit user authorization for delegation, which conflicts with the BMAD review instruction.

## Design Notes

The distinction is intentional: v2 model rows use `providerId::modelId` as an app-unique key, while provider APIs expect `apiModelId`. The clean boundary is the runtime request layer, not model selection or persistence.

## Verification

**Commands:**
- `pnpm exec vitest run --project renderer src/renderer/aiCore/prepareParams/__tests__/parameterBuilder.test.ts src/renderer/utils/__tests__/model.test.ts src/renderer/components/Popups/SelectModelPopup/__tests__/ChatModelPopup.test.tsx --reporter=basic` -- passed, 3 files / 18 tests.
- `pnpm exec vitest run --project main src/main/data/services/__tests__/AgentService.test.ts --reporter=basic` -- passed, 1 file / 11 tests.
- `pnpm lint` -- passed.
- `pnpm test` -- passed, 704 files / 9766 tests / 76 skipped.
- `pnpm format` -- passed.

## Suggested Review Order

**Runtime Id Boundary**

- The main chat path now sends provider-facing model ids.
  [`parameterBuilder.ts:242`](../../src/renderer/aiCore/prepareParams/parameterBuilder.ts#L242)

- Central helper preserves legacy fallback and trims v2 API ids.
  [`model.ts:75`](../../src/renderer/utils/model.ts#L75)

- Direct summary/generate bypass paths use the same runtime id rule.
  [`ApiService.ts:549`](../../src/renderer/services/ApiService.ts#L549)

- Embedding checks no longer send app-unique model ids.
  [`AiProvider.ts:329`](../../src/renderer/aiCore/AiProvider.ts#L329)

**V2 Model Bridge**

- Popup adapter preserves `apiModelId` while keeping internal ids selectable.
  [`v2ModelPopupAdapter.ts:31`](../../src/renderer/components/Popups/SelectModelPopup/v2ModelPopupAdapter.ts#L31)

- Provider settings are narrowed before crossing into legacy provider types.
  [`v2ModelPopupAdapter.ts:108`](../../src/renderer/components/Popups/SelectModelPopup/v2ModelPopupAdapter.ts#L108)

**Regression Coverage**

- Composite new-api models resolve to API ids without mutating assistant state.
  [`parameterBuilder.test.ts:215`](../../src/renderer/aiCore/prepareParams/__tests__/parameterBuilder.test.ts#L215)

- Helper tests cover trim and legacy fallback behavior.
  [`model.test.ts:96`](../../src/renderer/utils/__tests__/model.test.ts#L96)

- Agent cleanup expectation matches cascade behavior exposed during full tests.
  [`AgentService.test.ts:222`](../../src/main/data/services/__tests__/AgentService.test.ts#L222)
