import { db } from '../db'
import type { ShotEvent } from '../../domain'

export const shotEventsRepo = {
  async insert(event: ShotEvent): Promise<string> {
    await db.shotEvents.put(event)
    return event.id
  },
  async listByMatch(matchId: string): Promise<ShotEvent[]> {
    return db.shotEvents.where('matchId').equals(matchId).toArray()
  },
  async remove(id: string): Promise<void> {
    await db.shotEvents.delete(id)
  },
}