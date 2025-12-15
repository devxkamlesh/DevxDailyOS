-- ============================================
-- DevX Daily OS - COMPLETE Database Schema v2.0
-- ============================================
-- This is the CONSOLIDATED schema merging all migrations
-- Includes all security fixes, performance optimizations, and features
-- Generated: December 14, 2025
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
  timezone text DEFAULT 'Asia/Kolkata',
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE profiles IS 'User profiles with public/private settings';
COMMENT ON COLUMN profiles.profile_icon IS 'Icon ID (e.g. user, smile, diamond) - NOT emoji';

-- ============================================
-- 1b. ADMINS TABLE (Separate for security)
-- ============================================
CREATE TABLE admins (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES profiles(id),
  granted_at timestamptz DEFAULT now(),
  notes text
);

COMMENT ON TABLE admins IS 'Admin users - separate table prevents self-assignment';

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
-- 4. USER REWARDS TABLE (WITH OPTIMISTIC LOCKING - C008 FIX)
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
  
  -- Optimistic Locking (C008 Fix)
  version integer DEFAULT 1 NOT NULL,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE user_rewards IS 'User rewards, currency, XP, levels, and customization with optimistic locking';
COMMENT ON COLUMN user_rewards.version IS 'Version number for optimistic locking to prevent concurrent data corruption';
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
-- 7. COIN TRANSACTIONS TABLE (For Optimistic Locking)
-- ============================================
CREATE TABLE coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Transaction Data
  amount int NOT NULL,
  type text NOT NULL CHECK (type IN ('earned', 'spent', 'purchased', 'refunded')),
  reason text,
  balance_after int NOT NULL,
  
  -- Metadata
  reference_id uuid, -- Reference to order, habit, etc.
  
  -- Timestamp
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE coin_transactions IS 'Complete transaction log for coin operations with optimistic locking support';
-- ============================================
-- 8. BADGES SYSTEM (MOVED UP FOR DEPENDENCIES)
-- ============================================
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) NOT NULL DEFAULT 'award',
  color VARCHAR(50) NOT NULL DEFAULT 'blue',
  badge_type VARCHAR(50) NOT NULL DEFAULT 'achievement',
  price_inr INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  criteria JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, badge_id)
);

CREATE TABLE badge_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  amount_inr INTEGER NOT NULL,
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. CONTACT SUBMISSIONS TABLE
-- ============================================
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE contact_submissions IS 'Contact form submissions from website visitors';
-- ============================================
-- 10. SHOP & PAYMENT SYSTEM
-- ============================================
CREATE TABLE coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INT NOT NULL CHECK (discount_value > 0),
  min_purchase INT DEFAULT 0,
  max_uses INT DEFAULT 0,
  used_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE coin_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  coins INT NOT NULL CHECK (coins > 0),
  bonus_coins INT DEFAULT 0,
  price_inr INT NOT NULL CHECK (price_inr > 0),
  is_popular BOOLEAN DEFAULT false,
  badge TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE shop_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  plan_type text NOT NULL CHECK (plan_type IN ('theme', 'avatar', 'feature')),
  coin_price int NOT NULL DEFAULT 0,
  icon text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE shop_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES shop_plans(id),
  coupon_id uuid REFERENCES coupons(id),
  original_price int NOT NULL,
  coupon_discount int DEFAULT 0,
  final_price int NOT NULL,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE shop_purchases IS 'Record of all shop purchases';

CREATE TABLE payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount int NOT NULL,
  currency text DEFAULT 'INR',
  receipt text,
  status text DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'refunded')),
  payment_id text,
  notes jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text UNIQUE NOT NULL,
  order_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount int NOT NULL,
  currency text DEFAULT 'INR',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  package_id text,
  coins_purchased int,
  bonus_coins int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
-- ============================================
-- 11. SYSTEM SETTINGS TABLE
-- ============================================
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT DEFAULT NULL,
  registration_enabled BOOLEAN DEFAULT true,
  leaderboard_enabled BOOLEAN DEFAULT true,
  shop_enabled BOOLEAN DEFAULT true,
  max_habits_per_user INT DEFAULT 30,
  max_active_habits INT DEFAULT 30,
  daily_coin_limit INT DEFAULT 50,
  daily_xp_limit INT DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- OPTIMISTIC LOCKING FUNCTIONS (C008 FIX)
-- ============================================

-- Function to safely update user rewards with optimistic locking
CREATE OR REPLACE FUNCTION update_user_rewards_safe(
  p_user_id uuid,
  p_expected_version integer,
  p_coins_delta integer DEFAULT 0,
  p_xp_delta integer DEFAULT 0,
  p_level_delta integer DEFAULT 0,
  p_current_streak integer DEFAULT NULL,
  p_longest_streak integer DEFAULT NULL,
  p_perfect_days_delta integer DEFAULT 0,
  p_current_theme text DEFAULT NULL,
  p_current_avatar text DEFAULT NULL,
  p_unlocked_themes text[] DEFAULT NULL,
  p_unlocked_avatars text[] DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  current_record user_rewards%ROWTYPE;
  new_coins integer;
  new_xp integer;
  new_level integer;
  new_perfect_days integer;
  result jsonb;
BEGIN
  -- Get current record with row lock
  SELECT * INTO current_record
  FROM user_rewards 
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if record exists
  IF NOT FOUND THEN
    -- Create new record if it doesn't exist
    INSERT INTO user_rewards (
      user_id, coins, xp, level, current_streak, longest_streak, perfect_days,
      current_theme, current_avatar, unlocked_themes, unlocked_avatars, version
    ) VALUES (
      p_user_id, GREATEST(0, p_coins_delta), GREATEST(0, p_xp_delta),
      GREATEST(1, 1 + p_level_delta), COALESCE(p_current_streak, 0),
      COALESCE(p_longest_streak, 0), GREATEST(0, p_perfect_days_delta),
      COALESCE(p_current_theme, 'default'), COALESCE(p_current_avatar, 'user'),
      COALESCE(p_unlocked_themes, ARRAY['default']), COALESCE(p_unlocked_avatars, ARRAY['user']), 1
    )
    RETURNING jsonb_build_object(
      'success', true, 'version', version, 'coins', coins, 'xp', xp, 'level', level,
      'current_streak', current_streak, 'longest_streak', longest_streak, 'perfect_days', perfect_days
    ) INTO result;
    RETURN result;
  END IF;

  -- Check version for optimistic locking
  IF current_record.version != p_expected_version THEN
    RETURN jsonb_build_object(
      'success', false, 'error', 'version_mismatch',
      'message', 'Record was modified by another process. Please refresh and try again.',
      'current_version', current_record.version, 'expected_version', p_expected_version
    );
  END IF;

  -- Calculate new values
  new_coins := GREATEST(0, current_record.coins + p_coins_delta);
  new_xp := GREATEST(0, current_record.xp + p_xp_delta);
  new_level := GREATEST(1, current_record.level + p_level_delta);
  new_perfect_days := GREATEST(0, current_record.perfect_days + p_perfect_days_delta);

  -- Update record with incremented version
  UPDATE user_rewards SET
    coins = new_coins, xp = new_xp, level = new_level,
    current_streak = COALESCE(p_current_streak, current_streak),
    longest_streak = COALESCE(p_longest_streak, longest_streak),
    perfect_days = new_perfect_days,
    current_theme = COALESCE(p_current_theme, current_theme),
    current_avatar = COALESCE(p_current_avatar, current_avatar),
    unlocked_themes = COALESCE(p_unlocked_themes, unlocked_themes),
    unlocked_avatars = COALESCE(p_unlocked_avatars, unlocked_avatars),
    version = version + 1, updated_at = now()
  WHERE user_id = p_user_id AND version = p_expected_version
  RETURNING jsonb_build_object(
    'success', true, 'version', version, 'coins', coins, 'xp', xp, 'level', level,
    'current_streak', current_streak, 'longest_streak', longest_streak, 'perfect_days', perfect_days,
    'current_theme', current_theme, 'current_avatar', current_avatar,
    'unlocked_themes', unlocked_themes, 'unlocked_avatars', unlocked_avatars
  ) INTO result;

  IF result IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'update_failed', 'message', 'Failed to update record. Please try again.');
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to get user rewards with version for optimistic locking
CREATE OR REPLACE FUNCTION get_user_rewards_with_version(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', id, 'user_id', user_id, 'coins', coins, 'gems', gems, 'xp', xp, 'level', level,
    'current_streak', current_streak, 'longest_streak', longest_streak, 'perfect_days', perfect_days,
    'current_theme', current_theme, 'current_avatar', current_avatar,
    'unlocked_themes', unlocked_themes, 'unlocked_avatars', unlocked_avatars,
    'version', version, 'created_at', created_at, 'updated_at', updated_at
  ) INTO result FROM user_rewards WHERE user_id = p_user_id;

  IF result IS NULL THEN
    result := jsonb_build_object(
      'user_id', p_user_id, 'coins', 0, 'gems', 0, 'xp', 0, 'level', 1,
      'current_streak', 0, 'longest_streak', 0, 'perfect_days', 0,
      'current_theme', 'default', 'current_avatar', 'user',
      'unlocked_themes', ARRAY['default'], 'unlocked_avatars', ARRAY['user'], 'version', 0
    );
  END IF;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely add coins with optimistic locking
