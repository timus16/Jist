import { motion } from 'motion/react'
import type { Delivery } from '../../domain'
import type { BatsmanState, MatchState } from '../../domain/cricket/types'
import { Card, EmptyState, Stat } from '../../ui'
import { formatEcon, formatOvers, formatStrikeRate, outcomeLabel, recentOvers } from './format'

interface LiveScorecardProps {
  state: MatchState
  deliveries?: Delivery[]
}

function requiredRunRate(target: number, runs: number, ballsRemaining: number): string {
  if (ballsRemaining <= 0) return '-'
  const rrr = (target - runs) / (ballsRemaining / 6)
  return rrr > 0 ? rrr.toFixed(2) : '-'
}

function BatsmanRow({ batsman, striker }: { batsman: BatsmanState; striker: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${striker ? 'bg-emerald-400' : 'bg-slate-600'}`}
        />
        <span className={`text-sm ${striker ? 'font-semibold text-white' : 'text-slate-300'}`}>
          {batsman.playerId}
        </span>
        {batsman.isOut ? <span className="text-[10px] uppercase text-red-400">out</span> : null}
      </div>
      <div className="flex items-baseline gap-3 tabular-nums">
        <span className="text-base font-bold text-white">
          {batsman.runs}
          <span className="ml-0.5 text-xs font-normal text-slate-500">({batsman.balls})</span>
        </span>
        <span className="w-12 text-right text-xs text-slate-400">
          SR {formatStrikeRate(batsman.runs, batsman.balls)}
        </span>
      </div>
    </div>
  )
}

function BallChip({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${tone}`}
    >
      {label}
    </span>
  )
}

function chipTone(outcome: Delivery): string {
  if (outcome.isWicket) return 'bg-red-500/90 text-white'
  if (outcome.runs >= 6) return 'bg-emerald-500 text-slate-950'
  if (outcome.runs === 4) return 'bg-emerald-400 text-slate-950'
  if (outcome.runs === 0 && outcome.extras === 0) return 'bg-white/10 text-slate-300'
  return 'bg-white/15 text-white'
}

export function LiveScorecard({ state, deliveries = [] }: LiveScorecardProps) {
  const inn = state.innings[state.currentInnings]
  if (!inn) {
    return <EmptyState title="No innings yet" description="Scoring will appear once play starts." />
  }

  const ballsRemaining = state.match.oversPerInnings * 6 - inn.balls
  const previous = state.currentInnings > 0 ? state.innings[state.currentInnings - 1] : undefined
  const target = previous ? previous.runs + 1 : null
  const striker = inn.strikerId ? inn.batsmen[inn.strikerId] : undefined
  const nonStriker = inn.nonStrikerId ? inn.batsmen[inn.nonStrikerId] : undefined
  const bowler = inn.bowlerId ? inn.bowlers[inn.bowlerId] : undefined
  const overs = recentOvers(deliveries, 3)

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Innings {inn.innings}
          </p>
          <p className="text-xs text-slate-500">vs {inn.bowlingTeamId}</p>
        </div>
        <p className="max-w-[45%] truncate text-right text-xs text-slate-500">{state.match.name}</p>
      </div>

      <div className="flex items-end gap-3">
        <motion.span
          key={`${inn.runs}-${inn.wickets}`}
          initial={{ scale: 1.25, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="text-5xl font-black leading-none tracking-tight text-white tabular-nums"
        >
          {inn.runs}
          <span className="text-3xl text-slate-500">/{inn.wickets}</span>
        </motion.span>
        <span className="pb-1 text-sm text-slate-400 tabular-nums">
          {formatOvers(inn.balls)} / {state.match.oversPerInnings} ov
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="CRR" value={formatEcon(inn.runs, inn.balls)} />
        <Stat label="RRR" value={target ? requiredRunRate(target, inn.runs, ballsRemaining) : '-'} />
        <Stat label="Need" value={target ? Math.max(0, target - inn.runs) : '-'} hint={target ? `${Math.max(0, ballsRemaining)} balls` : '1st innings'} />
      </div>

      <div className="divide-y divide-white/5">
        {striker ? <BatsmanRow batsman={striker} striker /> : null}
        {nonStriker ? <BatsmanRow batsman={nonStriker} striker={false} /> : null}
      </div>

      {bowler ? (
        <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
          <span className="text-sm text-slate-200">{bowler.playerId}</span>
          <span className="text-xs text-slate-400 tabular-nums">
            {formatOvers(bowler.balls)}-{bowler.maidens}-{bowler.runs}-{bowler.wickets}
          </span>
          <span className="text-xs text-slate-500 tabular-nums">
            econ {formatEcon(bowler.runs, bowler.balls)}
          </span>
        </div>
      ) : null}

      {overs.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Recent overs
          </p>
          {overs.map((group) => (
            <div key={group.over} className="flex items-center gap-3">
              <span className="w-8 shrink-0 text-xs font-semibold text-slate-500">
                {group.over + 1}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {group.balls.map((ball) => (
                  <BallChip
                    key={ball.id}
                    label={outcomeLabel(ball.outcome, ball.runs)}
                    tone={chipTone(ball)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  )
}
