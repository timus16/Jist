import type { ShotEvent } from '../../domain'
import { Button } from '../../ui'

interface ReplayScrubberProps {
  shots: ShotEvent[]
  index: number
  onChange: (i: number) => void
}

export function ReplayScrubber({ shots, index, onChange }: ReplayScrubberProps) {
  const count = shots.length
  const disabled = count === 0
  const safeIndex = disabled ? 0 : Math.min(Math.max(index, 0), count - 1)
  const selected = disabled ? undefined : shots[safeIndex]
  const atStart = disabled || safeIndex <= 0
  const atEnd = disabled || safeIndex >= count - 1

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          aria-label="Previous shot"
          disabled={atStart}
          onClick={() => onChange(safeIndex - 1)}
        >
          {'\u2039'}
        </Button>

        <div className="flex min-h-[44px] flex-1 flex-col items-center justify-center">
          <span className="text-xl font-bold leading-none text-white tabular-nums">
            {selected ? `${selected.over}.${selected.ballInOver}` : '\u2014'}
          </span>
          <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {selected
              ? selected.isWicket
                ? 'wicket'
                : `${selected.runs} run${selected.runs === 1 ? '' : 's'}`
              : 'no shots'}
          </span>
        </div>

        <Button
          variant="secondary"
          aria-label="Next shot"
          disabled={atEnd}
          onClick={() => onChange(safeIndex + 1)}
        >
          {'\u203a'}
        </Button>
      </div>

      <input
        type="range"
        min={0}
        max={disabled ? 0 : count - 1}
        step={1}
        value={safeIndex}
        disabled={disabled}
        aria-label="Replay position"
        aria-valuetext={selected ? `Ball ${selected.over}.${selected.ballInOver}` : 'No shots'}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="h-11 w-full accent-emerald-500 disabled:opacity-40"
      />

      <div className="flex justify-between text-[11px] text-slate-500 tabular-nums">
        <span>{disabled ? 0 : 1}</span>
        <span>
          {disabled ? 0 : safeIndex + 1} / {count}
        </span>
        <span>{count}</span>
      </div>
    </div>
  )
}
