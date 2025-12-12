-- ============================================
-- DevX Daily OS - Master Database Schema v1.0
-- ============================================
-- This is the COMPLETE schema for a clean database setup
-- Run this file ONLY on a fresh database
-- For existing databases, use supabase-migration-from-old-to-new.sql
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  
  -- Basic Info
  username text,
  full_name text,
  avatar_url text,
  
  -- Extended Info
  bio text,
  website text,
  
  -- Settings
  profile_icon text DEFAULT 'user', -- TEXT ID (not emoji!)
  is_public boolean DEFAULT true,
  show_on_leaderboard boolean DEFAULT true,
  timezone text DEFAULT 'Asia/Kolkata',
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE profiles IS 'User profiles with public/private settings';
COMMENT ON COLUMN profiles.profile_icon IS 'Icon ID (e.g. user, smile, diamond) - NOT emoji';

-- ============================================
-- 2. HABITS TABLE
-- ============================================
CREATE TABLE habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Habit Details
  name text NOT NULL,
  emoji text,
  description text,
  category text CHECK (category IN ('morning', 'work', 'night', 'health', 'focus')),
  
  -- Habit Type
  type text DEFAULT 'boolean' CHECK (type IN ('boolean', 'numeric')),
  target_value int,
  target_unit text,
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE habits IS 'User habits with tracking configuration';
COMMENT ON COLUMN habits.type IS 'boolean = yes/no, numeric = count/measure';

-- ============================================
-- 3. HABIT LOGS TABLE
-- ============================================
CREATE TABLE habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  
  -- Log Data
  date date NOT NULL,
  completed boolean DEFAULT false,
  value int,
  note text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT habit_logs_unique UNIQUE (user_id, habit_id, date)
);

COMMENT ON TABLE habit_logs IS 'Daily habit completion logs';

-- ============================================
-- 4. USER REWARDS TABLE
-- ============================================
CREATE TABLE user_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Currency
  coins int DEFAULT 0 CHECK (coins >= 0),
  gems int DEFAULT 0 CHECK (gems >= 0),
  
  -- XP & Level
  xp int DEFAULT 0 CHECK (xp >= 0),
  level int DEFAULT 1 CHECK (level >= 1),
  
  -- Streaks
  current_streak int DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak int DEFAULT 0 CHECK (longest_streak >= 0),
  perfect_days int DEFAULT 0 CHECK (perfect_days >= 0),
  
  -- Customization
  current_theme text DEFAULT 'default',
  current_avatar text DEFAULT 'user',
  unlocked_themes text[] DEFAULT ARRAY['default'],
  unlocked_avatars text[] DEFAULT ARRAY['user'],
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE user_rewards IS 'User rewards, currency, XP, levels, and customization';

-- ============================================
-- 5. COIN AWARDS TABLE (Exploit Prevention)
-- ============================================
CREATE TABLE coin_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  
  -- Award Data
  date date NOT NULL,
  coins_awarded int NOT NULL DEFAULT 1,
  
  -- Timestamp
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate awards
  CONSTRAINT coin_awards_unique UNIQUE (user_id, habit_id, date)
);

COMMENT ON TABLE coin_awards IS 'Tracks coin awards per habit per day to prevent farming exploits';

-- ============================================
-- 6. XP AWARDS TABLE (Exploit Prevention)
-- ============================================
CREATE TABLE xp_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  
  -- Award Data
  date date NOT NULL,
  xp_awarded int NOT NULL DEFAULT 10,
  
  -- Timestamp
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate awards
  CONSTRAINT xp_awards_unique UNIQUE (user_id, habit_id, date)
);

COMMENT ON TABLE xp_awards IS 'Tracks XP awards per habit per day to prevent farming exploits';

-- ============================================
-- 7. USER ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Achievement Data
  achievement_id text NOT NULL,
  
  -- Timestamp
  unlocked_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate achievements
  CONSTRAINT user_achievements_unique UNIQUE (user_id, achievement_id)
);

COMMENT ON TABLE user_achievements IS 'Tracks which achievements users have claimed';

