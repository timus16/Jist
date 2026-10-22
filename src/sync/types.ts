import type { ShotEvent } from '../domain'

export interface SyncConnector {
  /** Begin syncing. Resolves once the connector is ready. */
  start(): Promise<void>
  /** Stop syncing and release resources. */
  stop(): Promise<void>
  /** Enqueue a local write for upload. */
  enqueue(table: string, row: unknown): void
  /** Subscribe to remote shot events for a match. Returns an unsubscribe fn. */
  subscribeMatch(matchId: string, cb: (evt: ShotEvent) => void): () => void
}