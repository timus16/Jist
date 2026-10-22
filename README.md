# Jist

Real-time scoring for local sports tournaments. MVP: **cricket scoring** with a
**tap-to-locate "ground map"** shot-capture feature, presented as a
mobile-app-like **installable PWA**.

## Stack

- **Vite + React 19 + TypeScript** (web only — no React Native, no Expo)
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **vite-plugin-pwa** (auto-update service worker, installable, offline shell)
- **react-router-dom** for routing
- **zustand** for state
- **Dexie / IndexedDB** for offline-first local persistence
- **@supabase/supabase-js** for optional cloud sync (schema in `supabase/`)
- **motion**, **date-fns**
- **Vitest + Testing Library** for tests

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm run build      # type-check + production build into dist/
npm run preview    # preview the built app
npx tsc --noEmit   # type-check (project references: `npm run typecheck` = tsc -b)
npx vitest run     # run the test suite
```

The app runs fully offline with zero backend: it uses the in-memory/local sync
connector by default. To enable Supabase sync, create `.env` with:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

…and run the SQL in `supabase/migrations/0001_init.sql` (plus `supabase/seed.sql`
for demo data).

## PWA / install

The app ships a web app manifest and a service worker, so it can be installed
from the browser ("Add to Home screen"). It is designed **mobile-first**: the
shell uses `100dvh`, safe-area insets, a fixed bottom tab bar, and 44px+
touch targets; on desktop the app is centred in a phone-width column.

## Project layout

```
src/domain        Stable domain contracts (types, zones, ids) — build against these
src/db            Dexie database + repositories (offline-first persistence)
src/sync          SyncConnector interface + local (no-op) and Supabase implementations
src/state         zustand stores (match, ui)
src/ui/components App-shell building blocks (AppShell, TabBar, Button, Card, Stat, EmptyState)
src/routes        Route components (thin placeholders filled in by later waves)
src/styles        App-shell CSS + Tailwind theme
supabase/         Postgres schema parity + seed
docs/             PRD, architecture, data model, roadmap
```

See `docs/` for the PRD, architecture, data model, and roadmap.