-- ============================================
-- 8. WEEKLY CHALLENGE CLAIMS TABLE
-- ============================================
CREATE TABLE weekly_challenge_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Challenge Data
  challenge_id text NOT NULL,
  week_start date NOT NULL,
  coins_awarded int DEFAULT 0,
  xp_awarded int DEFAULT 0,
  
  -- Timestamp
  claimed_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate claims
  CONSTRAINT weekly_challenge_unique UNIQUE (user_id, challenge_id, week_start)
);

COMMENT ON TABLE weekly_challenge_claims IS 'Tracks weekly challenge completions';

-- ============================================
-- 9. NOTIFICATION SETTINGS TABLE
-- ============================================
CREATE TABLE notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Settings
  daily_reminders boolean DEFAULT false,
  achievement_alerts boolean DEFAULT true,
  weekly_summary boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE notification_settings IS 'User notification preferences';

-- ============================================
-- 10. PROJECTS TABLE
-- ============================================
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Project Details
  name text NOT NULL,
  slug text,
  description text,
  status text DEFAULT 'idea' CHECK (status IN ('idea', 'building', 'shipped')),
  tech_stack text[],
  live_url text,
  github_url text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE projects IS 'User projects and side projects';

-- ============================================
-- 11. TASKS TABLE
-- ============================================
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Task Details
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  is_today boolean DEFAULT false,
  due_date date,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE tasks IS 'User tasks and todos';

-- ============================================
-- 12. INSTAGRAM POSTS TABLE
-- ============================================
CREATE TABLE instagram_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Post Details
  title text,
  hook text,
  caption text,
  hashtags text,
  format text CHECK (format IN ('reel', 'post', 'story')),
  status text DEFAULT 'idea' CHECK (status IN ('idea', 'draft', 'scheduled', 'posted')),
  scheduled_for timestamptz,
  posted_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE instagram_posts IS 'Instagram content planning and scheduling';

-- ============================================
-- 13. FREELANCE CLIENTS TABLE
-- ============================================
CREATE TABLE freelance_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Client Details
  name text NOT NULL,
  platform text CHECK (platform IN ('upwork', 'fiverr', 'dm', 'other')),
  project_title text,
  value numeric,
  currency text DEFAULT 'INR',
  stage text DEFAULT 'lead' CHECK (stage IN ('lead', 'in_talk', 'proposal', 'active', 'done')),
  next_action text,
  next_action_date date,
  notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE freelance_clients IS 'Freelance client and project management';

-- ============================================
-- 14. USER SETTINGS TABLE
-- ============================================
CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Settings
  timezone text DEFAULT 'Asia/Kolkata',
  start_of_week text DEFAULT 'monday',
  theme text DEFAULT 'dark',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE user_settings IS 'User application settings';

-- ============================================
-- 15. DAILY JOURNAL TABLE
-- ============================================
CREATE TABLE daily_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Journal Entry
  date date NOT NULL,
  mood text CHECK (mood IN ('great', 'good', 'okay', 'bad', 'terrible')),
  reflection text,
  gratitude text,
  wins text,
  challenges text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- One entry per day
  CONSTRAINT daily_journal_unique UNIQUE (user_id, date)
);

COMMENT ON TABLE daily_journal IS 'Daily journal entries and reflections';

-- ============================================
-- FUNCTIONS
-- ============================================

