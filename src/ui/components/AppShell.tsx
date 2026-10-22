import type { ReactNode } from 'react'
import { TabBar } from './TabBar'

interface AppShellProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}

/**
 * Mobile-app shell: sticky top app bar, momentum-scrolling body, and a fixed
 * bottom tab bar, all inside a phone-width column that is centred on desktop.
 */
export function AppShell({ title, subtitle, action, children }: AppShellProps) {
  return (
    <div className="app-frame">
      <div className="app-shell">
        <header className="app-bar">
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 className="truncate text-base font-bold text-white">{title}</h1>
            {subtitle ? (
              <span className="truncate text-xs text-slate-400">{subtitle}</span>
            ) : null}
          </div>
          {action ? <div className="flex items-center gap-2">{action}</div> : null}
        </header>
        <main className="app-body">{children}</main>
        <TabBar />
      </div>
    </div>
  )
}