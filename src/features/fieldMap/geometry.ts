import type { Ground, Point } from '../../domain'
import { zoneForPoint } from '../../domain'

export const VIEW_SIZE = 220
export const VIEW_CENTER = VIEW_SIZE / 2
export const EDGE_PADDING = 10
export const DEFAULT_BOUNDARY_RADIUS_M = 68
export const WEDGE_RADIUS = VIEW_CENTER - EDGE_PADDING

export interface Picked {
  zoneId: number
  landingPoint: Point
}

export function groundRadiusM(ground?: Ground | null): number {
  if (!ground || ground.boundaryPolygon.length === 0) return DEFAULT_BOUNDARY_RADIUS_M
  let max = 0
  for (const p of ground.boundaryPolygon) {
    const d = Math.hypot(p.x, p.y)
    if (d > max) max = d
  }
  return max > 0 ? max : DEFAULT_BOUNDARY_RADIUS_M
}

export function scaleFor(radiusM: number): number {
  return WEDGE_RADIUS / radiusM
}

export function metersToSvg(p: Point, scale: number): Point {
  return { x: VIEW_CENTER + p.x * scale, y: VIEW_CENTER - p.y * scale }
}

export function svgToMeters(sx: number, sy: number, scale: number): Point {
  return { x: (sx - VIEW_CENTER) / scale, y: (VIEW_CENTER - sy) / scale }
}

export function clampToRadius(p: Point, radiusM: number): Point {
  const d = Math.hypot(p.x, p.y)
  if (d <= radiusM || d === 0) return p
  const k = radiusM / d
  return { x: p.x * k, y: p.y * k }
}

export function resolvePick(sx: number, sy: number, scale: number, radiusM: number): Picked {
  const landingPoint = clampToRadius(svgToMeters(sx, sy, scale), radiusM)
  return { zoneId: zoneForPoint(landingPoint), landingPoint }
}

export function polar(radius: number, deg: number): Point {
  const rad = (deg * Math.PI) / 180
  return { x: VIEW_CENTER + radius * Math.sin(rad), y: VIEW_CENTER - radius * Math.cos(rad) }
}

export function sectorPath(radius: number, angleStart: number, angleEnd: number): string {
  let span = angleEnd - angleStart
  if (span <= 0) span += 360
  const a = polar(radius, angleStart)
  const b = polar(radius, angleEnd)
  const largeArc = span > 180 ? 1 : 0
  return `M ${VIEW_CENTER} ${VIEW_CENTER} L ${a.x} ${a.y} A ${radius} ${radius} 0 ${largeArc} 1 ${b.x} ${b.y} Z`
}

export function makeBoundaryPolygon(radiusM: number, count = 32): Point[] {
  const pts: Point[] = []
  for (let i = 0; i < count; i++) {
    const rad = ((360 / count) * i * Math.PI) / 180
    pts.push({ x: radiusM * Math.sin(rad), y: radiusM * Math.cos(rad) })
  }
  return pts
}
