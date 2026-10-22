import type { Point, ShotEvent } from '../../domain'

interface ShotArcLayerProps {
  shots: ShotEvent[]
  groundRadius?: number
  activeShotId?: string | null
}

/** Arc from the pitch centre (0,0) to a landing point, in SVG space (y flipped). */
function arcPath(p: Point): string {
  const x = p.x
  const y = -p.y
  const len = Math.hypot(x, y) || 1
  const bow = len * 0.18
  const controlX = x / 2 + (-y / len) * bow
  const controlY = y / 2 + (x / len) * bow
  return `M 0 0 Q ${controlX} ${controlY} ${x} ${y}`
}

export function ShotArcLayer({ shots, groundRadius = 100, activeShotId = null }: ShotArcLayerProps) {
  const g = groundRadius
  const plottable = shots.filter((shot): shot is ShotEvent & { landingPoint: Point } => shot.landingPoint !== null)
  const active = activeShotId ? plottable.find((shot) => shot.id === activeShotId) : undefined
  const activePathId = active ? `shot-arc-${active.id}` : ''

  return (
    <svg
      viewBox={`${-g} ${-g} ${2 * g} ${2 * g}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <circle r={1.5} className="fill-emerald-400/70" />

      {plottable.map((shot) =>
        shot.id === activeShotId ? null : (
          <path
            key={shot.id}
            d={arcPath(shot.landingPoint)}
            fill="none"
            strokeLinecap="round"
            className="stroke-emerald-400/25"
            strokeWidth={1.5}
          />
        ),
      )}

      {active ? (
        <g>
          <path
            id={activePathId}
            d={arcPath(active.landingPoint)}
            pathLength={1}
            fill="none"
            strokeLinecap="round"
            strokeDasharray="1"
            strokeDashoffset="0"
            className="stroke-emerald-300"
            strokeWidth={2.5}
          >
            <animate
              attributeName="stroke-dashoffset"
              from="1"
              to="0"
              dur="0.7s"
              fill="freeze"
            />
          </path>
          <circle r={2.5} className="fill-emerald-200">
            <animateMotion dur="1s" repeatCount="indefinite" rotate="auto">
              <mpath href={`#${activePathId}`} />
            </animateMotion>
          </circle>
        </g>
      ) : null}
    </svg>
  )
}
