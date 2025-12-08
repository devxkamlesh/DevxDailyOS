-- Migration: Update Profiles Table with Public Settings
-- Run this in your Supabase SQL Editor

-- Add new columns to profiles table if they don't exist
alter table profiles 
  add column if not exists bio text,
  add column if not exists website text,
  add column if not exists is_public boolean default true,
  add column if not exists show_on_leaderboard boolean default true,
  add column if not exists profile_icon text default '👤';

-- Update existing profiles to have default values
update profiles 
set 
  is_public = true,
  show_on_leaderboard = true,
  profile_icon = '👤'
where is_public is null or show_on_leaderboard is null or profile_icon is null;
