import { describe, expect, it } from 'vitest'
import {
  applyDelivery,
  currentOverBalls,
  isInningsComplete,
  isMatchComplete,
  newMatchState,
  summary,
} from '../engine'
import type { DeliveryInput, InningsState, MatchConfig, MatchState } from '../types'

function cfg(overrides: Partial<MatchConfig> = {}): MatchConfig {
  return {
    oversPerInnings: 2,
    playersPerSide: 11,
    battingOrder: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10', 'b11'],
    bowlingOrder: ['p1', 'p2'],
    openingBatsmen: ['b1', 'b2'],
    openingBowler: 'p1',
    matchId: 'm1',
    matchName: 'Test Match',
    teamAId: 'A',
    teamBId: 'B',
    createdAt: '2020-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function inningsOf(state: MatchState): InningsState {
  return state.innings.find((i) => i.innings === state.currentInnings) as InningsState
}

function bowl(state: MatchState, input: Partial<DeliveryInput> = {}): MatchState {
  const inn = inningsOf(state)
  return applyDelivery(state, {
    matchId: state.match.id,
    innings: inn.innings,
    batsmanId: inn.strikerId ?? '',
    bowlerId: inn.bowlerId ?? '',
    outcome: 'dot',
    runs: 0,
    createdAt: '2020-01-01T00:00:01.000Z',
    ...input,
  })
}

describe('newMatchState', () => {
  it('initialises innings 1 with openers, bowler and zeroed stats', () => {
    const s = newMatchState(cfg())
    expect(s.currentInnings).toBe(1)
    expect(s.innings).toHaveLength(1)
    const i = s.innings[0]
    expect(i.strikerId).toBe('b1')
    expect(i.nonStrikerId).toBe('b2')
    expect(i.bowlerId).toBe('p1')
    expect(i.runs).toBe(0)
    expect(i.wickets).toBe(0)
    expect(i.balls).toBe(0)
    expect(i.batsmen.b1.isStriker).toBe(true)
    expect(i.batsmen.b2.isStriker).toBe(false)
    expect(i.batsmen.b1.runs).toBe(0)
    expect(i.bowlers.p1.balls).toBe(0)
    expect(currentOverBalls(s)).toEqual([])
    expect(isInningsComplete(s)).toBe(false)
    expect(isMatchComplete(s)).toBe(false)
  })
})

describe('runs and strike rotation', () => {
  it('credits runs, flags boundaries and rotates strike on odd runs', () => {
    let s = newMatchState(cfg())
    s = bowl(s, { outcome: 'runs', runs: 1 })
    expect(inningsOf(s).runs).toBe(1)
    expect(inningsOf(s).strikerId).toBe('b2')
    expect(inningsOf(s).batsmen.b1.runs).toBe(1)
    expect(inningsOf(s).batsmen.b1.balls).toBe(1)
    s = bowl(s, { outcome: 'runs', runs: 4 })
    expect(inningsOf(s).batsmen.b2.fours).toBe(1)
    expect(inningsOf(s).strikerId).toBe('b2')
    s = bowl(s, { outcome: 'runs', runs: 6 })
    expect(inningsOf(s).batsmen.b2.sixes).toBe(1)
    s = bowl(s, { outcome: 'runs', runs: 8 })
    expect(inningsOf(s).runs).toBe(17)
    expect(inningsOf(s).batsmen.b2.sixes).toBe(2)
    expect(inningsOf(s).batsmen.b2.balls).toBe(3)
  })

  it('does not score or rotate on a dot ball', () => {
    let s = newMatchState(cfg())
    s = bowl(s)
    expect(inningsOf(s).runs).toBe(0)
    expect(inningsOf(s).strikerId).toBe('b1')
    expect(inningsOf(s).balls).toBe(1)
  })
})

describe('overs and bowler rotation', () => {
  it('completes an over every 6 legal balls, swaps ends and rotates the bowler', () => {
    let s = newMatchState(cfg())
    for (let k = 0; k < 6; k += 1) s = bowl(s)
    const i = inningsOf(s)
    expect(i.balls).toBe(6)
    expect(i.over).toBe(1)
    expect(i.ballInOver).toBe(0)
    expect(i.bowlerId).toBe('p2')
    expect(i.strikerId).toBe('b2')
    expect(currentOverBalls(s)).toEqual([])
    expect(summary(s).overs).toBe('1.0')
  })

  it('does not advance the legal-ball count on wides or no-balls', () => {
    let s = newMatchState(cfg())
    for (let k = 0; k < 5; k += 1) s = bowl(s)
    s = bowl(s, { outcome: 'wide', runs: 1 })
    expect(inningsOf(s).ballInOver).toBe(5)
    expect(inningsOf(s).over).toBe(0)
    s = bowl(s, { outcome: 'no_ball', runs: 0 })
    expect(inningsOf(s).ballInOver).toBe(5)
    s = bowl(s)
    expect(inningsOf(s).over).toBe(1)
  })

  it('credits a maiden when a bowler concedes nothing in a completed over', () => {
    let s = newMatchState(cfg())
    for (let k = 0; k < 6; k += 1) s = bowl(s)
    expect(inningsOf(s).bowlers.p1.maidens).toBe(1)
  })
})

describe('extras', () => {
  it('wide adds one run, no ball faced and no legal ball for the bowler', () => {
    let s = newMatchState(cfg())
    s = bowl(s, { outcome: 'wide', runs: 1 })
    const i = inningsOf(s)
    expect(i.runs).toBe(1)
    expect(i.extras.wides).toBe(1)
    expect(i.balls).toBe(0)
    expect(i.batsmen.b1.balls).toBe(0)
    expect(i.batsmen.b1.runs).toBe(0)
    expect(i.bowlers.p1.balls).toBe(0)
    expect(i.bowlers.p1.runs).toBe(1)
    expect(i.bowlers.p1.wides).toBe(1)
    expect(currentOverBalls(s)).toEqual(['wd'])
  })

  it('no-ball adds a penalty run, batsman can score, extras tracked separately', () => {
    let s = newMatchState(cfg())
    s = bowl(s, { outcome: 'no_ball', runs: 2 })
    const i = inningsOf(s)
    expect(i.runs).toBe(3)
    expect(i.extras.noBalls).toBe(1)
    expect(i.balls).toBe(0)
    expect(i.batsmen.b1.runs).toBe(2)
    expect(i.batsmen.b1.balls).toBe(0)
    expect(i.bowlers.p1.noBalls).toBe(1)
    expect(i.bowlers.p1.runs).toBe(3)
    expect(currentOverBalls(s)).toEqual(['nb2'])
  })

  it('byes and leg-byes go to the team but not the batsman', () => {
    let s = newMatchState(cfg())
    s = bowl(s, { outcome: 'bye', runs: 2 })
    s = bowl(s, { outcome: 'leg_bye', runs: 1 })
    const i = inningsOf(s)
    expect(i.runs).toBe(3)
    expect(i.extras.byes).toBe(2)
    expect(i.extras.legByes).toBe(1)
    expect(i.batsmen.b1.runs).toBe(0)
    expect(i.batsmen.b1.balls).toBe(2)
    expect(i.bowlers.p1.runs).toBe(0)
    expect(i.balls).toBe(2)
  })
})

describe('wickets', () => {
  const bowlerCredited = ['bowled', 'caught', 'lbw', 'stumped', 'hit_wicket'] as const

  it.each(bowlerCredited)('%s retires the batsman, credits the bowler and brings the next in', (type) => {
    let s = newMatchState(cfg())
    s = bowl(s, {
      outcome: 'wicket',
      runs: 0,
      wicketType: type,
      fielderId: type === 'caught' ? 'f9' : null,
    })
    const i = inningsOf(s)
    expect(i.wickets).toBe(1)
    expect(i.batsmen.b1.isOut).toBe(true)
    expect(i.batsmen.b1.isStriker).toBe(false)
    expect(i.batsmen.b1.howOut).toBeTruthy()
    expect(i.strikerId).toBe('b3')
    expect(i.batsmen.b3.isStriker).toBe(true)
    expect(i.bowlers.p1.wickets).toBe(1)
    expect(i.balls).toBe(1)
  })

  it('run out is not credited to the bowler and rotates strike by runs completed', () => {
    let s = newMatchState(cfg())
    s = bowl(s, { outcome: 'wicket', runs: 1, wicketType: 'run_out', batsmanId: 'b1' })
    const i = inningsOf(s)
    expect(i.wickets).toBe(1)
    expect(i.runs).toBe(1)
    expect(i.bowlers.p1.wickets).toBe(0)
    expect(i.batsmen.b1.isOut).toBe(true)
    expect(i.strikerId).toBe('b2')
    expect(i.batsmen.b3).toBeTruthy()
  })

  it('supports a run-out on an illegal (wide) delivery without a legal ball', () => {
    let s = newMatchState(cfg())
    s = bowl(s, { outcome: 'wicket', runs: 0, wicketType: 'run_out', wicketOn: 'wide' })
    const i = inningsOf(s)
    expect(i.wickets).toBe(1)
    expect(i.extras.wides).toBe(1)
    expect(i.runs).toBe(1)
    expect(i.balls).toBe(0)
    expect(i.bowlers.p1.balls).toBe(0)
    expect(i.bowlers.p1.wickets).toBe(0)
  })
})

describe('innings and match completion', () => {
  it('ends the innings when all batsmen are out', () => {
    let s = newMatchState(cfg({ playersPerSide: 3, battingOrder: ['b1', 'b2', 'b3'], oversPerInnings: 5 }))
    s = bowl(s, { outcome: 'wicket', runs: 0, wicketType: 'bowled' })
    expect(isInningsComplete(s)).toBe(false)
    s = bowl(s, { outcome: 'wicket', runs: 0, wicketType: 'bowled' })
    const i = inningsOf(s)
    expect(i.wickets).toBe(2)
    expect(i.completed).toBe(true)
    expect(isInningsComplete(s)).toBe(true)
    expect(isMatchComplete(s)).toBe(false)
  })

  it('ends the innings when the overs are complete', () => {
    let s = newMatchState(cfg({ oversPerInnings: 1 }))
    for (let k = 0; k < 6; k += 1) s = bowl(s)
    expect(inningsOf(s).completed).toBe(true)
    expect(isInningsComplete(s)).toBe(true)
  })

  it('completes innings 2 and the match when the target is chased', () => {
    let s = newMatchState(cfg({ oversPerInnings: 1 }))
    s = bowl(s, { outcome: 'runs', runs: 4 })
    for (let k = 0; k < 5; k += 1) s = bowl(s)
    expect(inningsOf(s).completed).toBe(true)
    expect(isMatchComplete(s)).toBe(false)

    s = bowl(s, { innings: 2, outcome: 'runs', runs: 4 })
    const opened = s.innings.find((i) => i.innings === 2) as InningsState
    expect(opened.target).toBe(5)
    expect(opened.runs).toBe(4)
    s = bowl(s, { innings: 2, outcome: 'runs', runs: 1 })
    const chased = s.innings.find((i) => i.innings === 2) as InningsState
    expect(chased.runs).toBe(5)
    expect(chased.completed).toBe(true)
    expect(isMatchComplete(s)).toBe(true)
    expect(s.match.status).toBe('completed')
  })
})

describe('presentation helpers', () => {
  it('renders the current over ball-by-ball', () => {
    let s = newMatchState(cfg())
    s = bowl(s, { outcome: 'dot' })
    s = bowl(s, { outcome: 'runs', runs: 1 })
    s = bowl(s, { outcome: 'runs', runs: 4 })
    s = bowl(s, { outcome: 'wicket', runs: 0, wicketType: 'bowled' })
    s = bowl(s, { outcome: 'wide', runs: 1 })
    s = bowl(s, { outcome: 'runs', runs: 2 })
    expect(currentOverBalls(s)).toEqual(['0', '1', '4', 'W', 'wd', '2'])
  })

  it('summarises totals, run rate, strike rate and economy', () => {
    let s = newMatchState(cfg())
    s = bowl(s, { outcome: 'runs', runs: 4 })
    s = bowl(s, { outcome: 'runs', runs: 6 })
    s = bowl(s, { outcome: 'wide', runs: 1 })
    s = bowl(s, { outcome: 'dot' })
    s = bowl(s, { outcome: 'bye', runs: 2 })
    s = bowl(s, { outcome: 'runs', runs: 1 })
    s = bowl(s, { outcome: 'dot' })
    const sum = summary(s)
    expect(sum.runs).toBe(14)
    expect(sum.wickets).toBe(0)
    expect(sum.overs).toBe('1.0')
    expect(sum.runRate).toBeCloseTo(14, 5)
    const b1 = sum.batting.find((b) => b.playerId === 'b1') as {
      runs: number
      balls: number
      fours: number
      sixes: number
      strikeRate: number
    }
    expect(b1.runs).toBe(11)
    expect(b1.balls).toBe(5)
    expect(b1.fours).toBe(1)
    expect(b1.sixes).toBe(1)
    expect(b1.strikeRate).toBeCloseTo(220, 5)
    const p1 = sum.bowling[0]
    expect(p1.playerId).toBe('p1')
    expect(p1.balls).toBe(6)
    expect(p1.runs).toBe(12)
    expect(p1.overs).toBe(1)
    expect(p1.economy).toBeCloseTo(12, 5)
  })
})

describe('shot capture and purity', () => {
  it('attaches shot capture data to the shot event stream', () => {
    let s = newMatchState(cfg())
    s = bowl(s, {
      outcome: 'runs',
      runs: 4,
      shotType: 'drive',
      zoneId: 3,
      landingPoint: { x: 1, y: 2 },
      fielderId: 'f1',
      source: 'W1',
    })
    const i = inningsOf(s)
    expect(i.shotEvents).toHaveLength(1)
    const ev = (i.shotEvents ?? [])[0]
    expect(ev.shotType).toBe('drive')
    expect(ev.zoneId).toBe(3)
    expect(ev.landingPoint).toEqual({ x: 1, y: 2 })
    expect(ev.fielderId).toBe('f1')
    expect(ev.source).toBe('W1')
    expect(ev.runs).toBe(4)
    expect((i.deliveries ?? [])[0].shotEventId).toBe(ev.id)
  })

  it('never mutates the input state', () => {
    const s = newMatchState(cfg())
    const before = JSON.stringify(s)
    const next = applyDelivery(s, {
      matchId: 'm1',
      innings: 1,
      batsmanId: 'b1',
      bowlerId: 'p1',
      outcome: 'runs',
      runs: 4,
      createdAt: '2020-01-01T00:00:03.000Z',
    })
    expect(JSON.stringify(s)).toBe(before)
    expect(next).not.toBe(s)
    expect(next.innings[0].runs).toBe(4)
    expect(s.innings[0].runs).toBe(0)
  })
})