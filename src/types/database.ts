export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
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
  tech_stack: string[] | null
  live_url: string | null
  github_url: string | null
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
  format: 'reel' | 'post' | 'story'
  status: 'idea' | 'draft' | 'scheduled' | 'posted'
  scheduled_for: string | null
  posted_at: string | null
  created_at: string
  updated_at: string
}

export interface FreelanceClient {
  id: string
  user_id: string
  name: string
  platform: 'upwork' | 'fiverr' | 'dm' | 'other' | null
  project_title: string | null
  value: number | null
  currency: string
  stage: 'lead' | 'in_talk' | 'proposal' | 'active' | 'done'
  next_action: string | null
  next_action_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
