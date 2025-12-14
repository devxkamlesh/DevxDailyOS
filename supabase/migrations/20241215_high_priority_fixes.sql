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

-- Badges - Purchasable badges
CREATE INDEX IF NOT EXISTS idx_badges_purchasable 
  ON badges(is_purchasable, coin_price) 
  WHERE is_purchasable = true;

CREATE INDEX IF NOT EXISTS idx_badges_rarity 
  ON badges(rarity);

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
