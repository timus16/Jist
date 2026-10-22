import { motion } from 'motion/react'
import { ZONES } from '../../domain'
import type { ShotEvent } from '../../domain'
import {
  maxShotDistance,
  polarToSvg,
  scaledArcLength,
  shotVector,
  zoneWedgePath,
} from './geometry'

interface WagonWheelProps {
  shots: ShotEvent[]
  size?: number
}

function spokeClass(shot: ShotEvent): string {
  if (shot.isWicket) return 'stroke-red-400'
  if (shot.runs >= 6) return 'stroke-emerald-300'
  if (shot.runs === 4) return 'stroke-emerald-400'
  return 'stroke-slate-400/60'
}

function spokeWidth(shot: ShotEvent): number {
  if (shot.runs >= 6) return 3
  if (shot.runs === 4) return 2.5
  if (shot.isWicket) return 2.5
  return 1.5
}

function headClass(shot: ShotEvent): string {
  if (shot.isWicket) return 'fill-red-400'
  if (shot.runs >= 6) return 'fill-emerald-300'
  if (shot.runs === 4) return 'fill-emerald-400'
  return 'fill-slate-400/60'
}

export function WagonWheel({ shots, size = 320 }: WagonWheelProps) {
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 16
  const maxDistance = maxShotDistance(shots)

  const spokes = shots.flatMap((shot) => {
    const vector = shotVector(shot)
    if (!vector) return []
    const length =
      vector.source === 'point'
        ? scaledArcLength(vector.distance, maxDistance, radius)
        : scaledArcLength(null, 0, radius)
    const end = polarToSvg(vector.angle, length, cx, cy)
    return [{ shot, end }]
  })

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-auto w-full select-none"
      role="img"
      aria-label={`Wagon wheel of ${spokes.length} shot${spokes.length === 1 ? '' : 's'}`}
    >
      <g>
        {ZONES.map((zone) => (
          <path
            key={zone.zoneId}
            d={zoneWedgePath(zone.zoneId, radius, cx, cy)}
            className="fill-white/[0.02] stroke-slate-600/25"
            strokeWidth={0.75}
          >
            <title>{zone.name}</title>
          </path>
        ))}
      </g>

      <circle cx={cx} cy={cy} r={radius} className="fill-none stroke-slate-600/50" strokeWidth={1} />
      <circle
        cx={cx}
        cy={cy}
        r={radius * 0.55}
        className="fill-none stroke-slate-700/40"
        strokeDasharray="3 4"
      />

      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        {spokes.map(({ shot, end }) => (
          <g key={shot.id}>
            <line
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              className={spokeClass(shot)}
              strokeWidth={spokeWidth(shot)}
              strokeLinecap="round"
            />
            <circle cx={end.x} cy={end.y} r={shot.runs >= 4 ? 3 : 2} className={headClass(shot)} />
          </g>
        ))}
      </motion.g>

      <circle cx={cx} cy={cy} r={3.5} className="fill-slate-500" />
      <line x1={cx} y1={cy - 7} x2={cx} y2={cy + 7} className="stroke-slate-500/70" strokeWidth={1} />

      {spokes.length === 0 ? (
        <text x={cx} y={cy + 28} textAnchor="middle" className="fill-slate-500 text-[11px]">
          No shots yet
        </text>
      ) : null}
    </svg>
  )
}
