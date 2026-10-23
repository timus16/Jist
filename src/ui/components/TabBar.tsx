import { NavLink, type NavLinkRenderProps } from 'react-router-dom'

interface TabDef {
  key: string
  label: string
  to: string
  icon: string
}

export function TabBar() {
  const tabs: TabDef[] = [
    { key: 'home', label: 'Home', to: '/', icon: '\u{1F3E0}' },
    { key: 'new-match', label: 'New Match', to: '/match/new', icon: '\u{2795}' },
    { key: 'settings', label: 'Settings', to: '/settings', icon: '\u{2699}' },
  ]

  return (
    <nav
      role="tablist"
      aria-label="Primary navigation"
      className="tabbar"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.key}
          to={tab.to}
          role="tab"
          className={({ isActive }: NavLinkRenderProps) =>
            `tabbar__item ${isActive ? 'tabbar__item--active' : ''}`
          }
          children={({ isActive }: NavLinkRenderProps) => (
            <>
              <span aria-hidden="true" className="text-lg leading-none">
                {tab.icon}
              </span>
              <span aria-selected={isActive}>{tab.label}</span>
            </>
          )}
        />
      ))}
    </nav>
  )
}
