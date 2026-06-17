import { ENDPOINT_TYPE } from '@shared/data/types/model'
import type { Provider } from '@shared/data/types/provider'
import { describe, expect, it } from 'vitest'

import { toV1ProviderShim } from '../v1ProviderShim'

const makeProvider = (overrides: Partial<Provider> & Pick<Provider, 'id'>): Provider =>
  ({
    ...overrides,
    id: overrides.id,
    name: overrides.name ?? overrides.id,
    isEnabled: true,
    authType: 'api-key',
    defaultChatEndpoint: ENDPOINT_TYPE.OPENAI_CHAT_COMPLETIONS,
    endpointConfigs: {
      [ENDPOINT_TYPE.OPENAI_CHAT_COMPLETIONS]: { baseUrl: 'https://api.example.com/v1' }
    },
    apiFeatures: {
      arrayContent: true,
      streamOptions: true,
      developerRole: true,
      serviceTier: false,
      verbosity: false,
      enableThinking: true
    },
    apiKeys: [],
    createdAt: '2026-06-17T00:00:00.000Z',
    updatedAt: '2026-06-17T00:00:00.000Z'
  }) as Provider

describe('toV1ProviderShim', () => {
  it('bridges preset-derived new-api providers as new-api type', () => {
    const provider = makeProvider({
      id: 'new-api-custom',
      presetProviderId: 'new-api'
    })

    const shim = toV1ProviderShim(provider)

    expect(shim.id).toBe('new-api-custom')
    expect(shim.type).toBe('new-api')
    expect(shim.apiHost).toBe('https://api.example.com/v1')
  })
})
