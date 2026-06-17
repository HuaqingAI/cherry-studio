import { dataApiService } from '@data/DataApiService'
import { loggerService } from '@logger'
import { toV1ProviderShim } from '@renderer/pages/settings/ProviderSettings/utils/v1ProviderShim'
import type { Model, Provider } from '@renderer/types'
import type { Provider as RuntimeProvider } from '@shared/data/types/provider'

import { getProviderByModel as getLegacyProviderByModel } from './AssistantService'

const logger = loggerService.withContext('RuntimeProviderResolver')

export async function resolveRuntimeProviderForModel(model: Model): Promise<Provider> {
  try {
    const runtimeProvider = (await dataApiService.get(`/providers/${model.provider}` as never)) as RuntimeProvider
    const apiKeysResponse = (await dataApiService.get(`/providers/${model.provider}/api-keys` as never, {
      query: { enabled: true }
    })) as { keys: Array<{ key: string; isEnabled: boolean }> }

    return toV1ProviderShim(runtimeProvider, {
      apiKey: apiKeysResponse.keys
        .filter((entry) => entry.isEnabled && entry.key.trim())
        .map((entry) => entry.key.trim())
        .join(',')
    })
  } catch (error) {
    logger.warn('Falling back to legacy provider resolution', {
      providerId: model.provider,
      modelId: model.id,
      error
    })
    return getLegacyProviderByModel(model)
  }
}
