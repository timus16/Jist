# Architecture

## Shape

A single-page Vite/React app (installable PWA) built around three layers:

1. **Domain** (`src/domain`) — pure, framework-free contracts and helpers. The
   contract surface every other module depends on.
2. **Data** (`src/db`, `src/sync`) — offline-first persistence (Dexie/IndexedDB)
   plus an optional network sync behind one interface.
3. **Presentation** (`src/state`, `src/ui`, `src/routes`) — zustand state, the
   mobile-app shell, and thin route components.

## Data flow

```
routes/ -> state/ (zustand) -> db/ (Dexie repos) -> IndexedDB
                    |                    |
                    +-- sync/ (SyncConnector) --> local no-op OR Supabase
```

- Every write goes to Dexie first (source of truth on device) and is then
  `enqueue`d to the active `SyncConnector`.
- Remote changes (Supabase realtime) arrive via `subscribeMatch(matchId, cb)`
  and update stores/UI.
- With no backend configured, `createSyncConnector()` returns the local no-op
  connector so the app is fully functional offline.

## Sync interface

`src/sync/types.ts` defines `SyncConnector` (`start`, `stop`, `enqueue`,
`subscribeMatch`). Implementations: `createLocalConnector` (in-memory pub/sub)
and `createSupabaseConnector` (realtime channel + upsert). The factory
`createSyncConnector()` picks Supabase only when `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` are present.

## Mobile-app shell

`src/ui/components/AppShell.tsx` renders a phone-width column
(`.app-frame`, max 480px, centred on desktop) containing a sticky app bar, a
momentum-scrolling body, and a fixed bottom `TabBar`. CSS in
`src/styles/index.css` uses `100dvh`, `env(safe-area-inset-*)`, disables text
selection on chrome, sets `overscroll-behavior: none`, and keeps touch targets
>= 44px.

## Zones / ground map

`src/domain/zones.ts` defines 16 equal 22.5-degree sectors with real cricket
field names. Angles are measured **clockwise from straight down the ground**
(0deg). `zoneForAngle(deg)` and `zoneForPoint({x,y})` convert an angle or a
ground point (metres, origin at the centre of the pitch) into a zone id. The
ground map (wave 1) uses these helpers so taps and stored zones always agree.

## Routing

`src/router.tsx` (react-router-dom):

- `/` — matches list
- `/match/new` — create match
- `/match/:matchId/score` — live scoring (W1 tap-to-zone)
- `/match/:matchId/view` — read-only scorecard + shot map (W2)
- `/settings` — data/sync settings

Route components in `src/routes/` are thin placeholders marked `TODO wave-2`.

## Build & tooling

Vite + `@vitejs/plugin-react` + `@tailwindcss/vite` + `vite-plugin-pwa`
(auto-update SW, manifest). Tests via Vitest (jsdom, globals) with Testing
Library. Type-checking is project-reference based (`tsc -b`).