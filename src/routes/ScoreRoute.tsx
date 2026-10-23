import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppShell, Button, Card } from '../ui'
import { LiveScorecard } from '../features/scorecard'
import { ShotCaptureSheet } from '../features/fieldMap'
import { useShotCapture } from '../features/fieldMap'
import { useScoreStore } from '../state/scoreStore'
import { groundsRepo } from '../db'
import type { Ground } from '../domain'
import type { DeliveryInput } from '../domain/cricket/types'
import type { BallOutcome } from '../domain/types'

const SCORING_OUTCOMES: { outcome: BallOutcome; label: string; runs?: number; isScoringShot: boolean }[] = [
  { outcome: 'dot', label: '0', isScoringShot: false },
  { outcome: 'runs', label: '1', runs: 1, isScoringShot: true },
  { outcome: 'runs', label: '2', runs: 2, isScoringShot: true },
  { outcome: 'runs', label: '3', runs: 3, isScoringShot: true },
  { outcome: 'runs', label: '4', runs: 4, isScoringShot: true },
  { outcome: 'runs', label: '6', runs: 6, isScoringShot: true },
  { outcome: 'wide', label: 'Wd', isScoringShot: false },
  { outcome: 'no_ball', label: 'Nb', isScoringShot: false },
  { outcome: 'bye', label: 'Bye', isScoringShot: false },
  { outcome: 'leg_bye', label: 'LBye', isScoringShot: false },
  { outcome: 'wicket', label: 'W', isScoringShot: false },
]

export function ScoreRoute() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { matchState, deliveries, loading, error, loadMatch, addDelivery } = useScoreStore()
  const { open, start, cancel } = useShotCapture()
  const [ground, setGround] = useState<Ground | undefined>(undefined)

  useEffect(() => {
    if (matchId) {
      loadMatch(matchId)
    }
  }, [matchId, loadMatch])

  useEffect(() => {
    if (matchState?.match.groundId) {
      groundsRepo.get(matchState.match.groundId).then(setGround)
    }
  }, [matchState])

  const complete = matchState ? matchState.innings.every((i) => i.completed) : false

  async function handleOutcome(outcome: BallOutcome, runs = 0) {
    if (!matchState) return
    const inn = matchState.innings[matchState.currentInnings - 1]
    if (!inn) return

    const input: DeliveryInput = {
      matchId: matchState.match.id,
      innings: inn.innings,
      batsmanId: inn.strikerId ?? '',
      bowlerId: inn.bowlerId ?? '',
      outcome,
      runs,
    }

    const isScoringShot = outcome === 'runs' && runs > 0
    if (isScoringShot) {
      start()
    } else {
      await addDelivery(input)
    }
  }

  async function handleShotConfirm(shot: { zoneId: number | null; landingPoint: { x: number; y: number } | null; shotType: string | null }) {
    if (!matchState) return
    const inn = matchState.innings[matchState.currentInnings - 1]
    if (!inn) return

    const input: DeliveryInput = {
      matchId: matchState.match.id,
      innings: inn.innings,
      batsmanId: inn.strikerId ?? '',
      bowlerId: inn.bowlerId ?? '',
      outcome: 'runs',
      runs: 0,
      shotType: shot.shotType,
      zoneId: shot.zoneId,
      landingPoint: shot.landingPoint,
      source: 'manual',
    }

    await addDelivery(input)
    cancel()
  }

  if (loading) {
    return (
      <AppShell title='Live score'>
        <div className='flex h-64 items-center justify-center'>
          <p className='text-slate-400'>Loading…</p>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title='Live score'>
        <Card className='text-center'>
          <p className='text-red-400'>{error}</p>
          <Button variant='secondary' className='mt-4' onClick={() => navigate(-1)}>Back</Button>
        </Card>
      </AppShell>
    )
  }

  if (!matchState) {
    return (
      <AppShell title='Live score'>
        <Card className='text-center'>
          <p className='text-slate-400'>Match not found</p>
          <Button variant='secondary' className='mt-4' onClick={() => navigate(-1)}>Back</Button>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell title='Live score'>
      <div className='flex flex-col gap-4 pb-24'>
        <LiveScorecard state={matchState} deliveries={deliveries} />

        {!complete ? (
          <Card className='flex flex-col gap-3'>
            <p className='text-sm font-semibold text-slate-200'>Ball entry</p>
            <div className='grid grid-cols-4 gap-2'>
              {SCORING_OUTCOMES.map((o) => (
                <Button
                  key={o.label}
                  size='lg'
                  variant={o.outcome === 'wicket' ? 'danger' : o.isScoringShot ? 'primary' : 'secondary'}
                  disabled={complete}
                  onClick={() => handleOutcome(o.outcome, o.runs ?? 0)}
                  className='min-h-[56px]'
                >
                  {o.label}
                </Button>
              ))}
            </div>
          </Card>
        ) : (
          <Card>
            <p className='text-center text-slate-400'>Match complete</p>
          </Card>
        )}

        <ShotCaptureSheet
          open={open}
          ground={ground}
          onConfirm={handleShotConfirm}
          onCancel={cancel}
          disabled={false}
        />
      </div>
    </AppShell>
  )
}
