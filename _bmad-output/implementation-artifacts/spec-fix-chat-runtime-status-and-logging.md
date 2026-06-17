---
title: 'Fix chat runtime status and logging'
type: 'bugfix'
created: '2026-06-17T00:00:00+08:00'
status: 'in-review'
baseline_commit: '6df278ebe4f9d0d318da68fbfa09c8a4d109a048'
context:
  - '{project-root}/CLAUDE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After selecting a model and chatting, logs can show `[mainWindow::ProviderFactory] Provider ID not found in registered extensions, using as-is`, the page can keep showing a waiting/processing state even after the model answer has visibly ended, and the logs do not show enough preview context for the user question and model reply.

**Approach:** Keep the existing chat/runtime architecture, but make provider id resolution explicit for custom OpenAI-compatible and new-api providers, guarantee stream finalization when the AI stream naturally closes, and add centralized preview-only chat request/response logs at the runtime boundary.

## Boundaries & Constraints

**Always:** Use `loggerService`; log only short previews, ids, model/provider metadata, and timing/usage fields. Preserve internal v2 model ids for UI/state and provider-facing `apiModelId` for API calls. Keep fixes in the runtime/provider/streaming path, not presentation components.

**Ask First:** Stop if the fix requires changing persisted message schema, changing provider/model DataApi schema, logging full conversation text, or altering how model selection stores ids.

**Never:** Do not special-case only `gpt-5.4` or strip `provider::` strings ad hoc. Do not log API keys, headers, authorization tokens, file contents, tool payloads, or full prompts/responses. Do not hide real provider configuration failures by swallowing errors.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Custom OpenAI-compatible provider | V2 provider resolves to a non-extension provider id with OpenAI chat endpoint | AI SDK config uses `openai-compatible`; no noisy `Provider ID not found... using as-is` warning appears for the normal fallback path | Real unsupported provider errors still surface from executor/config creation |
| New-api provider | V2 provider has `presetProviderId: 'new-api'` or type that maps to `new-api`; model has `apiModelId` | Provider config uses `newapi`, runtime request sends `apiModelId`, and selection/internal ids remain unchanged | Existing DataApi/legacy provider fallback warning remains centralized |
| Stream closes without finish event | Text chunks arrive, readable stream closes, but no AI SDK `finish` chunk is received | Adapter emits final text completion and response/block completion so the assistant message is finalized to success and waiting UI disappears | Abort/error chunks still go through existing error/paused handling |
| Chat preview logging | User asks a question and model replies | Logs include request preview and response preview with model/provider/topic ids and truncated text | Empty output logs an empty/short preview without throwing |

</frozen-after-approval>

## Code Map

- `src/renderer/aiCore/provider/factory.ts` -- maps legacy provider ids/types to AI SDK extension ids; currently warns and returns `provider.id` when no mapping exists.
- `src/renderer/aiCore/provider/providerConfig.ts` -- turns resolved providers into concrete AI SDK `ProviderConfig`; already falls back to `openai-compatible` after provider id mapping.
- `src/renderer/pages/settings/ProviderSettings/utils/v1ProviderShim.ts` -- temporary v2-to-v1 provider bridge; controls whether v2 providers look like `new-api`, `openai`, or custom providers at runtime.
- `src/renderer/aiCore/chunk/AiSdkToChunkAdapter.ts` -- converts AI SDK stream parts into Cherry chunks; `finish` emits `BLOCK_COMPLETE`, which finalizes messages.
- `src/renderer/services/ApiService.ts` -- chat runtime boundary; has access to UI/model messages, runtime provider/model ids, final completion result, and existing token tracking.
- `src/renderer/services/messageStreaming/callbacks/baseCallbacks.ts` -- `BLOCK_COMPLETE` ultimately finalizes streaming tasks and removes waiting state.
- `src/renderer/services/StreamProcessingService.ts` and `src/renderer/store/thunk/__tests__/streamCallback.integration.test.ts` -- stream chunk dispatch and integration coverage for message finalization.
- `src/renderer/aiCore/provider/__tests__/providerConfig.test.ts` -- existing provider mapping tests, including new-api config expectations.

