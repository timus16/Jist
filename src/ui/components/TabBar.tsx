import { NavLink } from 'react-router-dom'
import { useMatchStore } from '../../state/matchStore'

interface TabDef {
  key: string
  label: string
  to: string
  icon: string
  end?: boolean
}

export function TabBar() {
  const matchId = useMatchStore((s) => s.currentMatchId)

  const tabs: TabDef[] = [
    { key: 'matches', label: 'Matches', to: '/', icon: '\u{1F3CF}', end: true },
    {
      key: 'score',
      label: 'Score',
      to: matchId ? `/match/${matchId}/score` : '/match/new',
      icon: '\u{1F3AF}',
    },
    {
      key: 'scorecard',
      label: 'Scorecard',
      to: matchId ? `/match/${matchId}/view` : '/',
      icon: '\u{1F4CB}',
    },
    { key: 'settings', label: 'Settings', to: '/settings', icon: '\u{2699}' },
  ]

  return (
    <nav className="tabbar" aria-label="Primary">
      {tabs.map((tab) => (
        <NavLink
          key={tab.key}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            isActive ? 'tabbar__item tabbar__item--active' : 'tabbar__item'
          }
        >
          <span aria-hidden className="text-lg leading-none">
            {tab.icon}
          </span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}