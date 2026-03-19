-- Cracked database schema
-- Run this in Supabase SQL editor

-- users table
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

-- skill scores
create table if not exists public.skill_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  topic text not null,
  score int default 0,
  unique(user_id, topic)
);

-- sessions
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  problem_slug text not null,
  stage_reached int not null,
  hints_used int default 0,
  duration_seconds int default 0,
  solved boolean default false,
  created_at timestamptz default now()
);

-- indexes
create index if not exists idx_skill_scores_user on public.skill_scores(user_id);
create index if not exists idx_sessions_user on public.sessions(user_id);
create index if not exists idx_sessions_slug on public.sessions(problem_slug);

-- RLS policies
alter table public.users enable row level security;
alter table public.skill_scores enable row level security;
alter table public.sessions enable row level security;

-- users: read/write own data only
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);
create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- skill_scores: read/write own data only
create policy "skills_select_own" on public.skill_scores
  for select using (auth.uid() = user_id);
create policy "skills_insert_own" on public.skill_scores
  for insert with check (auth.uid() = user_id);
create policy "skills_update_own" on public.skill_scores
  for update using (auth.uid() = user_id);

-- sessions: read/write own data only
create policy "sessions_select_own" on public.sessions
  for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on public.sessions
  for insert with check (auth.uid() = user_id);
