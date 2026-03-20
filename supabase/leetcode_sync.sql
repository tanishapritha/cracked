-- Run this in your Supabase SQL Editor to enable LeetCode sync
create table if not exists public.leetcode_accounts (
  user_id uuid primary key references public.users(id) on delete cascade,
  username text,
  session_cookie text,
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.leetcode_solved (
  user_id uuid references public.users(id) on delete cascade,
  problem_slug text not null,
  synced_at timestamptz default now(),
  primary key (user_id, problem_slug)
);
