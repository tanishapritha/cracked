-- Run this in your Supabase SQL Editor to switch Auth models from Supabase to Clerk.
-- Since Clerk user IDs are strings (e.g. "user_2xABC..."), we must drop the UUID constraints
-- and the foreign key relationship to Supabase's internal auth.users table.

-- 1. Drop the foreign key constraints safely
alter table public.sessions drop constraint if exists sessions_user_id_fkey;
alter table public.skill_scores drop constraint if exists skill_scores_user_id_fkey;
alter table public.users drop constraint if exists users_id_fkey;

-- 2. Alter the id columns to text to accept Clerk IDs
alter table public.users alter column id type text;
alter table public.sessions alter column user_id type text;
alter table public.skill_scores alter column user_id type text;

-- 3. Re-establish our own internal foreign keys linking sessions and skill scores directly to our public.users table
alter table public.sessions add constraint sessions_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;
alter table public.skill_scores add constraint skill_scores_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;

-- 4. Strip the strict row-level security policies based on Supabase's auth block
-- Note: Security relies entirely on our NextJS backend now via Clerk's tokens.
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "skills_select_own" on public.skill_scores;
drop policy if exists "skills_insert_own" on public.skill_scores;
drop policy if exists "skills_update_own" on public.skill_scores;
drop policy if exists "sessions_select_own" on public.sessions;
drop policy if exists "sessions_insert_own" on public.sessions;

-- 5. Open basic RLS for Service Roles & Authenticated Edge endpoints
create policy "Allow internal backend processing" on public.users for all using (true);
create policy "Allow internal backend processing" on public.skill_scores for all using (true);
create policy "Allow internal backend processing" on public.sessions for all using (true);
