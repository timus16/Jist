import { createLocalConnector } from './localConnector'
import { createSupabaseConnector, isSupabaseConfigured } from './supabaseConnector'
import type { SyncConnector } from './types'

/**
 * Returns the Supabase connector when env vars are present, otherwise the
 * offline no-op local connector so the app always runs.
 */
export function createSyncConnector(): SyncConnector {
  return isSupabaseConfigured() ? createSupabaseConnector() : createLocalConnector()
}