import { describe, expect, it } from 'vitest'
import type { ShotEvent } from '../../../domain'
import {
  angleFromPoint,
  distanceFromPoint,
  maxShotDistance,
  pointFromPolar,
  polarToSvg,
  scaledArcLength,
  shotVector,
  zoneCenterAngle,
  zoneWedgePath,
} from '../geometry'
import { formatEcon, formatOvers, outcomeLabel, recentOvers } from '../format'

function makeShot(partial: Partial<ShotEvent>): ShotEvent {
  return {
    id: partial.id ?? 's1',
    matchId: 'm1',
    innings: 0,
    over: 0,
    ballInOver: 1,
    batsmanId: 'b1',
    bowlerId: 'p1',
    shotType: null,
    zoneId: null,
    landingPoint: null,
    runs: 0,
    isWicket: false,
    fielderId: null,
    source: 'manual',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('angleFromPoint (clockwise, 0deg = straight)', () => {
  it('maps down-the-ground and square directions to cardinal angles', () => {
    expect(angleFromPoint({ x: 0, y: 10 })).toBeCloseTo(0, 5)
    expect(angleFromPoint({ x: 10, y: 0 })).toBeCloseTo(90, 5)
    expect(angleFromPoint({ x: 0, y: -10 })).toBeCloseTo(180, 5)
    expect(angleFromPoint({ x: -10, y: 0 })).toBeCloseTo(270, 5)
  })

  it('is the inverse of pointFromPolar', () => {
    for (const deg of [0, 33, 90, 178, 270, 359]) {
      const p = pointFromPolar(deg, 40)
      expect(angleFromPoint(p)).toBeCloseTo(deg, 4)
      expect(distanceFromPoint(p)).toBeCloseTo(40, 6)
    }
  })
})

describe('zoneCenterAngle', () => {
  it('spaces the 16 zones 22.5deg apart starting at 0', () => {
    expect(zoneCenterAngle(0)).toBeCloseTo(0, 5)
    expect(zoneCenterAngle(4)).toBeCloseTo(90, 5)
    expect(zoneCenterAngle(8)).toBeCloseTo(180, 5)
  })
})

describe('polarToSvg', () => {
  it('points 0deg up (-y) and 90deg right (+x) on screen', () => {
    const up = polarToSvg(0, 10, 50, 50)
    expect(up.x).toBeCloseTo(50, 5)
    expect(up.y).toBeCloseTo(40, 5)
    const right = polarToSvg(90, 10, 50, 50)
    expect(right.x).toBeCloseTo(60, 5)
    expect(right.y).toBeCloseTo(50, 5)
  })
})

describe('shotVector', () => {
  it('derives angle + distance from a landing point', () => {
    const v = shotVector(makeShot({ landingPoint: { x: 10, y: 0 } }))
    expect(v).not.toBeNull()
    expect(v?.source).toBe('point')
    expect(v?.angle).toBeCloseTo(90, 5)
    expect(v?.distance).toBeCloseTo(10, 5)
  })

  it('falls back to the zone centre angle when only a zone is known', () => {
    const v = shotVector(makeShot({ zoneId: 4 }))
    expect(v?.source).toBe('zone')
    expect(v?.angle).toBeCloseTo(90, 5)
    expect(v?.distance).toBeNull()
  })

  it('returns null when there is neither a point nor a zone', () => {
    expect(shotVector(makeShot({}))).toBeNull()
  })
})

describe('scaledArcLength', () => {
  it('normalises spokes against the furthest shot', () => {
    expect(scaledArcLength(null, 50, 100)).toBeCloseTo(60, 5)
    expect(scaledArcLength(0, 50, 100)).toBeCloseTo(25, 5)
    expect(scaledArcLength(50, 50, 100)).toBeCloseTo(95, 5)
    expect(scaledArcLength(100, 50, 100)).toBeCloseTo(95, 5)
  })
})

describe('maxShotDistance', () => {
  it('ignores shots without a landing point', () => {
    const shots = [
      makeShot({ id: 'a', landingPoint: { x: 3, y: 4 } }),
      makeShot({ id: 'b', zoneId: 2 }),
      makeShot({ id: 'c', landingPoint: { x: 0, y: 12 } }),
    ]
    expect(maxShotDistance(shots)).toBeCloseTo(12, 6)
  })
})

describe('zoneWedgePath', () => {
  it('produces a closed arc path from the centre', () => {
    const d = zoneWedgePath(0, 50, 50, 50)
    expect(d.startsWith('M 50 50 L')).toBe(true)
    expect(d).toContain('A 50 50 0 0 1')
    expect(d.endsWith('Z')).toBe(true)
  })
})

describe('format helpers', () => {
  it('formats overs as over.ball', () => {
    expect(formatOvers(0)).toBe('0.0')
    expect(formatOvers(7)).toBe('1.1')
    expect(formatOvers(13)).toBe('2.1')
  })

  it('computes economy with two decimals', () => {
    expect(formatEcon(24, 12)).toBe('12.00')
    expect(formatEcon(5, 0)).toBe('0.00')
  })

  it('labels outcomes including extras and wickets', () => {
    expect(outcomeLabel('dot', 0)).toBe('\u2022')
    expect(outcomeLabel('runs', 4)).toBe('4')
    expect(outcomeLabel('wicket', 0)).toBe('W')
    expect(outcomeLabel('wide', 1)).toBe('wd')
  })

  it('groups the latest overs in timeline order', () => {
    const delivery = (over: number, ballInOver: number, id: string) => ({
      id,
      matchId: 'm1',
      innings: 0,
      over,
      ballInOver,
      batsmanId: 'b1',
      bowlerId: 'p1',
      outcome: 'runs' as const,
      runs: 1,
      isWicket: false,
      fielderId: null,
      shotEventId: null,
      extras: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    const groups = recentOvers(
      [delivery(0, 2, 'a'), delivery(1, 1, 'b'), delivery(0, 1, 'c'), delivery(2, 1, 'd')],
      2,
    )
    expect(groups.map((g) => g.over)).toEqual([1, 2])
    expect(groups[0].balls.map((b) => b.id)).toEqual(['b'])
  })
})
