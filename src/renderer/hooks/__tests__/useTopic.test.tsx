import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useActiveTopic } from '../useTopic'

const mocks = vi.hoisted(() => ({
  assistant: undefined as any,
  dispatch: vi.fn(),
  emit: vi.fn(),
  loadTopicMessagesThunk: vi.fn((topicId: string) => ({ type: 'loadTopicMessagesThunk', payload: topicId }))
}))

vi.mock('@data/CacheService', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn()
  }
}))

vi.mock('@data/PreferenceService', () => ({
  preferenceService: {
    get: vi.fn()
  }
}))

vi.mock('@logger', () => ({
  loggerService: {
    withContext: vi.fn(() => ({
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn()
    }))
  }
}))

vi.mock('@renderer/databases', () => ({
  default: {
    topics: {
      get: vi.fn(),
      toArray: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          modify: vi.fn()
        }))
      }))
    },
    message_blocks: {
      where: vi.fn(() => ({
        anyOf: vi.fn(() => ({
          toArray: vi.fn()
        }))
      })),
      bulkDelete: vi.fn()
    },
    transaction: vi.fn()
  }
}))

vi.mock('@renderer/i18n', () => ({
  default: {
    t: (key: string) => key
  }
}))

vi.mock('@renderer/services/ApiService', () => ({
  fetchMessagesSummary: vi.fn()
}))

vi.mock('@renderer/services/EventService', () => ({
  EVENT_NAMES: {
    CHANGE_TOPIC: 'CHANGE_TOPIC'
  },
  EventEmitter: {
    emit: mocks.emit
  }
}))

vi.mock('@renderer/services/MessagesService', () => ({
  safeDeleteFiles: vi.fn()
}))

vi.mock('@renderer/store', () => ({
  default: {
    dispatch: mocks.dispatch,
    getState: vi.fn(() => ({
      assistants: { assistants: [] }
    }))
  }
}))

vi.mock('@renderer/store/assistants', () => ({
  updateTopic: vi.fn((payload) => ({ type: 'updateTopic', payload }))
}))

vi.mock('@renderer/store/thunk/messageThunk', () => ({
  loadTopicMessagesThunk: mocks.loadTopicMessagesThunk
}))

vi.mock('../useAssistant', () => ({
  useAssistant: vi.fn(() => ({ assistant: mocks.assistant }))
}))

describe('useActiveTopic', () => {
  beforeEach(() => {
    mocks.dispatch.mockClear()
    mocks.emit.mockClear()
    mocks.loadTopicMessagesThunk.mockClear()
  })

  it('does not load messages for a temporary default assistant topic', async () => {
    const topic = {
      id: 'temporary-topic',
      assistantId: 'default',
      name: 'Default topic',
      messages: [],
      createdAt: '2026-06-16T08:00:00.000Z',
      updatedAt: '2026-06-16T08:00:00.000Z'
    }
    mocks.assistant = { id: 'default', topics: [topic] }

    renderHook(() => useActiveTopic('default', topic))

    await waitFor(() => {
      expect(mocks.loadTopicMessagesThunk).not.toHaveBeenCalled()
    })
    expect(mocks.dispatch).not.toHaveBeenCalled()
    expect(mocks.emit).not.toHaveBeenCalled()
  })

  it('loads messages and emits change event for a persisted topic', async () => {
    const topic = {
      id: 'persisted-topic',
      assistantId: 'assistant-id',
      name: 'Persisted topic',
      messages: [],
      createdAt: '2026-06-16T08:00:00.000Z',
      updatedAt: '2026-06-16T08:00:00.000Z'
    }
    mocks.assistant = { id: 'assistant-id', topics: [topic] }

    renderHook(() => useActiveTopic('assistant-id', topic))

    await waitFor(() => {
      expect(mocks.loadTopicMessagesThunk).toHaveBeenCalledWith('persisted-topic')
    })
    expect(mocks.dispatch).toHaveBeenCalledWith({ type: 'loadTopicMessagesThunk', payload: 'persisted-topic' })
    expect(mocks.emit).toHaveBeenCalledWith('CHANGE_TOPIC', topic)
  })
})
