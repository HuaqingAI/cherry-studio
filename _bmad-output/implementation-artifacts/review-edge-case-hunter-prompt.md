# Edge Case Hunter Review Prompt

Use the `bmad-review-edge-case-hunter` skill. You may inspect the project. Review the diff below for unhandled edge cases, branching paths, data-shape mismatches, and regression risks. Return only actionable findings, with file/line references and a short reproduction/impact note.

```diff
diff --git a/src/renderer/services/AssistantService.ts b/src/renderer/services/AssistantService.ts
index c506b5996..4489e7040 100644
--- a/src/renderer/services/AssistantService.ts
+++ b/src/renderer/services/AssistantService.ts
@@ -26,6 +26,7 @@ import type {
 import type { CreateAssistantDto } from '@shared/data/api/schemas/assistants'
 import type { CreateTopicDto } from '@shared/data/api/schemas/topics'
 import type { Assistant as SharedAssistant } from '@shared/data/types/assistant'
+import { parseUniqueModelId } from '@shared/data/types/model'
 import type { Topic as SharedTopic } from '@shared/data/types/topic'
 import type { TranslateLanguage } from '@shared/data/types/translate'
 import { v4 as uuid } from 'uuid'
@@ -193,6 +194,27 @@ function mapSharedTopicToLegacyTopic(topic: SharedTopic): Topic {
   }
 }
 
+function mapSharedAssistantModelToLegacyModel(assistant: SharedAssistant): Model | undefined {
+  if (!assistant.modelId) {
+    return undefined
+  }
+
+  const { providerId, modelId } = parseUniqueModelId(assistant.modelId)
+  const model = getStoreProviders()
+    .flatMap((provider) => provider.models)
+    .find((model) => model.provider === providerId && (model.id === assistant.modelId || model.id === modelId))
+
+  return (
+    model ?? {
+      id: assistant.modelId,
+      provider: providerId,
+      apiModelId: modelId,
+      name: assistant.modelName ?? modelId,
+      group: ''
+    }
+  )
+}
+
 function mapSharedAssistantToLegacyAssistant(
   assistant: SharedAssistant,
   template: Assistant,
@@ -205,6 +227,7 @@ function mapSharedAssistantToLegacyAssistant(
     prompt: assistant.prompt,
     emoji: assistant.emoji,
     description: assistant.description,
+    model: mapSharedAssistantModelToLegacyModel(assistant),
     topics: [mapSharedTopicToLegacyTopic(topic)]
   }
 }
diff --git a/src/renderer/services/__tests__/AssistantService.test.ts b/src/renderer/services/__tests__/AssistantService.test.ts
index 39eb68053..e9d95963a 100644
--- a/src/renderer/services/__tests__/AssistantService.test.ts
+++ b/src/renderer/services/__tests__/AssistantService.test.ts
@@ -4,6 +4,17 @@ import { beforeEach, describe, expect, it, vi } from 'vitest'
 
 const addAssistantMock = vi.fn()
 const toastSuccessMock = vi.fn()
+const providersMock = vi.hoisted(() => [
+  {
+    id: 'openai',
+    type: 'openai',
+    name: 'OpenAI',
+    apiKey: '',
+    apiHost: '',
+    enabled: true,
+    models: [{ id: 'gpt-4', provider: 'openai', name: 'GPT-4', group: 'OpenAI' }]
+  }
+])
 
 vi.mock('@renderer/store', () => ({
   __esModule: true,
@@ -26,7 +37,7 @@ vi.mock('@renderer/store/assistants', () => ({
 }))
 
 vi.mock('@renderer/hooks/useStore', () => ({
-  getStoreProviders: vi.fn(() => [])
+  getStoreProviders: vi.fn(() => providersMock)
 }))
 
 vi.mock('@renderer/i18n', () => ({
@@ -53,13 +64,13 @@ describe('AssistantService', () => {
           emoji: options.body.emoji,
           description: options.body.description ?? '',
           settings: {},
-          modelId: null,
+          modelId: 'openai::gpt-4',
           mcpServerIds: [],
           knowledgeBaseIds: [],
           createdAt: '2026-06-16T08:00:00.000Z',
           updatedAt: '2026-06-16T08:00:00.000Z',
           tags: [],
-          modelName: null
+          modelName: 'GPT-4'
         }
       }
 
@@ -106,6 +117,7 @@ describe('AssistantService', () => {
       }
     })
     expect(assistant.id).toBe('assistant-from-data-api')
+    expect(assistant.model).toEqual({ id: 'gpt-4', provider: 'openai', name: 'GPT-4', group: 'OpenAI' })
     expect(assistant.topics).toEqual([
       {
         id: 'topic-from-data-api',
@@ -119,4 +131,61 @@ describe('AssistantService', () => {
     ])
     expect(addAssistantMock).toHaveBeenCalledWith(assistant)
   })
+
+  it('keeps the API model id when a default model is not available in legacy provider state', async () => {
+    vi.mocked(dataApiService.post).mockImplementation(async (path, options) => {
+      if (path === '/assistants') {
+        return {
+          id: 'assistant-from-data-api',
+          name: options.body.name,
+          prompt: options.body.prompt,
+          emoji: options.body.emoji,
+          description: options.body.description ?? '',
+          settings: {},
+          modelId: 'new-api::gpt-5.4',
+          mcpServerIds: [],
+          knowledgeBaseIds: [],
+          createdAt: '2026-06-16T08:00:00.000Z',
+          updatedAt: '2026-06-16T08:00:00.000Z',
+          tags: [],
+          modelName: 'GPT 5.4'
+        }
+      }
+
+      if (path === '/topics') {
+        return {
+          id: 'topic-from-data-api',
+          name: options.body.name,
+          assistantId: options.body.assistantId,
+          isNameManuallyEdited: false,
+          activeNodeId: null,
+          groupId: null,
+          orderKey: 'a0',
+          createdAt: '2026-06-16T08:00:01.000Z',
+          updatedAt: '2026-06-16T08:00:01.000Z'
+        }
+      }
+
+      throw new Error(`Unexpected path: ${path}`)
+    })
+
+    const { createAssistantWithDefaultTopic } = await import('../AssistantService')
+
+    const assistant = await createAssistantWithDefaultTopic({
+      id: 'preset-id',
+      name: 'Preset',
+      prompt: 'Be helpful',
+      topics: [],
+      type: 'assistant',
+      emoji: '⭐'
+    })
+
+    expect(assistant.model).toEqual({
+      id: 'new-api::gpt-5.4',
+      provider: 'new-api',
+      apiModelId: 'gpt-5.4',
+      name: 'GPT 5.4',
+      group: ''
+    })
+  })
 })


--- UNTRACKED FILE: _bmad-output/implementation-artifacts/spec-fix-default-assistant-model-on-create.md ---
---
title: 'Fix default assistant model on assistant create'
type: 'bugfix'
created: '2026-06-17T00:00:00+08:00'
status: 'in-review'
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

- `src/renderer/pages/library/editor/assistant/descriptor.ts` -- create-mode form state and `buildCreateAssistantPayload`; likely place to ensure default model inheritance is preserved by omitting `modelId` unless explicitly selected.
- `src/renderer/pages/library/editor/assistant/AssistantConfigPage.tsx` -- create/edit flow commits the descriptor payload through DataApi mutations.
- `src/main/data/services/AssistantService.ts` -- authoritative backend default model injection via `resolveCreateModelId`; should stay the source of truth.
- `src/main/data/services/__tests__/AssistantService.test.ts` -- existing DB-backed coverage for default preference injection, stale preference, and explicit `null`.
- `src/renderer/pages/library/editor/assistant/__tests__/descriptor.test.ts` -- focused renderer coverage for create payload shape.

## Tasks & Acceptance

**Execution:**
- [x] `src/renderer/pages/library/editor/assistant/descriptor.ts` and its tests -- add/adjust create-mode payload coverage so an untouched create form omits `modelId`, while an explicitly selected model includes it; fix any create-state bug that sends `null`/stale values and bypasses backend default injection.
- [x] `src/renderer/pages/library/editor/assistant/AssistantConfigPage.tsx` or adjacent create-state code -- if the actual bug is not in descriptor payload construction, adjust the create flow so initial/untouched model state reaches the backend as omitted `modelId`.
- [x] `src/main/data/services/__tests__/AssistantService.test.ts` -- keep existing default-model injection tests green; add only if investigation exposes a missing backend edge case.
- [x] Focused tests -- prove create-mode omission triggers backend default injection and explicit model selection still overrides it.

**Acceptance Criteria:**
- Given a valid `chat.default_model_id`, when a user creates a new assistant without touching the model field, then the created assistant uses that default model.
- Given a user explicitly selects a model while creating an assistant, when saving, then that selected model overrides the global default.

## Spec Change Log

## Design Notes

The default model fix should keep the main process as the source of truth because it already validates `user_model` and handles stale preferences safely. Renderer create mode should express user intent only: omitted means “use global default”; a real id means “override”; explicit `null` should remain a deliberate unbind/update concept, not the default create payload.

## Verification

**Commands:**
- `pnpm exec vitest run --project renderer src/renderer/services/__tests__/AssistantService.test.ts src/renderer/pages/library/editor/assistant/__tests__/descriptor.test.ts --reporter=basic` -- passed, 2 files / 20 tests.
- `pnpm exec vitest run --project main src/main/data/services/__tests__/AssistantService.test.ts --reporter=basic` -- passed, 1 file / 70 tests.
- `pnpm format` -- passed, no fixes applied.
- `pnpm lint` -- passed with existing warnings and Node engine warning.
- `pnpm test` -- passed, 707 files / 9781 tests / 76 skipped.


--- UNTRACKED FILE: _bmad-output/implementation-artifacts/deferred-work.md ---
# Deferred Work

- 2026-06-17: Add model service provider `hth` by copying `new-api` channel behavior and replacing the logo with `/Users/chenkangping/Desktop/logo.png`. Include system provider registration, provider registry data, i18n label, UI provider icon integration, NewAPI-family runtime/helper classification, and focused tests.

```
