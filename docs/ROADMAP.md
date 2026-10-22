# Roadmap

Delivery is split into phases P0–P5. Each wave owns a slice of the codebase and
builds against the stable contracts in `src/domain`.

## P0 — Foundation (this wave)

- Vite + React + TS web scaffold, Tailwind v4, PWA (installable, auto-update).
- Domain contracts: `types.ts`, `zones.ts` (16 sectors + helpers), `ids.ts`,
  `cricket/types.ts`.
- Offline-first data layer: Dexie db + repositories; `SyncConnector` with local
  and Supabase implementations.
- zustand stores; mobile-app shell (AppShell, TabBar, Button, Card, Stat,
  EmptyState); routing with thin placeholder routes.
- Supabase schema parity + seed; docs; zone tests.

## P1 — Tap-to-zone scoring (W1)  → **first real feature**

- Match creation flow (teams, overs, ground) at `/match/new`.
- Live scoring panel at `/match/:matchId/score`: ball-by-ball entry.
- **Tap-to-zone ground map**: SVG field, 16 zones from `zoneForAngle`; a tap
  stores a `landingPoint` + derived `zoneId` on a `ShotEvent`.
- Scoring engine implementing the `cricket/types.ts` contracts.
- Read-only scorecard + shot map at `/match/:matchId/view`.

## P2 — Single-camera + ArUco "Pro Ground"

- Optional single-camera capture: ArUco markers on the boundary let the app
  calibrate the ground and map a detected ball/shots to real ground coordinates.
- `ShotSource = 'W2'`; higher-fidelity zones and pitch/landing points.

## P3 — Passive fielder phones (moonshot)

- Fielder phones placed around the ground act as passive sensors, triangulating
  ball position. High complexity, low certainty — explored only after P2.

## P4 — Tournament + sharing

- Multi-match tournaments, standings, shareable live links.

## P5 — Hardening

- Robust conflict resolution, sync retry/backoff, data export/import, analytics.

## Contract stability

`src/domain` exports are the integration surface. Waves must not rename or
remove existing exports; extend additively.