import type { ShotEvent } from '../domain'
import type { SyncConnector } from './types'

type Listener = (evt: ShotEvent) => void

/**
 * Zero-backend connector: keeps pending writes in memory and fans out local
 * pub/sub so the app is fully usable offline with no server configured.
 */
export function createLocalConnector(): SyncConnector {
  const listeners = new Map<string, Set<Listener>>()
  const pending: Array<{ table: string; row: unknown }> = []

  return {
    async start() {
      /* nothing to connect */
    },
    async stop() {
      listeners.clear()
      pending.length = 0
    },
    enqueue(table, row) {
      pending.push({ table, row })
    },
    subscribeMatch(matchId, cb) {
      const set = listeners.get(matchId) ?? new Set<Listener>()
      set.add(cb)
      listeners.set(matchId, set)
      return () => {
        set.delete(cb)
        if (set.size === 0) listeners.delete(matchId)
      }
    },
  }
}