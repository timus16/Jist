import { create } from 'zustand'
import type { Match, Delivery, ShotEvent } from '../domain'
import type { DeliveryInput, MatchState, MatchConfig } from '../domain/cricket/types'
import { newMatchState, applyDelivery, isMatchComplete } from '../domain/cricket/engine'
import { matchesRepo } from '../db'
import { deliveriesRepo } from '../db'
import { shotEventsRepo } from '../db'

function configFromMatch(match: Match): MatchConfig {
  return {
    oversPerInnings: match.oversPerInnings,
    battingOrder: [],
    bowlingOrder: [],
    openingBatsmen: ['batsman1', 'batsman2'],
    openingBowler: 'bowler1',
    matchId: match.id,
    matchName: match.name,
    teamAId: match.teamAId,
    teamBId: match.teamBId,
    groundId: match.groundId,
    createdAt: match.createdAt,
  }
}

function deliveryToInput(d: Delivery): DeliveryInput {
  return {
    id: d.id,
    matchId: d.matchId,
    innings: d.innings,
    batsmanId: d.batsmanId,
    bowlerId: d.bowlerId,
    outcome: d.outcome,
    runs: d.runs,
    shotType: null,
    zoneId: null,
    landingPoint: null,
    fielderId: d.fielderId,
    source: 'manual',
    wicketType: null,
    wicketOn: null,
    createdAt: d.createdAt,
  }
}

function rebuildState(match: Match, deliveries: Delivery[]): MatchState {
  const config = configFromMatch(match)
  let state = newMatchState(config)
  const sorted = [...deliveries].sort((a, b) => {
    if (a.over !== b.over) return a.over - b.over
    return a.ballInOver - b.ballInOver
  })
  for (const d of sorted) {
    const input = deliveryToInput(d)
    state = applyDelivery(state, input)
  }
  return state
}

interface ScoreStore {
  matchState: MatchState | null
  deliveries: Delivery[]
  shotEvents: ShotEvent[]
  loading: boolean
  error: string | null
  loadMatch: (matchId: string) => Promise<void>
  addDelivery: (input: DeliveryInput) => Promise<void>
  reset: () => void
}

export const useScoreStore = create<ScoreStore>((set, get) => ({
  matchState: null,
  deliveries: [],
  shotEvents: [],
  loading: false,
  error: null,

  async loadMatch(matchId) {
    set({ loading: true, error: null })
    try {
      const match = await matchesRepo.get(matchId)
      if (!match) throw new Error('Match not found')
      const [deliveries, shotEvents] = await Promise.all([
        deliveriesRepo.listByMatch(matchId),
        shotEventsRepo.listByMatch(matchId),
      ])
      const matchState = rebuildState(match, deliveries)
      set({ matchState, deliveries, shotEvents, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load match', loading: false })
    }
  },

  async addDelivery(input) {
    const { matchState } = get()
    if (!matchState) throw new Error('No match loaded')
    if (isMatchComplete(matchState)) return

    const nextState = applyDelivery(matchState, input)
    const newDelivery = nextState.innings
      .find((i) => i.innings === input.innings)
      ?.deliveries?.find((d) => d.id === input.id)
    const newShotEvent = nextState.innings
      .find((i) => i.innings === input.innings)
      ?.shotEvents?.find((s) => s.id === input.id)

    if (newDelivery) {
      await deliveriesRepo.insert(newDelivery)
    }
    if (newShotEvent) {
      await shotEventsRepo.insert(newShotEvent)
    }

    set({
      matchState: nextState,
      deliveries: [...get().deliveries, newDelivery!].filter(Boolean),
      shotEvents: newShotEvent ? [...get().shotEvents, newShotEvent] : get().shotEvents,
    })
  },

  reset() {
    set({ matchState: null, deliveries: [], shotEvents: [], loading: false, error: null })
  },
}))

export { rebuildState, configFromMatch, deliveryToInput }
