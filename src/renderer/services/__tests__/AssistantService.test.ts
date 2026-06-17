import { dataApiService } from '@data/DataApiService'
import { MockDataApiUtils } from '@test-mocks/renderer/DataApiService'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const addAssistantMock = vi.fn()
const toastSuccessMock = vi.fn()

vi.mock('@renderer/store', () => ({
  __esModule: true,
  default: {
    dispatch: vi.fn((action) => {
      if (action?.type === 'assistants/addAssistant') {
        addAssistantMock(action.payload)
      }
    }),
    getState: vi.fn(() => ({
      assistants: { assistants: [], defaultAssistant: undefined },
      llm: { defaultModel: undefined, quickModel: undefined, translateModel: undefined },
      settings: {}
    }))
  }
}))

vi.mock('@renderer/store/assistants', () => ({
  addAssistant: vi.fn((assistant) => ({ type: 'assistants/addAssistant', payload: assistant }))
}))

vi.mock('@renderer/hooks/useStore', () => ({
  getStoreProviders: vi.fn(() => [])
}))

vi.mock('@renderer/i18n', () => ({
  default: {
    t: (key: string) => key
  }
}))

describe('AssistantService', () => {
  beforeEach(() => {
    MockDataApiUtils.resetMocks()
    addAssistantMock.mockClear()
    toastSuccessMock.mockClear()
    window.toast = { success: toastSuccessMock } as unknown as typeof window.toast
  })

  it('creates a preset assistant and its initial topic through DataApi before adding it to the legacy store', async () => {
    vi.mocked(dataApiService.post).mockImplementation(async (path, options) => {
      if (path === '/assistants') {
        return {
          id: 'assistant-from-data-api',
          name: options.body.name,
          prompt: options.body.prompt,
          emoji: options.body.emoji,
          description: options.body.description ?? '',
          settings: {},
          modelId: null,
          mcpServerIds: [],
          knowledgeBaseIds: [],
          createdAt: '2026-06-16T08:00:00.000Z',
          updatedAt: '2026-06-16T08:00:00.000Z',
          tags: [],
          modelName: null
        }
      }

      if (path === '/topics') {
        return {
          id: 'topic-from-data-api',
          name: options.body.name,
          assistantId: options.body.assistantId,
          isNameManuallyEdited: false,
          activeNodeId: null,
          groupId: null,
          orderKey: 'a0',
          createdAt: '2026-06-16T08:00:01.000Z',
          updatedAt: '2026-06-16T08:00:01.000Z'
        }
      }

      throw new Error(`Unexpected path: ${path}`)
    })

    const { createAssistantFromAgent } = await import('../AssistantService')

    const assistant = await createAssistantFromAgent({
      id: 'preset-id',
      name: 'Preset',
      prompt: 'Be helpful',
      topics: [],
      type: 'assistant',
      emoji: '⭐'
    })

    expect(dataApiService.post).toHaveBeenNthCalledWith(1, '/assistants', {
      body: {
        name: 'Preset',
        prompt: 'Be helpful',
        emoji: '⭐',
        description: undefined
      }
    })
    expect(dataApiService.post).toHaveBeenNthCalledWith(2, '/topics', {
      body: {
        name: 'chat.default.topic.name',
        assistantId: 'assistant-from-data-api'
      }
    })
    expect(assistant.id).toBe('assistant-from-data-api')
    expect(assistant.topics).toEqual([
      {
        id: 'topic-from-data-api',
        assistantId: 'assistant-from-data-api',
        createdAt: '2026-06-16T08:00:01.000Z',
        updatedAt: '2026-06-16T08:00:01.000Z',
        name: 'chat.default.topic.name',
        messages: [],
        isNameManuallyEdited: false
      }
    ])
    expect(addAssistantMock).toHaveBeenCalledWith(assistant)
  })
})
