# PRD — Jist

## Problem

Local club and street-cricket tournaments are scored on paper or in fragile
spreadsheets. There is no lightweight, offline-capable, shared scoreboard that
fans, scorers, and organisers can all see live — and no cheap way to capture
*where* a shot went for rich, shareable stats.

## Product

Jist is a mobile-first, installable web app that scores local tournaments in
real time and captures shot direction on a **tap-to-locate ground map**. MVP
sport: **cricket**.

## Primary users

- **Scorer** — enters balls quickly on a phone at the ground, often offline.
- **Organiser** — creates matches, picks teams/ground, watches the scorecard.
- **Follower** — opens a link to watch the live score and shot map.

## MVP scope (P0)

- Create a match (two teams, overs, ground).
- Ball-by-ball scoring: runs, dots, wides, no-balls, byes, leg-byes, wickets.
- Tap-to-locate shot capture: tap a point on the ground map; the app derives the
  field **zone** from the tap and stores both the point and the zone.
- Offline-first: everything works with no network; sync is optional.
- Mobile-app feel: installable PWA, bottom tab bar, one-thumb controls.

## Non-goals (for P0)

- No native app. No account system required. No multi-sport. No video.

## Success metrics

- A full innings scored offline without data loss.
- Median ball entry < 4 taps.
- Shot map renders for a completed match on a mid-range phone.

## Roadmap summary

P0 scaffold -> P1 tap-to-zone scoring (W1) -> P2 single-camera + ArUco
"Pro Ground" (W2) -> P3 passive fielder phones (W3, moonshot). See
`docs/ROADMAP.md`.

## Key risks

- **Capture accuracy**: tap-to-zone is coarse; the map must stay forgiving.
- **Offline conflicts**: sync must never lose local writes.
- **Scope creep into native**: explicitly banned; web PWA only.