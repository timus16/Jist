import { AppShell, Button, Card } from '../ui'

export function NewMatchRoute() {
  return (
    <AppShell title="New match" subtitle="TODO wave-2">
      <Card>
        <h2 className="text-sm font-semibold text-white">TODO wave-2</h2>
        <p className="mt-1 text-sm text-slate-400">
          The match-creation flow (team picker, overs, ground selection) is built
          in wave 2. This route is a placeholder wired into the router.
        </p>
      </Card>
      <div className="mt-4">
        <Button size="lg" block disabled>
          Create match
        </Button>
      </div>
    </AppShell>
  )
}