import { useState, useEffect } from 'react'

import { AppShell, Button, Card } from '../ui'
import { useMatchStore } from '../state/matchStore'
import { groundsRepo } from '../db'

export function NewMatchRoute() {
  
  const createMatch = useMatchStore((s) => s.createMatch)
  const [name, setName] = useState('')
  const [teamA, setTeamA] = useState('')
  const [teamB, setTeamB] = useState('')
  const [overs, setOvers] = useState(20)
  const [groundId, setGroundId] = useState<string | null>(null)
  const [grounds, setGrounds] = useState<Awaited<ReturnType<typeof groundsRepo.list>>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    groundsRepo.list().then(setGrounds)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !teamA.trim() || !teamB.trim()) {
      setError('All fields are required')
      return
    }
    if (teamA === teamB) {
      setError('Teams must be different')
      return
    }
    setLoading(true)
    setError(null)
    createMatch({
      name: name.trim(),
      teamAId: teamA.trim(),
      teamBId: teamB.trim(),
      groundId,
      oversPerInnings: overs,
    }).then((match) => {
      window.location.href = '/Jist/scorer.html#/match/' + match.id + '/score'
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to create match')
      setLoading(false)
    })
  }

  return (
    <AppShell title='New match'>
      <Card className='flex flex-col gap-4'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <div className='flex flex-col gap-1.5'>
            <label htmlFor='name' className='text-sm font-medium text-slate-200'>Match name</label>
            <input
              id='name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. Finals - Team A vs Team B'
              className='min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent'
            />
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='flex flex-col gap-1.5'>
              <label htmlFor='teamA' className='text-sm font-medium text-slate-200'>Team A</label>
              <input
                id='teamA'
                type='text'
                value={teamA}
                onChange={(e) => setTeamA(e.target.value)}
                placeholder='Team A name'
                className='min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent'
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <label htmlFor='teamB' className='text-sm font-medium text-slate-200'>Team B</label>
              <input
                id='teamB'
                type='text'
                value={teamB}
                onChange={(e) => setTeamB(e.target.value)}
                placeholder='Team B name'
                className='min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent'
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='flex flex-col gap-1.5'>
              <label htmlFor='overs' className='text-sm font-medium text-slate-200'>Overs per innings</label>
              <select
                id='overs'
                value={overs}
                onChange={(e) => setOvers(Number(e.target.value))}
                className='min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-3 text-white focus:outline-none focus:border-accent'
              >
                {[5, 10, 15, 20, 25, 30, 40, 50].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className='flex flex-col gap-1.5'>
              <label htmlFor='ground' className='text-sm font-medium text-slate-200'>Ground</label>
              <select
                id='ground'
                value={groundId ?? ''}
                onChange={(e) => setGroundId(e.target.value || null)}
                className='min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-3 text-white focus:outline-none focus:border-accent'
              >
                <option value=''>None</option>
                {grounds.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className='text-sm text-red-400'>{error}</p>}

          <Button type='submit' size='lg' block disabled={loading}>
            {loading ? 'Creatingâ€¦' : 'Create match'}
          </Button>
        </form>
      </Card>
    </AppShell>
  )
}

