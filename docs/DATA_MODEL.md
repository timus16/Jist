# Data model

Two representations share one shape: the **Dexie** tables (offline, on device)
and the **Postgres** tables in `supabase/migrations/0001_init.sql` (cloud). Ids
are UUIDs on both sides; complex values are JSON.

## Entities

### Team — `teams`
| field | type | notes |
| --- | --- | --- |
| id | uuid PK | |
| name | text | |
| short_name | text? | e.g. "RCB" |
| created_at | timestamp | |

Dexie index: `id, name`.

### Player — `players`
| field | type | notes |
| --- | --- | --- |
| id | uuid PK | |
| team_id | uuid FK -> teams | |
| name | text | |
| role | text? | batter/bowler/all-rounder/keeper |
| created_at | timestamp | |

Dexie index: `id, teamId`.

### Ground — `grounds`
| field | type | notes |
| --- | --- | --- |
| id | uuid PK | |
| name | text | |
| venue_id | uuid? | |
| boundary_polygon | jsonb / Point[] | fence outline (ground metres) |
| pitch_center | jsonb / Point | origin |
| pitch_orientation_deg | number | rotation of the pitch |

Dexie index: `id, name, venueId`.

### Match — `matches`
| field | type | notes |
| --- | --- | --- |
| id | uuid PK | |
| name | text | |
| sport | text | `'cricket'` |
| team_a_id / team_b_id | uuid FK | |
| ground_id | uuid FK? | |
| overs_per_innings | int | default 20 |
| status | text | scheduled/live/completed/abandoned |
| created_at / updated_at | timestamp | |

Dexie index: `id, status, groundId, teamAId, teamBId, createdAt`.

### Innings — `innings`
| field | type | notes |
| --- | --- | --- |
| id | uuid PK | |
| match_id | uuid FK | |
| innings | int | 1 or 2 |
| batting_team_id / bowling_team_id | uuid FK | |
| runs / wickets / balls | int | |
| completed | bool | |
| created_at | timestamp | |

Dexie index: `id, matchId, [matchId+innings]`. Unique `(match_id, innings)`.

### Delivery — `deliveries`
| field | type | notes |
| --- | --- | --- |
| id | uuid PK | |
| match_id | uuid FK | |
| innings / over / ball_in_over | int | |
| batsman_id / bowler_id | uuid | |
| outcome | text | dot/runs/wide/no_ball/bye/leg_bye/wicket |
| runs | int | |
| is_wicket | bool | |
| fielder_id | uuid? | |
| shot_event_id | uuid? | links to the shot map entry |
| extras | int | |
| created_at | timestamp | |

Dexie index: `id, matchId, [matchId+innings], shotEventId`.

### ShotEvent — `shot_events`
| field | type | notes |
| --- | --- | --- |
| id | uuid PK | |
| match_id | uuid FK | |
| innings / over / ball_in_over | int | |
| batsman_id / bowler_id | uuid | |
| shot_type | text? | e.g. "cover drive" |
| zone_id | int? | 0..15 (see zones.ts) |
| landing_point | jsonb? / Point | ground metres |
| runs | int | |
| is_wicket | bool | |
| fielder_id | uuid? | |
| source | text | W1 (tap) / W2 (camera) / manual |
| created_at | timestamp | |

Dexie index: `id, matchId, [matchId+innings], zoneId`.

### FieldSetup — `field_setups`
| field | type | notes |
| --- | --- | --- |
| match_id | uuid FK | part of PK |
| innings | int | part of PK |
| positions | jsonb / FielderPosition[] | `{playerId, role, x, y}` |

Dexie index: `matchId, [matchId+innings]`. PK `(match_id, innings)`.

## Zones

16 sectors of 22.5 degrees, clockwise from straight-down-the-ground (0deg).
Cardinal checks: 0deg -> zone 0 "Straight", 90deg -> 4, 180deg -> 8,
270deg -> 12 "Point". See `src/domain/zones.ts`.

## Engine contracts (wave 1)

`src/domain/cricket/types.ts` defines the shapes the scoring engine will
implement: `DeliveryInput`, `BatsmanState`, `BowlerState`, `Extras`,
`InningsState`, `MatchState`. These are contracts only — the engine lands in
wave 1.