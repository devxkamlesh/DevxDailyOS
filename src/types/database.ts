export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  website: string | null
  profile_icon: string
  is_public: boolean
  show_on_leaderboard: boolean
  timezone: string
  created_at: string
}

export interface Habit {
  id: string
  user_id: string
  name: string
  emoji: string | null
  description: string | null
  category: 'morning' | 'work' | 'night' | 'health' | 'focus'
  type: 'boolean' | 'numeric'
  target_value: number | null
  target_unit: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Extended fields for focus integration (computed/derived)
  requires_focus?: boolean
  target_time?: number | null
  min_session_time?: number | null
  color?: string | null
  icon?: string | null
  can_complete_without_time?: boolean
}

export interface HabitLog {
  id: string
  user_id: string
  habit_id: string
  date: string
  completed: boolean
  value: number | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  slug: string | null
  description: string | null
  status: 'idea' | 'building' | 'shipped'
  priority: 'low' | 'medium' | 'high' | 'urgent' | null
  category: string | null
  tech_stack: string[] | null
  live_url: string | null
  github_url: string | null
  due_date: string | null
  estimated_hours: number | null
  actual_hours: number | null
  is_pinned: boolean
  is_archived: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  project_id: string | null
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'done'
  is_today: boolean
  due_date: string | null
  created_at: string
  updated_at: string
  project?: Project
}

export interface InstagramPost {
  id: string
  user_id: string
  title: string | null
  hook: string | null
  caption: string | null
  hashtags: string | null
  format: 'reel' | 'post' | 'story' | 'carousel'
  status: 'idea' | 'draft' | 'scheduled' | 'posted'
  category: string | null
  thumbnail_idea: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  scheduled_for: string | null
  posted_at: string | null
  script: string | null
  is_starred: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface FreelanceClient {
  id: string
  user_id: string
  name: string
  platform: 'upwork' | 'fiverr' | 'linkedin' | 'twitter' | 'dm' | 'referral' | 'other' | null
  project_title: string | null
  value: number | null
  currency: string
  stage: 'lead' | 'in_talk' | 'proposal' | 'active' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent' | null
  email: string | null
  phone: string | null
  website: string | null
  next_action: string | null
  next_action_date: string | null
  notes: string | null
  is_starred: boolean
  created_at: string
  updated_at: string
}


// Additional types for gamification and settings

export interface UserRewards {
  id: string
  user_id: string
  coins: number
  gems: number
  xp: number
  level: number
  current_streak: number
  longest_streak: number
  perfect_days: number
  current_theme: string
  current_avatar: string
  unlocked_themes: string[]
  unlocked_avatars: string[]
  created_at: string
  updated_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  claimed_at: string
  created_at: string
}

export interface DailyJournal {
  id: string
  user_id: string
  date: string
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible' | null
  reflection: string | null
  gratitude: string | null
  wins: string | null
  challenges: string | null
  created_at: string
  updated_at: string
}

export interface HabitFocusSession {
  id: string
  user_id: string
  habit_id: string
  date: string
  duration: number
  pomodoros_completed: number
  created_at: string
}

export interface WeeklyChallenge {
  id: string
  title: string
  description: string | null
  target_type: 'completions' | 'streak' | 'perfect_days'
  target_value: number
  coin_reward: number
  xp_reward: number
  is_active: boolean
  week_start: string | null
  week_end: string | null
  created_at: string
}

export interface UserChallengeProgress {
  id: string
  user_id: string
  challenge_id: string
  progress: number
  completed: boolean
  completed_at: string | null
  claimed: boolean
  created_at: string
}

export interface NotificationSettings {
  id: string
  user_id: string
  daily_reminders: boolean
  achievement_alerts: boolean
  weekly_summary: boolean
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  timezone: string
  start_of_week: string
  theme: string
  created_at: string
  updated_at: string
}

export interface PaymentOrder {
  id: string
  order_id: string
  user_id: string
  amount: number
  currency: string
  receipt: string | null
  status: 'created' | 'paid' | 'failed' | 'refunded'
  payment_id: string | null
  notes: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface PaymentTransaction {
  id: string
  payment_id: string
  order_id: string
  user_id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  package_id: string | null
  coins_purchased: number | null
  bonus_coins: number
  created_at: string
}


export interface TimeBlock {
  id: string
  user_id: string
  date: string
  start_time: string
  end_time: string
  title: string
  description: string | null
  color: string
  completed: boolean
  created_at: string
  updated_at: string
}

export interface ShopPlan {
  id: string
  name: string
  description: string | null
  plan_type: 'theme' | 'avatar' | 'feature'
  coin_price: number
  icon: string | null
  is_active: boolean
  created_at: string
}

export interface CoinAward {
  id: string
  user_id: string
  habit_id: string
  date: string
  coins_awarded: number
  created_at: string
}

export interface XpAward {
  id: string
  user_id: string
  habit_id: string
  date: string
  xp_awarded: number
  created_at: string
}

export interface WeeklyChallengeClaim {
  id: string
  user_id: string
  challenge_id: string
  week_start: string
  coins_awarded: number
  xp_awarded: number
  claimed_at: string
}


// Feedback system
export interface Feedback {
  id: string
  user_id: string | null
  type: 'bug' | 'feature' | 'improvement' | 'other'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'reviewing' | 'planned' | 'in_progress' | 'completed' | 'rejected'
  admin_notes: string | null
  page_url: string | null
  user_agent: string | null
  created_at: string
  updated_at: string
}

// Announcements system
export interface Announcement {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'error' | 'update'
  is_active: boolean
  is_dismissible: boolean
  show_on_dashboard: boolean
  priority: number
  target_audience: 'all' | 'free' | 'premium' | 'new_users'
  start_date: string
  end_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AnnouncementDismissal {
  id: string
  user_id: string
  announcement_id: string
  dismissed_at: string
}

// System logs
export interface SystemLog {
  id: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  category: string
  message: string
  details: Record<string, any> | null
  user_id: string | null
  page_url: string | null
  user_agent: string | null
  ip_address: string | null
  created_at: string
}
