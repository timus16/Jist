import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Ground, Point } from '../../domain'
import { zoneById } from '../../domain'
import { Button } from '../../ui'
import { FieldMap } from './FieldMap'
import { SHOT_TYPES } from './shotTypes'
import type { PendingShot } from './useShotCapture'

interface ShotCaptureSheetProps {
  open: boolean
  ground?: Ground
  onConfirm: (s: PendingShot) => void
  onCancel: () => void
  disabled?: boolean
}

export function ShotCaptureSheet({
  open,
  ground,
  onConfirm,
  onCancel,
  disabled = false,
}: ShotCaptureSheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <ShotSheet
          ground={ground}
          disabled={disabled}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      ) : null}
    </AnimatePresence>
  )
}

interface ShotSheetProps {
  ground?: Ground
  disabled: boolean
  onConfirm: (s: PendingShot) => void
  onCancel: () => void
}

function ShotSheet({ ground, disabled, onConfirm, onCancel }: ShotSheetProps) {
  const [zoneId, setZoneId] = useState<number | null>(null)
  const [landingPoint, setLandingPoint] = useState<Point | null>(null)
  const [shotType, setShotType] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)

  function clearPick() {
    setZoneId(null)
    setLandingPoint(null)
    setResetKey((k) => k + 1)
  }

  const zoneName = zoneId === null ? null : zoneById(zoneId)?.name ?? null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label="Cancel shot capture"
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
      />
      <motion.div
        className="relative mx-auto w-full max-w-[480px] rounded-t-3xl border-t border-white/10 bg-ink-900 px-4 pb-[calc(var(--safe-bottom)+16px)] pt-2 shadow-2xl"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 460, damping: 40 }}
        role="dialog"
        aria-label="Shot capture"
      >
        <div className="mx-auto mb-3 mt-1 h-1.5 w-10 rounded-full bg-white/20" />
        {disabled ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="var(--color-ink-700)" strokeWidth="2" />
              <line x1="6" y1="18" x2="18" y2="6" stroke="var(--color-ink-700)" strokeWidth="2" />
            </svg>
            <div>
              <p className="text-base font-semibold text-white">No shot</p>
              <p className="text-sm text-slate-400">
                Wide / no-ball — nothing to place on the map.
              </p>
            </div>
            <div className="flex w-full gap-2">
              <Button variant="secondary" block onClick={onCancel}>
                Cancel
              </Button>
              <Button block onClick={() => onConfirm({ zoneId: null, landingPoint: null, shotType: null })}>
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-base font-bold text-white">Shot placement</h2>
              <span className="text-sm text-slate-300">{zoneName ?? 'Tap the ground'}</span>
            </div>
            <div className="mb-3 overflow-hidden rounded-2xl">
              <FieldMap
                key={resetKey}
                ground={ground}
                interactive
                highlightZoneId={zoneId}
                onPick={(p) => {
                  setZoneId(p.zoneId)
                  setLandingPoint(p.landingPoint)
                }}
              />
            </div>
            <div className="mb-3 grid grid-cols-4 gap-2">
              {SHOT_TYPES.map((t) => {
                const active = shotType === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setShotType(active ? null : t)}
                    className={[
                      'tap rounded-xl border px-2 text-xs font-semibold transition-colors active:scale-[0.97]',
                      active
                        ? 'border-accent bg-accent/20 text-accent'
                        : 'border-white/10 bg-white/5 text-slate-200',
                    ].join(' ')}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
            <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
              <span>
                {landingPoint && zoneId !== null
                  ? `Zone ${zoneId} · ${zoneName ?? ''}`
                  : 'No zone selected'}
              </span>
              {landingPoint || shotType ? (
                <button type="button" className="underline" onClick={clearPick}>
                  Reset
                </button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  clearPick()
                  onConfirm({ zoneId: null, landingPoint: null, shotType: null })
                }}
              >
                No shot / skip
              </Button>
              <Button block onClick={() => onConfirm({ zoneId, landingPoint, shotType })}>
                Confirm
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
