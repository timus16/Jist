-- Jist schema parity with the Dexie/IndexedDB tables in src/db/db.ts.
-- Run with the Supabase CLI or paste into the SQL editor.

create extension if not exists "pgcrypto";

-- teams -------------------------------------------------------------------
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  created_at timestamptz not null default now()
);

-- players -----------------------------------------------------------------
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  role text,
  created_at timestamptz not null default now()
);
create index if not exists players_team_id_idx on public.players(team_id);

-- grounds -----------------------------------------------------------------
create table if not exists public.grounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  venue_id uuid,
  boundary_polygon jsonb not null default '[]'::jsonb,
  pitch_center jsonb not null default '{"x":0,"y":0}'::jsonb,
  pitch_orientation_deg double precision not null default 0
);

-- matches -----------------------------------------------------------------
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text not null default 'cricket' check (sport in ('cricket')),
  team_a_id uuid references public.teams(id) on delete set null,
  team_b_id uuid references public.teams(id) on delete set null,
  ground_id uuid references public.grounds(id) on delete set null,
  overs_per_innings integer not null default 20,
  status text not null default 'scheduled'
    check (status in ('scheduled','live','completed','abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists matches_status_idx on public.matches(status);
create index if not exists matches_ground_id_idx on public.matches(ground_id);

-- innings -----------------------------------------------------------------
create table if not exists public.innings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  innings integer not null,
  batting_team_id uuid references public.teams(id) on delete set null,
  bowling_team_id uuid references public.teams(id) on delete set null,
  runs integer not null default 0,
  wickets integer not null default 0,
  balls integer not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (match_id, innings)
);
create index if not exists innings_match_id_idx on public.innings(match_id);

-- deliveries --------------------------------------------------------------
create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  innings integer not null,
  over integer not null,
  ball_in_over integer not null,
  batsman_id uuid,
  bowler_id uuid,
  outcome text not null
    check (outcome in ('dot','runs','wide','no_ball','bye','leg_bye','wicket')),
  runs integer not null default 0,
  is_wicket boolean not null default false,
  fielder_id uuid,
  shot_event_id uuid,
  extras integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists deliveries_match_id_idx on public.deliveries(match_id);

-- shot_events -------------------------------------------------------------
create table if not exists public.shot_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  innings integer not null,
  over integer not null,
  ball_in_over integer not null,
  batsman_id uuid,
  bowler_id uuid,
  shot_type text,
  zone_id integer,
  landing_point jsonb,
  runs integer not null default 0,
  is_wicket boolean not null default false,
  fielder_id uuid,
  source text not null default 'manual' check (source in ('W1','W2','manual')),
  created_at timestamptz not null default now()
);
create index if not exists shot_events_match_id_idx on public.shot_events(match_id);
create index if not exists shot_events_zone_id_idx on public.shot_events(zone_id);

-- field_setups ------------------------------------------------------------
create table if not exists public.field_setups (
  match_id uuid not null references public.matches(id) on delete cascade,
  innings integer not null,
  positions jsonb not null default '[]'::jsonb,
  primary key (match_id, innings)
);

-- Realtime: broadcast new shot events to subscribed clients.
alter publication supabase_realtime add table public.shot_events;

-- Row Level Security ------------------------------------------------------
alter table public.teams        enable row level security;
alter table public.players      enable row level security;
alter table public.grounds      enable row level security;
alter table public.matches      enable row level security;
alter table public.innings      enable row level security;
alter table public.deliveries   enable row level security;
alter table public.shot_events  enable row level security;
alter table public.field_setups enable row level security;

-- MVP policy: any authenticated user may read/write. Tighten per-match
-- ownership before production.
-- create policy "read all"  on public.matches for select to authenticated using (true);
-- create policy "write all" on public.matches for all    to authenticated using (true) with check (true);
-- ...repeat per table as needed.