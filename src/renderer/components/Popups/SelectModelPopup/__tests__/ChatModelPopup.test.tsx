import { render } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChatModelPopupContainer } from '../ChatModelPopup'

const mockUseProviders = vi.fn()
const mockUseModels = vi.fn()
const selectModelPopupViewSpy = vi.fn<(props: unknown) => null>(() => null)

vi.mock('@renderer/hooks/useProviders', () => ({
  useProviders: (...args: unknown[]) => mockUseProviders(...args)
}))

vi.mock('@renderer/hooks/useModels', () => ({
  useModels: (...args: unknown[]) => mockUseModels(...args)
}))

vi.mock('../BasePopup', () => ({
  __esModule: true,
  default: (props: unknown) => selectModelPopupViewSpy(props),
  createModelPopup: vi.fn()
}))

type PopupProps = ComponentProps<typeof ChatModelPopupContainer>

describe('ChatModelPopupContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds chat provider groups from v2 providers/models so new-api models remain selectable', () => {
    mockUseProviders.mockReturnValue({
      providers: [
        {
          id: 'new-api',
          presetProviderId: 'new-api',
          name: 'New API',
          defaultChatEndpoint: 'openai-chat-completions',
          endpointConfigs: {
            'openai-chat-completions': { baseUrl: 'http://localhost:3000/v1' }
          },
          apiKeys: [{ id: 'key-1', isEnabled: true }],
          authType: 'api-key',
          apiFeatures: {
            arrayContent: true,
            streamOptions: true,
            developerRole: true,
            serviceTier: false,
            verbosity: false,
            enableThinking: true
          },
          settings: {},
          isEnabled: true
        }
      ]
    })
    mockUseModels.mockReturnValue({
      models: [
        {
          id: 'new-api::gpt-4o-mini',
          providerId: 'new-api',
          apiModelId: 'gpt-4o-mini',
          name: 'GPT-4o mini',
          capabilities: [],
          supportsStreaming: true,
          isEnabled: true,
          isHidden: false
        }
      ]
    })

    render(
      <ChatModelPopupContainer
        resolve={vi.fn()}
        showTagFilter={false}
        filter={() => true}
        model={undefined as PopupProps['model']}
      />
    )

    expect(selectModelPopupViewSpy).toHaveBeenCalledTimes(1)
    const props = selectModelPopupViewSpy.mock.calls[0]?.[0] as {
      providers: Array<{ id: string; models: Array<{ id: string; apiModelId?: string }> }>
    }
    expect(props.providers).toHaveLength(1)
    expect(props.providers[0]?.id).toBe('new-api')
    expect(props.providers[0]?.models.map((model) => model.id)).toEqual(['new-api::gpt-4o-mini'])
    expect(props.providers[0]?.models.map((model) => model.apiModelId)).toEqual(['gpt-4o-mini'])
  })

  it('bridges hth providers through the new-api legacy type', () => {
    mockUseProviders.mockReturnValue({
      providers: [
        {
          id: 'hth',
          presetProviderId: 'hth',
          name: 'hth',
          defaultChatEndpoint: 'openai-chat-completions',
          endpointConfigs: {
            'openai-chat-completions': { baseUrl: 'http://localhost:3000/v1' }
          },
          apiKeys: [{ id: 'key-1', isEnabled: true }],
          authType: 'api-key',
          apiFeatures: {
            arrayContent: true,
            streamOptions: true,
            developerRole: true,
            serviceTier: false,
            verbosity: false,
            enableThinking: true
          },
          settings: {},
          isEnabled: true
        }
      ]
    })
    mockUseModels.mockReturnValue({
      models: [
        {
          id: 'hth::gpt-4o-mini',
          providerId: 'hth',
          apiModelId: 'gpt-4o-mini',
          name: 'GPT-4o mini',
          capabilities: [],
          supportsStreaming: true,
          isEnabled: true,
          isHidden: false
        }
      ]
    })

    render(
      <ChatModelPopupContainer
        resolve={vi.fn()}
        showTagFilter={false}
        filter={() => true}
        model={undefined as PopupProps['model']}
      />
    )

    const props = selectModelPopupViewSpy.mock.calls[0]?.[0] as {
      providers: Array<{ id: string; type: string; models: Array<{ id: string; apiModelId?: string }> }>
    }
    expect(props.providers[0]).toMatchObject({ id: 'hth', type: 'new-api' })
    expect(props.providers[0]?.models.map((model) => model.id)).toEqual(['hth::gpt-4o-mini'])
    expect(props.providers[0]?.models.map((model) => model.apiModelId)).toEqual(['gpt-4o-mini'])
  })
})
