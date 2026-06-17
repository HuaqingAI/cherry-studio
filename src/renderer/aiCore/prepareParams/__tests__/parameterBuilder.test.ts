import type { Assistant, Model, Provider } from '@renderer/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@data/PreferenceService', () => ({
  preferenceService: {
    get: vi.fn(async () => undefined),
    getMultiple: vi.fn(async () => ({
      maxResults: 5,
      excludeDomains: []
    }))
  }
}))

vi.mock('@renderer/config/models', () => {
  const qwenModel = {
    id: 'qwen',
    provider: 'cherryai',
    name: 'Qwen',
    group: 'Qwen'
  }

  return {
    qwenModel,
    SYSTEM_MODELS: new Proxy({ defaultModel: [qwenModel] }, { get: (target, key) => target[key] ?? [] }),
    isAnthropicModel: vi.fn(() => false),
    isClaude46SeriesModel: vi.fn(() => false),
    isClaudeModelRejectsTemperature: vi.fn(() => false),
    isClaudeModelRejectsTopK: vi.fn(() => false),
    isClaudeModelRejectsTopP: vi.fn(() => false),
    isClaudeReasoningModel: vi.fn(() => false),
    isFixedReasoningModel: vi.fn(() => false),
    isGemini3Model: vi.fn(() => false),
    isGeminiModel: vi.fn(() => false),
    isGenerateImageModel: vi.fn(() => false),
    isGrokModel: vi.fn(() => false),
    isMaxTemperatureOneModel: vi.fn(() => false),
    isOpenAIModel: vi.fn(() => false),
    isOpenRouterBuiltInWebSearchModel: vi.fn(() => false),
    isPureGenerateImageModel: vi.fn(() => false),
    isSupportAdaptiveThinkingClaudeModel: vi.fn(() => false),
    isSupportedFlexServiceTier: vi.fn(() => false),
    isSupportedReasoningEffortModel: vi.fn(() => false),
    isSupportedThinkingTokenClaudeModel: vi.fn(() => false),
    isSupportedThinkingTokenModel: vi.fn(() => false),
    isSupportTemperatureModel: vi.fn(() => true),
    isSupportTopPModel: vi.fn(() => true),
    isTemperatureTopPMutuallyExclusiveModel: vi.fn(() => false),
    isWebSearchModel: vi.fn(() => false)
  }
})

vi.mock('@renderer/config/promptsCodeMode', () => ({
  getHubModeSystemPrompt: vi.fn(() => '')
}))

vi.mock('@renderer/utils/prompt', () => ({
  replacePromptVariables: vi.fn(async (prompt: string) => prompt)
}))

vi.mock('@renderer/services/AssistantService', () => ({
  DEFAULT_ASSISTANT_SETTINGS: {
    maxTokens: 4096,
    enableMaxTokens: false,
    temperature: 0.7,
    enableTemperature: true,
    topP: 1,
    enableTopP: false,
    contextCount: 4096,
    streamOutput: true,
    defaultModel: undefined,
    customParameters: [],
    reasoning_effort: 'default',
    qwenThinkMode: undefined,
    toolUseMode: 'function',
    maxToolCalls: 20,
    enableMaxToolCalls: true
  },
  getAssistantSettings: (assistant: Assistant) => ({
    contextCount: assistant.settings?.contextCount ?? 4096,
    temperature: assistant.settings?.temperature ?? 0.7,
    enableTemperature: assistant.settings?.enableTemperature ?? true,
    topP: assistant.settings?.topP ?? 1,
    enableTopP: assistant.settings?.enableTopP ?? false,
    enableMaxTokens: assistant.settings?.enableMaxTokens ?? false,
    maxTokens: assistant.settings?.maxTokens,
    streamOutput: assistant.settings?.streamOutput ?? true,
    toolUseMode: assistant.settings?.toolUseMode ?? 'prompt',
    defaultModel: assistant.defaultModel,
    customParameters: assistant.settings?.customParameters ?? [],
    reasoning_effort: assistant.settings?.reasoning_effort ?? 'default',
    qwenThinkMode: assistant.settings?.qwenThinkMode
  }),
  getDefaultModel: () => ({
    id: 'gpt-4o',
    provider: 'openai',
    name: 'GPT-4o',
    group: 'openai'
  })
}))

