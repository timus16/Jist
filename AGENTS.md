# AGENTS.md

Guidance for agents working in this repository.

## What this is

**Jist** — a mobile-first, installable **web** app (PWA) for real-time scoring of
local sports tournaments. The MVP sport is **cricket**, with a tap-to-locate
"ground map" shot-capture feature.

## Hard constraints

- **Web only. No React Native, no Expo.** Do not add `expo-*` / `react-native*`
  dependencies, `app.json`, `app/`, or `src/app/_layout.tsx`.
- **Domain-first.** `src/domain` is the contract surface. Other features and
  waves build against the exported types/helpers there. Keep changes to domain
  additive and typed; do not casually rename exports.
- **Offline-first.** Persistence goes through Dexie (`src/db`). Network sync is
  optional and goes through the `SyncConnector` interface (`src/sync`).
- **Feature-folder ownership.** Each wave owns a slice: shared contracts in
  `src/domain`, UI primitives in `src/ui/components`, and each feature gets its
  own route folder under `src/routes` plus logic folders (e.g. `src/features/*`).
  Don't edit another feature's files without coordinating.

## Validate before finishing

```bash
npx tsc -b          # type-check (must pass)
npx vitest run      # tests (must pass)
npm run build       # production build -> dist/
```

`npx tsc --noEmit` runs the solution config; use `npm run typecheck` (`tsc -b`)
for the full project-reference check.

## Conventions

- TypeScript strict-ish: `noUnusedLocals`, `noUnusedParameters`,
  `verbatimModuleSyntax` (use `import type` for type-only imports),
  `erasableSyntaxOnly` (no enums/namespaces/parameter properties).
- No comments unless they add real value.
- Mobile-app feel is a product requirement: `100dvh` shell, safe-area insets,
  bottom tab bar, >=44px touch targets, momentum scroll, no accidental text
  selection.
- Never commit secrets. Supabase keys are public anon keys via `VITE_*` env only.

## Layout

```
src/domain        types.ts, zones.ts, ids.ts, cricket/types.ts  (contracts)
src/db            Dexie db + repositories
src/sync          SyncConnector + local/supabase connectors
src/state         zustand stores
src/ui/components App-shell primitives
src/routes        Route components
src/styles        index.css (Tailwind + shell CSS)
supabase/         SQL schema + seed
docs/             PRD, ARCHITECTURE, DATA_MODEL, ROADMAP
```