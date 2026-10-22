export type Sport = 'cricket'

export type BallOutcome =
  | 'dot'
  | 'runs'
  | 'wide'
  | 'no_ball'
  | 'bye'
  | 'leg_bye'
  | 'wicket'

export type ShotSource = 'W1' | 'W2' | 'manual'

export interface Point {
  x: number
  y: number
}

export interface Match {
  id: string
  name: string
  sport: Sport
  teamAId: string
  teamBId: string
  groundId: string | null
  oversPerInnings: number
  status: 'scheduled' | 'live' | 'completed' | 'abandoned'
  createdAt: string
  updatedAt: string
}

export interface Team {
  id: string
  name: string
  shortName: string | null
  createdAt: string
}

export interface Player {
  id: string
  teamId: string
  name: string
  role: string | null
  createdAt: string
}

export interface Delivery {
  id: string
  matchId: string
  innings: number
  over: number
  ballInOver: number
  batsmanId: string
  bowlerId: string
  outcome: BallOutcome
  runs: number
  isWicket: boolean
  fielderId: string | null
  shotEventId: string | null
  extras: number
  createdAt: string
}

export interface Innings {
  id: string
  matchId: string
  innings: number
  battingTeamId: string
  bowlingTeamId: string
  runs: number
  wickets: number
  balls: number
  completed: boolean
  createdAt: string
}

export interface ShotEvent {
  id: string
  matchId: string
  innings: number
  over: number
  ballInOver: number
  batsmanId: string
  bowlerId: string
  shotType: string | null
  zoneId: number | null
  landingPoint: Point | null
  runs: number
  isWicket: boolean
  fielderId: string | null
  source: ShotSource
  createdAt: string
}

export interface Ground {
  id: string
  name: string
  venueId: string | null
  boundaryPolygon: Point[]
  pitchCenter: Point
  pitchOrientationDeg: number
}

export interface FielderPosition {
  playerId: string
  role: string
  x: number
  y: number
}

export interface FieldSetup {
  matchId: string
  innings: number
  positions: FielderPosition[]
}

export interface ZoneMeta {
  zoneId: number
  name: string
  angleStart: number
  angleEnd: number
  radiusBand: 'inner' | 'outer'
}