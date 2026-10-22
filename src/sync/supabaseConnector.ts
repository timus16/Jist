import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js'
import type { ShotEvent } from '../domain'
import type { SyncConnector } from './types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey)
}

/**
 * Supabase-backed connector. Requires VITE_SUPABASE_URL and
 * VITE_SUPABASE_ANON_KEY; throws a clear error when they are missing.
 */
export function createSupabaseConnector(): SyncConnector {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase sync is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env',
    )
  }

  const client: SupabaseClient = createClient(url as string, anonKey as string)
  const channels = new Map<string, RealtimeChannel>()

  return {
    async start() {
      await client.auth.getSession()
    },
    async stop() {
      for (const channel of channels.values()) {
        await client.removeChannel(channel)
      }
      channels.clear()
    },
    enqueue(table, row) {
      void client
        .from(table)
        .upsert(row as Record<string, unknown>)
        .then(({ error }) => {
          if (error) console.error('[sync] upsert failed', table, error.message)
        })
    },
    subscribeMatch(matchId, cb) {
      const channel = client
        .channel(`shot_events:${matchId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'shot_events', filter: `match_id=eq.${matchId}` },
          (payload) => cb(payload.new as ShotEvent),
        )
        .subscribe()
      channels.set(matchId, channel)
      return () => {
        const existing = channels.get(matchId)
        if (existing) {
          void client.removeChannel(existing)
          channels.delete(matchId)
        }
      }
    },
  }
}