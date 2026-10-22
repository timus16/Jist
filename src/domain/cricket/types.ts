import type {
  BallOutcome,
  Match,
  Point,
  ShotSource,
} from '../types'

/**
 * Engine contracts. The cricket scoring ENGINE is implemented in Wave 1; these
 * are the shapes it must implement against. Keep changes additive.
 */

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
}

export interface MatchState {
  match: Match
  innings: InningsState[]
  currentInnings: number
}