-- Verify Database Tables After Recreation
-- Run this after executing database.sql to confirm everything is set up correctly

-- 1. Check all tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. Check table row counts (should all be 0 for fresh database)
SELECT 
    'profiles' as table_name, 
    COUNT(*) as row_count 
FROM profiles
UNION ALL
SELECT 'habits', COUNT(*) FROM habits
UNION ALL
SELECT 'habit_logs', COUNT(*) FROM habit_logs
UNION ALL
SELECT 'user_rewards', COUNT(*) FROM user_rewards
UNION ALL
SELECT 'system_settings', COUNT(*) FROM system_settings
UNION ALL
SELECT 'shop_plans', COUNT(*) FROM shop_plans
UNION ALL
SELECT 'coin_packages', COUNT(*) FROM coin_packages
UNION ALL
SELECT 'payment_orders', COUNT(*) FROM payment_orders
UNION ALL
SELECT 'payment_transactions', COUNT(*) FROM payment_transactions
ORDER BY table_name;

-- 3. Check RLS policies are enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = true
ORDER BY tablename;

-- 4. Check functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;