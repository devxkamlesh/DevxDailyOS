-- Migration: Rewards & Social Features
-- Run this in your Supabase SQL Editor

-- 1. User Rewards/Currency Table
create table if not exists user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade unique,
  coins int default 0,
  gems int default 0,
  current_theme text default 'default',
  current_avatar text default 'default',
  unlocked_themes text[] default array['default'],
  unlocked_avatars text[] default array['default'],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Weekly Challenges Table
create table if not exists weekly_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  target_type text not null, -- completions | streak | perfect_days
  target_value int not null,
  coin_reward int default 100,
  xp_reward int default 500,
  start_date date not null,
  end_date date not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. User Challenge Progress
create table if not exists user_challenge_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  challenge_id uuid references weekly_challenges(id) on delete cascade,
  progress int default 0,
  completed boolean default false,
  completed_at timestamptz,
  claimed boolean default false,
  created_at timestamptz default now(),
  constraint user_challenge_unique unique (user_id, challenge_id)
);

-- 4. Leaderboard View (computed from habit_logs)
create or replace view leaderboard_weekly as
select 
  p.id as user_id,
  p.username,
  p.avatar_url,
  count(hl.id) filter (where hl.completed = true) as completions,
  count(distinct hl.date) filter (where hl.completed = true) as active_days
from profiles p
left join habit_logs hl on p.id = hl.user_id 
  and hl.date >= current_date - interval '7 days'
group by p.id, p.username, p.avatar_url
order by completions desc;

create or replace view leaderboard_monthly as
select 
  p.id as user_id,
  p.username,
  p.avatar_url,
  count(hl.id) filter (where hl.completed = true) as completions,
  count(distinct hl.date) filter (where hl.completed = true) as active_days
from profiles p
left join habit_logs hl on p.id = hl.user_id 
  and hl.date >= current_date - interval '30 days'
group by p.id, p.username, p.avatar_url
order by completions desc;

-- Enable RLS
alter table user_rewards enable row level security;
alter table weekly_challenges enable row level security;
alter table user_challenge_progress enable row level security;

-- Policies for user_rewards
drop policy if exists "Users can view own rewards" on user_rewards;
drop policy if exists "Users can create own rewards" on user_rewards;
drop policy if exists "Users can update own rewards" on user_rewards;

create policy "Users can view own rewards"
  on user_rewards for select
  using (auth.uid() = user_id);

create policy "Users can create own rewards"
  on user_rewards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own rewards"
  on user_rewards for update
  using (auth.uid() = user_id);

-- Policies for weekly_challenges (everyone can view)
drop policy if exists "Anyone can view challenges" on weekly_challenges;
create policy "Anyone can view challenges"
  on weekly_challenges for select
  using (true);

-- Policies for user_challenge_progress
drop policy if exists "Users can view own progress" on user_challenge_progress;
drop policy if exists "Users can create own progress" on user_challenge_progress;
drop policy if exists "Users can update own progress" on user_challenge_progress;

create policy "Users can view own progress"
  on user_challenge_progress for select
  using (auth.uid() = user_id);

create policy "Users can create own progress"
  on user_challenge_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on user_challenge_progress for update
  using (auth.uid() = user_id);

-- Insert some default weekly challenges
insert into weekly_challenges (title, description, target_type, target_value, coin_reward, xp_reward, start_date, end_date) values
('Habit Hero', 'Complete 50 habits this week', 'completions', 50, 200, 1000, current_date - extract(dow from current_date)::int, current_date - extract(dow from current_date)::int + 6),
('Streak Master', 'Maintain a 7-day streak', 'streak', 7, 150, 750, current_date - extract(dow from current_date)::int, current_date - extract(dow from current_date)::int + 6),
('Perfect Week', 'Get 5 perfect days', 'perfect_days', 5, 300, 1500, current_date - extract(dow from current_date)::int, current_date - extract(dow from current_date)::int + 6)
on conflict do nothing;
