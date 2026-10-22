import { db } from '../db'
import type { Match } from '../../domain'

export const matchesRepo = {
  async insert(match: Match): Promise<string> {
    await db.matches.put(match)
    return match.id
  },
  async get(id: string): Promise<Match | undefined> {
    return db.matches.get(id)
  },
  async list(): Promise<Match[]> {
    return db.matches.orderBy('createdAt').reverse().toArray()
  },
  async listLive(): Promise<Match[]> {
    return db.matches.where('status').equals('live').toArray()
  },
  async update(id: string, patch: Partial<Match>): Promise<void> {
    await db.matches.update(id, patch)
  },
  async remove(id: string): Promise<void> {
    await db.matches.delete(id)
  },
}