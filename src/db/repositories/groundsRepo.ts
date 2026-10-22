import { db } from '../db'
import type { Ground } from '../../domain'

export const groundsRepo = {
  async insert(ground: Ground): Promise<string> {
    await db.grounds.put(ground)
    return ground.id
  },
  async get(id: string): Promise<Ground | undefined> {
    return db.grounds.get(id)
  },
  async list(): Promise<Ground[]> {
    return db.grounds.toArray()
  },
}