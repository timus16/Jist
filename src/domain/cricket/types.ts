import type {
  BallOutcome,
  Delivery,
  Match,
  Point,
  ShotEvent,
  ShotSource,
} from '../types'

/**
 * Engine contracts. The cricket scoring ENGINE is implemented in Wave 1; these
 * are the shapes it must implement against. Keep changes additive.
 */

export type WicketType =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'stumped'
  | 'run_out'
  | 'hit_wicket'

export interface MatchConfig {
  oversPerInnings: number
  playersPerSide?: number
  battingOrder: string[]
  bowlingOrder: string[]
  openingBatsmen: [string, string]
  openingBowler: string
  matchId?: string
  matchName?: string
  teamAId?: string
  teamBId?: string
  groundId?: string | null
  createdAt?: string
}

export interface DeliveryInput {
  matchId: string
  innings: number
  batsmanId: string
  bowlerId: string
  outcome: BallOutcome
  runs: number
  shotType?: string | null
  zoneId?: number | null
  landingPoint?: Point | null
  fielderId?: string | null
  source?: ShotSource
  wicketType?: WicketType | null
  wicketOn?: 'wide' | 'no_ball' | null
  id?: string
  createdAt?: string
}

export interface BatsmanState {
  playerId: string
  runs: number
  balls: number
  fours: number
  sixes: number
  isStriker: boolean
  isOut: boolean
  howOut: string | null
  strikeRate?: number
}

export interface BowlerState {
  playerId: string
  balls: number
  overs: number
  runs: number
  wickets: number
  maidens: number
  wides: number
  noBalls: number
  economy?: number
}

export interface Extras {
  wides: number
  noBalls: number
  byes: number
  legByes: number
}

export interface InningsState {
  matchId: string
  innings: number
  battingTeamId: string
  bowlingTeamId: string
  runs: number
  wickets: number
  balls: number
  extras: Extras
  batsmen: Record<string, BatsmanState>
  bowlers: Record<string, BowlerState>
  strikerId: string | null
  nonStrikerId: string | null
  bowlerId: string | null
  over: number
  ballInOver: number
  completed: boolean
  target?: number | null
  deliveries?: Delivery[]
  shotEvents?: ShotEvent[]
}

export interface MatchState {
  match: Match
  innings: InningsState[]
  currentInnings: number
  config?: MatchConfig
}