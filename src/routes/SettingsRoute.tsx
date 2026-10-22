import { AppShell, Card } from '../ui'

export function SettingsRoute() {
  return (
    <AppShell title="Settings" subtitle="TODO wave-2">
      <Card>
        <h2 className="text-sm font-semibold text-white">TODO wave-2</h2>
        <p className="mt-1 text-sm text-slate-400">
          Data/sync settings (Supabase connector, offline export/import) are
          wired here in wave 2.
        </p>
      </Card>
    </AppShell>
  )
}