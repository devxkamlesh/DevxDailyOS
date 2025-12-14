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
  
  -- Time Tracking
  completed_at timestamptz,
  duration_minutes int,
  time_of_day text,
  focus_score int CHECK (focus_score >= 1 AND focus_score <= 10),
  interruptions int DEFAULT 0,
  notes text,
  
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

-- Auto-set time_of_day based on completed_at timestamp
CREATE OR REPLACE FUNCTION set_time_of_day()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL THEN
    CASE 
      WHEN EXTRACT(HOUR FROM NEW.completed_at AT TIME ZONE 'UTC') BETWEEN 5 AND 7 THEN
        NEW.time_of_day = 'early_morning';
      WHEN EXTRACT(HOUR FROM NEW.completed_at AT TIME ZONE 'UTC') BETWEEN 8 AND 11 THEN
        NEW.time_of_day = 'morning';
      WHEN EXTRACT(HOUR FROM NEW.completed_at AT TIME ZONE 'UTC') BETWEEN 12 AND 16 THEN
        NEW.time_of_day = 'afternoon';
      WHEN EXTRACT(HOUR FROM NEW.completed_at AT TIME ZONE 'UTC') BETWEEN 17 AND 20 THEN
        NEW.time_of_day = 'evening';
      WHEN EXTRACT(HOUR FROM NEW.completed_at AT TIME ZONE 'UTC') BETWEEN 21 AND 23 THEN
        NEW.time_of_day = 'night';
      ELSE
        NEW.time_of_day = 'late_night';
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_time_of_day IS 'Automatically categorize time of day based on completed_at timestamp';

-- ============================================
-- TRIGGERS
-- ============================================

-- User Rewards: Auto-update level
CREATE TRIGGER trigger_update_level_on_xp
  BEFORE INSERT OR UPDATE OF xp ON user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_level_on_xp_change();

-- Habit Logs: Auto-set time_of_day
CREATE TRIGGER trigger_set_time_of_day
  BEFORE INSERT OR UPDATE ON habit_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_time_of_day();

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
-- Time tracking indexes for Advanced Analytics
CREATE INDEX idx_habit_logs_completed_at ON habit_logs(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_habit_logs_time_of_day ON habit_logs(time_of_day) WHERE time_of_day IS NOT NULL;
CREATE INDEX idx_habit_logs_duration ON habit_logs(duration_minutes) WHERE duration_minutes IS NOT NULL;

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

COMMENT ON SCHEMA public IS 'Sadhana Database Schema v1.0 - Created: 2024-12-13';

-- ============================================
-- END OF MASTER SCHEMA
-- ============================================


-- ============================================
-- ADDITIONAL TABLES (Added from codebase analysis)
-- ============================================

-- ============================================
-- 16. HABIT FOCUS SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS habit_focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  
  -- Session Data
  date date NOT NULL,
  duration int NOT NULL DEFAULT 0,
  pomodoros_completed int DEFAULT 0,
  
  -- Timestamp
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE habit_focus_sessions IS 'Focus/pomodoro sessions for habits';

-- ============================================
-- 17. WEEKLY CHALLENGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Challenge Details
  title text NOT NULL,
  description text,
  target_type text NOT NULL CHECK (target_type IN ('completions', 'streak', 'perfect_days')),
  target_value int NOT NULL,
  coin_reward int DEFAULT 0,
  xp_reward int DEFAULT 0,
  is_active boolean DEFAULT true,
  week_start date,
  week_end date,
  
  -- Timestamp
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE weekly_challenges IS 'Weekly challenge definitions';

-- ============================================
-- 18. USER CHALLENGE PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES weekly_challenges(id) ON DELETE CASCADE,
  
  -- Progress Data
  progress int DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  claimed boolean DEFAULT false,
  
  -- Timestamp
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicates
  CONSTRAINT user_challenge_progress_unique UNIQUE (user_id, challenge_id)
);