## Tasks & Acceptance

**Execution:**
- [x] `src/renderer/aiCore/provider/factory.ts` / `src/renderer/aiCore/provider/providerConfig.ts` -- make normal OpenAI-compatible fallback explicit instead of returning arbitrary `provider.id`, and keep warnings for genuinely suspicious unsupported paths.
- [x] `src/renderer/pages/settings/ProviderSettings/utils/v1ProviderShim.ts` -- ensure v2 new-api providers continue to bridge as `type: 'new-api'`; add or adjust tests if the current matching misses the selected provider shape.
- [x] `src/renderer/aiCore/chunk/AiSdkToChunkAdapter.ts` -- track whether a final `finish` chunk was received; on natural stream close without finish, emit missing `TEXT_COMPLETE` and `BLOCK_COMPLETE`/`LLM_RESPONSE_COMPLETE` from accumulated text/reasoning so the message finalizes.
- [x] `src/renderer/services/ApiService.ts` -- add helper for truncated previews and log chat request/response previews around `AI.completions(...)`, including topic id, assistant id, internal model id, API model id, provider id/type, and preview lengths.
- [x] Focused tests -- cover provider fallback without noisy warning, new-api runtime config, stream close without finish finalization, and preview logging truncation/no full text leakage.

**Acceptance Criteria:**
- Given a selected v2 model backed by a custom OpenAI-compatible provider, when chat starts, then the AI SDK uses the compatible provider config without logging `Provider ID not found in registered extensions, using as-is` as a normal path.
- Given a selected new-api model with an internal id like `new-api::gpt-5.4`, when chat starts, then provider resolution still uses new-api config and the request model id remains the provider-facing API id.
- Given the model stream has produced visible text and then closes without an explicit `finish` event, when stream processing completes, then the assistant message is persisted as success and no waiting/processing placeholder remains.
- Given a chat request completes, when logs are inspected, then they include truncated previews of the user question and assistant answer, not full content or secrets.

## Design Notes

The ProviderFactory warning is useful for true misconfiguration but noisy when an OpenAI-compatible custom provider is expected. The runtime should distinguish “known generic compatible path” from “unknown extension id”.

`BLOCK_COMPLETE` is the event that calls `onComplete` and `StreamingService.finalize`; `LLM_RESPONSE_COMPLETE` alone does not remove processing state. The safest fix is to guarantee a completion chunk at the stream adapter boundary so all existing callbacks, stats, topic rename, and persistence behavior stay intact.

Preview logs should be generated from already-prepared chat text, normalized to one line, and truncated before logging. A helper keeps the limit consistent and makes tests able to prove long content is not emitted.

## Verification

**Commands:**
- `pnpm exec vitest run --project renderer src/renderer/aiCore/provider/__tests__/providerConfig.test.ts src/renderer/pages/settings/ProviderSettings/utils/__tests__/v1ProviderShim.test.ts src/renderer/aiCore/chunk/__tests__/AiSdkToChunkAdapter.test.ts src/renderer/services/__tests__/chatLogPreview.test.ts src/renderer/store/thunk/__tests__/streamCallback.integration.test.ts --reporter=basic` -- passed.
- `pnpm exec vitest run --project renderer src/renderer/aiCore/provider/__tests__/integratedRegistry.test.ts src/renderer/aiCore/provider/__tests__/providerConfig.test.ts src/renderer/aiCore/utils/__tests__/options.test.ts --reporter=basic` -- passed.
- `pnpm exec vitest run --project renderer src/renderer/aiCore/prepareParams/__tests__/parameterBuilder.test.ts src/renderer/utils/__tests__/model.test.ts src/renderer/components/Popups/SelectModelPopup/__tests__/ChatModelPopup.test.tsx --reporter=basic` -- passed.
- `pnpm lint` -- passed; existing ESLint warnings and Node engine warning were reported.
- `pnpm test` -- passed, 707 test files and 9774 tests.
- `pnpm format` -- passed with no fixes.