-- Level calculation function
CREATE OR REPLACE FUNCTION calculate_level(total_xp int)
RETURNS int AS $$
BEGIN
  RETURN GREATEST(1, FLOOR(SQRT(total_xp / 100.0)) + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_level IS 'Calculate level from XP: level = floor(sqrt(xp/100)) + 1';

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically update updated_at timestamp';

-- Auto-update level when XP changes
CREATE OR REPLACE FUNCTION update_level_on_xp_change()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := calculate_level(NEW.xp);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_level_on_xp_change IS 'Automatically recalculate level when XP changes';

-- ============================================
-- TRIGGERS
-- ============================================

-- User Rewards: Auto-update level
CREATE TRIGGER trigger_update_level_on_xp
  BEFORE INSERT OR UPDATE OF xp ON user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_level_on_xp_change();

-- User Rewards: Auto-update timestamp
CREATE TRIGGER trigger_user_rewards_updated_at
  BEFORE UPDATE ON user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habits: Auto-update timestamp
CREATE TRIGGER trigger_habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habit Logs: Auto-update timestamp
CREATE TRIGGER trigger_habit_logs_updated_at
  BEFORE UPDATE ON habit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Projects: Auto-update timestamp
CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tasks: Auto-update timestamp
CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Instagram Posts: Auto-update timestamp
CREATE TRIGGER trigger_instagram_posts_updated_at
  BEFORE UPDATE ON instagram_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Freelance Clients: Auto-update timestamp
CREATE TRIGGER trigger_freelance_clients_updated_at
  BEFORE UPDATE ON freelance_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- User Settings: Auto-update timestamp
CREATE TRIGGER trigger_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Daily Journal: Auto-update timestamp
CREATE TRIGGER trigger_daily_journal_updated_at
  BEFORE UPDATE ON daily_journal
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Notification Settings: Auto-update timestamp
CREATE TRIGGER trigger_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES (Performance Optimization)
-- ============================================

-- Habit Logs (most queried table)
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, date DESC);
CREATE INDEX idx_habit_logs_habit_date ON habit_logs(habit_id, date DESC);
CREATE INDEX idx_habit_logs_completed ON habit_logs(completed) WHERE completed = true;

-- Habits
CREATE INDEX idx_habits_user_active ON habits(user_id, is_active);
CREATE INDEX idx_habits_category ON habits(category) WHERE is_active = true;

-- User Rewards
CREATE INDEX idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX idx_user_rewards_level ON user_rewards(level DESC);
CREATE INDEX idx_user_rewards_xp ON user_rewards(xp DESC);

-- Coin & XP Awards
CREATE INDEX idx_coin_awards_user_date ON coin_awards(user_id, date DESC);
CREATE INDEX idx_coin_awards_habit_date ON coin_awards(habit_id, date DESC);
CREATE INDEX idx_xp_awards_user_date ON xp_awards(user_id, date DESC);
CREATE INDEX idx_xp_awards_habit_date ON xp_awards(habit_id, date DESC);

-- User Achievements
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Profiles
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_leaderboard ON profiles(show_on_leaderboard) WHERE show_on_leaderboard = true;

-- Projects & Tasks
CREATE INDEX idx_projects_user_status ON projects(user_id, status);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE status != 'done';