COMMENT ON TABLE user_challenge_progress IS 'User progress on weekly challenges';

-- ============================================
-- 19. TIME BLOCKS TABLE (Calendar)
-- ============================================
CREATE TABLE IF NOT EXISTS time_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Block Details
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  title text NOT NULL,
  description text,
  color text DEFAULT '#3b82f6',
  completed boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE time_blocks IS 'Calendar time blocking for scheduling';

-- ============================================
-- 20. PAYMENT ORDERS TABLE (Razorpay)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Order Details
  amount int NOT NULL,
  currency text DEFAULT 'INR',
  receipt text,
  status text DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'refunded')),
  payment_id text,
  notes jsonb,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE payment_orders IS 'Razorpay payment orders';

-- ============================================
-- 21. PAYMENT TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text UNIQUE NOT NULL,
  order_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Transaction Details
  amount int NOT NULL,
  currency text DEFAULT 'INR',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  package_id text,
  coins_purchased int,
  bonus_coins int DEFAULT 0,
  
  -- Timestamp
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE payment_transactions IS 'Completed payment transactions';

-- ============================================
-- 22. SHOP PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shop_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Plan Details
  name text NOT NULL,
  description text,
  plan_type text NOT NULL CHECK (plan_type IN ('theme', 'avatar', 'feature')),
  coin_price int NOT NULL DEFAULT 0,
  icon text,
  is_active boolean DEFAULT true,
  
  -- Timestamp
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE shop_plans IS 'Shop items available for purchase with coins';