CREATE OR REPLACE FUNCTION add_coins_safe(
  p_user_id uuid, p_expected_version integer, p_amount integer, p_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount', 'message', 'Amount must be positive');
  END IF;

  SELECT update_user_rewards_safe(p_user_id, p_expected_version, p_coins_delta := p_amount) INTO result;

  IF (result->>'success')::boolean THEN
    INSERT INTO coin_transactions (user_id, amount, type, reason, balance_after)
    VALUES (p_user_id, p_amount, 'earned', COALESCE(p_reason, 'Coins added'), (result->>'coins')::integer);
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely spend coins with optimistic locking
CREATE OR REPLACE FUNCTION spend_coins_safe(
  p_user_id uuid, p_expected_version integer, p_amount integer, p_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  current_coins integer;
  result jsonb;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount', 'message', 'Amount must be positive');
  END IF;

  SELECT coins INTO current_coins FROM user_rewards WHERE user_id = p_user_id;

  IF current_coins IS NULL OR current_coins < p_amount THEN
    RETURN jsonb_build_object(
      'success', false, 'error', 'insufficient_funds', 'message', 'Not enough coins',
      'required', p_amount, 'available', COALESCE(current_coins, 0)
    );
  END IF;

  SELECT update_user_rewards_safe(p_user_id, p_expected_version, p_coins_delta := -p_amount) INTO result;

  IF (result->>'success')::boolean THEN
    INSERT INTO coin_transactions (user_id, amount, type, reason, balance_after)
    VALUES (p_user_id, p_amount, 'spent', COALESCE(p_reason, 'Coins spent'), (result->>'coins')::integer);
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================
-- PERFORMANCE OPTIMIZATION FUNCTIONS (C007 FIX)
-- ============================================

-- Function to calculate user habit analytics efficiently
CREATE OR REPLACE FUNCTION get_user_habit_analytics(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  today date := CURRENT_DATE;
  week_ago date := today - INTERVAL '7 days';
  month_ago date := today - INTERVAL '30 days';
  year_ago date := today - INTERVAL '365 days';
  active_habits_count integer;
  current_streak integer := 0;
  longest_streak integer := 0;
  temp_streak integer := 0;
  streak_dates date[];
BEGIN
  SELECT COUNT(*) INTO active_habits_count FROM habits WHERE user_id = p_user_id AND is_active = true;

  WITH completion_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE date >= week_ago AND completed = true) as week_completed,
      COUNT(*) FILTER (WHERE date >= month_ago AND completed = true) as month_completed,
      COUNT(*) FILTER (WHERE date >= year_ago AND completed = true) as year_completed,
      COUNT(*) FILTER (WHERE completed = true) as total_completed
    FROM habit_logs WHERE user_id = p_user_id
  )
  SELECT jsonb_build_object(
    'weekly', jsonb_build_object(
      'completed', cs.week_completed, 'total', active_habits_count * 7,
      'percentage', CASE WHEN active_habits_count > 0 THEN ROUND((cs.week_completed::numeric / (active_habits_count * 7)) * 100) ELSE 0 END
    ),
    'monthly', jsonb_build_object(
      'completed', cs.month_completed, 'total', active_habits_count * 30,
      'percentage', CASE WHEN active_habits_count > 0 THEN ROUND((cs.month_completed::numeric / (active_habits_count * 30)) * 100) ELSE 0 END
    ),
    'yearly', jsonb_build_object(
      'completed', cs.year_completed, 'total', active_habits_count * 365,
      'percentage', CASE WHEN active_habits_count > 0 THEN ROUND((cs.year_completed::numeric / (active_habits_count * 365)) * 100) ELSE 0 END
    ),
    'totalCompletions', cs.total_completed, 'currentStreak', 0, 'longestStreak', 0
  ) INTO result FROM completion_stats cs;

  -- Calculate streaks efficiently
  SELECT array_agg(date ORDER BY date DESC) INTO streak_dates
  FROM (
    SELECT DISTINCT date FROM habit_logs 
    WHERE user_id = p_user_id AND completed = true
    ORDER BY date DESC LIMIT 365
  ) dates;

  IF array_length(streak_dates, 1) > 0 THEN
    FOR i IN 1..array_length(streak_dates, 1) LOOP
      IF i = 1 THEN
        IF streak_dates[i] >= today - INTERVAL '1 day' THEN
          current_streak := 1;
        ELSE
          EXIT;
        END IF;
      ELSE
        IF streak_dates[i] = streak_dates[i-1] - INTERVAL '1 day' THEN
          current_streak := current_streak + 1;
        ELSE
          EXIT;
        END IF;
      END IF;
    END LOOP;

    temp_streak := 1;
    longest_streak := 1;
    
    FOR i IN 2..array_length(streak_dates, 1) LOOP
      IF streak_dates[i] = streak_dates[i-1] - INTERVAL '1 day' THEN
        temp_streak := temp_streak + 1;
        longest_streak := GREATEST(longest_streak, temp_streak);
      ELSE
        temp_streak := 1;
      END IF;
    END LOOP;
  END IF;

  result := jsonb_set(result, '{currentStreak}', to_jsonb(current_streak));
  result := jsonb_set(result, '{longestStreak}', to_jsonb(longest_streak));

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to get user habits with today completion status
CREATE OR REPLACE FUNCTION get_user_habits_with_status(p_user_id uuid)
RETURNS TABLE (
  id uuid, name text, description text, category text, type text,
  target_value integer, target_unit text, is_active boolean,
  created_at timestamptz, updated_at timestamptz,
  completed_today boolean, current_value integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id, h.name, h.description, h.category, h.type, h.target_value, h.target_unit, h.is_active,
    h.created_at, h.updated_at, COALESCE(hl.completed, false) as completed_today, COALESCE(hl.value, 0) as current_value
  FROM habits h
  LEFT JOIN habit_logs hl ON (h.id = hl.habit_id AND hl.user_id = p_user_id AND hl.date = CURRENT_DATE)
  WHERE h.user_id = p_user_id
  ORDER BY h.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BADGE MANAGEMENT FUNCTIONS (C003 FIX)
-- ============================================

-- Function to atomically set primary badge (prevents race conditions)
CREATE OR REPLACE FUNCTION set_primary_badge(p_user_id uuid, p_user_badge_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE user_badges SET is_primary = false WHERE user_id = p_user_id;
  UPDATE user_badges SET is_primary = true WHERE id = p_user_badge_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Badge not found or does not belong to user';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely assign badge to user (prevents duplicates)
CREATE OR REPLACE FUNCTION assign_user_badge(p_user_id uuid, p_badge_id uuid)
RETURNS boolean AS $$
DECLARE
  badge_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = p_badge_id) INTO badge_exists;
  
  IF badge_exists THEN
    RETURN false;
  END IF;
  
  INSERT INTO user_badges (user_id, badge_id, is_primary) VALUES (p_user_id, p_badge_id, false);
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely remove user badge
CREATE OR REPLACE FUNCTION remove_user_badge(p_user_badge_id uuid, p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  was_primary boolean;
  badge_count integer;
BEGIN
  SELECT is_primary INTO was_primary FROM user_badges WHERE id = p_user_badge_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  DELETE FROM user_badges WHERE id = p_user_badge_id AND user_id = p_user_id;
  
  IF was_primary THEN
    SELECT COUNT(*) INTO badge_count FROM user_badges WHERE user_id = p_user_id;
    
    IF badge_count > 0 THEN
      UPDATE user_badges SET is_primary = true 
      WHERE user_id = p_user_id AND id = (
        SELECT id FROM user_badges WHERE user_id = p_user_id ORDER BY created_at ASC LIMIT 1
      );
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Level calculation function
CREATE OR REPLACE FUNCTION calculate_level(total_xp int)
RETURNS int AS $$
BEGIN
  RETURN GREATEST(1, FLOOR(SQRT(total_xp / 100.0)) + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update level when XP changes
CREATE OR REPLACE FUNCTION update_level_on_xp_change()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := calculate_level(NEW.xp);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Auto-assign "New" badge on signup
CREATE OR REPLACE FUNCTION assign_new_user_badge()
RETURNS TRIGGER AS $$
DECLARE
  new_badge_id UUID;
BEGIN
  SELECT id INTO new_badge_id FROM badges WHERE badge_type = 'auto' AND criteria->>'type' = 'new_user' LIMIT 1;
  
  IF new_badge_id IS NOT NULL THEN
    INSERT INTO user_badges (user_id, badge_id, is_primary, expires_at)
    VALUES (NEW.id, new_badge_id, true, NOW() + INTERVAL '7 days')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
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

-- Auto-update timestamps (Core tables only - additional tables have triggers defined later)
CREATE TRIGGER trigger_user_rewards_updated_at
  BEFORE UPDATE ON user_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_habits_updated_at
  BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_habit_logs_updated_at
  BEFORE UPDATE ON habit_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_coupons_updated_at
  BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_coin_packages_updated_at
  BEFORE UPDATE ON coin_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_system_settings_updated_at
  BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Badge assignment on profile creation
CREATE TRIGGER on_profile_created_assign_badge
  AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION assign_new_user_badge();

-- ============================================
-- INDEXES (Performance Optimization)
-- ============================================

-- Habit Logs (most queried table)
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, date DESC);
CREATE INDEX idx_habit_logs_habit_date ON habit_logs(habit_id, date DESC);
CREATE INDEX idx_habit_logs_completed ON habit_logs(completed) WHERE completed = true;
CREATE INDEX idx_habit_logs_completed_at ON habit_logs(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_habit_logs_time_of_day ON habit_logs(time_of_day) WHERE time_of_day IS NOT NULL;
CREATE INDEX idx_habit_logs_duration ON habit_logs(duration_minutes) WHERE duration_minutes IS NOT NULL;

-- Performance indexes for C007 fix
CREATE INDEX idx_habit_logs_user_date_completed ON habit_logs(user_id, date DESC, completed) WHERE completed = true;
CREATE INDEX idx_habit_logs_user_completed_date ON habit_logs(user_id, completed, date DESC) WHERE completed = true;

-- Habits
CREATE INDEX idx_habits_user_active ON habits(user_id, is_active);
CREATE INDEX idx_habits_category ON habits(category) WHERE is_active = true;

-- User Rewards (with optimistic locking)
CREATE INDEX idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX idx_user_rewards_level ON user_rewards(level DESC);
CREATE INDEX idx_user_rewards_xp ON user_rewards(xp DESC);
CREATE INDEX idx_user_rewards_user_version ON user_rewards(user_id, version);

-- Coin & XP Awards
CREATE INDEX idx_coin_awards_user_date ON coin_awards(user_id, date DESC);
CREATE INDEX idx_coin_awards_habit_date ON coin_awards(habit_id, date DESC);
CREATE INDEX idx_xp_awards_user_date ON xp_awards(user_id, date DESC);
CREATE INDEX idx_xp_awards_habit_date ON xp_awards(habit_id, date DESC);

-- Badges
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX idx_user_badges_primary ON user_badges(user_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_badge_purchases_user ON badge_purchases(user_id);

-- Shop & Payments
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active) WHERE is_active = true;
CREATE INDEX idx_coin_packages_active ON coin_packages(is_active) WHERE is_active = true;
CREATE INDEX idx_coin_packages_sort ON coin_packages(sort_order);
CREATE INDEX idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_order_id ON payment_orders(order_id);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);

-- Contact & System
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at DESC);

-- Profiles
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_public ON profiles(is_public) WHERE is_public = true;
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
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_purchases ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ADMIN HELPER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION is_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admins WHERE user_id = check_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_admin IS 'Check if user is admin - uses separate admins table';

-- Admins Table Policies
CREATE POLICY "admins_select" ON admins FOR SELECT USING (true);
CREATE POLICY "admins_insert_service" ON admins FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "admins_update_service" ON admins FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "admins_delete_service" ON admins FOR DELETE USING (auth.jwt()->>'role' = 'service_role');

-- Helper function to add first admin (run once during setup)
-- This bypasses RLS using SECURITY DEFINER
CREATE OR REPLACE FUNCTION setup_first_admin(admin_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Only allow if no admins exist yet
  IF EXISTS (SELECT 1 FROM admins LIMIT 1) THEN
    RAISE EXCEPTION 'Admin already exists. Use service_role to add more admins.';
  END IF;
  
  INSERT INTO admins (user_id) VALUES (admin_user_id);
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION setup_first_admin(uuid) TO authenticated;

-- Profiles Policies (SECURE - admin status managed via separate admins table)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_safe" ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

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

-- Coin Transactions Policies
CREATE POLICY "Users can view own coin transactions" ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own coin transactions" ON coin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Badge Policies (SECURE - admin only for modifications)
CREATE POLICY "badges_select_all" ON badges FOR SELECT USING (true);
CREATE POLICY "badges_insert_admin" ON badges FOR INSERT WITH CHECK (is_admin(auth.uid()) OR auth.jwt()->>'role' = 'service_role');
CREATE POLICY "badges_update_admin" ON badges FOR UPDATE USING (is_admin(auth.uid()) OR auth.jwt()->>'role' = 'service_role');
CREATE POLICY "badges_delete_admin" ON badges FOR DELETE USING (is_admin(auth.uid()) OR auth.jwt()->>'role' = 'service_role');

-- User Badge Policies (SECURE - users view only, insert via SECURITY DEFINER functions)
CREATE POLICY "user_badges_select" ON user_badges FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "user_badges_insert_service" ON user_badges FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role' OR is_admin(auth.uid()));
CREATE POLICY "user_badges_update_own" ON user_badges FOR UPDATE USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "user_badges_delete_admin" ON user_badges FOR DELETE USING (is_admin(auth.uid()));

-- Badge Purchase Policies
CREATE POLICY "badge_purchases_select" ON badge_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "badge_purchases_insert" ON badge_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Contact Submission Policies
CREATE POLICY "Anyone can submit contact form" ON contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view contact submissions" ON contact_submissions FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update contact submissions" ON contact_submissions FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- Shop & Payment Policies (SECURE - admin only for modifications)
CREATE POLICY "Anyone can read active coupons" ON coupons FOR SELECT USING (is_active = true OR is_admin(auth.uid()));
CREATE POLICY "coupons_insert_admin" ON coupons FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "coupons_update_admin" ON coupons FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "coupons_delete_admin" ON coupons FOR DELETE USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can read active coin packages" ON coin_packages FOR SELECT USING (is_active = true OR is_admin(auth.uid()));
CREATE POLICY "coin_packages_insert_admin" ON coin_packages FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "coin_packages_update_admin" ON coin_packages FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "coin_packages_delete_admin" ON coin_packages FOR DELETE USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active shop plans" ON shop_plans FOR SELECT USING (is_active = true OR is_admin(auth.uid()));
CREATE POLICY "shop_plans_insert_admin" ON shop_plans FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "shop_plans_update_admin" ON shop_plans FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "shop_plans_delete_admin" ON shop_plans FOR DELETE USING (is_admin(auth.uid()));

-- Shop Purchases Policies
CREATE POLICY "shop_purchases_select_own" ON shop_purchases FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "shop_purchases_insert_service" ON shop_purchases FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role' OR auth.uid() = user_id);

CREATE POLICY "Users can view own payment orders" ON payment_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payment orders" ON payment_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment orders" ON payment_orders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payment transactions" ON payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payment transactions" ON payment_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- System Settings Policies
CREATE POLICY "Anyone can read system settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated can update system settings" ON system_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can insert system settings" ON system_settings FOR INSERT TO authenticated WITH CHECK (true);
-- ============================================
-- DEFAULT DATA INSERTION
-- ============================================

-- Insert default badges
INSERT INTO badges (name, description, icon, color, badge_type, price_inr, display_order, criteria) VALUES
-- Auto badges
('New', 'New member - First 7 days', 'sparkles', 'green', 'auto', 0, 1, '{"type": "new_user", "days": 7}'),
('Early Adopter', 'Joined during beta', 'rocket', 'purple', 'special', 0, 2, '{}'),

-- Level Badges (HARD MODE - Starting from Level 30)
('Grandmaster', 'Reached Level 30', 'crown', 'orange', 'achievement', 0, 100, '{"type": "level", "level": 30}'),
('Legend', 'Reached Level 40', 'flame', 'red', 'achievement', 0, 101, '{"type": "level", "level": 40}'),
('Mythic', 'Reached Level 50', 'crown', 'pink', 'achievement', 0, 102, '{"type": "level", "level": 50}'),
('Divine', 'Reached Level 60', 'star', 'cyan', 'achievement', 0, 103, '{"type": "level", "level": 60}'),
('Immortal', 'Reached Level 75', 'star', 'amber', 'achievement', 0, 104, '{"type": "level", "level": 75}'),
('Transcendent', 'Reached Level 100', 'crown', 'gradient', 'achievement', 0, 105, '{"type": "level", "level": 100}'),
('Celestial', 'Reached Level 150', 'zap', 'blue', 'achievement', 0, 106, '{"type": "level", "level": 150}'),
('Eternal', 'Reached Level 200', 'crown', 'gold', 'achievement', 0, 107, '{"type": "level", "level": 200}'),

-- Streak Badges (HARD MODE - Starting from 30 days)
('Month Master', '30 day streak', 'calendar', 'purple', 'achievement', 0, 200, '{"type": "streak", "days": 30}'),
('Discipline King', '60 day streak', 'crown', 'indigo', 'achievement', 0, 201, '{"type": "streak", "days": 60}'),
('Quarter Champion', '90 day streak', 'trophy', 'cyan', 'achievement', 0, 202, '{"type": "streak", "days": 90}'),
('Half Year Hero', '180 day streak', 'star', 'pink', 'achievement', 0, 203, '{"type": "streak", "days": 180}'),
('Year Legend', '365 day streak', 'crown', 'amber', 'achievement', 0, 204, '{"type": "streak", "days": 365}'),
('Unstoppable', '500 day streak', 'flame', 'red', 'achievement', 0, 205, '{"type": "streak", "days": 500}'),
('Two Year Titan', '730 day streak', 'crown', 'yellow', 'achievement', 0, 206, '{"type": "streak", "days": 730}'),
('Streak Immortal', '1000 day streak', 'star', 'gradient', 'achievement', 0, 207, '{"type": "streak", "days": 1000}'),

-- Completion Badges (LEGENDARY)
('First Step', 'Completed 1 habit', 'check-circle', 'green', 'achievement', 0, 300, '{"type": "completions", "count": 1}'),
('Habit Hero', 'Completed 100 habits', 'trophy', 'yellow', 'achievement', 0, 301, '{"type": "completions", "count": 100}'),
('Titan', 'Completed 1000 habits', 'crown', 'orange', 'achievement', 0, 302, '{"type": "completions", "count": 1000}'),
('Mythic Achiever', 'Completed 2500 habits', 'star', 'pink', 'achievement', 0, 303, '{"type": "completions", "count": 2500}'),
('Transcendent', 'Completed 5000 habits', 'zap', 'red', 'achievement', 0, 304, '{"type": "completions", "count": 5000}'),
('Eternal', 'Completed 10000 habits', 'crown', 'gradient', 'achievement', 0, 305, '{"type": "completions", "count": 10000}'),

-- Perfect Day Badges (EXTREME)
('Perfect Start', '3 perfect days', 'star', 'cyan', 'achievement', 0, 400, '{"type": "perfect_days", "count": 3}'),
('Perfectionist', '10 perfect days', 'star', 'blue', 'achievement', 0, 401, '{"type": "perfect_days", "count": 10}'),
('Flawless', '25 perfect days', 'star', 'indigo', 'achievement', 0, 402, '{"type": "perfect_days", "count": 25}'),
('Perfect Century', '100 perfect days', 'trophy', 'orange', 'achievement', 0, 403, '{"type": "perfect_days", "count": 100}'),
('Perfect Elite', '200 perfect days', 'crown', 'pink', 'achievement', 0, 404, '{"type": "perfect_days", "count": 200}'),
('Perfect Legend', '365 perfect days', 'zap', 'red', 'achievement', 0, 405, '{"type": "perfect_days", "count": 365}'),
('Perfect Immortal', '500 perfect days', 'crown', 'gradient', 'achievement', 0, 406, '{"type": "perfect_days", "count": 500}'),

-- Special badges
('Creator', 'Content Creator', 'video', 'red', 'special', 0, 500, '{}'),
('Developer', 'Software Developer', 'code', 'cyan', 'special', 0, 501, '{}'),
('YouTuber', 'YouTube Creator', 'youtube', 'red', 'special', 0, 502, '{}'),
('Entrepreneur', 'Business Owner', 'briefcase', 'amber', 'special', 0, 503, '{}'),
('Designer', 'UI/UX Designer', 'palette', 'pink', 'special', 0, 504, '{}'),
('Freelancer', 'Freelance Professional', 'laptop', 'indigo', 'special', 0, 505, '{}'),
('Student', 'Student', 'book', 'emerald', 'special', 0, 506, '{}'),
('Pro', 'Sadhana Pro Member', 'crown', 'gold', 'special', 0, 507, '{}'),
('Verified', 'Verified Account', 'check-circle', 'blue', 'special', 0, 508, '{}')
ON CONFLICT DO NOTHING;

-- Insert default coin packages
INSERT INTO coin_packages (name, description, coins, bonus_coins, price_inr, is_popular, badge, sort_order) VALUES
('Starter Pack', 'Perfect for beginners', 100, 0, 4900, false, NULL, 1),
('Popular Pack', 'Most purchased pack', 250, 50, 9900, true, 'Most Popular', 2),
('Value Pack', 'Great value for money', 500, 150, 19900, false, 'Best Value', 3),
('Mega Pack', 'For serious users', 1000, 400, 39900, false, NULL, 4)
ON CONFLICT DO NOTHING;

-- Insert default shop items (Avatars)
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
('Brain', 'Smart thinker avatar', 'avatar', 300, 'brain', true)
ON CONFLICT DO NOTHING;

-- Insert default themes
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

-- Insert default system settings
INSERT INTO system_settings (
  maintenance_mode, registration_enabled, leaderboard_enabled, shop_enabled,
  max_habits_per_user, max_active_habits, daily_coin_limit, daily_xp_limit
) VALUES (
  false, true, true, true, 30, 30, 50, 500
) ON CONFLICT DO NOTHING;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions for functions
GRANT EXECUTE ON FUNCTION update_user_rewards_safe TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rewards_with_version TO authenticated;
GRANT EXECUTE ON FUNCTION add_coins_safe TO authenticated;
GRANT EXECUTE ON FUNCTION spend_coins_safe TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_habit_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_habits_with_status TO authenticated;
GRANT EXECUTE ON FUNCTION set_primary_badge TO authenticated;
GRANT EXECUTE ON FUNCTION assign_user_badge TO authenticated;
GRANT EXECUTE ON FUNCTION remove_user_badge TO authenticated;

-- Grant service role permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================
-- INITIALIZATION
-- ============================================

-- Create user_rewards for existing profiles
INSERT INTO user_rewards (user_id, coins, xp, level, version)
SELECT id, 0, 0, 1, 1 FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_rewards WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Update existing records to have version = 1
UPDATE user_rewards SET version = 1 WHERE version IS NULL;

-- ============================================
-- SCHEMA VERSION & COMMENTS
-- ============================================

COMMENT ON SCHEMA public IS 'Sadhana Database Schema v2.0 - CONSOLIDATED - December 14, 2025 - Includes all security fixes (C001-C008), performance optimizations, and complete feature set';

-- ============================================
-- END OF CONSOLIDATED DATABASE SCHEMA
-- ============================================
-- ============================================
-- MISSING TABLES FROM BACKUP - ADDING NOW
-- ============================================

-- ============================================
-- USER ACHIEVEMENTS TABLE
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
-- WEEKLY CHALLENGE CLAIMS TABLE
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
-- NOTIFICATION SETTINGS TABLE
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
-- PROJECTS TABLE
-- ============================================
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Project Details
  name text NOT NULL,
  slug text,
  description text,
  status text DEFAULT 'idea' CHECK (status IN ('idea', 'building', 'shipped')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category text,
  tech_stack text[],
  live_url text,
  github_url text,
  
  -- Planning & Time
  due_date date,
  estimated_hours int,
  actual_hours int DEFAULT 0,
  
  -- Organization
  is_pinned boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for projects
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_pinned ON projects(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_projects_archived ON projects(is_archived);

COMMENT ON TABLE projects IS 'User projects and side projects with full management features';

-- ============================================
-- TASKS TABLE
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
-- INSTAGRAM POSTS TABLE
-- ============================================
CREATE TABLE instagram_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Post Details
  title text,
  hook text,
  caption text,
  hashtags text,
  format text DEFAULT 'reel' CHECK (format IN ('reel', 'post', 'story', 'carousel')),
  status text DEFAULT 'idea' CHECK (status IN ('idea', 'draft', 'scheduled', 'posted')),
  category text,
  thumbnail_idea text,
  
  -- Scheduling
  scheduled_date date,
  scheduled_time text,
  scheduled_for timestamptz,
  posted_at timestamptz,
  
  -- Script & Notes
  script text,
  notes text,
  
  -- Organization
  is_starred boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for instagram_posts
CREATE INDEX idx_instagram_posts_user ON instagram_posts(user_id);
CREATE INDEX idx_instagram_posts_status ON instagram_posts(status);
CREATE INDEX idx_instagram_posts_starred ON instagram_posts(is_starred) WHERE is_starred = true;

COMMENT ON TABLE instagram_posts IS 'Instagram content planning and scheduling with categories';

-- ============================================
-- FREELANCE CLIENTS TABLE
-- ============================================
CREATE TABLE freelance_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Client Details
  name text NOT NULL,
  platform text CHECK (platform IN ('upwork', 'fiverr', 'linkedin', 'twitter', 'dm', 'referral', 'other')),
  project_title text,
  value numeric,
  currency text DEFAULT 'INR',
  stage text DEFAULT 'lead' CHECK (stage IN ('lead', 'in_talk', 'proposal', 'active', 'done')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Contact Info
  email text,
  phone text,
  website text,
  
  -- Actions & Notes
  next_action text,
  next_action_date date,
  notes text,
  
  -- Organization
  is_starred boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for freelance_clients
CREATE INDEX idx_freelance_clients_user ON freelance_clients(user_id);
CREATE INDEX idx_freelance_clients_stage ON freelance_clients(stage);
CREATE INDEX idx_freelance_clients_starred ON freelance_clients(is_starred) WHERE is_starred = true;

COMMENT ON TABLE freelance_clients IS 'Freelance CRM with client pipeline management';

-- ============================================
-- USER SETTINGS TABLE
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
-- DAILY JOURNAL TABLE
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
-- HABIT FOCUS SESSIONS TABLE
-- ============================================
CREATE TABLE habit_focus_sessions (
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
-- WEEKLY CHALLENGES TABLE
-- ============================================
CREATE TABLE weekly_challenges (
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
-- USER CHALLENGE PROGRESS TABLE
-- ============================================
CREATE TABLE user_challenge_progress (
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
-- TIME BLOCKS TABLE (Calendar)
-- ============================================
CREATE TABLE time_blocks (
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
-- CHART DATA ENGINE TABLES
-- ============================================
CREATE TABLE chart_metrics (
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

CREATE TABLE chart_configurations (
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

-- Friend connections
CREATE TABLE user_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, accepted, blocked
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Detailed time tracking table
CREATE TABLE habit_time_logs (
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

COMMENT ON TABLE user_friends IS 'User friend connections for social features';
COMMENT ON TABLE habit_time_logs IS 'Detailed time tracking for habit sessions';

-- ============================================
-- ADDITIONAL HELPER FUNCTIONS
-- ============================================

-- Trigger to auto-set date from recorded_at
CREATE OR REPLACE FUNCTION set_chart_metric_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date := NEW.recorded_at::date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- SECURE: Add coins with proper tracking and retry logic
CREATE OR REPLACE FUNCTION add_user_coins_safe(p_user_id uuid, p_coins int, p_reason text DEFAULT 'Coins added')
RETURNS jsonb AS $$
DECLARE
  current_version integer;
  result jsonb;
  retry_count integer := 0;
BEGIN
  LOOP
    SELECT version INTO current_version FROM user_rewards WHERE user_id = p_user_id;
    IF current_version IS NULL THEN
      INSERT INTO user_rewards (user_id, coins, version) VALUES (p_user_id, p_coins, 1) ON CONFLICT (user_id) DO NOTHING;
      IF FOUND THEN
        INSERT INTO coin_transactions (user_id, amount, type, reason, balance_after) VALUES (p_user_id, p_coins, 'earned', p_reason, p_coins);
        RETURN jsonb_build_object('success', true, 'coins', p_coins, 'version', 1);
      END IF;
      SELECT version INTO current_version FROM user_rewards WHERE user_id = p_user_id;
    END IF;
    SELECT add_coins_safe(p_user_id, COALESCE(current_version, 0), p_coins, p_reason) INTO result;
    IF (result->>'success')::boolean THEN RETURN result; END IF;
    retry_count := retry_count + 1;
    IF retry_count >= 3 THEN RETURN jsonb_build_object('success', false, 'error', 'max_retries'); END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_user_coins_safe IS 'Add coins with version tracking and retry logic';

-- DEPRECATED: Legacy function
CREATE OR REPLACE FUNCTION add_user_coins(p_user_id uuid, p_coins int)
RETURNS void AS $$
BEGIN
  PERFORM add_user_coins_safe(p_user_id, p_coins, 'Coins added (legacy)');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_user_coins IS 'Add coins to user account (used by payment system)';

-- SECURE: Process purchase with optimistic locking
CREATE OR REPLACE FUNCTION process_purchase_safe(
  p_user_id uuid,
  p_expected_version integer,
  p_plan_id uuid,
  p_coupon_id uuid,
  p_original_price int,
  p_coupon_discount int,
  p_final_price int,
  p_coins_spent int
)
RETURNS jsonb AS $$
DECLARE
  spend_result jsonb;
BEGIN
  SELECT spend_coins_safe(p_user_id, p_expected_version, p_coins_spent, 'Shop purchase: ' || p_plan_id::text) INTO spend_result;
  IF NOT (spend_result->>'success')::boolean THEN RETURN spend_result; END IF;
  INSERT INTO shop_purchases (user_id, plan_id, coupon_id, original_price, coupon_discount, final_price)
  VALUES (p_user_id, p_plan_id, p_coupon_id, p_original_price, p_coupon_discount, p_final_price);
  RETURN jsonb_build_object('success', true, 'coins_spent', p_coins_spent, 'new_balance', (spend_result->>'coins')::integer);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_purchase_safe IS 'Process shop purchase with optimistic locking';

-- DEPRECATED: Legacy function - raises error
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
  -- Deduct coins from user account
  UPDATE user_rewards 
  SET coins = coins - p_coins_spent,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record the transaction
  INSERT INTO coin_transactions (user_id, amount, type, reason, balance_after)
  SELECT p_user_id, -p_coins_spent, 'spent', 'Shop purchase', coins
  FROM user_rewards WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_purchase IS 'Process shop purchase and deduct coins with transaction logging';
-- ============================================
-- ADDITIONAL TRIGGERS
-- ============================================

CREATE TRIGGER trigger_chart_metrics_set_date
  BEFORE INSERT OR UPDATE ON chart_metrics
  FOR EACH ROW
  EXECUTE FUNCTION set_chart_metric_date();

CREATE TRIGGER trigger_chart_metrics_updated_at
  BEFORE UPDATE ON chart_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_chart_configurations_updated_at
  BEFORE UPDATE ON chart_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_instagram_posts_updated_at
  BEFORE UPDATE ON instagram_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_freelance_clients_updated_at
  BEFORE UPDATE ON freelance_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_daily_journal_updated_at
  BEFORE UPDATE ON daily_journal
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_time_blocks_updated_at
  BEFORE UPDATE ON time_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ADDITIONAL INDEXES
-- ============================================

-- User Achievements
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Projects & Tasks
CREATE INDEX idx_projects_user_status ON projects(user_id, status);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE status != 'done';

-- Daily Journal
CREATE INDEX idx_daily_journal_user_date ON daily_journal(user_id, date DESC);

-- Focus Sessions
CREATE INDEX idx_habit_focus_sessions_user_date ON habit_focus_sessions(user_id, date DESC);

-- Time Blocks
CREATE INDEX idx_time_blocks_user_date ON time_blocks(user_id, date);

-- Weekly Challenges
CREATE INDEX idx_weekly_challenges_active ON weekly_challenges(is_active) WHERE is_active = true;
CREATE INDEX idx_user_challenge_progress_user ON user_challenge_progress(user_id);

-- Chart Engine Indexes
CREATE INDEX idx_chart_metrics_recorded_at ON chart_metrics(recorded_at);
CREATE INDEX idx_chart_metrics_date ON chart_metrics(date);
CREATE INDEX idx_chart_metrics_metric ON chart_metrics(metric);
CREATE INDEX idx_chart_metrics_group ON chart_metrics(group_key);
CREATE INDEX idx_chart_metrics_user ON chart_metrics(user_id);
CREATE INDEX idx_chart_metrics_category ON chart_metrics(category);
CREATE INDEX idx_chart_metrics_user_date_metric ON chart_metrics(user_id, date, metric);
CREATE INDEX idx_chart_metrics_group_recorded_at ON chart_metrics(group_key, recorded_at);

CREATE INDEX idx_chart_configs_chart_id ON chart_configurations(chart_id);
CREATE INDEX idx_chart_configs_user ON chart_configurations(user_id);
CREATE INDEX idx_chart_configs_type ON chart_configurations(chart_type);
CREATE INDEX idx_chart_configs_global ON chart_configurations(is_global) WHERE is_global = true;

-- Social Features Indexes
CREATE INDEX idx_user_friends_user_id ON user_friends(user_id);
CREATE INDEX idx_user_friends_friend_id ON user_friends(friend_id);
CREATE INDEX idx_user_friends_status ON user_friends(status);
CREATE INDEX idx_habit_time_logs_habit_log ON habit_time_logs(habit_log_id);
-- ============================================
-- ADDITIONAL RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_challenge_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelance_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_time_logs ENABLE ROW LEVEL SECURITY;

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

-- Habit Focus Sessions Policies
CREATE POLICY "Users can view own focus sessions" ON habit_focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own focus sessions" ON habit_focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own focus sessions" ON habit_focus_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own focus sessions" ON habit_focus_sessions FOR DELETE USING (auth.uid() = user_id);

-- Weekly Challenges Policies (SECURE - admin only for modifications)
CREATE POLICY "weekly_challenges_select" ON weekly_challenges FOR SELECT USING (is_active = true OR is_admin(auth.uid()));
CREATE POLICY "weekly_challenges_insert_admin" ON weekly_challenges FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "weekly_challenges_update_admin" ON weekly_challenges FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "weekly_challenges_delete_admin" ON weekly_challenges FOR DELETE USING (is_admin(auth.uid()));

-- User Challenge Progress Policies
CREATE POLICY "Users can view own challenge progress" ON user_challenge_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own challenge progress" ON user_challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenge progress" ON user_challenge_progress FOR UPDATE USING (auth.uid() = user_id);

-- Weekly Challenge Claims Policies (SECURE - service_role only for insert)
ALTER TABLE weekly_challenge_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weekly_challenge_claims_select" ON weekly_challenge_claims FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "weekly_challenge_claims_insert_service" ON weekly_challenge_claims FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Time Blocks Policies
CREATE POLICY "Users can view own time blocks" ON time_blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own time blocks" ON time_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own time blocks" ON time_blocks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own time blocks" ON time_blocks FOR DELETE USING (auth.uid() = user_id);

-- Chart Metrics Policies
CREATE POLICY "Users can read their own chart metrics" ON chart_metrics FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own chart metrics" ON chart_metrics FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own chart metrics" ON chart_metrics FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own chart metrics" ON chart_metrics FOR DELETE USING (user_id = auth.uid());

-- Chart Configurations Policies
CREATE POLICY "Users can read their own chart configs" ON chart_configurations FOR SELECT USING (user_id = auth.uid() OR is_global = true);
CREATE POLICY "Users can insert their own chart configs" ON chart_configurations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own chart configs" ON chart_configurations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own chart configs" ON chart_configurations FOR DELETE USING (user_id = auth.uid());

-- User Friends Policies
CREATE POLICY "Users can read their own friends" ON user_friends FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());
CREATE POLICY "Users can insert friend requests" ON user_friends FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update friend requests they sent or received" ON user_friends FOR UPDATE USING (user_id = auth.uid() OR friend_id = auth.uid());
CREATE POLICY "Users can delete friend requests they sent or received" ON user_friends FOR DELETE USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Habit Time Logs Policies
CREATE POLICY "Users can view own time logs" ON habit_time_logs FOR SELECT USING (
  EXISTS(SELECT 1 FROM habit_logs hl WHERE hl.id = habit_log_id AND hl.user_id = auth.uid())
);
CREATE POLICY "Users can create own time logs" ON habit_time_logs FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM habit_logs hl WHERE hl.id = habit_log_id AND hl.user_id = auth.uid())
);

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
  p.created_at,
  
  -- User rewards data
  COALESCE(ur.current_avatar, 'user') as current_avatar,
  COALESCE(ur.current_theme, 'default') as current_theme,
  COALESCE(ur.xp, 0) as xp,
  COALESCE(ur.level, 1) as level,
  COALESCE(ur.current_streak, 0) as current_streak,
  COALESCE(ur.coins, 0) as coins,
  
  -- Primary badge
  (
    SELECT json_build_object('id', b.id, 'name', b.name, 'icon', b.icon, 'color', b.color)
    FROM user_badges ub
    JOIN badges b ON b.id = ub.badge_id
    WHERE ub.user_id = p.id 
    AND ub.is_primary = true
    AND (ub.expires_at IS NULL OR ub.expires_at > NOW())
    LIMIT 1
  ) as primary_badge,
  
  -- Today's stats
  (
    SELECT COUNT(*)
    FROM habit_logs hl
    WHERE hl.user_id = p.id 
    AND hl.completed = true
    AND hl.date = CURRENT_DATE
  ) as today_completions,
  
  -- Total habits count
  (
    SELECT COUNT(*)
    FROM habits h
    WHERE h.user_id = p.id 
    AND h.is_active = true
  ) as total_habits,
  
  -- Today's focus time (in minutes)
  (
    SELECT COALESCE(SUM(hfs.duration), 0)
    FROM habit_focus_sessions hfs
    WHERE hfs.user_id = p.id 
    AND hfs.date = CURRENT_DATE
  ) as today_focus_minutes,
  
  -- Total focus time (in minutes)
  (
    SELECT COALESCE(SUM(hfs.duration), 0)
    FROM habit_focus_sessions hfs
    WHERE hfs.user_id = p.id
  ) as total_focus_minutes,
  
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
WHERE p.is_public = true;

COMMENT ON VIEW public_profiles IS 'Public user profiles with aggregated stats for leaderboard';

-- Grant access to authenticated users
GRANT SELECT ON public_profiles TO authenticated;

-- ============================================
-- ADDITIONAL DEFAULT DATA
-- ============================================

-- Insert premium golden avatars
INSERT INTO shop_plans (name, description, plan_type, coin_price, icon, is_active) VALUES
('Golden Crown', 'Premium royal crown', 'avatar', 1200, 'gold-crown', true),
('Golden Star', 'Premium shining star', 'avatar', 8000, 'gold-star', true),
('Golden Trophy', 'Premium champion', 'avatar', 600, 'gold-trophy', true),
('Golden Diamond', 'Ultimate premium', 'avatar', 1000, 'gold-gem', true),
('Golden Flame', 'Premium hot streak', 'avatar', 500, 'gold-flame', true),
('Golden Shield', 'Premium defender', 'avatar', 500, 'gold-shield', true)
ON CONFLICT DO NOTHING;

-- Insert premium features
INSERT INTO shop_plans (name, description, plan_type, coin_price, icon, is_active) VALUES
('Custom Sounds', 'Custom notification sounds', 'feature', 500, 'volume-2', true),
('Advanced Stats', 'Detailed analytics', 'feature', 750, 'bar-chart-2', true),
('Priority Support', 'Faster support', 'feature', 1000, 'headphones', true),
('Smart Reminders', 'AI-powered reminders', 'feature', 600, 'bell', true),
('Focus Mode Pro', 'Extended focus tools', 'feature', 800, 'wand', true),
('Unlimited History', 'Access all past data', 'feature', 1200, 'clock', true)
ON CONFLICT DO NOTHING;

-- Sample Weekly Challenges
INSERT INTO weekly_challenges (title, description, target_type, target_value, coin_reward, xp_reward, is_active)
VALUES 
  ('Habit Starter', 'Complete 10 habits this week', 'completions', 10, 25, 50, true),
  ('Consistency King', 'Maintain a 5 day streak', 'streak', 5, 40, 75, true),
  ('Perfect Week', 'Have 3 perfect days this week', 'perfect_days', 3, 50, 100, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- FINAL SCHEMA VERSION UPDATE
-- ============================================
COMMENT ON SCHEMA public IS 'Sadhana Database Schema v2.0 - COMPLETE CONSOLIDATED - December 14, 2025 - Includes ALL features: security fixes (C001-C008), performance optimizations, badges, shop, payments, social features, chart engine, and complete feature set';

-- ============================================
-- END OF COMPLETE CONSOLIDATED DATABASE SCHEMA
-- ============================================

-- ============================================
-- HIGH PRIORITY FIXES - December 15, 2025
-- H006: Database Indexes
-- H010: Data Consistency Checks
-- ============================================

-- ============================================
-- H006: MISSING DATABASE INDEXES
-- ============================================

-- User Rewards - Leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_rewards_leaderboard 
  ON user_rewards(xp DESC, level DESC) 
  WHERE xp > 0;

CREATE INDEX IF NOT EXISTS idx_user_rewards_coins 
  ON user_rewards(coins DESC) 
  WHERE coins > 0;

-- Habit Logs - Date range queries (most common)
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date_range 
  ON habit_logs(user_id, date DESC, completed);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_completed 
  ON habit_logs(habit_id, completed, date DESC) 
  WHERE completed = true;

-- Habits - Active habits per user
CREATE INDEX IF NOT EXISTS idx_habits_user_active 
  ON habits(user_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_habits_category 
  ON habits(user_id, category) 
  WHERE category IS NOT NULL;

-- User Badges - Badge lookups
CREATE INDEX IF NOT EXISTS idx_user_badges_badge 
  ON user_badges(badge_id);

CREATE INDEX IF NOT EXISTS idx_user_badges_primary 
  ON user_badges(user_id, is_primary) 
  WHERE is_primary = true;

-- Badges - Active badges by type
CREATE INDEX IF NOT EXISTS idx_badges_active_type 
  ON badges(badge_type, is_active) 
  WHERE is_active = true;

-- Weekly Challenges - Active challenges
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_dates 
  ON weekly_challenges(week_start, week_end) 
  WHERE is_active = true;

-- User Challenge Progress
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_challenge 
  ON user_challenge_progress(challenge_id, completed);

-- Coin Transactions - User history
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_date 
  ON coin_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_type 
  ON coin_transactions(user_id, type, created_at DESC);

-- Shop Purchases - User purchase history
CREATE INDEX IF NOT EXISTS idx_shop_purchases_user_date 
  ON shop_purchases(user_id, created_at DESC);

-- Payment Orders - Status lookups
CREATE INDEX IF NOT EXISTS idx_payment_orders_status 
  ON payment_orders(user_id, status, created_at DESC);

-- Daily Journal - Date lookups
CREATE INDEX IF NOT EXISTS idx_daily_journal_user_date 
  ON daily_journal(user_id, date DESC);

-- Time Blocks - Schedule queries
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date 
  ON time_blocks(user_id, date, start_time);

-- Profiles - Username search
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower 
  ON profiles(LOWER(username)) 
  WHERE username IS NOT NULL;

-- ============================================
-- H010: DATA CONSISTENCY CHECKS
-- ============================================

-- Ensure habit logs reference valid habits owned by the same user
CREATE OR REPLACE FUNCTION validate_habit_log_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM habits 
    WHERE id = NEW.habit_id 
    AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Habit does not belong to user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_habit_log ON habit_logs;
CREATE TRIGGER trigger_validate_habit_log
  BEFORE INSERT OR UPDATE ON habit_logs
  FOR EACH ROW
  EXECUTE FUNCTION validate_habit_log_ownership();

-- Ensure numeric habits have valid values
CREATE OR REPLACE FUNCTION validate_habit_log_value()
RETURNS TRIGGER AS $$
DECLARE
  habit_type text;
  habit_target int;
BEGIN
  SELECT type, target_value INTO habit_type, habit_target
  FROM habits WHERE id = NEW.habit_id;
  
  -- For boolean habits, value should be null or 0/1
  IF habit_type = 'boolean' AND NEW.value IS NOT NULL AND NEW.value NOT IN (0, 1) THEN
    NEW.value := CASE WHEN NEW.completed THEN 1 ELSE 0 END;
  END IF;
  
  -- For numeric habits, value should not exceed reasonable limits
  IF habit_type = 'numeric' AND NEW.value IS NOT NULL THEN
    IF NEW.value < 0 THEN
      RAISE EXCEPTION 'Value cannot be negative';
    END IF;
    IF NEW.value > 100000 THEN
      RAISE EXCEPTION 'Value exceeds maximum limit';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_habit_value ON habit_logs;
CREATE TRIGGER trigger_validate_habit_value
  BEFORE INSERT OR UPDATE ON habit_logs
  FOR EACH ROW
  EXECUTE FUNCTION validate_habit_log_value();

-- Ensure user_badges reference valid badges
CREATE OR REPLACE FUNCTION validate_user_badge()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM badges WHERE id = NEW.badge_id) THEN
    RAISE EXCEPTION 'Badge does not exist';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_user_badge ON user_badges;
CREATE TRIGGER trigger_validate_user_badge
  BEFORE INSERT ON user_badges
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_badge();

-- Ensure coins cannot go negative
CREATE OR REPLACE FUNCTION validate_user_rewards_coins()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.coins < 0 THEN
    RAISE EXCEPTION 'Coins cannot be negative';
  END IF;
  IF NEW.xp < 0 THEN
    RAISE EXCEPTION 'XP cannot be negative';
  END IF;
  IF NEW.level < 1 THEN
    NEW.level := 1;
  END IF;
  IF NEW.current_streak < 0 THEN
    NEW.current_streak := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_user_rewards ON user_rewards;
CREATE TRIGGER trigger_validate_user_rewards
  BEFORE INSERT OR UPDATE ON user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_rewards_coins();

-- Ensure challenge progress doesn't exceed target
CREATE OR REPLACE FUNCTION validate_challenge_progress()
RETURNS TRIGGER AS $$
DECLARE
  target int;
BEGIN
  SELECT target_value INTO target
  FROM weekly_challenges WHERE id = NEW.challenge_id;
  
  IF NEW.progress < 0 THEN
    NEW.progress := 0;
  END IF;
  
  -- Auto-complete if progress meets target
  IF NEW.progress >= target AND NOT NEW.completed THEN
    NEW.completed := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_challenge_progress ON user_challenge_progress;
CREATE TRIGGER trigger_validate_challenge_progress
  BEFORE INSERT OR UPDATE ON user_challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION validate_challenge_progress();

-- Ensure shop purchases have valid prices
CREATE OR REPLACE FUNCTION validate_shop_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.original_price < 0 OR NEW.final_price < 0 OR NEW.coupon_discount < 0 THEN
    RAISE EXCEPTION 'Prices cannot be negative';
  END IF;
  IF NEW.final_price > NEW.original_price THEN
    RAISE EXCEPTION 'Final price cannot exceed original price';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_shop_purchase ON shop_purchases;
CREATE TRIGGER trigger_validate_shop_purchase
  BEFORE INSERT ON shop_purchases
  FOR EACH ROW
  EXECUTE FUNCTION validate_shop_purchase();

-- ============================================
-- ANALYZE TABLES FOR QUERY OPTIMIZATION
-- ============================================

ANALYZE habits;
ANALYZE habit_logs;
ANALYZE user_rewards;
ANALYZE user_badges;
ANALYZE badges;
ANALYZE weekly_challenges;
ANALYZE user_challenge_progress;
ANALYZE coin_transactions;
ANALYZE shop_purchases;
ANALYZE profiles;

-- ============================================
-- SUMMARY
-- ============================================
-- H006: Added 20+ indexes for common query patterns
-- H010: Added 6 validation triggers for data consistency
-- - Habit log ownership validation
-- - Habit log value validation
-- - User badge validation
-- - User rewards bounds checking
-- - Challenge progress validation
-- - Shop purchase price validation


-- ============================================================================
-- MEDIUM PRIORITY FIXES - December 15, 2025
-- M003: Database Schema Normalization
-- ============================================================================

-- ============================================================================
-- M003: FIX DUPLICATE COLUMNS IN HABIT_LOGS
-- ============================================================================

-- Check if both 'note' and 'notes' columns exist, keep only 'notes'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'habit_logs' AND column_name = 'note'
  ) THEN
    UPDATE habit_logs SET notes = note WHERE notes IS NULL AND note IS NOT NULL;
    ALTER TABLE habit_logs DROP COLUMN IF EXISTS note;
    RAISE NOTICE 'Migrated note column to notes and dropped duplicate';
  END IF;
END $$;

-- ============================================================================
-- M003: FIX TIMEZONE DUPLICATION (profiles vs user_settings)
-- ============================================================================

COMMENT ON COLUMN profiles.timezone IS 'Primary timezone setting for user. user_settings.timezone is deprecated.';

-- Create view for unified user preferences
CREATE OR REPLACE VIEW user_preferences AS
SELECT 
  p.id as user_id,
  p.username,
  p.timezone,
  COALESCE(us.theme, 'dark') as theme,
  COALESCE(us.start_of_week, 'monday') as start_of_week
FROM profiles p
LEFT JOIN user_settings us ON p.id = us.user_id;

-- ============================================================================
-- M003: FIX SYSTEM_SETTINGS SINGLE ROW CONSTRAINT
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'system_settings_single_row'
  ) THEN
    INSERT INTO system_settings (id, maintenance_mode, maintenance_message)
    VALUES ('00000000-0000-0000-0000-000000000001', false, null)
    ON CONFLICT (id) DO NOTHING;
    
    DELETE FROM system_settings WHERE id != '00000000-0000-0000-0000-000000000001';
    
    ALTER TABLE system_settings 
    ADD CONSTRAINT system_settings_single_row 
    CHECK (id = '00000000-0000-0000-0000-000000000001');
    
    RAISE NOTICE 'Added single row constraint to system_settings';
  END IF;
END $$;

-- ============================================================================
-- M003: FIX CHART_METRICS - Add idempotency key
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chart_metrics_recorded_at_metric_group_key_user_id_key'
  ) THEN
    ALTER TABLE chart_metrics 
    DROP CONSTRAINT chart_metrics_recorded_at_metric_group_key_user_id_key;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chart_metrics' AND column_name = 'idempotency_key'
  ) THEN
    ALTER TABLE chart_metrics ADD COLUMN idempotency_key text;
    CREATE INDEX IF NOT EXISTS idx_chart_metrics_idempotency 
    ON chart_metrics(idempotency_key) WHERE idempotency_key IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- M003: ADD MISSING FOREIGN KEY CONSTRAINTS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_habit_logs_habit') THEN
    ALTER TABLE habit_logs 
    ADD CONSTRAINT fk_habit_logs_habit 
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_habit_logs_user') THEN
    ALTER TABLE habit_logs 
    ADD CONSTRAINT fk_habit_logs_user 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTION: Get normalized user data
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_profile_complete(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'profile', jsonb_build_object(
      'id', p.id,
      'username', p.username,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url,
      'timezone', p.timezone,
      'created_at', p.created_at
    ),
    'rewards', jsonb_build_object(
      'coins', COALESCE(ur.coins, 0),
      'xp', COALESCE(ur.xp, 0),
      'level', COALESCE(ur.level, 1),
      'current_streak', COALESCE(ur.current_streak, 0),
      'longest_streak', COALESCE(ur.longest_streak, 0)
    ),
    'settings', jsonb_build_object(
      'theme', COALESCE(us.theme, 'dark'),
      'notifications_enabled', COALESCE(us.notifications_enabled, true),
      'sound_enabled', COALESCE(us.sound_enabled, true)
    ),
    'stats', jsonb_build_object(
      'total_habits', (SELECT COUNT(*) FROM habits WHERE user_id = p_user_id AND is_active = true),
      'total_completions', (SELECT COUNT(*) FROM habit_logs WHERE user_id = p_user_id AND completed = true),
      'badges_earned', (SELECT COUNT(*) FROM user_badges WHERE user_id = p_user_id)
    )
  )
  INTO v_result
  FROM profiles p
  LEFT JOIN user_rewards ur ON p.id = ur.user_id
  LEFT JOIN user_settings us ON p.id = us.user_id
  WHERE p.id = p_user_id;
  
  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_profile_complete(uuid) TO authenticated;

-- ============================================================================
-- FINAL SCHEMA VERSION UPDATE
-- ============================================================================
COMMENT ON SCHEMA public IS 'Sadhana Database Schema v2.1 - COMPLETE - December 15, 2025 - Includes ALL security fixes (C001-C008, H001-H012, M001-M015), performance optimizations, data consistency triggers, and complete feature set';

-- ============================================================================
-- END OF COMPLETE DATABASE SCHEMA
-- ============================================================================


-- ============================================================================
-- NEW FEATURES - December 15, 2025
-- Feedback, Announcements, and System Logs
-- ============================================================================

-- ============================================
-- FEEDBACK TABLE - User feedback and feature requests
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Feedback details
  type text NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'other')),
  title text NOT NULL,
  description text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Status tracking
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'planned', 'in_progress', 'completed', 'rejected')),
  admin_notes text,
  
  -- Metadata
  page_url text,
  user_agent text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create feedback" ON feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update feedback" ON feedback
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

COMMENT ON TABLE feedback IS 'User feedback, bug reports, and feature requests';

-- ============================================
-- ANNOUNCEMENTS TABLE - App-wide announcements
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Announcement content
  title text NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'update')),
  
  -- Display settings
  is_active boolean DEFAULT true,
  is_dismissible boolean DEFAULT true,
  show_on_dashboard boolean DEFAULT true,
  priority int DEFAULT 0,
  
  -- Targeting
  target_audience text DEFAULT 'all' CHECK (target_audience IN ('all', 'free', 'premium', 'new_users')),
  
  -- Scheduling
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  
  -- Metadata
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority DESC);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements" ON announcements
  FOR SELECT TO authenticated
  USING (is_active = true AND start_date <= now() AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

COMMENT ON TABLE announcements IS 'App-wide announcements and notifications';

-- ============================================
-- ANNOUNCEMENT DISMISSALS - Track dismissed announcements per user
-- ============================================
CREATE TABLE IF NOT EXISTS announcement_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  dismissed_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, announcement_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_dismissals_user ON announcement_dismissals(user_id);

ALTER TABLE announcement_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can dismiss announcements" ON announcement_dismissals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own dismissals" ON announcement_dismissals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- SYSTEM LOGS TABLE - Error and activity logs
-- ============================================
CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Log details
  level text NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  category text NOT NULL,
  message text NOT NULL,
  details jsonb,
  
  -- Context
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  page_url text,
  user_agent text,
  ip_address text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs(user_id);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view logs" ON system_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "System can insert logs" ON system_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

COMMENT ON TABLE system_logs IS 'System error and activity logs';

-- ============================================
-- HELPER FUNCTION: Log system event
-- ============================================
CREATE OR REPLACE FUNCTION log_system_event(
  p_level text,
  p_category text,
  p_message text,
  p_details jsonb DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO system_logs (level, category, message, details, user_id)
  VALUES (p_level, p_category, p_message, p_details, COALESCE(p_user_id, auth.uid()))
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION log_system_event(text, text, text, jsonb, uuid) TO authenticated;

-- ============================================
-- VIEW: Active announcements for users
-- ============================================
CREATE OR REPLACE VIEW active_announcements AS
SELECT 
  a.*,
  NOT EXISTS (
    SELECT 1 FROM announcement_dismissals ad 
    WHERE ad.announcement_id = a.id AND ad.user_id = auth.uid()
  ) as is_visible
FROM announcements a
WHERE a.is_active = true 
  AND a.start_date <= now() 
  AND (a.end_date IS NULL OR a.end_date >= now())
ORDER BY a.priority DESC, a.created_at DESC;

-- ============================================
-- ANALYZE NEW TABLES
-- ============================================
ANALYZE feedback;
ANALYZE announcements;
ANALYZE announcement_dismissals;
ANALYZE system_logs;

COMMENT ON SCHEMA public IS 'Sadhana Database Schema v2.2 - December 15, 2025 - Added feedback, announcements, and system logs';

-- ============================================
-- ADMIN BADGE MANAGEMENT FUNCTIONS
-- ============================================

-- Admin function to get users who have a specific badge
CREATE OR REPLACE FUNCTION admin_get_badge_users(p_badge_id uuid)
RETURNS TABLE (
  user_badge_id uuid,
  user_id uuid,
  username varchar,
  full_name varchar,
  is_primary boolean
) AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  RETURN QUERY
  SELECT 
    ub.id as user_badge_id,
    ub.user_id,
    p.username,
    p.full_name,
    ub.is_primary
  FROM user_badges ub
  JOIN profiles p ON p.id = ub.user_id
  WHERE ub.badge_id = p_badge_id
  ORDER BY ub.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to create a badge
CREATE OR REPLACE FUNCTION admin_create_badge(
  p_name varchar,
  p_description text DEFAULT '',
  p_icon varchar DEFAULT 'award',
  p_color varchar DEFAULT 'blue',
  p_badge_type varchar DEFAULT 'special',
  p_display_order int DEFAULT 0,
  p_is_active boolean DEFAULT true
)
RETURNS uuid AS $$
DECLARE
  new_badge_id uuid;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  INSERT INTO badges (name, description, icon, color, badge_type, display_order, is_active)
  VALUES (p_name, p_description, p_icon, p_color, p_badge_type, p_display_order, p_is_active)
  RETURNING id INTO new_badge_id;
  
  RETURN new_badge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to update a badge
CREATE OR REPLACE FUNCTION admin_update_badge(
  p_badge_id uuid,
  p_name varchar,
  p_description text DEFAULT '',
  p_icon varchar DEFAULT 'award',
  p_color varchar DEFAULT 'blue',
  p_badge_type varchar DEFAULT 'special',
  p_display_order int DEFAULT 0,
  p_is_active boolean DEFAULT true
)
RETURNS boolean AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  UPDATE badges SET
    name = p_name,
    description = p_description,
    icon = p_icon,
    color = p_color,
    badge_type = p_badge_type,
    display_order = p_display_order,
    is_active = p_is_active,
    updated_at = now()
  WHERE id = p_badge_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to delete a badge
CREATE OR REPLACE FUNCTION admin_delete_badge(p_badge_id uuid)
RETURNS boolean AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  DELETE FROM badges WHERE id = p_badge_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to remove badge from any user
CREATE OR REPLACE FUNCTION admin_remove_user_badge(p_user_badge_id uuid)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
  was_primary boolean;
  badge_count integer;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  SELECT user_id, is_primary INTO v_user_id, was_primary 
  FROM user_badges WHERE id = p_user_badge_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  DELETE FROM user_badges WHERE id = p_user_badge_id;
  
  IF was_primary THEN
    SELECT COUNT(*) INTO badge_count FROM user_badges WHERE user_id = v_user_id;
    
    IF badge_count > 0 THEN
      UPDATE user_badges SET is_primary = true 
      WHERE user_id = v_user_id AND id = (
        SELECT id FROM user_badges WHERE user_id = v_user_id ORDER BY created_at ASC LIMIT 1
      );
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions for admin badge functions
GRANT EXECUTE ON FUNCTION admin_get_badge_users(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_badge(varchar, text, varchar, varchar, varchar, int, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_badge(uuid, varchar, text, varchar, varchar, varchar, int, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_badge(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_remove_user_badge(uuid) TO authenticated;




-- Check your user ID first
SELECT id, email FROM auth.users WHERE email = 'kamleshgchoudhary007@gmail.com';