import type { Ground } from '../../domain'
import { newId } from '../../domain'
import { Card } from '../../ui'
import {
  DEFAULT_BOUNDARY_RADIUS_M,
  groundRadiusM,
  makeBoundaryPolygon,
} from './geometry'
import { FieldMap } from './FieldMap'

interface GroundCalibratorProps {
  value: Ground | null
  onChange: (g: Ground) => void
}

const MIN_RADIUS = 30
const MAX_RADIUS = 120
const BOUNDARY_POINTS = 32

export function GroundCalibrator({ value, onChange }: GroundCalibratorProps) {
  const radius = value ? Math.round(groundRadiusM(value)) : DEFAULT_BOUNDARY_RADIUS_M
  const orientation = value ? Math.round(value.pitchOrientationDeg) : 0

  function emit(nextRadius: number, nextOrientation: number) {
    const deg = ((nextOrientation % 360) + 360) % 360
    onChange({
      id: value?.id ?? newId(),
      name: value?.name ?? 'Custom ground',
      venueId: value?.venueId ?? null,
      boundaryPolygon: makeBoundaryPolygon(nextRadius, BOUNDARY_POINTS),
      pitchCenter: { x: 0, y: 0 },
      pitchOrientationDeg: deg,
    })
  }

  const preview: Ground = value ?? {
    id: 'preview',
    name: 'Preview',
    venueId: null,
    boundaryPolygon: makeBoundaryPolygon(radius, BOUNDARY_POINTS),
    pitchCenter: { x: 0, y: 0 },
    pitchOrientationDeg: orientation,
  }

  return (
    <Card className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="flex justify-between text-sm text-slate-300">
          <span>Boundary radius</span>
          <span className="tabular-nums text-white">{radius} m</span>
        </span>
        <input
          type="range"
          min={MIN_RADIUS}
          max={MAX_RADIUS}
          step={1}
          value={radius}
          onChange={(e) => emit(Number(e.target.value), orientation)}
          className="h-11 w-full accent-[var(--color-accent)]"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="flex justify-between text-sm text-slate-300">
          <span>Pitch orientation</span>
          <span className="tabular-nums text-white">{orientation}°</span>
        </span>
        <input
          type="range"
          min={0}
          max={359}
          step={1}
          value={orientation}
          onChange={(e) => emit(radius, Number(e.target.value))}
          className="h-11 w-full accent-[var(--color-accent)]"
        />
      </label>

      <div className="overflow-hidden rounded-2xl">
        <FieldMap ground={preview} showZones={false} />
      </div>
    </Card>
  )
}
