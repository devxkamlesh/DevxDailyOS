-- ============================================================================
-- MEDIUM PRIORITY FIXES MIGRATION
-- M003: Database Schema Normalization
-- M010: Backup-related constraints
-- ============================================================================

-- ============================================================================
-- M003: FIX DUPLICATE COLUMNS IN HABIT_LOGS
-- ============================================================================

-- Check if both 'note' and 'notes' columns exist, keep only 'notes'
DO $$
BEGIN
  -- If 'note' column exists, migrate data to 'notes' and drop 'note'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'habit_logs' AND column_name = 'note'
  ) THEN
    -- Migrate data from 'note' to 'notes' if 'notes' is empty
    UPDATE habit_logs 
    SET notes = note 
    WHERE notes IS NULL AND note IS NOT NULL;
    
    -- Drop the duplicate column
    ALTER TABLE habit_logs DROP COLUMN IF EXISTS note;
    
    RAISE NOTICE 'Migrated note column to notes and dropped duplicate';
  END IF;
END $$;

-- ============================================================================
-- M003: FIX TIMEZONE DUPLICATION (profiles vs user_settings)
-- ============================================================================

-- Add comment to clarify timezone source of truth
COMMENT ON COLUMN profiles.timezone IS 'Primary timezone setting for user. user_settings.timezone is deprecated.';

-- Create view for unified user preferences
CREATE OR REPLACE VIEW user_preferences AS
SELECT 
  p.id as user_id,
  p.username,
  p.timezone,
  COALESCE(us.theme, 'dark') as theme,
  COALESCE(us.notifications_enabled, true) as notifications_enabled,
  COALESCE(us.sound_enabled, true) as sound_enabled,
  COALESCE(us.daily_reminder_time, '09:00') as daily_reminder_time
FROM profiles p
LEFT JOIN user_settings us ON p.id = us.user_id;

-- ============================================================================
-- M003: FIX SYSTEM_SETTINGS SINGLE ROW CONSTRAINT
-- ============================================================================

-- Ensure system_settings has only one row
DO $$
BEGIN
  -- Add constraint if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'system_settings_single_row'
  ) THEN
    -- First, ensure we have exactly one row
    INSERT INTO system_settings (id, maintenance_mode, maintenance_message)
    VALUES ('00000000-0000-0000-0000-000000000001', false, null)
    ON CONFLICT (id) DO NOTHING;
    
    -- Delete any extra rows
    DELETE FROM system_settings 
    WHERE id != '00000000-0000-0000-0000-000000000001';
    
    -- Add check constraint
    ALTER TABLE system_settings 
    ADD CONSTRAINT system_settings_single_row 
    CHECK (id = '00000000-0000-0000-0000-000000000001');
    
    RAISE NOTICE 'Added single row constraint to system_settings';
  END IF;
END $$;

-- ============================================================================
-- M003: FIX PAYMENT_TRANSACTIONS.PACKAGE_ID TYPE
-- ============================================================================

-- Note: This is a potentially breaking change, only run if needed
-- Uncomment if you want to fix the type mismatch

-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM information_schema.columns 
--     WHERE table_name = 'payment_transactions' 
--     AND column_name = 'package_id' 
--     AND data_type = 'text'
--   ) THEN
--     -- Create temporary column
--     ALTER TABLE payment_transactions ADD COLUMN package_id_new uuid;
--     
--     -- Migrate data (only valid UUIDs)
--     UPDATE payment_transactions 
--     SET package_id_new = package_id::uuid 
--     WHERE package_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
--     
--     -- Drop old column and rename new
--     ALTER TABLE payment_transactions DROP COLUMN package_id;
--     ALTER TABLE payment_transactions RENAME COLUMN package_id_new TO package_id;
--     
--     -- Add foreign key
--     ALTER TABLE payment_transactions 
--     ADD CONSTRAINT fk_payment_package 
--     FOREIGN KEY (package_id) REFERENCES coin_packages(id);
--     
--     RAISE NOTICE 'Fixed package_id type in payment_transactions';
--   END IF;
-- END $$;

-- ============================================================================
-- M003: FIX CHART_METRICS UNIQUE CONSTRAINT
-- ============================================================================

-- Replace strict unique constraint with idempotency key approach
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chart_metrics_recorded_at_metric_group_key_user_id_key'
  ) THEN
    ALTER TABLE chart_metrics 
    DROP CONSTRAINT chart_metrics_recorded_at_metric_group_key_user_id_key;
    
    RAISE NOTICE 'Dropped strict unique constraint on chart_metrics';
  END IF;
  
  -- Add idempotency_key column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chart_metrics' AND column_name = 'idempotency_key'
  ) THEN
    ALTER TABLE chart_metrics ADD COLUMN idempotency_key text;
    
    -- Create index for idempotency lookups
    CREATE INDEX IF NOT EXISTS idx_chart_metrics_idempotency 
    ON chart_metrics(idempotency_key) WHERE idempotency_key IS NOT NULL;
    
    RAISE NOTICE 'Added idempotency_key column to chart_metrics';
  END IF;
END $$;

-- ============================================================================
-- M003: OPTIMIZE HABIT_LOGS INDEXES (Remove redundant)
-- ============================================================================

-- Keep the most useful composite indexes, drop redundant ones
DO $$
BEGIN
  -- Check for redundant indexes and drop them
  -- Keep: idx_habit_logs_user_date_completed (most useful for queries)
  -- Drop: idx_habit_logs_user_completed_date if it exists and is redundant
  
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_habit_logs_user_completed_date'
  ) AND EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_habit_logs_user_date_completed'
  ) THEN
    DROP INDEX IF EXISTS idx_habit_logs_user_completed_date;
    RAISE NOTICE 'Dropped redundant index idx_habit_logs_user_completed_date';
  END IF;
END $$;

-- ============================================================================
-- M003: ADD MISSING FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Ensure referential integrity where missing
DO $$
BEGIN
  -- habit_logs -> habits
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_habit_logs_habit'
  ) THEN
    ALTER TABLE habit_logs 
    ADD CONSTRAINT fk_habit_logs_habit 
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint fk_habit_logs_habit';
  END IF;
  
  -- habit_logs -> profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_habit_logs_user'
  ) THEN
    ALTER TABLE habit_logs 
    ADD CONSTRAINT fk_habit_logs_user 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint fk_habit_logs_user';
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_profile_complete(uuid) TO authenticated;

COMMENT ON FUNCTION get_user_profile_complete IS 'Returns complete normalized user profile with rewards, settings, and stats';
