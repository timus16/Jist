import { useParams } from 'react-router-dom'
import { AppShell, Card } from '../ui'

export function ViewRoute() {
  const { matchId } = useParams()
  return (
    <AppShell title="Scorecard" subtitle={matchId ? `Match ${matchId.slice(0, 8)}` : undefined}>
      <Card>
        <h2 className="text-sm font-semibold text-white">TODO wave-2</h2>
        <p className="mt-1 text-sm text-slate-400">
          The read-only viewer — scorecard, over-by-over log, and the ground map
          shot visualisation (W2 “Pro Ground”) — fills this route in wave 2.
        </p>
      </Card>
    </AppShell>
  )
}