-- ============================================
-- ADDITIONAL INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_habit_focus_sessions_user_date ON habit_focus_sessions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date ON time_blocks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_active ON weekly_challenges(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user ON user_challenge_progress(user_id);

-- ============================================
-- ADDITIONAL RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE habit_focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_plans ENABLE ROW LEVEL SECURITY;

-- Habit Focus Sessions Policies
CREATE POLICY "Users can view own focus sessions" ON habit_focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own focus sessions" ON habit_focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own focus sessions" ON habit_focus_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own focus sessions" ON habit_focus_sessions FOR DELETE USING (auth.uid() = user_id);

-- Weekly Challenges Policies (public read for active)
CREATE POLICY "Anyone can view active challenges" ON weekly_challenges FOR SELECT USING (is_active = true);

-- User Challenge Progress Policies
CREATE POLICY "Users can view own challenge progress" ON user_challenge_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own challenge progress" ON user_challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenge progress" ON user_challenge_progress FOR UPDATE USING (auth.uid() = user_id);

-- Time Blocks Policies
CREATE POLICY "Users can view own time blocks" ON time_blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own time blocks" ON time_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own time blocks" ON time_blocks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own time blocks" ON time_blocks FOR DELETE USING (auth.uid() = user_id);

-- Payment Orders Policies
CREATE POLICY "Users can view own payment orders" ON payment_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payment orders" ON payment_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment orders" ON payment_orders FOR UPDATE USING (auth.uid() = user_id);

-- Payment Transactions Policies
CREATE POLICY "Users can view own payment transactions" ON payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payment transactions" ON payment_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shop Plans Policies (public read for active)
CREATE POLICY "Anyone can view active shop plans" ON shop_plans FOR SELECT USING (is_active = true);

-- ============================================
-- ADDITIONAL TRIGGERS
-- ============================================

-- Time Blocks: Auto-update timestamp
CREATE TRIGGER trigger_time_blocks_updated_at
  BEFORE UPDATE ON time_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Payment Orders: Auto-update timestamp
CREATE TRIGGER trigger_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to add coins to user (used by payment verification)
CREATE OR REPLACE FUNCTION add_user_coins(p_user_id uuid, p_coins int)
RETURNS void AS $$
BEGIN
  INSERT INTO user_rewards (user_id, coins)
  VALUES (p_user_id, p_coins)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    coins = user_rewards.coins + p_coins,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_user_coins IS 'Add coins to user account (used by payment system)';

-- Function to process shop purchase
CREATE OR REPLACE FUNCTION process_purchase(
  p_user_id uuid,
  p_plan_id uuid,
  p_coupon_id uuid,
  p_original_price int,
  p_coupon_discount int,
  p_final_price int,
  p_coins_spent int
)
RETURNS void AS $$
BEGIN
  UPDATE user_rewards 
  SET coins = coins - p_coins_spent,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_purchase IS 'Process shop purchase and deduct coins';

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Sample Weekly Challenges
INSERT INTO weekly_challenges (title, description, target_type, target_value, coin_reward, xp_reward, is_active)
VALUES 
  ('Habit Starter', 'Complete 10 habits this week', 'completions', 10, 25, 50, true),
  ('Consistency King', 'Maintain a 5 day streak', 'streak', 5, 40, 75, true),
  ('Perfect Week', 'Have 3 perfect days this week', 'perfect_days', 3, 50, 100, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- GRANT SERVICE ROLE PERMISSIONS
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================
-- UPDATED SCHEMA VERSION
-- ============================================
COMMENT ON SCHEMA public IS 'Sadhana Database Schema v1.1 - Updated: 2024-12-13 - Added payment, shop, time blocks, focus sessions';


-- ============================================
-- 23. COUPONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Coupon Details
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Discount Configuration
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INT NOT NULL CHECK (discount_value > 0),
  min_purchase INT DEFAULT 0,
  
  -- Usage Limits
  max_uses INT DEFAULT 0, -- 0 = unlimited
  used_count INT DEFAULT 0,
  
  -- Validity
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE coupons IS 'Discount coupons for shop purchases';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Coupon Policies
CREATE POLICY "Anyone can read active coupons" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can read all coupons" ON coupons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert coupons" ON coupons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update coupons" ON coupons FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete coupons" ON coupons FOR DELETE TO authenticated USING (true);

-- Trigger
CREATE TRIGGER trigger_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 24. COIN PACKAGES TABLE (Real Money Purchase)
-- ============================================
CREATE TABLE IF NOT EXISTS coin_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Package Details
  name TEXT NOT NULL,
  description TEXT,
  
  -- Coin Configuration
  coins INT NOT NULL CHECK (coins > 0),
  bonus_coins INT DEFAULT 0,
  
  -- Pricing (in INR paise - 100 paise = 1 INR)
  price_inr INT NOT NULL CHECK (price_inr > 0),
  
  -- Display
  is_popular BOOLEAN DEFAULT false,
  badge TEXT,
  sort_order INT DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE coin_packages IS 'Coin packages for real money purchase via Razorpay';
COMMENT ON COLUMN coin_packages.price_inr IS 'Price in paise (100 = ₹1)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coin_packages_active ON coin_packages(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coin_packages_sort ON coin_packages(sort_order);

-- RLS
ALTER TABLE coin_packages ENABLE ROW LEVEL SECURITY;

-- Coin Packages Policies
CREATE POLICY "Anyone can read active coin packages" ON coin_packages FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can read all packages" ON coin_packages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert packages" ON coin_packages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update packages" ON coin_packages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete packages" ON coin_packages FOR DELETE TO authenticated USING (true);

-- Trigger
CREATE TRIGGER trigger_coin_packages_updated_at
  BEFORE UPDATE ON coin_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SHOP PLANS - Additional Policies for Admin
-- ============================================
CREATE POLICY "Authenticated can read all shop plans" ON shop_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert shop plans" ON shop_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update shop plans" ON shop_plans FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete shop plans" ON shop_plans FOR DELETE TO authenticated USING (true);

-- ============================================
-- DEFAULT COIN PACKAGES
-- ============================================
INSERT INTO coin_packages (name, description, coins, bonus_coins, price_inr, is_popular, badge, sort_order) VALUES
  ('Starter Pack', 'Perfect for beginners', 100, 0, 4900, false, NULL, 1),
  ('Popular Pack', 'Most purchased pack', 250, 50, 9900, true, 'Most Popular', 2),
  ('Value Pack', 'Great value for money', 500, 150, 19900, false, 'Best Value', 3),
  ('Mega Pack', 'For serious users', 1000, 400, 39900, false, NULL, 4)
ON CONFLICT DO NOTHING;

-- ============================================
-- PREDEFINED SHOP ITEMS (Avatars & Themes)
-- ============================================

-- Predefined Avatars (icon is used as identifier in app)
INSERT INTO shop_plans (name, description, plan_type, coin_price, icon, is_active) VALUES
  ('Default User', 'Classic user avatar', 'avatar', 0, 'user', true),
  ('Crown', 'Royal crown avatar', 'avatar', 100, 'crown', true),
  ('Star', 'Shining star avatar', 'avatar', 150, 'star', true),
  ('Rocket', 'Blast off with this avatar', 'avatar', 200, 'rocket', true),
  ('Flame', 'Hot streak avatar', 'avatar', 250, 'flame', true),
  ('Diamond', 'Premium diamond avatar', 'avatar', 500, 'gem', true),
  ('Trophy', 'Champion avatar', 'avatar', 300, 'trophy', true),
  ('Lightning', 'Electric avatar', 'avatar', 200, 'zap', true),
  ('Heart', 'Lovely heart avatar', 'avatar', 150, 'heart', true),
  ('Shield', 'Defender avatar', 'avatar', 250, 'shield', true),
  ('Target', 'Goal-focused avatar', 'avatar', 200, 'target', true),
  ('Coffee', 'Caffeine lover avatar', 'avatar', 100, 'coffee', true),
  ('Music', 'Music lover avatar', 'avatar', 150, 'music', true),
  ('Gamepad', 'Gamer avatar', 'avatar', 200, 'gamepad-2', true),
  ('Code', 'Developer avatar', 'avatar', 250, 'code', true),
  ('Brain', 'Smart thinker avatar', 'avatar', 300, 'brain', true),
  -- Premium Golden Avatars (double price)
  ('Golden Crown', 'Premium royal crown', 'avatar', 1200, 'gold-crown', true),
  ('Golden Star', 'Premium shining star', 'avatar', 300, 'gold-star', true),
  ('Golden Trophy', 'Premium champion', 'avatar', 600, 'gold-trophy', true),
  ('Golden Diamond', 'Ultimate premium', 'avatar', 1000, 'gold-gem', true),
  ('Golden Flame', 'Premium hot streak', 'avatar', 500, 'gold-flame', true),
  ('Golden Shield', 'Premium defender', 'avatar', 500, 'gold-shield', true)
ON CONFLICT DO NOTHING;

-- Predefined Themes (icon is used as identifier in app)
INSERT INTO shop_plans (name, description, plan_type, coin_price, icon, is_active) VALUES
  ('Default', 'Classic dark theme', 'theme', 0, 'default', true),
  ('Ocean Blue', 'Cool ocean vibes', 'theme', 200, 'ocean', true),
  ('Sunset', 'Warm sunset colors', 'theme', 250, 'sunset', true),
  ('Forest', 'Natural green theme', 'theme', 200, 'forest', true),
  ('Royal Purple', 'Elegant purple theme', 'theme', 300, 'purple', true),
  ('Golden', 'Luxurious gold theme', 'theme', 400, 'gold', true),
  ('Rose Gold', 'Beautiful rose gold', 'theme', 350, 'rose', true),
  ('Midnight', 'Deep midnight blue', 'theme', 250, 'midnight', true)
ON CONFLICT DO NOTHING;

-- Predefined Features
INSERT INTO shop_plans (name, description, plan_type, coin_price, icon, is_active) VALUES
  ('Custom Sounds', 'Custom notification sounds', 'feature', 500, 'volume-2', true),
  ('Advanced Stats', 'Detailed analytics', 'feature', 750, 'bar-chart-2', true),
  ('Priority Support', 'Faster support', 'feature', 1000, 'headphones', true),
  ('Smart Reminders', 'AI-powered reminders', 'feature', 600, 'bell', true),
  ('Focus Mode Pro', 'Extended focus tools', 'feature', 800, 'wand', true),
  ('Unlimited History', 'Access all past data', 'feature', 1200, 'clock', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- UPDATED SCHEMA VERSION
-- ============================================
COMMENT ON SCHEMA public IS 'Sadhana Database Schema v1.2 - Updated: 2024-12-13 - Added coupons, coin packages, predefined shop items';


-- ============================================
-- 25. SYSTEM SETTINGS TABLE (Admin Config)
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- General Settings
  maintenance_mode BOOLEAN DEFAULT false,
  registration_enabled BOOLEAN DEFAULT true,
  leaderboard_enabled BOOLEAN DEFAULT true,
  shop_enabled BOOLEAN DEFAULT true,
  
  -- Limits
  max_habits_per_user INT DEFAULT 30,
  max_active_habits INT DEFAULT 30,
  daily_coin_limit INT DEFAULT 50,
  daily_xp_limit INT DEFAULT 500,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE system_settings IS 'Global system configuration managed by admins';

-- RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (for app to check maintenance mode, etc.)
CREATE POLICY "Anyone can read system settings" ON system_settings 
  FOR SELECT USING (true);

-- Only authenticated users can modify (admin check at app level)
CREATE POLICY "Authenticated can update system settings" ON system_settings 
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can insert system settings" ON system_settings 
  FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER trigger_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO system_settings (
  maintenance_mode, registration_enabled, leaderboard_enabled, shop_enabled,
  max_habits_per_user, max_active_habits, daily_coin_limit, daily_xp_limit
) VALUES (
  false, true, true, true, 30, 30, 50, 500
) ON CONFLICT DO NOTHING;

-- ============================================
-- UPDATED SCHEMA VERSION
-- ============================================
COMMENT ON SCHEMA public IS 'Sadhana Database Schema v1.3 - Updated: 2024-12-13 - Added system_settings table';

-- ============================================
-- CHART DATA ENGINE TABLES
-- ============================================
-- Unified Chart Data Engine Database Schema
-- Supports all chart types with flexible metric storage

-- Main metrics table - unified structure for all chart data
CREATE TABLE IF NOT EXISTS chart_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time dimension (required)
  recorded_at TIMESTAMPTZ NOT NULL,
  date DATE, -- Will be set by trigger
  
  -- Metric identification
  metric TEXT NOT NULL, -- e.g., 'completions', 'revenue', 'users'
  value NUMERIC NOT NULL,
  
  -- Grouping and categorization
  group_key TEXT, -- e.g., 'morning_habits', 'financial_data'
  category TEXT, -- e.g., 'habit', 'business', 'health'
  
  -- Metadata (flexible JSON for chart-specific data)
  meta JSONB DEFAULT '{}',
  
  -- User context (for multi-tenant)
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE(recorded_at, metric, group_key, user_id)
);

-- Trigger to auto-set date from recorded_at
CREATE OR REPLACE FUNCTION set_chart_metric_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date := NEW.recorded_at::date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_chart_metrics_set_date
  BEFORE INSERT OR UPDATE ON chart_metrics
  FOR EACH ROW
  EXECUTE FUNCTION set_chart_metric_date();

-- Chart configurations table
CREATE TABLE IF NOT EXISTS chart_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Chart identification
  chart_id TEXT NOT NULL,
  chart_type TEXT NOT NULL, -- 'simple_area', 'fill_by_value', etc.
  
  -- Configuration JSON
  config JSONB NOT NULL,
  
  -- Ownership
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT false, -- Global charts visible to all users
  
  -- Metadata
  title TEXT,
  description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE(chart_id, user_id)
);

COMMENT ON TABLE chart_metrics IS 'Unified metrics storage for all chart types';
COMMENT ON TABLE chart_configurations IS 'Chart configuration and settings storage';

-- ============================================
-- SOCIAL FEATURES TABLES
-- ============================================

-- Weather tracking
CREATE TABLE IF NOT EXISTS daily_weather (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  condition TEXT, -- sunny, rainy, cloudy, etc.
  temperature INTEGER,
  humidity INTEGER,
  api_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Friend connections
CREATE TABLE IF NOT EXISTS user_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, accepted, blocked
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Social challenges
CREATE TABLE IF NOT EXISTS social_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  habit_type TEXT,
  duration_days INTEGER DEFAULT 7,
  start_date DATE,
  end_date DATE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Challenge participants
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES social_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  completed_days INTEGER DEFAULT 0,
  UNIQUE(challenge_id, user_id)
);

-- Detailed time tracking table
CREATE TABLE IF NOT EXISTS habit_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_log_id UUID REFERENCES habit_logs(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  interruptions INTEGER DEFAULT 0,
  focus_score INTEGER CHECK (focus_score >= 1 AND focus_score <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE daily_weather IS 'Daily weather data for correlation analysis';
COMMENT ON TABLE user_friends IS 'User friend connections for social features';
COMMENT ON TABLE social_challenges IS 'Community challenges and competitions';
COMMENT ON TABLE challenge_participants IS 'User participation in social challenges';
COMMENT ON TABLE habit_time_logs IS 'Detailed time tracking for habit sessions';

-- ============================================
-- CHART ENGINE INDEXES
-- ============================================

-- Indexes for chart metrics performance
CREATE INDEX IF NOT EXISTS idx_chart_metrics_recorded_at ON chart_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_chart_metrics_date ON chart_metrics(date);
CREATE INDEX IF NOT EXISTS idx_chart_metrics_metric ON chart_metrics(metric);
CREATE INDEX IF NOT EXISTS idx_chart_metrics_group ON chart_metrics(group_key);
CREATE INDEX IF NOT EXISTS idx_chart_metrics_user ON chart_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_chart_metrics_category ON chart_metrics(category);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_chart_metrics_user_date_metric ON chart_metrics(user_id, date, metric);
CREATE INDEX IF NOT EXISTS idx_chart_metrics_group_recorded_at ON chart_metrics(group_key, recorded_at);

-- Indexes for chart configurations
CREATE INDEX IF NOT EXISTS idx_chart_configs_chart_id ON chart_configurations(chart_id);
CREATE INDEX IF NOT EXISTS idx_chart_configs_user ON chart_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_chart_configs_type ON chart_configurations(chart_type);
CREATE INDEX IF NOT EXISTS idx_chart_configs_global ON chart_configurations(is_global) WHERE is_global = true;

-- Social features indexes
CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON user_friends(status);
CREATE INDEX IF NOT EXISTS idx_social_challenges_creator ON social_challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_social_challenges_public ON social_challenges(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_time_logs_habit_log ON habit_time_logs(habit_log_id);
CREATE INDEX IF NOT EXISTS idx_daily_weather_date ON daily_weather(date);

-- ============================================
-- CHART ENGINE RLS POLICIES
-- ============================================

ALTER TABLE chart_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_configurations ENABLE ROW LEVEL SECURITY;

-- Chart Metrics Policies
CREATE POLICY "Users can read their own chart metrics" ON chart_metrics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own chart metrics" ON chart_metrics
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chart metrics" ON chart_metrics
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own chart metrics" ON chart_metrics
  FOR DELETE USING (user_id = auth.uid());

-- Chart Configurations Policies
CREATE POLICY "Users can read their own chart configs" ON chart_configurations
  FOR SELECT USING (user_id = auth.uid() OR is_global = true);

CREATE POLICY "Users can insert their own chart configs" ON chart_configurations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chart configs" ON chart_configurations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own chart configs" ON chart_configurations
  FOR DELETE USING (user_id = auth.uid());

-- Social Features RLS Policies
ALTER TABLE user_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_weather ENABLE ROW LEVEL SECURITY;

-- User Friends Policies
CREATE POLICY "Users can read their own friends" ON user_friends
  FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can manage their own friend requests" ON user_friends
  FOR ALL USING (user_id = auth.uid());

-- Social Challenges Policies
CREATE POLICY "Users can read public challenges" ON social_challenges
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create challenges" ON social_challenges
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own challenges" ON social_challenges
  FOR UPDATE USING (creator_id = auth.uid());

-- Challenge Participants Policies
CREATE POLICY "Users can read challenge participants" ON challenge_participants
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM social_challenges sc 
    WHERE sc.id = challenge_id AND (sc.is_public = true OR sc.creator_id = auth.uid())
  ));

CREATE POLICY "Users can join challenges" ON challenge_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON challenge_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Habit Time Logs Policies
CREATE POLICY "Users can read their own time logs" ON habit_time_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM habit_logs hl 
    WHERE hl.id = habit_log_id AND hl.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own time logs" ON habit_time_logs
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM habit_logs hl 
    WHERE hl.id = habit_log_id AND hl.user_id = auth.uid()
  ));

