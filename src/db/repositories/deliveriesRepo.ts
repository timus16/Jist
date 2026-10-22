import { db } from '../db'
import type { Delivery } from '../../domain'

export const deliveriesRepo = {
  async insert(delivery: Delivery): Promise<string> {
    await db.deliveries.put(delivery)
    return delivery.id
  },
  async listByMatch(matchId: string): Promise<Delivery[]> {
    return db.deliveries.where('matchId').equals(matchId).toArray()
  },
  async remove(id: string): Promise<void> {
    await db.deliveries.delete(id)
  },
}