-- Daily Journal
CREATE INDEX idx_daily_journal_user_date ON daily_journal(user_id, date DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_challenge_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelance_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_journal ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Habits Policies
CREATE POLICY "Users can view own habits" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own habits" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON habits FOR DELETE USING (auth.uid() = user_id);

-- Habit Logs Policies
CREATE POLICY "Users can view own habit logs" ON habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own habit logs" ON habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit logs" ON habit_logs FOR UPDATE USING (auth.uid() = user_id);

-- User Rewards Policies
CREATE POLICY "Users can view own rewards" ON user_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own rewards" ON user_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rewards" ON user_rewards FOR UPDATE USING (auth.uid() = user_id);

-- Coin Awards Policies
CREATE POLICY "Users can view own coin awards" ON coin_awards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own coin awards" ON coin_awards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own coin awards" ON coin_awards FOR DELETE USING (auth.uid() = user_id);

-- XP Awards Policies
CREATE POLICY "Users can view own xp awards" ON xp_awards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own xp awards" ON xp_awards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own xp awards" ON xp_awards FOR DELETE USING (auth.uid() = user_id);

-- User Achievements Policies
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Weekly Challenge Claims Policies
CREATE POLICY "Users can view own weekly claims" ON weekly_challenge_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own weekly claims" ON weekly_challenge_claims FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notification Settings Policies
CREATE POLICY "Users can view own notification settings" ON notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notification settings" ON notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification settings" ON notification_settings FOR UPDATE USING (auth.uid() = user_id);

-- Projects Policies
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Tasks Policies
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Instagram Posts Policies
CREATE POLICY "Users can view own instagram posts" ON instagram_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own instagram posts" ON instagram_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own instagram posts" ON instagram_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own instagram posts" ON instagram_posts FOR DELETE USING (auth.uid() = user_id);

-- Freelance Clients Policies
CREATE POLICY "Users can view own freelance clients" ON freelance_clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own freelance clients" ON freelance_clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own freelance clients" ON freelance_clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own freelance clients" ON freelance_clients FOR DELETE USING (auth.uid() = user_id);

-- User Settings Policies
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Daily Journal Policies
CREATE POLICY "Users can view own journal" ON daily_journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own journal" ON daily_journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal" ON daily_journal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal" ON daily_journal FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- PUBLIC PROFILES VIEW (For Leaderboard)
-- ============================================

CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  p.id,
  p.username,
  p.full_name,
  p.bio,
  p.website,
  p.profile_icon,
  p.avatar_url,
  p.is_public,
  p.show_on_leaderboard,
  p.created_at,
  
  -- User rewards data
  COALESCE(ur.current_avatar, 'user') as current_avatar,
  COALESCE(ur.current_theme, 'default') as current_theme,
  COALESCE(ur.xp, 0) as xp,
  COALESCE(ur.level, 1) as level,
  COALESCE(ur.current_streak, 0) as current_streak,
  COALESCE(ur.coins, 0) as coins,
  
  -- Weekly stats (last 7 days)
  (
    SELECT COUNT(*)
    FROM habit_logs hl
    WHERE hl.user_id = p.id 
    AND hl.completed = true
    AND hl.date >= CURRENT_DATE - INTERVAL '7 days'
  ) as weekly_completions,
  
  (
    SELECT COUNT(DISTINCT hl.date)
    FROM habit_logs hl
    WHERE hl.user_id = p.id 
    AND hl.completed = true
    AND hl.date >= CURRENT_DATE - INTERVAL '7 days'
  ) as weekly_active_days,
  
  -- Monthly stats (last 30 days)
  (
    SELECT COUNT(*)
    FROM habit_logs hl
    WHERE hl.user_id = p.id 
    AND hl.completed = true
    AND hl.date >= CURRENT_DATE - INTERVAL '30 days'
  ) as monthly_completions,
  
  (
    SELECT COUNT(DISTINCT hl.date)
    FROM habit_logs hl
    WHERE hl.user_id = p.id 
    AND hl.completed = true
    AND hl.date >= CURRENT_DATE - INTERVAL '30 days'
  ) as monthly_active_days,
  
  -- All time stats
  (
    SELECT COUNT(*)
    FROM habit_logs hl
    WHERE hl.user_id = p.id 
    AND hl.completed = true
  ) as total_completions,
  
  (
    SELECT COUNT(DISTINCT hl.date)
    FROM habit_logs hl
    WHERE hl.user_id = p.id 
    AND hl.completed = true
  ) as total_active_days,
  
  -- Achievement count
  (
    SELECT COUNT(*)
    FROM user_achievements ua
    WHERE ua.user_id = p.id
  ) as achievement_count

FROM profiles p
LEFT JOIN user_rewards ur ON ur.user_id = p.id
WHERE p.show_on_leaderboard = true;

COMMENT ON VIEW public_profiles IS 'Public user profiles with aggregated stats for leaderboard';

-- Grant access to authenticated users
GRANT SELECT ON public_profiles TO authenticated;

-- ============================================
-- INITIALIZATION
-- ============================================

-- Create user_rewards for existing profiles
INSERT INTO user_rewards (user_id, coins, xp, level)
SELECT id, 0, 0, 1 FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_rewards WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify all tables created
SELECT 
  'Tables created:' as info,
  COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Verify all indexes created
SELECT 
  'Indexes created:' as info,
  COUNT(*) as count 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Verify all triggers created
SELECT 
  'Triggers created:' as info,
  COUNT(*) as count 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- ============================================
-- SCHEMA VERSION
-- ============================================

COMMENT ON SCHEMA public IS 'DevX Daily OS Database Schema v1.0 - Created: 2024-12-13';

-- ============================================
-- END OF MASTER SCHEMA
-- ============================================