-- Daily Weather Policies (public read access)
CREATE POLICY "Anyone can read weather data" ON daily_weather
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- CHART ENGINE FUNCTIONS
-- ============================================

-- Functions for data aggregation
CREATE OR REPLACE FUNCTION get_chart_data(
  p_user_id UUID,
  p_metrics TEXT[],
  p_group_key TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  recorded_at TIMESTAMPTZ,
  date DATE,
  metric TEXT,
  value NUMERIC,
  meta JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.recorded_at,
    cm.date,
    cm.metric,
    cm.value,
    cm.meta
  FROM chart_metrics cm
  WHERE 
    cm.user_id = p_user_id
    AND (p_metrics IS NULL OR cm.metric = ANY(p_metrics))
    AND (p_group_key IS NULL OR cm.group_key = p_group_key)
    AND (p_start_date IS NULL OR cm.date >= p_start_date)
    AND (p_end_date IS NULL OR cm.date <= p_end_date)
  ORDER BY cm.recorded_at, cm.metric;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to insert/update chart metrics
CREATE OR REPLACE FUNCTION upsert_chart_metric(
  p_user_id UUID,
  p_recorded_at TIMESTAMPTZ,
  p_metric TEXT,
  p_value NUMERIC,
  p_group_key TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_meta JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  result_id UUID;
BEGIN
  INSERT INTO chart_metrics (
    user_id, recorded_at, metric, value, group_key, category, meta
  ) VALUES (
    p_user_id, p_recorded_at, p_metric, p_value, p_group_key, p_category, p_meta
  )
  ON CONFLICT (recorded_at, metric, group_key, user_id)
  DO UPDATE SET
    value = EXCLUDED.value,
    category = EXCLUDED.category,
    meta = EXCLUDED.meta,
    updated_at = now()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_chart_data IS 'Retrieve chart data with flexible filtering';
COMMENT ON FUNCTION upsert_chart_metric IS 'Insert or update chart metrics with conflict resolution';

-- ============================================
-- CHART ENGINE TRIGGERS
-- ============================================

CREATE TRIGGER trigger_chart_metrics_updated_at
  BEFORE UPDATE ON chart_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_chart_configurations_updated_at
  BEFORE UPDATE ON chart_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FINAL SCHEMA VERSION UPDATE
-- ============================================
COMMENT ON SCHEMA public IS 'Sadhana Database Schema v2.0 - Updated: 2024-12-13 - Added Social Features, User Tracking';

-- ============================================
-- END OF CONSOLIDATED DATABASE SCHEMA
-- ============================================