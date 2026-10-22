import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { motion } from 'motion/react'
import type { FielderPosition, Ground, Point, ShotEvent } from '../../domain'
import { ZONES } from '../../domain'
import type { Picked } from './geometry'
import {
  VIEW_SIZE,
  WEDGE_RADIUS,
  groundRadiusM,
  metersToSvg,
  resolvePick,
  scaleFor,
  sectorPath,
} from './geometry'

interface FieldMapProps {
  ground?: Ground
  shots?: ShotEvent[]
  fielders?: FielderPosition[]
  onPick?: (p: { zoneId: number; landingPoint: Point }) => void
  interactive?: boolean
  highlightZoneId?: number | null
  showZones?: boolean
}

const PITCH_LENGTH_M = 20.12
const PITCH_WIDTH_M = 3.05
const CENTER = VIEW_SIZE / 2

export function FieldMap({
  ground,
  shots,
  fielders,
  onPick,
  interactive = false,
  highlightZoneId = null,
  showZones = true,
}: FieldMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [picked, setPicked] = useState<Picked | null>(null)
  const radiusM = groundRadiusM(ground)
  const scale = scaleFor(radiusM)
  const activeZone = highlightZoneId ?? picked?.zoneId ?? null
  const pitchSvg = metersToSvg(ground?.pitchCenter ?? { x: 0, y: 0 }, scale)
  const pitchRot = ground?.pitchOrientationDeg ?? 0

  function handlePointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    if (!interactive) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const sx = ((e.clientX - rect.left) / rect.width) * VIEW_SIZE
    const sy = ((e.clientY - rect.top) / rect.height) * VIEW_SIZE
    const next = resolvePick(sx, sy, scale, radiusM)
    setPicked(next)
    onPick?.({ zoneId: next.zoneId, landingPoint: next.landingPoint })
  }

  const marker = picked ? metersToSvg(picked.landingPoint, scale) : null
  const pitchHalfLen = (PITCH_LENGTH_M * scale) / 2
  const pitchHalfWid = (PITCH_WIDTH_M * scale) / 2

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
      className={[
        'block aspect-square w-full select-none touch-manipulation rounded-2xl',
        interactive ? 'cursor-crosshair' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onPointerDown={handlePointerDown}
      role="img"
      aria-label="Top-down ground map"
    >
      <circle cx={CENTER} cy={CENTER} r={WEDGE_RADIUS} fill="var(--color-ink-900)" />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={WEDGE_RADIUS}
        fill="none"
        stroke="var(--color-accent-soft)"
        strokeWidth={1.5}
      />

      {showZones
        ? ZONES.map((zone) => {
            const isActive = activeZone === zone.zoneId
            return (
              <path
                key={zone.zoneId}
                d={sectorPath(WEDGE_RADIUS, zone.angleStart, zone.angleEnd)}
                fill={isActive ? 'var(--color-accent)' : 'var(--color-ink-700)'}
                opacity={isActive ? 0.55 : zone.radiusBand === 'outer' ? 0.14 : 0.26}
                stroke="var(--color-ink-950)"
                strokeWidth={0.5}
              />
            )
          })
        : null}

      <g transform={`rotate(${pitchRot} ${pitchSvg.x} ${pitchSvg.y})`}>
        <rect
          x={pitchSvg.x - pitchHalfWid}
          y={pitchSvg.y - pitchHalfLen}
          width={pitchHalfWid * 2}
          height={pitchHalfLen * 2}
          rx={1}
          fill="var(--color-ink-950)"
          stroke="var(--color-ink-700)"
          strokeWidth={0.6}
        />
        <line
          x1={pitchSvg.x}
          y1={pitchSvg.y - pitchHalfLen + 2}
          x2={pitchSvg.x}
          y2={pitchSvg.y + pitchHalfLen - 2}
          stroke="var(--color-ink-700)"
          strokeWidth={0.5}
        />
      </g>

      {fielders?.map((f) => {
        const p = metersToSvg({ x: f.x, y: f.y }, scale)
        return (
          <g key={f.playerId}>
            <circle cx={p.x} cy={p.y} r={3} fill="white" opacity={0.85} />
            <text
              x={p.x}
              y={p.y - 4.5}
              fontSize={5.5}
              textAnchor="middle"
              fill="white"
              opacity={0.7}
              pointerEvents="none"
            >
              {f.role}
            </text>
          </g>
        )
      })}

      {shots?.map((s) => {
        if (!s.landingPoint) return null
        const p = metersToSvg(s.landingPoint, scale)
        return <circle key={s.id} cx={p.x} cy={p.y} r={2.2} fill="var(--color-accent)" opacity={0.5} />
      })}

      {marker ? (
        <motion.circle
          key={`${picked?.zoneId}-${marker.x}-${marker.y}`}
          cx={marker.x}
          cy={marker.y}
          r={4.5}
          fill="var(--color-accent)"
          stroke="white"
          strokeWidth={1.5}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 520, damping: 24 }}
        />
      ) : null}
    </svg>
  )
}
