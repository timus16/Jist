import { useParams } from 'react-router-dom'
import { AppShell, Card } from '../ui'

export function ScoreRoute() {
  const { matchId } = useParams()
  return (
    <AppShell title="Live score" subtitle={matchId ? `Match ${matchId.slice(0, 8)}` : undefined}>
      <Card>
        <h2 className="text-sm font-semibold text-white">TODO wave-2</h2>
        <p className="mt-1 text-sm text-slate-400">
          The live scoring panel + tap-to-zone shot capture (W1 “tap-to-zone”)
          fills this route in wave 2.
        </p>
      </Card>
    </AppShell>
  )
}