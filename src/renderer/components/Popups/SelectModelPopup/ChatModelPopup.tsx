import { useModels } from '@renderer/hooks/useModels'
import { useProviders } from '@renderer/hooks/useProviders'
import type { Model, Provider } from '@renderer/types'
import { sortBy } from 'lodash'
import React, { useMemo } from 'react'

import SelectModelPopupView, { createModelPopup } from './BasePopup'
import { toLegacyModel, toLegacyProvider } from './v2ModelPopupAdapter'

interface PopupParams {
  model?: Model
  filter?: (model: Model) => boolean
  showTagFilter?: boolean
}

interface Props extends PopupParams {
  resolve: (value: Model | undefined) => void
}

export const ChatModelPopupContainer: React.FC<Props> = ({ model, filter, showTagFilter = true, resolve }) => {
  const { providers: runtimeProviders } = useProviders()
  const { models: runtimeModels } = useModels({ enabled: true })

  const filteredProviders = useMemo(() => {
    const providerOrderMap = new Map(runtimeProviders.map((provider, i) => [provider.id, i]))
    const modelsByProvider = runtimeModels.reduce<Map<string, typeof runtimeModels>>((result, modelItem) => {
      const providerModels = result.get(modelItem.providerId)
      if (providerModels) {
        providerModels.push(modelItem)
      } else {
        result.set(modelItem.providerId, [modelItem])
      }
      return result
    }, new Map())

    const filtered = runtimeProviders.reduce<Provider[]>((result, provider) => {
      if (!provider.isEnabled) {
        return result
      }

      const providerModels = modelsByProvider.get(provider.id) ?? []
      const filteredRuntimeModels = filter
        ? providerModels.filter((runtimeModel) => filter(toLegacyModel(runtimeModel)))
        : providerModels

      if (filteredRuntimeModels.length === 0) {
        return result
      }

      result.push(toLegacyProvider(provider, filteredRuntimeModels))
      return result
    }, [])

    return sortBy(filtered, (provider) => providerOrderMap.get(provider.id) ?? Infinity)
  }, [filter, runtimeModels, runtimeProviders])

  return (
    <SelectModelPopupView
      providers={filteredProviders}
      model={model}
      showTagFilter={showTagFilter}
      showPinnedModels={true}
      resolve={resolve}
    />
  )
}

export const SelectChatModelPopup = createModelPopup<PopupParams, Model>(ChatModelPopupContainer)
