import { useCallback, useState } from 'react'
import type { Point } from '../../domain'

export interface PendingShot {
  zoneId: number | null
  landingPoint: Point | null
  shotType: string | null
}

export interface ShotCaptureController {
  open: boolean
  start: () => void
  cancel: () => void
  confirm: (s: PendingShot) => void
  pending: PendingShot | null
}

export function useShotCapture(): ShotCaptureController {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<PendingShot | null>(null)

  const start = useCallback(() => setOpen(true), [])
  const cancel = useCallback(() => {
    setOpen(false)
    setPending(null)
  }, [])
  const confirm = useCallback((s: PendingShot) => {
    setPending(s)
    setOpen(false)
  }, [])

  return { open, start, cancel, confirm, pending }
}
