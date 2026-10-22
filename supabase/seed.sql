-- Demo data for local development. Mirrors the Dexie seed shape.

insert into public.teams (id, name, short_name) values
  ('11111111-1111-4111-8111-111111111111', 'Royal Challengers', 'RCB'),
  ('22222222-2222-4222-8222-222222222222', 'Super Kings', 'CSK')
on conflict (id) do nothing;

insert into public.grounds (id, name, pitch_center, pitch_orientation_deg, boundary_polygon) values
  ('33333333-3333-4333-8333-333333333333', 'MG Ground', '{"x":0,"y":0}'::jsonb, 0, '[]'::jsonb)
on conflict (id) do nothing;

insert into public.matches (id, name, team_a_id, team_b_id, ground_id, overs_per_innings, status) values
  ('44444444-4444-4444-8444-444444444444', 'Sunday Friendly', 
   '11111111-1111-4111-8111-111111111111',
   '22222222-2222-4222-8222-222222222222',
   '33333333-3333-4333-8333-333333333333',
   20, 'scheduled')
on conflict (id) do nothing;