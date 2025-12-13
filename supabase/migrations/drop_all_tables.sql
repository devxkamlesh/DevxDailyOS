-- DROP ALL TABLES SCRIPT
-- This will remove all tables and their data from the database
-- WARNING: This action is irreversible and will delete all data

-- Disable foreign key checks temporarily (if needed)
SET session_replication_role = replica;

-- Drop all tables in reverse dependency order to avoid foreign key conflicts
DROP TABLE IF EXISTS xp_awards CASCADE;
DROP TABLE IF EXISTS weekly_challenge_claims CASCADE;
DROP TABLE IF EXISTS weekly_challenges CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS user_rewards CASCADE;
DROP TABLE IF EXISTS user_friends CASCADE;
DROP TABLE IF EXISTS user_challenge_progress CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS time_blocks CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS social_challenges CASCADE;
DROP TABLE IF EXISTS shop_plans CASCADE;
DROP TABLE IF EXISTS public_profiles CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS payment_orders CASCADE;
DROP TABLE IF EXISTS notification_settings CASCADE;
DROP TABLE IF EXISTS instagram_posts CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS habit_time_logs CASCADE;
DROP TABLE IF EXISTS habit_logs CASCADE;
DROP TABLE IF EXISTS habit_focus_sessions CASCADE;
DROP TABLE IF EXISTS freelance_clients CASCADE;
DROP TABLE IF EXISTS daily_weather CASCADE;
DROP TABLE IF EXISTS daily_journal CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS coin_packages CASCADE;
DROP TABLE IF EXISTS coin_awards CASCADE;
DROP TABLE IF EXISTS challenge_participants CASCADE;

-- Drop any remaining views
DROP VIEW IF EXISTS public_profiles CASCADE;

-- Drop any custom types (if they exist)
DROP TYPE IF EXISTS habit_type CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS challenge_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Drop any custom functions (if they exist)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_level(xp INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_user_streak(user_id UUID) CASCADE;
DROP FUNCTION IF EXISTS set_time_of_day() CASCADE;

-- Drop any triggers (if they exist)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles CASCADE;
DROP TRIGGER IF EXISTS update_habits_updated_at ON habits CASCADE;
DROP TRIGGER IF EXISTS update_habit_logs_updated_at ON habit_logs CASCADE;
DROP TRIGGER IF EXISTS set_habit_log_time_of_day ON habit_logs CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Verify all tables are dropped
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;