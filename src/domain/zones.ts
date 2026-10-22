import type { Point, ZoneMeta } from './types'

/**
 * Angular convention (from a top-down view of the ground):
 *  - Angles are degrees, measured CLOCKWISE.
 *  - 0deg = straight down the ground toward the bowler (the batsman's
 *    straight drive direction).
 *  - The two "square" positions are at 90deg and 270deg; directly behind the
 *    wicket (where the keeper stands) is 180deg.
 *  - +x in Point space points to the 90deg side, +y points toward 0deg.
 *
 * The ground is divided into 16 equal sectors of 22.5deg each. Sector 0 is
 * centred on 0deg, so the cardinal directions map to zone ids 0/4/8/12.
 */

const SECTOR = 22.5
const SECTOR_COUNT = 16

interface ZoneSeed {
  name: string
}

/** Clockwise ring of 16 sectors starting at 0deg (straight). */
const SEEDS: ZoneSeed[] = [
  { name: 'Straight' },
  { name: 'Mid-on' },
  { name: 'Midwicket' },
  { name: 'Square Leg' },
  { name: 'Deep Square Leg' },
  { name: 'Fine Leg' },
  { name: 'Deep Fine Leg' },
  { name: 'Third Man' },
  { name: 'Straight Behind Wicket' },
  { name: 'Slip' },
  { name: 'Gully' },
  { name: 'Cover Point' },
  { name: 'Point' },
  { name: 'Cover' },
  { name: 'Mid-off' },
  { name: 'Long-off' },
]

export const ZONES: ZoneMeta[] = SEEDS.map((seed, zoneId) => ({
  zoneId,
  name: seed.name,
  angleStart: normalize(zoneId * SECTOR - SECTOR / 2),
  angleEnd: normalize(zoneId * SECTOR + SECTOR / 2),
  radiusBand: zoneId % 2 === 0 ? 'inner' : 'outer',
}))

export function normalize(deg: number): number {
  const m = deg % 360
  return m < 0 ? m + 360 : m
}

/** Map an angle in degrees to a canonical zone id (0..15). */
export function zoneForAngle(deg: number): number {
  return Math.round(normalize(deg) / SECTOR) % SECTOR_COUNT
}

/** Map a ground point (metres, origin = centre of pitch) to a zone id. */
export function zoneForPoint(p: Point): number {
  const deg = (Math.atan2(p.x, p.y) * 180) / Math.PI
  return zoneForAngle(deg)
}

/** Convenience lookup by id. */
export function zoneById(zoneId: number): ZoneMeta | undefined {
  return ZONES[zoneId]
}