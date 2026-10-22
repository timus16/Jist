import { create } from 'zustand'
import type { Match } from '../domain'
import { newId } from '../domain'
import { matchesRepo } from '../db'

interface NewMatchInput {
  name: string
  teamAId: string
  teamBId: string
  groundId?: string | null
  oversPerInnings?: number
}

interface MatchStore {
  matches: Match[]
  currentMatchId: string | null
  loading: boolean
  loadMatches: () => Promise<void>
  createMatch: (input: NewMatchInput) => Promise<Match>
  setCurrentMatch: (matchId: string | null) => void
}

export const useMatchStore = create<MatchStore>((set) => ({
  matches: [],
  currentMatchId: null,
  loading: false,
  async loadMatches() {
    set({ loading: true })
    const matches = await matchesRepo.list()
    set({ matches, loading: false })
  },
  async createMatch(input) {
    const now = new Date().toISOString()
    const match: Match = {
      id: newId(),
      name: input.name,
      sport: 'cricket',
      teamAId: input.teamAId,
      teamBId: input.teamBId,
      groundId: input.groundId ?? null,
      oversPerInnings: input.oversPerInnings ?? 20,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    }
    await matchesRepo.insert(match)
    set((state) => ({ matches: [match, ...state.matches] }))
    return match
  },
  setCurrentMatch(matchId) {
    set({ currentMatchId: matchId })
  },
}))