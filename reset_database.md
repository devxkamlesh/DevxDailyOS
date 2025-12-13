# Database Reset Instructions

## ⚠️ WARNING: This will delete ALL data in your database!

### Step 1: Drop All Tables
Run this SQL in your Supabase SQL Editor:

```sql
-- DROP ALL TABLES SCRIPT
-- This will remove all tables and their data from the database
-- WARNING: This action is irreversible and will delete all data

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Drop all tables
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

-- Drop views, types, functions, triggers
DROP VIEW IF EXISTS public_profiles CASCADE;
DROP TYPE IF EXISTS habit_type CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS challenge_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_level(xp INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_user_streak(user_id UUID) CASCADE;
DROP FUNCTION IF EXISTS set_time_of_day() CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;
```

### Step 2: Recreate Clean Schema
After dropping all tables, run the `database.sql` file to recreate the clean schema:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the entire content of `supabase/migrations/database.sql`
3. Click "Run" to execute

### Step 3: Verify
Check that all tables are created properly:

```sql
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

## Alternative: Use Supabase CLI

If you have Supabase CLI installed:

```bash
# Reset the database
supabase db reset

# Or apply migrations
supabase db push
```

## What This Does:
- ✅ Removes all 32 tables and their data
- ✅ Drops all views, functions, triggers
- ✅ Cleans up custom types
- ✅ Prepares for fresh schema installation
- ✅ Maintains RLS policies when recreated