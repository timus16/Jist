import { normalize } from '../../domain'
import type { Point, ShotEvent } from '../../domain'

export const SECTOR_DEG = 22.5
export const ZONE_COUNT = 16

/** Angle in degrees (clockwise, 0deg = straight down the ground) for a ground point. */
export function angleFromPoint(p: Point): number {
  return normalize((Math.atan2(p.x, p.y) * 180) / Math.PI)
}

/** Straight-line distance from the pitch centre to a ground point. */
export function distanceFromPoint(p: Point): number {
  return Math.hypot(p.x, p.y)
}

/** Inverse of angleFromPoint: a ground point at the given polar angle + radius. */
export function pointFromPolar(angleDeg: number, radius: number): Point {
  const rad = (normalize(angleDeg) * Math.PI) / 180
  return { x: radius * Math.sin(rad), y: radius * Math.cos(rad) }
}

/** Centre angle of a canonical 0..15 zone. */
export function zoneCenterAngle(zoneId: number): number {
  return normalize(zoneId * SECTOR_DEG)
}

/** Screen-space point for a polar angle; y grows downward, 0deg points up. */
export function polarToSvg(angleDeg: number, radius: number, cx: number, cy: number): Point {
  const rad = (normalize(angleDeg) * Math.PI) / 180
  return { x: cx + radius * Math.sin(rad), y: cy - radius * Math.cos(rad) }
}

/** Faint wedge path (in SVG space) covering one 22.5deg zone sector. */
export function zoneWedgePath(zoneId: number, radius: number, cx: number, cy: number): string {
  const centre = zoneCenterAngle(zoneId)
  const a0 = centre - SECTOR_DEG / 2
  const a1 = centre + SECTOR_DEG / 2
  const p0 = polarToSvg(a0, radius, cx, cy)
  const p1 = polarToSvg(a1, radius, cx, cy)
  return `M ${cx} ${cy} L ${p0.x} ${p0.y} A ${radius} ${radius} 0 0 1 ${p1.x} ${p1.y} Z`
}

export interface ShotVector {
  angle: number
  distance: number | null
  source: 'point' | 'zone'
}

/** Plottable vector for a shot, from its landing point or its zone centre. */
export function shotVector(shot: ShotEvent): ShotVector | null {
  if (shot.landingPoint) {
    return {
      angle: angleFromPoint(shot.landingPoint),
      distance: distanceFromPoint(shot.landingPoint),
      source: 'point',
    }
  }
  if (shot.zoneId != null) {
    return { angle: zoneCenterAngle(shot.zoneId), distance: null, source: 'zone' }
  }
  return null
}

export function maxShotDistance(shots: ShotEvent[]): number {
  let max = 0
  for (const shot of shots) {
    if (!shot.landingPoint) continue
    const d = distanceFromPoint(shot.landingPoint)
    if (d > max) max = d
  }
  return max
}

/** Radial length for a shot spoke, normalised so the furthest shot reaches the rim. */
export function scaledArcLength(distance: number | null, maxDistance: number, radius: number): number {
  if (distance == null || maxDistance <= 0) return radius * 0.6
  const t = Math.min(1, Math.max(0, distance / maxDistance))
  return radius * (0.25 + 0.7 * t)
}
