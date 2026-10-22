import type { BallOutcome, Delivery } from '../../domain'

export function formatOvers(balls: number): string {
  const b = Math.max(0, Math.floor(balls))
  return `${Math.floor(b / 6)}.${b % 6}`
}

export function formatEcon(runs: number, balls: number): string {
  if (balls <= 0) return '0.00'
  return (runs / (balls / 6)).toFixed(2)
}

export function formatStrikeRate(runs: number, balls: number): string {
  if (balls <= 0) return '0.00'
  return ((runs / balls) * 100).toFixed(1)
}

export function outcomeLabel(outcome: BallOutcome, runs: number): string {
  switch (outcome) {
    case 'dot':
      return '\u2022'
    case 'wicket':
      return 'W'
    case 'wide':
      return 'wd'
    case 'no_ball':
      return 'nb'
    case 'bye':
      return runs > 0 ? `${runs}b` : 'b'
    case 'leg_bye':
      return runs > 0 ? `${runs}lb` : 'lb'
    case 'runs':
      return String(runs)
  }
}

export interface OverGroup {
  over: number
  balls: Delivery[]
}

/** Latest `count` overs, each with balls ordered by ball-in-over. */
export function recentOvers(deliveries: Delivery[], count = 3): OverGroup[] {
  const map = new Map<number, Delivery[]>()
  for (const d of deliveries) {
    const arr = map.get(d.over) ?? []
    arr.push(d)
    map.set(d.over, arr)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(-count)
    .map(([over, balls]) => ({
      over,
      balls: [...balls].sort((a, b) => a.ballInOver - b.ballInOver),
    }))
}
