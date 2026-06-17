import { describe, expect, it } from 'vitest'

import migrate from '../migrate'

describe('store migrations', () => {
  describe('migration 207: StepFun Anthropic-compatible host backfill', () => {
    it('backfills anthropicApiHost for existing StepFun providers', async () => {
      const state = {
        llm: {
          providers: [
            {
              id: 'stepfun',
              apiHost: 'https://api.stepfun.com'
            }
          ]
        },
        _persist: { version: 206, rehydrated: false }
      }

      const migrated: any = await migrate(state as any, 207)

      expect(migrated.llm.providers[0].anthropicApiHost).toBe('https://api.stepfun.com')
    })

    it('preserves existing StepFun anthropicApiHost customizations', async () => {
      const state = {
        llm: {
          providers: [
            {
              id: 'stepfun',
              apiHost: 'https://api.stepfun.com',
              anthropicApiHost: 'https://custom.example.com'
            }
          ]
        },
        _persist: { version: 206, rehydrated: false }
      }

      const migrated: any = await migrate(state as any, 207)

      expect(migrated.llm.providers[0].anthropicApiHost).toBe('https://custom.example.com')
    })
  })

  describe('migration 208: hth provider backfill', () => {
    it('adds hth to existing persisted provider lists', async () => {
      const state = {
        llm: {
          providers: [
            {
              id: 'openai',
              name: 'OpenAI'
            },
            {
              id: 'new-api',
              name: 'New API'
            }
          ]
        },
        _persist: { version: 207, rehydrated: false }
      }

      const migrated: any = await migrate(state as any, 208)

      const hthProvider = migrated.llm.providers.find((provider: any) => provider.id === 'hth')
      expect(migrated.llm.providers[0].id).toBe('hth')
      expect(hthProvider).toMatchObject({
        id: 'hth',
        name: 'hth',
        type: 'new-api',
        apiHost: 'http://localhost:3000',
        anthropicApiHost: 'http://localhost:3000',
        isSystem: true,
        enabled: false
      })
    })

    it('does not duplicate hth when the provider already exists', async () => {
      const state = {
        llm: {
          providers: [
            {
              id: 'openai',
              name: 'OpenAI'
            },
            {
              id: 'hth',
              name: 'hth',
              type: 'new-api'
            }
          ]
        },
        _persist: { version: 207, rehydrated: false }
      }

      const migrated: any = await migrate(state as any, 208)

      expect(migrated.llm.providers[0].id).toBe('hth')
      expect(migrated.llm.providers.filter((provider: any) => provider.id === 'hth')).toHaveLength(1)
    })
  })
})
