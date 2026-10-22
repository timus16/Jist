import { describe, expect, it } from 'vitest'
import { ZONES, zoneForAngle, zoneForPoint } from '../zones'

describe('ZONES', () => {
  it('defines 16 canonical sectors of 22.5 degrees each', () => {
    expect(ZONES).toHaveLength(16)
    for (const zone of ZONES) {
      const span = (zone.angleEnd - zone.angleStart + 360) % 360
      expect(span).toBeCloseTo(22.5, 5)
    }
  })

  it('has real cricket field names', () => {
    const names = ZONES.map((z) => z.name)
    expect(names).toContain('Straight')
    expect(names).toContain('Point')
    expect(names).toContain('Third Man')
    expect(names).toContain('Fine Leg')
  })
})

describe('zoneForAngle (cardinal directions)', () => {
  it('0deg straight down the ground -> zone 0', () => {
    expect(zoneForAngle(0)).toBe(0)
    expect(ZONES[zoneForAngle(0)].name).toBe('Straight')
  })

  it('90deg square -> zone 4', () => {
    expect(zoneForAngle(90)).toBe(4)
  })

  it('180deg behind the wicket -> zone 8', () => {
    expect(zoneForAngle(180)).toBe(8)
  })

  it('270deg square (other side) -> zone 12', () => {
    expect(zoneForAngle(270)).toBe(12)
    expect(ZONES[zoneForAngle(270)].name).toBe('Point')
  })

  it('normalises out-of-range and negative angles', () => {
    expect(zoneForAngle(360)).toBe(0)
    expect(zoneForAngle(-90)).toBe(zoneForAngle(270))
  })
})

describe('zoneForPoint (cardinal directions)', () => {
  it('straight toward the bowler -> zone 0', () => {
    expect(zoneForPoint({ x: 0, y: 30 })).toBe(0)
  })

  it('square to +x -> zone 4', () => {
    expect(zoneForPoint({ x: 30, y: 0 })).toBe(4)
  })

  it('straight behind the wicket -> zone 8', () => {
    expect(zoneForPoint({ x: 0, y: -30 })).toBe(8)
  })

  it('square to -x -> zone 12', () => {
    expect(zoneForPoint({ x: -30, y: 0 })).toBe(12)
  })

  it('agrees with zoneForAngle for an arbitrary point', () => {
    const p = { x: 12, y: 20 }
    const deg = (Math.atan2(p.x, p.y) * 180) / Math.PI
    expect(zoneForPoint(p)).toBe(zoneForAngle(deg))
  })
})