import { newId } from '../ids'
import type { Delivery, Match, ShotEvent } from '../types'
import type {
  BatsmanState,
  BowlerState,
  DeliveryInput,
  InningsState,
  MatchConfig,
  MatchState,
  WicketType,
} from './types'

export const LEGAL_BALLS_PER_OVER = 6

export interface MatchSummary {
  runs: number
  wickets: number
  overs: string
  runRate: number
  batting: BatsmanState[]
  bowling: BowlerState[]
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

function oversAsNumber(balls: number): number {
  return Math.floor(balls / LEGAL_BALLS_PER_OVER) + (balls % LEGAL_BALLS_PER_OVER) / 10
}

function formatOvers(balls: number): string {
  return `${Math.floor(balls / LEGAL_BALLS_PER_OVER)}.${balls % LEGAL_BALLS_PER_OVER}`
}

function newBatsman(playerId: string, isStriker: boolean): BatsmanState {
  return {
    playerId,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    isStriker,
    isOut: false,
    howOut: null,
    strikeRate: 0,
  }
}

function newBowler(playerId: string): BowlerState {
  return {
    playerId,
    balls: 0,
    overs: 0,
    runs: 0,
    wickets: 0,
    maidens: 0,
    wides: 0,
    noBalls: 0,
    economy: 0,
  }
}

function refreshBatsmanDerived(b: BatsmanState): void {
  b.strikeRate = b.balls > 0 ? round2((b.runs * 100) / b.balls) : 0
}

function refreshBowlerDerived(b: BowlerState): void {
  b.overs = oversAsNumber(b.balls)
  b.economy = b.balls > 0 ? round2((b.runs * LEGAL_BALLS_PER_OVER) / b.balls) : 0
}

function cloneInnings(i: InningsState): InningsState {
  const batsmen: Record<string, BatsmanState> = {}
  for (const key of Object.keys(i.batsmen)) batsmen[key] = { ...i.batsmen[key] }
  const bowlers: Record<string, BowlerState> = {}
  for (const key of Object.keys(i.bowlers)) bowlers[key] = { ...i.bowlers[key] }
  return {
    ...i,
    extras: { ...i.extras },
    batsmen,
    bowlers,
    deliveries: (i.deliveries ?? []).map((d) => ({ ...d })),
    shotEvents: (i.shotEvents ?? []).map((s) => ({
      ...s,
      landingPoint: s.landingPoint ? { ...s.landingPoint } : null,
    })),
  }
}

function cloneState(state: MatchState): MatchState {
  return {
    match: { ...state.match },
    config: state.config,
    currentInnings: state.currentInnings,
    innings: state.innings.map(cloneInnings),
  }
}

function syncStrikerFlags(innings: InningsState): void {
  for (const id of Object.keys(innings.batsmen)) {
    innings.batsmen[id].isStriker = id === innings.strikerId
  }
}

function swapEnds(innings: InningsState): void {
  const previousStriker = innings.strikerId
  innings.strikerId = innings.nonStrikerId
  innings.nonStrikerId = previousStriker
  syncStrikerFlags(innings)
}

function nextBatsman(innings: InningsState, config: MatchConfig | undefined): string | null {
  const order = config?.battingOrder ?? []
  for (const playerId of order) {
    if (playerId === innings.strikerId || playerId === innings.nonStrikerId) continue
    if (playerId in innings.batsmen) continue
    return playerId
  }
  return null
}

function bringInReplacement(innings: InningsState, config: MatchConfig | undefined, outId: string): void {
  const replacement = nextBatsman(innings, config)
  if (replacement) {
    const asStriker = innings.strikerId === outId
    innings.batsmen[replacement] = newBatsman(replacement, asStriker)
    if (asStriker) innings.strikerId = replacement
    else innings.nonStrikerId = replacement
  } else {
    if (innings.strikerId === outId) innings.strikerId = null
    if (innings.nonStrikerId === outId) innings.nonStrikerId = null
  }
  syncStrikerFlags(innings)
}

function nextBowler(innings: InningsState, config: MatchConfig | undefined, currentId: string | null): string | null {
  const order = config?.bowlingOrder ?? []
  if (order.length === 0) return currentId
  const currentIndex = currentId ? order.indexOf(currentId) : -1
  let next = order[(currentIndex + 1) % order.length]
  if (order.length > 1 && next === currentId) next = order[(currentIndex + 2) % order.length]
  if (!innings.bowlers[next]) innings.bowlers[next] = newBowler(next)
  return next
}

function resolveWicketType(input: DeliveryInput): WicketType {
  if (input.wicketType) return input.wicketType
  if (input.runs > 0) return 'run_out'
  if (input.fielderId) return 'caught'
  return 'bowled'
}

function describeHowOut(type: WicketType, fielderId: string | null): string {
  switch (type) {
    case 'bowled':
      return 'bowled'
    case 'caught':
      return fielderId ? `caught by ${fielderId}` : 'caught'
    case 'lbw':
      return 'lbw'
    case 'stumped':
      return 'stumped'
    case 'run_out':
      return 'run out'
    case 'hit_wicket':
      return 'hit wicket'
  }
}

function bowlerConceded(delivery: Delivery): number {
  if (delivery.outcome === 'bye' || delivery.outcome === 'leg_bye') return 0
  if (delivery.outcome === 'wide' || delivery.outcome === 'no_ball' || delivery.outcome === 'wicket') {
    return delivery.runs + delivery.extras
  }
  return delivery.runs
}

function createInnings(config: MatchConfig, match: Match, number: number, target: number | null): InningsState {
  const [openerOne, openerTwo] = config.openingBatsmen
  const batsmen: Record<string, BatsmanState> = {
    [openerOne]: newBatsman(openerOne, true),
  }
  if (openerTwo !== openerOne) batsmen[openerTwo] = newBatsman(openerTwo, false)
  const bowlers: Record<string, BowlerState> = {
    [config.openingBowler]: newBowler(config.openingBowler),
  }
  return {
    matchId: match.id,
    innings: number,
    battingTeamId: number === 1 ? match.teamAId : match.teamBId,
    bowlingTeamId: number === 1 ? match.teamBId : match.teamAId,
    runs: 0,
    wickets: 0,
    balls: 0,
    extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
    batsmen,
    bowlers,
    strikerId: openerOne,
    nonStrikerId: openerTwo === openerOne ? null : openerTwo,
    bowlerId: config.openingBowler,
    over: 0,
    ballInOver: 0,
    completed: false,
    target,
    deliveries: [],
    shotEvents: [],
  }
}

export function newMatchState(config: MatchConfig): MatchState {
  const now = config.createdAt ?? new Date().toISOString()
  const match: Match = {
    id: config.matchId ?? newId(),
    name: config.matchName ?? 'Match',
    sport: 'cricket',
    teamAId: config.teamAId ?? 'teamA',
    teamBId: config.teamBId ?? 'teamB',
    groundId: config.groundId ?? null,
    oversPerInnings: config.oversPerInnings,
    status: 'live',
    createdAt: now,
    updatedAt: now,
  }
  return {
    match,
    config,
    currentInnings: 1,
    innings: [createInnings(config, match, 1, null)],
  }
}

function currentInningsOf(state: MatchState): InningsState | undefined {
  return (
    state.innings.find((i) => i.innings === state.currentInnings) ??
    state.innings[state.innings.length - 1]
  )
}

export function applyDelivery(state: MatchState, input: DeliveryInput): MatchState {
  const next = cloneState(state)
  let innings = next.innings.find((i) => i.innings === input.innings)
  if (!innings) {
    const config = next.config
    if (!config) throw new Error('applyDelivery: MatchState.config is required to open a new innings')
    const previous = next.innings.find((i) => i.innings === input.innings - 1)
    innings = createInnings(config, next.match, input.innings, previous ? previous.runs + 1 : null)
    next.innings.push(innings)
    next.innings.sort((a, b) => a.innings - b.innings)
  }
  const config = next.config
  const deliveries = innings.deliveries ?? (innings.deliveries = [])
  const shotEvents = innings.shotEvents ?? (innings.shotEvents = [])

  let batsmanRuns = 0
  let byes = 0
  let legByes = 0
  let wides = 0
  let noBalls = 0
  const isWicketBall = input.outcome === 'wicket'

  switch (input.outcome) {
    case 'dot':
      break
    case 'runs':
      batsmanRuns = clamp(input.runs, 0, 6)
      break
    case 'wide':
      wides = Math.max(1, input.runs)
      break
    case 'no_ball':
      noBalls = 1
      batsmanRuns = Math.max(0, input.runs)
      break
    case 'bye':
      byes = Math.max(1, input.runs)
      break
    case 'leg_bye':
      legByes = Math.max(1, input.runs)
      break
    case 'wicket':
      batsmanRuns = Math.max(0, input.runs)
      break
  }

  const wicketOnWide = isWicketBall && input.wicketOn === 'wide'
  const wicketOnNoBall = isWicketBall && input.wicketOn === 'no_ball'
  if (wicketOnWide) wides += 1
  if (wicketOnNoBall) noBalls += 1

  const illegal =
    input.outcome === 'wide' ||
    input.outcome === 'no_ball' ||
    wicketOnWide ||
    wicketOnNoBall
  const legal = !illegal

  innings.extras.wides += wides
  innings.extras.noBalls += noBalls
  innings.extras.byes += byes
  innings.extras.legByes += legByes
  const extrasRuns = wides + noBalls + byes + legByes
  innings.runs += batsmanRuns + extrasRuns

  const overBefore = innings.over
  const striker = innings.strikerId ? innings.batsmen[innings.strikerId] : undefined
  if (striker) {
    if (legal) striker.balls += 1
    striker.runs += batsmanRuns
    if (input.outcome === 'runs' && batsmanRuns === 4) striker.fours += 1
    if (input.outcome === 'runs' && batsmanRuns === 6) striker.sixes += 1
    refreshBatsmanDerived(striker)
  }

  const bowlerId = input.bowlerId || innings.bowlerId
  if (bowlerId) {
    if (!innings.bowlers[bowlerId]) innings.bowlers[bowlerId] = newBowler(bowlerId)
    innings.bowlerId = bowlerId
  }
  const bowler = bowlerId ? innings.bowlers[bowlerId] : undefined
  if (bowler) {
    if (legal) bowler.balls += 1
    bowler.runs += batsmanRuns + wides + noBalls
    if (wides > 0) bowler.wides += 1
    if (noBalls > 0) bowler.noBalls += 1
    refreshBowlerDerived(bowler)
  }

  if (legal) {
    innings.balls += 1
    innings.ballInOver += 1
  }
  const recordedBallInOver = legal ? innings.ballInOver : innings.ballInOver + 1

  const createdAt = input.createdAt ?? new Date().toISOString()
  const delivery: Delivery = {
    id: input.id ?? newId(),
    matchId: input.matchId,
    innings: input.innings,
    over: overBefore,
    ballInOver: recordedBallInOver,
    batsmanId: input.batsmanId,
    bowlerId: bowlerId ?? '',
    outcome: input.outcome,
    runs: batsmanRuns,
    isWicket: isWicketBall,
    fielderId: input.fielderId ?? null,
    shotEventId: null,
    extras: extrasRuns,
    createdAt,
  }

  const hasShotData =
    input.shotType != null ||
    input.zoneId != null ||
    input.landingPoint != null ||
    input.source != null
  if (hasShotData) {
    const shotEventId = newId()
    const shotEvent: ShotEvent = {
      id: shotEventId,
      matchId: input.matchId,
      innings: input.innings,
      over: overBefore,
      ballInOver: recordedBallInOver,
      batsmanId: input.batsmanId,
      bowlerId: bowlerId ?? '',
      shotType: input.shotType ?? null,
      zoneId: input.zoneId ?? null,
      landingPoint: input.landingPoint ? { ...input.landingPoint } : null,
      runs: batsmanRuns,
      isWicket: isWicketBall,
      fielderId: input.fielderId ?? null,
      source: input.source ?? 'manual',
      createdAt,
    }
    delivery.shotEventId = shotEventId
    shotEvents.push(shotEvent)
  }
  deliveries.push(delivery)

  const runsRun = batsmanRuns + byes + legByes
  const strikeRotated = runsRun % 2 === 1

  if (isWicketBall) {
    const wicketType = resolveWicketType(input)
    if (strikeRotated) swapEnds(innings)
    const outId = input.batsmanId
    const out = innings.batsmen[outId]
    if (out) {
      out.isOut = true
      out.isStriker = false
      out.howOut = describeHowOut(wicketType, input.fielderId ?? null)
    }
    innings.wickets += 1
    if (bowler && wicketType !== 'run_out') {
      bowler.wickets += 1
      refreshBowlerDerived(bowler)
    }
    bringInReplacement(innings, config, outId)
  } else if (strikeRotated) {
    swapEnds(innings)
  }

  if (legal && innings.ballInOver >= LEGAL_BALLS_PER_OVER) {
    const conceded = deliveries
      .filter((d) => d.over === overBefore && d.bowlerId === bowlerId)
      .reduce((sum, d) => sum + bowlerConceded(d), 0)
    if (bowler && conceded === 0) {
      bowler.maidens += 1
      refreshBowlerDerived(bowler)
    }
    innings.over += 1
    innings.ballInOver = 0
    swapEnds(innings)
    innings.bowlerId = nextBowler(innings, config, bowlerId)
  }

  const maxWickets = (config?.playersPerSide ?? 11) - 1
  const oversPerInnings = config?.oversPerInnings ?? Number.POSITIVE_INFINITY
  const allOut = innings.wickets >= maxWickets
  const oversDone = innings.balls >= oversPerInnings * LEGAL_BALLS_PER_OVER
  const targetChased =
    innings.innings > 1 && innings.target != null && innings.runs >= innings.target
  if (allOut || oversDone || targetChased) innings.completed = true

  next.currentInnings = innings.innings
  next.match.updatedAt = createdAt
  if (isMatchComplete(next)) next.match.status = 'completed'
  return next
}

export function ballLabel(delivery: Delivery): string {
  switch (delivery.outcome) {
    case 'dot':
      return '0'
    case 'runs':
      return String(delivery.runs)
    case 'wide':
      return delivery.extras > 1 ? `wd${delivery.extras}` : 'wd'
    case 'no_ball':
      return delivery.runs > 0 ? `nb${delivery.runs}` : 'nb'
    case 'bye':
      return `b${delivery.extras}`
    case 'leg_bye':
      return `lb${delivery.extras}`
    case 'wicket':
      return delivery.runs > 0 ? `W${delivery.runs}` : 'W'
    default:
      return '?'
  }
}

export function currentOverBalls(state: MatchState): string[] {
  const innings = currentInningsOf(state)
  if (!innings) return []
  return (innings.deliveries ?? [])
    .filter((d) => d.over === innings.over)
    .map((d) => ballLabel(d))
}

export function isInningsComplete(state: MatchState): boolean {
  const innings = currentInningsOf(state)
  return !!innings && innings.completed
}

export function isMatchComplete(state: MatchState): boolean {
  if (state.innings.length < 2) return false
  if (!state.innings.every((i) => i.completed)) return false
  return true
}

export function summary(state: MatchState): MatchSummary {
  const innings = currentInningsOf(state)
  if (!innings) {
    return { runs: 0, wickets: 0, overs: '0.0', runRate: 0, batting: [], bowling: [] }
  }
  const battingOrder = state.config?.battingOrder ?? []
  const bowlingOrder = state.config?.bowlingOrder ?? []
  const batsmanIds = Object.keys(innings.batsmen)
  const bowlerIds = Object.keys(innings.bowlers)
  const orderedBatsmen = [
    ...battingOrder.filter((p) => batsmanIds.includes(p)),
    ...batsmanIds.filter((p) => !battingOrder.includes(p)),
  ]
  const orderedBowlers = [
    ...bowlingOrder.filter((p) => bowlerIds.includes(p)),
    ...bowlerIds.filter((p) => !bowlingOrder.includes(p)),
  ]
  const batting = orderedBatsmen.map((p) => ({ ...innings.batsmen[p] }))
  const bowling = orderedBowlers.map((p) => ({ ...innings.bowlers[p] }))
  const overs = formatOvers(innings.balls)
  const runRate = innings.balls > 0 ? round2((innings.runs * LEGAL_BALLS_PER_OVER) / innings.balls) : 0
  return { runs: innings.runs, wickets: innings.wickets, overs, runRate, batting, bowling }
}