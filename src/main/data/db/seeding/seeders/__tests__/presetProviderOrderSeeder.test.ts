import { userProviderTable } from '@data/db/schemas/userProvider'
import { PresetProviderOrderSeeder } from '@data/db/seeding/seeders/presetProviderOrderSeeder'
import { generateOrderKeySequence } from '@data/services/utils/orderKey'
import { setupTestDatabase } from '@test-helpers/db'
import { asc } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

describe('PresetProviderOrderSeeder', () => {
  const dbh = setupTestDatabase()

  async function readProviderOrder() {
    const rows = await dbh.db
      .select({ providerId: userProviderTable.providerId })
      .from(userProviderTable)
      .orderBy(asc(userProviderTable.orderKey))

    return rows.map((row) => row.providerId)
  }

  it('moves hth to the first provider position when it already exists', async () => {
    const [openaiKey, anthropicKey, hthKey] = generateOrderKeySequence(3)
    await dbh.db.insert(userProviderTable).values([
      { providerId: 'openai', name: 'OpenAI', orderKey: openaiKey },
      { providerId: 'anthropic', name: 'Anthropic', orderKey: anthropicKey },
      { providerId: 'hth', name: 'hth', orderKey: hthKey }
    ])

    const seed = new PresetProviderOrderSeeder()
    await seed.run(dbh.db)

    expect(await readProviderOrder()).toEqual(['hth', 'openai', 'anthropic'])
  })

  it('does nothing when hth is not present', async () => {
    const [openaiKey, anthropicKey] = generateOrderKeySequence(2)
    await dbh.db.insert(userProviderTable).values([
      { providerId: 'openai', name: 'OpenAI', orderKey: openaiKey },
      { providerId: 'anthropic', name: 'Anthropic', orderKey: anthropicKey }
    ])

    const seed = new PresetProviderOrderSeeder()
    await seed.run(dbh.db)

    expect(await readProviderOrder()).toEqual(['openai', 'anthropic'])
  })
})
