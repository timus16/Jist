import { useEffect, useState } from 'react'
import type { ShotEvent } from '../../domain'
import { shotEventsRepo } from '../../db'
import { createSyncConnector } from '../../sync'

function byTimeline(a: ShotEvent, b: ShotEvent): number {
  if (a.innings !== b.innings) return a.innings - b.innings
  if (a.over !== b.over) return a.over - b.over
  if (a.ballInOver !== b.ballInOver) return a.ballInOver - b.ballInOver
  return a.createdAt.localeCompare(b.createdAt)
}

function mergeShots(prev: ShotEvent[], incoming: ShotEvent[]): ShotEvent[] {
  if (incoming.length === 0) return prev
  const seen = new Set(prev.map((s) => s.id))
  const next = [...prev]
  for (const shot of incoming) {
    if (seen.has(shot.id)) continue
    seen.add(shot.id)
    next.push(shot)
  }
  return next.length === prev.length ? prev : next.sort(byTimeline)
}

/**
 * Hydrates persisted shots for a match and appends live ones from the sync
 * connector. De-dupes by id and keeps the timeline ordered.
 */
export function useMatchShots(matchId: string): { shots: ShotEvent[]; loading: boolean } {
  const [collected, setCollected] = useState<ShotEvent[]>([])
  const [loadedMatchId, setLoadedMatchId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const connector = createSyncConnector()
    const unsubscribe = connector.subscribeMatch(matchId, (evt) => {
      if (cancelled) return
      setCollected((prev) => mergeShots(prev, [evt]))
    })

    shotEventsRepo
      .listByMatch(matchId)
      .then((existing) => {
        if (!cancelled) setCollected((prev) => mergeShots(prev, existing))
      })
      .catch(() => {
        /* keep whatever the sync connector delivered */
      })
      .finally(() => {
        if (!cancelled) setLoadedMatchId(matchId)
      })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [matchId])

  const shots = collected.filter((shot) => shot.matchId === matchId)
  const loading = loadedMatchId !== matchId

  return { shots, loading }
}
