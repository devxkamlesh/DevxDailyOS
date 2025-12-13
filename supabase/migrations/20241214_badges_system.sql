-- ============================================
-- BADGES SYSTEM
-- ============================================

-- Badges table (admin-managed)
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) NOT NULL DEFAULT 'award',
  color VARCHAR(50) NOT NULL DEFAULT 'blue',
  badge_type VARCHAR(50) NOT NULL DEFAULT 'achievement', -- 'achievement', 'purchasable', 'special', 'auto'
  price_inr INTEGER DEFAULT 0, -- Price in INR (0 = free/earned)
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  criteria JSONB DEFAULT '{}', -- For auto badges: {"type": "new_user", "days": 7}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges (which badges a user has)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false, -- Primary badge shown on profile
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For temporary badges like "New"
  UNIQUE(user_id, badge_id)
);

-- Badge purchases (for paid badges)
CREATE TABLE IF NOT EXISTS badge_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  amount_inr INTEGER NOT NULL,
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_primary ON user_badges(user_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_badge_purchases_user ON badge_purchases(user_id);

-- RLS Policies
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_purchases ENABLE ROW LEVEL SECURITY;

-- Badges: Everyone can read active badges
CREATE POLICY "badges_select" ON badges FOR SELECT USING (is_active = true);

-- User badges: Users can see all badges, manage their own
CREATE POLICY "user_badges_select" ON user_badges FOR SELECT USING (true);
CREATE POLICY "user_badges_insert" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_badges_update" ON user_badges FOR UPDATE USING (auth.uid() = user_id);

-- Badge purchases: Users can see and create their own
CREATE POLICY "badge_purchases_select" ON badge_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "badge_purchases_insert" ON badge_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- INSERT DEFAULT BADGES
-- ============================================

INSERT INTO badges (name, description, icon, color, badge_type, price_inr, display_order, criteria) VALUES
-- Auto badges (free, auto-assigned)
('New', 'New member - First 7 days', 'sparkles', 'green', 'auto', 0, 1, '{"type": "new_user", "days": 7}'),
('Early Adopter', 'Joined during beta', 'rocket', 'purple', 'special', 0, 2, '{}'),

-- Achievement badges (earned)
('Streak Master', '30 day streak', 'flame', 'orange', 'achievement', 0, 10, '{"type": "streak", "days": 30}'),
('Habit Hero', 'Completed 100 habits', 'trophy', 'yellow', 'achievement', 0, 11, '{"type": "completions", "count": 100}'),
('Consistent', '7 day streak', 'zap', 'blue', 'achievement', 0, 12, '{"type": "streak", "days": 7}'),

-- Special badges (admin-assigned)
('Creator', 'Content Creator', 'video', 'red', 'special', 0, 20, '{}'),
('Developer', 'Software Developer', 'code', 'cyan', 'special', 0, 21, '{}'),
('YouTuber', 'YouTube Creator', 'youtube', 'red', 'special', 0, 22, '{}'),
('Entrepreneur', 'Business Owner', 'briefcase', 'amber', 'special', 0, 23, '{}'),
('Designer', 'UI/UX Designer', 'palette', 'pink', 'special', 0, 24, '{}'),
('Freelancer', 'Freelance Professional', 'laptop', 'indigo', 'special', 0, 25, '{}'),
('Student', 'Student', 'book', 'emerald', 'special', 0, 26, '{}'),
('Pro', 'Sadhana Pro Member', 'crown', 'gold', 'special', 0, 27, '{}'),
('Verified', 'Verified Account', 'check-circle', 'blue', 'special', 0, 28, '{}')
ON CONFLICT DO NOTHING;

-- ============================================
-- FUNCTION: Auto-assign "New" badge on signup
-- ============================================

CREATE OR REPLACE FUNCTION assign_new_user_badge()
RETURNS TRIGGER AS $$
DECLARE
  new_badge_id UUID;
BEGIN
  -- Get the "New" badge ID
  SELECT id INTO new_badge_id FROM badges WHERE badge_type = 'auto' AND criteria->>'type' = 'new_user' LIMIT 1;
  
  IF new_badge_id IS NOT NULL THEN
    INSERT INTO user_badges (user_id, badge_id, is_primary, expires_at)
    VALUES (NEW.id, new_badge_id, true, NOW() + INTERVAL '7 days')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on profile creation
DROP TRIGGER IF EXISTS on_profile_created_assign_badge ON profiles;
CREATE TRIGGER on_profile_created_assign_badge
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_new_user_badge();

-- ============================================
-- UPDATE public_profiles VIEW to include badges
-- ============================================

DROP VIEW IF EXISTS public_profiles;
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
  
  -- Weekly stats
  (SELECT COUNT(*) FROM habit_logs hl WHERE hl.user_id = p.id AND hl.completed = true AND hl.date >= CURRENT_DATE - INTERVAL '7 days') as weekly_completions,
  (SELECT COUNT(DISTINCT hl.date) FROM habit_logs hl WHERE hl.user_id = p.id AND hl.completed = true AND hl.date >= CURRENT_DATE - INTERVAL '7 days') as weekly_active_days,
  
  -- Monthly stats
  (SELECT COUNT(*) FROM habit_logs hl WHERE hl.user_id = p.id AND hl.completed = true AND hl.date >= CURRENT_DATE - INTERVAL '30 days') as monthly_completions,
  (SELECT COUNT(DISTINCT hl.date) FROM habit_logs hl WHERE hl.user_id = p.id AND hl.completed = true AND hl.date >= CURRENT_DATE - INTERVAL '30 days') as monthly_active_days,
  
  -- All time stats
  (SELECT COUNT(*) FROM habit_logs hl WHERE hl.user_id = p.id AND hl.completed = true) as total_completions,
  (SELECT COUNT(DISTINCT hl.date) FROM habit_logs hl WHERE hl.user_id = p.id AND hl.completed = true) as total_active_days,
  
  -- Achievement count
  (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = p.id) as achievement_count

FROM profiles p
LEFT JOIN user_rewards ur ON ur.user_id = p.id
WHERE p.show_on_leaderboard = true;

GRANT SELECT ON public_profiles TO authenticated;
