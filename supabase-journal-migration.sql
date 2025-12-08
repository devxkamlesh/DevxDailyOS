-- Migration: Add Daily Journal Table
-- Run this in your Supabase SQL Editor

-- Create daily_journal table (only run if it doesn't exist)
create table if not exists daily_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  date date not null,
  mood text, -- great | good | okay | bad | terrible
  reflection text,
  gratitude text,
  wins text,
  challenges text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint daily_journal_unique unique (user_id, date)
);

-- Enable Row Level Security
alter table daily_journal enable row level security;

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "Users can view own journal" on daily_journal;
drop policy if exists "Users can create own journal" on daily_journal;
drop policy if exists "Users can update own journal" on daily_journal;
drop policy if exists "Users can delete own journal" on daily_journal;

-- Create policies
create policy "Users can view own journal"
  on daily_journal for select
  using (auth.uid() = user_id);

create policy "Users can create own journal"
  on daily_journal for insert
  with check (auth.uid() = user_id);

create policy "Users can update own journal"
  on daily_journal for update
  using (auth.uid() = user_id);

create policy "Users can delete own journal"
  on daily_journal for delete
  using (auth.uid() = user_id);
