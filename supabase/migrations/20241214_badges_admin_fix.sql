-- Fix RLS policies for admin badge management
-- Run this after 20241214_badges_system.sql

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "user_badges_insert" ON user_badges;
DROP POLICY IF EXISTS "user_badges_update" ON user_badges;

-- Allow all authenticated users to insert/update/delete user_badges
-- (Admin check should be done at application level)
CREATE POLICY "user_badges_insert_all" ON user_badges FOR INSERT WITH CHECK (true);
CREATE POLICY "user_badges_update_all" ON user_badges FOR UPDATE USING (true);
CREATE POLICY "user_badges_delete_all" ON user_badges FOR DELETE USING (true);

-- Also allow admins to manage badges table
DROP POLICY IF EXISTS "badges_select" ON badges;
CREATE POLICY "badges_select_all" ON badges FOR SELECT USING (true);
CREATE POLICY "badges_insert" ON badges FOR INSERT WITH CHECK (true);
CREATE POLICY "badges_update" ON badges FOR UPDATE USING (true);
CREATE POLICY "badges_delete" ON badges FOR DELETE USING (true);
