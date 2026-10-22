import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { AppShell, Button, Card, EmptyState } from '../ui'
import { useMatchStore } from '../state/matchStore'

function statusPill(status: string) {
  const map: Record<string, string> = {
    live: 'bg-red-500/20 text-red-300',
    scheduled: 'bg-sky-500/20 text-sky-300',
    completed: 'bg-emerald-500/20 text-emerald-300',
    abandoned: 'bg-slate-500/20 text-slate-300',
  }
  return `rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${map[status] ?? map.scheduled}`
}

export function HomeRoute() {
  const navigate = useNavigate()
  const matches = useMatchStore((s) => s.matches)
  const loading = useMatchStore((s) => s.loading)
  const loadMatches = useMatchStore((s) => s.loadMatches)
  const setCurrentMatch = useMatchStore((s) => s.setCurrentMatch)

  useEffect(() => {
    void loadMatches()
  }, [loadMatches])

  return (
    <AppShell
      title="Jist"
      subtitle="Local tournament scoring"
      action={
        <Link to="/match/new">
          <Button size="md">New</Button>
        </Link>
      }
    >
      {loading && matches.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={'\u{1F3CF}'}
          title="No matches yet"
          description="Create your first match to start scoring."
          action={
            <Link to="/match/new">
              <Button size="lg">New match</Button>
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {matches.map((match) => (
            <li key={match.id}>
              <button
                className="w-full text-left"
                onClick={() => {
                  setCurrentMatch(match.id)
                  navigate(`/match/${match.id}/score`)
                }}
              >
                <Card>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="truncate font-semibold text-white">{match.name}</h2>
                    <span className={statusPill(match.status)}>{match.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {match.oversPerInnings} overs ·{' '}
                    {formatDistanceToNow(new Date(match.createdAt), { addSuffix: true })}
                  </p>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}