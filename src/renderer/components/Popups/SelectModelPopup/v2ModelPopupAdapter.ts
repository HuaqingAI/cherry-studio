import { isServiceTier, type Model as LegacyModel, type Provider as LegacyProvider } from '@renderer/types'
import type { Model as RuntimeModel } from '@shared/data/types/model'
import type { Provider as RuntimeProvider } from '@shared/data/types/provider'

function toLegacyCapabilityType(capability: string): NonNullable<LegacyModel['capabilities']>[number]['type'] | null {
  switch (capability) {
    case 'IMAGE_RECOGNITION':
      return 'vision'
    case 'EMBEDDING':
      return 'embedding'
    case 'REASONING':
      return 'reasoning'
    case 'FUNCTION_CALL':
      return 'function_calling'
    case 'WEB_SEARCH':
      return 'web_search'
    case 'RERANK':
      return 'rerank'
    default:
      return null
  }
}

function toLegacyVerbosity(verbosity: string | undefined): LegacyProvider['verbosity'] {
  if (verbosity === 'low' || verbosity === 'medium' || verbosity === 'high') {
    return verbosity
  }
  return undefined
}

export function toLegacyModel(model: RuntimeModel): LegacyModel {
  const apiModelId = model.apiModelId ?? model.id
  const legacyModel = {
    id: model.id,
    provider: model.providerId,
    name: model.name,
    group: model.group ?? '',
    owned_by: model.ownedBy,
    description: model.description,
    capabilities: model.capabilities
      .map((capability) => toLegacyCapabilityType(capability))
      .filter((capability): capability is NonNullable<typeof capability> => capability !== null)
      .map((type) => ({ type })),
    endpoint_type: model.endpointTypes?.[0],
    supported_endpoint_types: model.endpointTypes,
    supported_text_delta: model.supportsStreaming,
    pricing: model.pricing
      ? {
          input_per_million_tokens: model.pricing.input.perMillionTokens ?? 0,
          output_per_million_tokens: model.pricing.output.perMillionTokens ?? 0
        }
      : undefined
  } as LegacyModel & { apiModelId?: string }

  legacyModel.apiModelId = apiModelId

  return legacyModel
}

export function toLegacyProvider(provider: RuntimeProvider, models: RuntimeModel[]): LegacyProvider {
  const primaryEndpointConfig = provider.defaultChatEndpoint
    ? provider.endpointConfigs?.[provider.defaultChatEndpoint]
    : undefined
  const anthropicEndpointConfig = provider.endpointConfigs?.['anthropic-messages']
  const firstEnabledApiKey = provider.apiKeys.find((entry) => entry.isEnabled)

  return {
    id: provider.id,
    type:
      provider.authType === 'iam-azure'
        ? 'azure-openai'
        : provider.authType === 'iam-gcp'
          ? 'vertexai'
          : provider.authType === 'iam-aws' || provider.authType === 'api-key-aws'
            ? 'aws-bedrock'
            : provider.defaultChatEndpoint === 'anthropic-messages'
              ? 'anthropic'
              : provider.defaultChatEndpoint === 'google-generate-content'
                ? 'gemini'
                : provider.defaultChatEndpoint === 'openai-responses'
                  ? 'openai-response'
                  : provider.id === 'gateway'
                    ? 'gateway'
                    : provider.presetProviderId === 'new-api' || provider.id === 'new-api'
                      ? 'new-api'
                      : provider.id === 'ollama'
                        ? 'ollama'
                        : 'openai',
    name: provider.name,
    apiKey: firstEnabledApiKey?.id ?? '',
    apiHost: primaryEndpointConfig?.baseUrl ?? '',
    anthropicApiHost: anthropicEndpointConfig?.baseUrl,
    apiVersion: provider.settings.apiVersion,
    models: models.map(toLegacyModel),
    enabled: provider.isEnabled,
    isSystem: provider.presetProviderId != null,
    rateLimit: provider.settings.rateLimit,
    apiOptions: {
      isNotSupportArrayContent: !provider.apiFeatures.arrayContent,
      isNotSupportStreamOptions: !provider.apiFeatures.streamOptions,
      isSupportDeveloperRole: provider.apiFeatures.developerRole,
      isNotSupportDeveloperRole: !provider.apiFeatures.developerRole,
      isSupportServiceTier: provider.apiFeatures.serviceTier,
      isNotSupportServiceTier: !provider.apiFeatures.serviceTier,
      isNotSupportVerbosity: !provider.apiFeatures.verbosity,
      isNotSupportEnableThinking: !provider.apiFeatures.enableThinking
    },
    serviceTier: isServiceTier(provider.settings.serviceTier) ? provider.settings.serviceTier : undefined,
    verbosity: toLegacyVerbosity(provider.settings.verbosity),
    notes: provider.settings.notes,
    extra_headers: provider.settings.extraHeaders
  }
}