vi.mock('../../utils/mcp', () => ({
  setupToolsConfig: vi.fn(() => undefined)
}))

vi.mock('../../utils/options', () => ({
  buildProviderOptions: vi.fn(() => ({
    providerOptions: {},
    standardParams: {}
  }))
}))

vi.mock('../../utils/websearch', () => ({
  buildProviderBuiltinWebSearchConfig: vi.fn()
}))

vi.mock('../../provider/factory', () => ({
  getAiSdkProviderId: vi.fn(() => 'openai-chat')
}))

vi.mock('../../utils/reasoning', () => ({
  getThinkingBudget: vi.fn(() => 0)
}))

vi.mock('../header', () => ({
  addAnthropicHeaders: vi.fn(() => [])
}))

import { buildStreamTextParams, getEffectiveMaxToolCalls } from '../parameterBuilder'

const createModel = (overrides: Partial<Model> = {}): Model => ({
  id: 'gpt-4o',
  provider: 'openai',
  name: 'GPT-4o',
  group: 'openai',
  ...overrides
})

const createAssistant = (model: Model): Assistant => ({
  id: 'assistant-1',
  name: 'Assistant',
  prompt: '',
  topics: [],
  type: 'assistant',
  model,
  settings: {
    maxToolCalls: 20,
    enableMaxToolCalls: true,
    contextCount: 4096,
    temperature: 0.7,
    enableTemperature: false,
    topP: 1,
    enableTopP: false,
    streamOutput: true,
    reasoning_effort: 'default',
    toolUseMode: 'function'
  }
})

const createProvider = (overrides: Partial<Provider> = {}): Provider => ({
  id: 'new-api',
  type: 'new-api',
  name: 'New API',
  apiKey: 'key',
  apiHost: 'https://example.com/v1',
  models: [],
  ...overrides
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getEffectiveMaxToolCalls', () => {
  it('uses the default cap when settings are missing', () => {
    expect(getEffectiveMaxToolCalls()).toBe(20)
  })

  it('uses the default cap when the switch is off', () => {
    expect(
      getEffectiveMaxToolCalls({
        enableMaxToolCalls: false,
        maxToolCalls: 50
      })
    ).toBe(20)
  })

  it('uses a custom cap when enabled', () => {
    expect(
      getEffectiveMaxToolCalls({
        enableMaxToolCalls: true,
        maxToolCalls: 50
      })
    ).toBe(50)
  })

  it('clamps invalid custom values back to the default cap', () => {
    expect(
      getEffectiveMaxToolCalls({
        enableMaxToolCalls: true,
        maxToolCalls: 999
      })
    ).toBe(20)
  })

  it('uses the default cap for old assistants without the new fields', () => {
    expect(
      getEffectiveMaxToolCalls({
        temperature: 0.7,
        contextCount: 10
      } as { maxToolCalls?: number; enableMaxToolCalls?: boolean })
    ).toBe(20)
  })
})

describe('buildStreamTextParams', () => {
  it('returns apiModelId for v2 composite models while keeping assistant model unchanged', async () => {
    const model = createModel({
      id: 'new-api::gpt-5.4',
      provider: 'new-api',
      apiModelId: 'gpt-5.4',
      name: 'GPT 5.4'
    })
    const assistant = createAssistant(model)

    const result = await buildStreamTextParams([{ role: 'user', content: 'hi' }], assistant, createProvider(), {})

    expect(result.modelId).toBe('gpt-5.4')
    expect(assistant.model?.id).toBe('new-api::gpt-5.4')
  })

  it('returns id for legacy models without apiModelId', async () => {
    const model = createModel({ id: 'gpt-4o' })

    const result = await buildStreamTextParams(
      [{ role: 'user', content: 'hi' }],
      createAssistant(model),
      createProvider(),
      {}
    )

    expect(result.modelId).toBe('gpt-4o')
  })
})
