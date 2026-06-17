import { userProviderTable } from '@data/db/schemas/userProvider'
import { generateOrderKeyBetween } from '@data/services/utils/orderKey'
import { asc, eq } from 'drizzle-orm'

import type { DbType, ISeeder } from '../../types'

export class PresetProviderOrderSeeder implements ISeeder {
  readonly name = 'presetProviderOrder'
  readonly version = 'hth-first-2026.06.17'
  readonly description = 'Place hth preset provider first'

  async run(db: DbType): Promise<void> {
    await db.transaction(async (tx) => {
      const [hth] = await tx
        .select({ providerId: userProviderTable.providerId })
        .from(userProviderTable)
        .where(eq(userProviderTable.providerId, 'hth'))
        .limit(1)

      if (!hth) return

      const [first] = await tx
        .select({ providerId: userProviderTable.providerId, orderKey: userProviderTable.orderKey })
        .from(userProviderTable)
        .orderBy(asc(userProviderTable.orderKey))
        .limit(1)

      if (!first || first.providerId === 'hth') return

      await tx
        .update(userProviderTable)
        .set({ orderKey: generateOrderKeyBetween(null, first.orderKey) })
        .where(eq(userProviderTable.providerId, 'hth'))
    })
  }
}
