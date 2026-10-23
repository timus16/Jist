import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppShell, Button, Card } from '../ui'
import { LiveScorecard } from '../features/scorecard'
import { FieldMap } from '../features/fieldMap'
import { useScoreStore } from '../state/scoreStore'
import { groundsRepo } from '../db'
import type { Ground } from '../domain'

export function ViewRoute() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { matchState, deliveries, shotEvents, loading, error, loadMatch } = useScoreStore()
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

  if (loading) {
    return (
      <AppShell title='Scorecard'>
        <div className='flex h-64 items-center justify-center'>
          <p className='text-slate-400'>Loading…</p>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title='Scorecard'>
        <Card className='text-center'>
          <p className='text-red-400'>{error}</p>
          <Button variant='secondary' className='mt-4' onClick={() => navigate(-1)}>Back</Button>
        </Card>
      </AppShell>
    )
  }

  if (!matchState) {
    return (
      <AppShell title='Scorecard'>
        <Card className='text-center'>
          <p className='text-slate-400'>Match not found</p>
          <Button variant='secondary' className='mt-4' onClick={() => navigate(-1)}>Back</Button>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell title='Scorecard'>
      <div className='flex flex-col gap-4 pb-24'>
        <LiveScorecard state={matchState} deliveries={deliveries} />

        <Card className='p-0 overflow-hidden'>
          <FieldMap
            ground={ground}
            shots={shotEvents}
            interactive={false}
            showZones={true}
          />
        </Card>
      </div>
    </AppShell>
  )
}
