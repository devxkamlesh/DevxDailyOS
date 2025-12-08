-- DevX Daily OS Database Schema
-- Run this in your Supabase SQL Editor

create extension if not exists "pgcrypto";

-- 1. Profiles
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. Habits
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  emoji text,
  description text,
  category text, -- morning, work, night, health, focus
  type text default 'boolean', -- 'boolean' | 'numeric'
  target_value int, -- e.g. 5 (pages, minutes, etc)
  target_unit text, -- 'pages', 'min', 'reps', etc
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Habit logs (per day)
create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  habit_id uuid references habits(id) on delete cascade,
  date date not null,
  completed boolean default false,
  value int,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint habit_logs_unique unique (user_id, habit_id, date)
);

-- 4. Projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  slug text,
  description text,
  status text default 'idea', -- idea | building | shipped
  tech_stack text[],
  live_url text,
  github_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  description text,
  priority text default 'medium', -- low | medium | high
  status text default 'pending',  -- pending | in_progress | done
  is_today boolean default false,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. Instagram content
create table instagram_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text,
  hook text,
  caption text,
  hashtags text,
  format text, -- reel | post | story
  status text default 'idea', -- idea | draft | scheduled | posted
  scheduled_for timestamptz,
  posted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. Freelance clients
create table freelance_clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  platform text, -- upwork | fiverr | dm | other
  project_title text,
  value numeric,
  currency text default 'INR',
  stage text default 'lead', -- lead | in_talk | proposal | active | done
  next_action text,
  next_action_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. Settings (optional)
create table user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  timezone text,
  start_of_week text default 'monday',
  theme text default 'dark',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table instagram_posts enable row level security;
alter table freelance_clients enable row level security;
alter table user_settings enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Habits policies
create policy "Users can view own habits"
  on habits for select
  using (auth.uid() = user_id);

create policy "Users can create own habits"
  on habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own habits"
  on habits for update
  using (auth.uid() = user_id);

create policy "Users can delete own habits"
  on habits for delete
  using (auth.uid() = user_id);

-- Habit logs policies
create policy "Users can view own habit logs"
  on habit_logs for select
  using (auth.uid() = user_id);

create policy "Users can create own habit logs"
  on habit_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own habit logs"
  on habit_logs for update
  using (auth.uid() = user_id);

-- Projects policies
create policy "Users can view own projects"
  on projects for select
  using (auth.uid() = user_id);

create policy "Users can create own projects"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on projects for delete
  using (auth.uid() = user_id);

-- Tasks policies
create policy "Users can view own tasks"
  on tasks for select
  using (auth.uid() = user_id);

create policy "Users can create own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on tasks for delete
  using (auth.uid() = user_id);

-- Instagram posts policies
create policy "Users can view own instagram posts"
  on instagram_posts for select
  using (auth.uid() = user_id);

create policy "Users can create own instagram posts"
  on instagram_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own instagram posts"
  on instagram_posts for update
  using (auth.uid() = user_id);

create policy "Users can delete own instagram posts"
  on instagram_posts for delete
  using (auth.uid() = user_id);

-- Freelance clients policies
create policy "Users can view own freelance clients"
  on freelance_clients for select
  using (auth.uid() = user_id);

create policy "Users can create own freelance clients"
  on freelance_clients for insert
  with check (auth.uid() = user_id);

create policy "Users can update own freelance clients"
  on freelance_clients for update
  using (auth.uid() = user_id);

create policy "Users can delete own freelance clients"
  on freelance_clients for delete
  using (auth.uid() = user_id);

-- User settings policies
create policy "Users can view own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can create own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on user_settings for update
  using (auth.uid() = user_id);
