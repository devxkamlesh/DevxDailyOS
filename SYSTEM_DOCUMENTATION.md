# DevX Daily OS - Complete System Documentation

## Overview

DevX Daily OS is a gamified habit tracking application built with Next.js 16, Supabase, and TypeScript. It helps users build and maintain habits through gamification elements like XP, coins, streaks, badges, and challenges.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, shadcn/ui components |
| Backend | Supabase (PostgreSQL, Auth, RLS) |
| Payments | Razorpay |
| State | React hooks, Supabase real-time |

---

## Architecture

```
devx-daily-os/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (protected)/        # Auth-required pages
│   │   │   ├── calendar/       # Calendar view
│   │   │   ├── challenges/     # Weekly challenges
│   │   │   ├── friends/        # Social features
│   │   │   ├── journal/        # Daily journal
│   │   │   └── weather/        # Weather widget
│   │   ├── admin/              # Admin dashboard
│   │   │   ├── badges/         # Badge management
│   │   │   ├── charts/         # Analytics charts
│   │   │   ├── coupons/        # Coupon management
│   │   │   ├── notifications/  # Push notifications
│   │   │   ├── settings/       # System settings
│   │   │   └── weekly-challenges/
│   │   ├── api/                # API routes
│   │   │   ├── shop/purchase/  # Shop purchases
│   │   │   └── verify-payment/ # Payment verification
│   │   ├── login/              # Auth pages
│   │   └── signup/
│   ├── components/             # React components
│   │   ├── admin/              # Admin components
│   │   ├── habits/             # Habit components
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/                    # Utilities
│   │   ├── supabase/           # Supabase clients
│   │   ├── coins-fixed.ts      # Coin operations
│   │   ├── user-rewards-safe.ts # Safe reward updates
│   │   └── xp.ts               # XP calculations
│   └── types/                  # TypeScript types
├── supabase/
│   └── migrations/             # Database migrations
└── public/                     # Static assets
```

---

## Database Schema

### Core Tables

#### 1. profiles
User profile information linked to Supabase Auth.

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  username text,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  profile_icon text DEFAULT 'user',
  is_public boolean DEFAULT true,
  show_on_leaderboard boolean DEFAULT true,
  timezone text DEFAULT 'Asia/Kolkata',
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

#### 2. admins (Security Table)
Separate table for admin privileges - prevents self-assignment.

```sql
CREATE TABLE admins (
  user_id uuid PRIMARY KEY REFERENCES profiles(id),
  granted_by uuid REFERENCES profiles(id),
  granted_at timestamptz DEFAULT now(),
  notes text
);
```

#### 3. habits
User-defined habits to track.

```sql
CREATE TABLE habits (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  name text NOT NULL,
  emoji text,
  description text,
  category text CHECK (category IN ('morning', 'work', 'night', 'health', 'focus')),
  type text DEFAULT 'boolean' CHECK (type IN ('boolean', 'numeric')),
  target_value int,
  target_unit text,
  is_active boolean DEFAULT true,
  created_at timestamptz,
  updated_at timestamptz
);
```

#### 4. habit_logs
Daily habit completion records.

```sql
CREATE TABLE habit_logs (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  habit_id uuid REFERENCES habits(id),
  date date NOT NULL,
  completed boolean DEFAULT false,
  value int,
  completed_at timestamptz,
  duration_minutes int,
  time_of_day text,
  focus_score int CHECK (1-10),
  interruptions int DEFAULT 0,
  notes text,
  UNIQUE (user_id, habit_id, date)
);
```

#### 5. user_rewards
Gamification data with optimistic locking.

```sql
CREATE TABLE user_rewards (
  id uuid PRIMARY KEY,
  user_id uuid UNIQUE REFERENCES profiles(id),
  coins int DEFAULT 0,
  gems int DEFAULT 0,
  xp int DEFAULT 0,
  level int DEFAULT 1,
  current_streak int DEFAULT 0,
  longest_streak int DEFAULT 0,
  perfect_days int DEFAULT 0,
  current_theme text DEFAULT 'default',
  current_avatar text DEFAULT 'user',
  unlocked_themes text[] DEFAULT ARRAY['default'],
  unlocked_avatars text[] DEFAULT ARRAY['user'],
  version int DEFAULT 0,  -- For optimistic locking
  created_at timestamptz,
  updated_at timestamptz
);
```

#### 6. badges & user_badges
Achievement system.

```sql
CREATE TABLE badges (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text,
  rarity text DEFAULT 'common',
  category text,
  requirement_type text,
  requirement_value int,
  xp_reward int DEFAULT 0,
  coin_reward int DEFAULT 0,
  is_purchasable boolean DEFAULT false,
  coin_price int DEFAULT 0
);

CREATE TABLE user_badges (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  badge_id uuid REFERENCES badges(id),
  is_primary boolean DEFAULT false,
  earned_at timestamptz DEFAULT now(),
  UNIQUE (user_id, badge_id)
);
```

#### 7. weekly_challenges
Time-limited challenges for engagement.

```sql
CREATE TABLE weekly_challenges (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  description text,
  target_type text CHECK (IN ('completions', 'streak', 'perfect_days')),
  target_value int NOT NULL,
  coin_reward int DEFAULT 0,
  xp_reward int DEFAULT 0,
  is_active boolean DEFAULT true,
  week_start date,
  week_end date
);
```

#### 8. shop_plans & shop_purchases
In-app shop system.

```sql
CREATE TABLE shop_plans (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  plan_type text CHECK (IN ('theme', 'avatar', 'feature')),
  coin_price int NOT NULL DEFAULT 0,
  icon text,
  is_active boolean DEFAULT true
);

CREATE TABLE shop_purchases (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  plan_id uuid REFERENCES shop_plans(id),
  coupon_id uuid REFERENCES coupons(id),
  original_price int NOT NULL,
  coupon_discount int DEFAULT 0,
  final_price int NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

---

## Core Functions (PostgreSQL)

### Security Functions

#### is_admin()
Check if user has admin privileges.

```sql
CREATE FUNCTION is_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admins WHERE user_id = check_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### Optimistic Locking Functions

#### update_user_rewards_safe()
Safely update user rewards with version checking to prevent race conditions.

```sql
CREATE FUNCTION update_user_rewards_safe(
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
-- Returns: {success: bool, coins: int, xp: int, level: int, version: int, error?: string}
-- Checks version before update, increments version on success
-- Returns error if version mismatch (concurrent modification)
$$;
```

#### add_coins_safe()
Add coins with optimistic locking and transaction logging.

```sql
CREATE FUNCTION add_coins_safe(
  p_user_id uuid,
  p_expected_version integer,
  p_amount integer,
  p_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
-- Validates amount > 0
-- Uses update_user_rewards_safe internally
-- Logs to coin_transactions table
-- Returns: {success: bool, coins: int, version: int}
$$;
```

#### spend_coins_safe()
Spend coins with balance validation and optimistic locking.

```sql
CREATE FUNCTION spend_coins_safe(
  p_user_id uuid,
  p_expected_version integer,
  p_amount integer,
  p_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
-- Validates sufficient balance
-- Uses update_user_rewards_safe with negative delta
-- Logs to coin_transactions table
-- Returns: {success: bool, coins: int, version: int, error?: 'insufficient_funds'}
$$;
```

#### add_user_coins_safe()
Add coins with automatic retry logic for version conflicts.

```sql
CREATE FUNCTION add_user_coins_safe(
  p_user_id uuid,
  p_coins int,
  p_reason text DEFAULT 'Coins added'
)
RETURNS jsonb AS $$
-- Automatically retries up to 3 times on version conflict
-- Creates user_rewards record if doesn't exist
-- Returns: {success: bool, coins: int, version: int}
$$;
```

#### process_purchase_safe()
Process shop purchases with full transaction safety.

```sql
CREATE FUNCTION process_purchase_safe(
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
-- Uses spend_coins_safe for atomic coin deduction
-- Records purchase in shop_purchases table
-- Returns: {success: bool, coins_spent: int, new_balance: int}
$$;
```

### Badge Functions

#### assign_user_badge()
Safely assign badge to user (prevents duplicates).

```sql
CREATE FUNCTION assign_user_badge(p_user_id uuid, p_badge_id uuid)
RETURNS boolean AS $$
-- Checks if badge already assigned
-- Inserts into user_badges if not exists
-- Returns true on success
$$;
```

#### set_primary_badge()
Atomically set primary badge (prevents race conditions).

```sql
CREATE FUNCTION set_primary_badge(p_user_id uuid, p_user_badge_id uuid)
RETURNS void AS $$
-- Sets all user badges to non-primary
-- Sets specified badge as primary
-- Uses transaction for atomicity
$$;
```

### Analytics Functions

#### get_user_habit_analytics()
Calculate comprehensive habit analytics efficiently.

```sql
CREATE FUNCTION get_user_habit_analytics(p_user_id uuid)
RETURNS jsonb AS $$
-- Returns: {
--   total_habits, active_habits, total_completions,
--   completions_today, completions_week, completions_month,
--   current_streak, longest_streak, perfect_days,
--   completion_rate, best_category, best_time_of_day
-- }
$$;
```

#### get_user_habits_with_status()
Get habits with today's completion status.

```sql
CREATE FUNCTION get_user_habits_with_status(p_user_id uuid)
RETURNS TABLE (
  id uuid, name text, description text, category text, type text,
  target_value int, target_unit text, emoji text, is_active boolean,
  created_at timestamptz, updated_at timestamptz,
  completed_today boolean, current_value integer
) AS $$
-- Joins habits with today's habit_logs
-- Returns completion status for each habit
$$;
```

### Utility Functions

#### calculate_level()
Calculate user level from XP.

```sql
CREATE FUNCTION calculate_level(total_xp int)
RETURNS int AS $$
BEGIN
  RETURN GREATEST(1, FLOOR(SQRT(total_xp / 100.0)) + 1);
END;
$$;
```

---

## API Routes

### POST /api/shop/purchase
Process shop item purchase.

```typescript
// Request
{
  planId: string,      // Shop plan UUID
  couponCode?: string  // Optional coupon code
}

// Response
{
  success: boolean,
  message: string,
  finalPrice: number,
  couponDiscount: number
}

// Flow:
// 1. Validate user authentication
// 2. Get plan details
// 3. Get user rewards with version
// 4. Validate/apply coupon if provided
// 5. Check sufficient balance
// 6. Call process_purchase_safe() RPC
// 7. Apply purchased item (theme/avatar)
// 8. Return success response
```

### POST /api/verify-payment
Verify Razorpay payment and add coins.

```typescript
// Request
{
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  coins: number
}

// Response
{
  success: boolean,
  coins_added: number,
  new_balance: number,
  message: string
}

// Flow:
// 1. Validate signature with HMAC-SHA256
// 2. Verify user authentication
// 3. Verify order belongs to user
// 4. Check for duplicate payment
// 5. Record payment_transaction
// 6. Update order status
// 7. Call add_user_coins_safe() RPC
// 8. Return new balance
```

---

## Row Level Security (RLS) Policies

### User Data (Self-access only)
```sql
-- Users can only access their own data
CREATE POLICY "own_data" ON [table] 
  FOR ALL USING (auth.uid() = user_id);
```

### Admin-Only Tables
```sql
-- badges, weekly_challenges, coupons, shop_plans, coin_packages
CREATE POLICY "admin_only" ON [table]
  FOR INSERT/UPDATE/DELETE
  USING/WITH CHECK (is_admin(auth.uid()));
```

### Service Role Only
```sql
-- user_badges insert, weekly_challenge_claims insert
CREATE POLICY "service_only" ON [table]
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');
```

### Public Read
```sql
-- Active items visible to all
CREATE POLICY "public_read" ON [table]
  FOR SELECT USING (is_active = true);
```

---

## Frontend Components

### Habit Management
- `HabitCard` - Individual habit display with completion toggle
- `HabitList` - List of user habits
- `HabitForm` - Create/edit habit form
- `HabitCalendar` - Calendar view of completions

### Gamification
- `Gamification` - XP bar, level, coins display
- `BadgeGrid` - User badges display
- `LeaderboardTable` - Global/friends leaderboard
- `StreakCounter` - Current streak display

### Challenges
- `ChallengeCard` - Weekly challenge with progress
- `ChallengeList` - Active challenges list
- `RewardClaim` - Claim completed challenge rewards

### Admin
- `AdminLayoutClient` - Admin dashboard layout
- `BadgeManager` - CRUD for badges
- `CouponManager` - CRUD for coupons
- `ChallengeManager` - CRUD for weekly challenges

---

## Authentication Flow

```
1. User visits /login or /signup
2. Supabase Auth handles authentication
3. On success, middleware checks session
4. Protected routes require valid session
5. Admin routes additionally check is_admin()
```

### Middleware (middleware.ts)
```typescript
// Checks for valid Supabase session
// Redirects unauthenticated users to /login
// Allows public routes: /, /login, /signup
```

---

## Gamification System

### XP Calculation
```typescript
// Per habit completion: 10 XP base
// Streak bonus: +5 XP per streak day (max +50)
// Perfect day bonus: +25 XP
// Challenge completion: Variable XP reward
```

### Level Formula
```sql
level = FLOOR(SQRT(total_xp / 100)) + 1
-- Level 1: 0 XP
-- Level 2: 100 XP
-- Level 3: 400 XP
-- Level 4: 900 XP
-- Level 5: 1600 XP
```

### Coin Economy
```
Earning:
- Habit completion: 1-5 coins
- Perfect day: 10 coins
- Challenge completion: 25-100 coins
- Purchase: Real money via Razorpay

Spending:
- Shop items (themes, avatars): 50-500 coins
- Premium badges: 100-1000 coins
```

### Streak System
```
- Streak increments on any habit completion per day
- Streak resets if no completions for a day
- Longest streak is preserved
- Streak milestones unlock badges
```

---

## Security Features

### 1. Optimistic Locking
Prevents race conditions in concurrent updates:
```typescript
// Get current version
const { version } = await getRewards(userId);
// Update with version check
const result = await updateSafe(userId, version, changes);
if (!result.success && result.error === 'version_mismatch') {
  // Retry with fresh version
}
```

### 2. Admin Separation
Admin privileges stored in separate table:
```sql
-- Cannot self-assign via profiles update
-- Only service_role can modify admins table
```

### 3. RLS Policies
All tables protected by Row Level Security:
```sql
-- Users can only access own data
-- Admin operations require is_admin() check
-- Sensitive operations require service_role
```

### 4. Payment Verification
```typescript
// HMAC-SHA256 signature verification
// Order ownership validation
// Duplicate payment prevention
// Transaction logging
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Deployment

### Database Setup
```bash
# Run migrations
supabase db push

# Or apply specific migration
supabase migration up
```

### Application
```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build
npm start
```

---

## Error Handling

### API Errors
```typescript
// Standard error response
{
  error: string,      // Error message
  details?: string,   // Additional info (dev only)
  status: number      // HTTP status code
}
```

### Database Errors
```typescript
// Optimistic locking failure
{ success: false, error: 'version_mismatch' }

// Insufficient funds
{ success: false, error: 'insufficient_funds', required: X, available: Y }

// Invalid input
{ success: false, error: 'invalid_amount' }
```

### Frontend Error Boundaries
```typescript
// ErrorBoundary - Catches React errors
// AsyncErrorBoundary - Handles async errors
// Toast notifications for user feedback
```

---

## Performance Optimizations

### Database Indexes
```sql
-- Habit logs (most queried)
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, date DESC);
CREATE INDEX idx_habit_logs_completed ON habit_logs(completed) WHERE completed = true;

-- User rewards
CREATE INDEX idx_user_rewards_leaderboard ON user_rewards(xp DESC, level DESC);

-- Badges
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
```

### Query Optimization
- Use RPC functions for complex queries
- Batch operations where possible
- Selective column fetching
- Pagination for large lists

---

## Feature Pages

### /projects - Project Management

**Purpose:** Track personal/side projects from idea to shipped status with task management.

**Routes:**
- `/projects` - Main project list with Kanban/Cards/List views
- `/projects/[id]` - Individual project detail page with unique URL

**Database Tables:**
- `projects` - Project records with status, tech stack, URLs
- `tasks` - Tasks linked to projects

**Core Features:**
| Feature | Description |
|---------|-------------|
| Project CRUD | Create, read, update, delete projects |
| Status Pipeline | Idea → Building → Shipped workflow |
| Task Management | Add, toggle complete, delete tasks per project |
| Progress Tracking | Auto-calculated percentage based on completed tasks |
| Tech Stack Tags | Comma-separated input, stored as array |
| External Links | Live URL and GitHub repository links |
| Detail Page | Dedicated page per project with unique URL |

**UI Components:**
| Component | Description |
|-----------|-------------|
| View Toggle | Switch between Card view and List view |
| Status Colors | Yellow (Idea), Blue (Building), Green (Shipped) |
| Project Modal | Full project details with task list |
| Detail Page | Full-page view with tabs (Tasks, Notes) |
| Quick Actions | Status change buttons, edit/delete |
| Summary Stats | Ideas count, Building count, Shipped count, Tasks done |
| Loading States | Skeleton cards during data fetch |
| Empty State | CTA to create first project |

**Data Model:**
```typescript
interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  status: 'idea' | 'building' | 'shipped'
  tech_stack?: string[]
  live_url?: string
  github_url?: string
  created_at: string
  updated_at: string
}

interface Task {
  id: string
  user_id: string
  project_id: string
  title: string
  status: 'pending' | 'done'
  priority: 'low' | 'medium' | 'high'
  created_at: string
}
```

---

### /freelance - Freelance CRM

**Purpose:** Full-featured CRM for managing freelance clients through sales pipeline with analytics.

**Routes:**
- `/freelance` - Main client list with Kanban/Cards/List views
- `/freelance/[id]` - Individual client detail page with unique URL

**Database Tables:**
- `freelance_clients` - Client records with stage, value, contact info, priority

**Core Features:**
| Feature | Description |
|---------|-------------|
| Kanban Pipeline | Lead → In Talk → Proposal → Active → Done |
| Drag & Drop | Move clients between stages using @dnd-kit |
| 3 View Modes | Kanban, Cards, List views |
| Client Management | Name, platform, project title, value, currency |
| Priority System | Low, Medium, High, Urgent with color coding |
| Contact Info | Email, phone, website fields |
| Next Action Tracking | Action description with due date + overdue alerts |
| Star/Favorite | Pin important clients to top |
| Search & Filter | Filter by stage, platform, search by name |
| Analytics Dashboard | Pipeline value, Active value, Completed value, Conversion rate |
| Platform Options | Upwork, Fiverr, LinkedIn, Twitter, DM, Referral, Other |
| Multi-Currency | INR, USD, EUR, GBP support |
| Detail Page | Dedicated page per client with unique URL |

**UI Components:**
| Component | Description |
|-----------|-------------|
| Stats Cards | Pipeline value, Active value, Completed, Conversion % |
| 5-Column Kanban | Responsive board with stage totals and values |
| Client Cards | Priority badge, platform tag, value, next action |
| Client Detail Modal | Full info with stage switcher, contact links |
| Detail Page | Full-page view with edit modal, contact info, notes |
| Search Bar | Real-time search across clients |
| Filter Panel | Stage and platform filters |
| View Toggle | Switch between Kanban/Cards/List |
| Overdue Indicators | Red border for past-due actions |

**Data Model:**
```typescript
interface FreelanceClient {
  id: string
  user_id: string
  name: string
  platform?: 'upwork' | 'fiverr' | 'linkedin' | 'twitter' | 'dm' | 'referral' | 'other'
  project_title?: string
  value?: number
  currency: string
  stage: 'lead' | 'in_talk' | 'proposal' | 'active' | 'done'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  email?: string
  phone?: string
  website?: string
  next_action?: string
  next_action_date?: string
  notes?: string
  is_starred: boolean
  created_at: string
}
```

---

### /instagram - Content Planner

**Purpose:** Full content planning system for Instagram with scheduling, categories, and copy features.

**Routes:**
- `/instagram` - Main post list with Kanban/Cards/List views
- `/instagram/[id]` - Individual post detail page with unique URL

**Database Tables:**
- `instagram_posts` - Post records with format, status, category, scheduling

**Core Features:**
| Feature | Description |
|---------|-------------|
| Content Pipeline | Idea → Draft → Scheduled → Posted |
| Drag & Drop | Move posts between statuses using @dnd-kit |
| 3 View Modes | Kanban, Cards, List views |
| Post Formats | Reel, Post, Story, Carousel with distinct icons |
| Categories | Educational, Entertainment, Promotional, Personal, Trending, Collaboration |
| Content Fields | Title, Hook, Caption, Hashtags, Thumbnail Idea |
| Script Section | Dedicated script field for Reels/Videos with timestamps template |
| Notes Section | Additional notes and ideas per post |
| Tabbed Detail View | Content, Script, Notes tabs in detail modal |
| Scheduling | Date and time scheduling |
| Star/Favorite | Pin important posts to top |
| Copy to Clipboard | One-click copy caption, hashtags, and script |
| Search & Filter | Filter by format, category, search by title |
| Format Stats | Count of Reels, Posts, Stories, Carousels |
| Detail Page | Dedicated page per post with unique URL |

**UI Components:**
| Component | Description |
|-----------|-------------|
| Stats Cards | Count per format type (Reels, Posts, etc.) |
| 4-Column Kanban | Responsive board with status counts |
| Post Cards | Format badge, category tag, schedule date |
| Post Detail Modal | Full content with copy buttons |
| Detail Page | Full-page view with tabs (Content, Script, Notes) |
| Search Bar | Real-time search across posts |
| Filter Panel | Format and category filters |
| View Toggle | Switch between Kanban/Cards/List |
| Gradient Theme | Purple-to-pink Instagram-style accents |

**Data Model:**
```typescript
interface InstagramPost {
  id: string
  user_id: string
  title?: string
  hook?: string
  caption?: string
  hashtags?: string
  format: 'reel' | 'post' | 'story' | 'carousel'
  status: 'idea' | 'draft' | 'scheduled' | 'posted'
  category?: string
  thumbnail_idea?: string
  scheduled_date?: string
  scheduled_time?: string
  script?: string  // Video script with timestamps
  notes?: string
  is_starred: boolean
  created_at: string
}
```

**Category Configuration:**
| Category | Color | Use Case |
|----------|-------|----------|
| educational | Blue | Teaching/tutorial content |
| entertainment | Pink | Fun/engaging content |
| promotional | Green | Product/service promotion |
| personal | Orange | Behind-the-scenes, personal |
| trending | Purple | Trend-based content |
| collaboration | Cyan | Partner/collab content |

---

### /social-leaderboard - Friend Rankings

**Purpose:** Compare stats and rankings with friends in a dedicated leaderboard view.

**Database Views:**
- `public_profiles` - Public user data for leaderboard display

**Core Features:**
| Feature | Description |
|---------|-------------|
| Friend Rankings | XP-based leaderboard of accepted friends |
| Stats Comparison | Level, XP, Streak, Perfect Days |
| Summary Cards | Your rank, friends count, top performer |
| Profile Links | Click to view friend profiles |

**UI Components:**
| Component | Description |
|-----------|-------------|
| Leaderboard Table | Ranked list with position indicators |
| Summary Cards | Quick stats overview |
| Medal Icons | Gold/Silver/Bronze for top 3 |
| Loading States | Skeleton rows during fetch |
| Empty State | CTA to add friends |

---

### /templates - Template Library

**Purpose:** Pre-built templates for quick-starting habits, projects, Instagram content, and freelance clients.

**Core Features:**
| Feature | Description |
|---------|-------------|
| 3 View Modes | Cards, Grid, List views |
| Template Types | Habits, Projects, Instagram, Freelance |
| Search & Filter | Search by name, filter by type |
| Preview Modal | Full template preview before applying |
| One-Click Apply | Instantly create items from templates |
| Stats Dashboard | Count of templates per category |

**Template Categories:**
| Category | Templates | Items |
|----------|-----------|-------|
| Habits | Morning Routine, Deep Work, Fitness, Mindfulness, Entrepreneur | 5-6 habits each |
| Projects | Web App, Mobile App, SaaS, AI/ML | 10 tasks each |
| Instagram | Content Creator, Business Brand, Influencer Growth | 7-8 posts each |
| Freelance | Web Dev, Mobile, UI/UX, E-commerce, CMS, API | 1 client each |

**UI Components:**
| Component | Description |
|-----------|-------------|
| Stats Cards | Total, Habits, Projects, Instagram, Freelance counts |
| Type Filter | Filter by template category |
| View Toggle | Cards/Grid/List view modes |
| Search Bar | Real-time search across templates |
| Template Cards | Icon, name, description, item count, preview/apply buttons |
| Preview Modal | Full item list with details, apply button |
| Grid View | Compact view for quick browsing |
| List View | Detailed row view with quick actions |

**Apply Behavior:**
| Type | Action |
|------|--------|
| Habit | Creates all habits in template |
| Project | Creates project with all tasks |
| Instagram | Creates all posts in template |
| Freelance | Creates client record |

---

### /feedback - User Feedback

**Purpose:** Allow users to submit bug reports, feature requests, and suggestions.

**Routes:**
- `/feedback` - User feedback submission and history

**Database Tables:**
- `feedback` - Feedback records with type, status, priority

**Core Features:**
| Feature | Description |
|---------|-------------|
| Submit Feedback | Bug reports, feature requests, improvements |
| Priority Levels | Low, Medium, High, Urgent |
| Status Tracking | Pending → Reviewing → Planned → In Progress → Completed |
| Admin Response | View admin notes on feedback |
| History View | See all submitted feedback and status |

---

## Admin Pages

### /admin/feedback - Feedback Management

**Purpose:** Review and respond to user feedback.

**Features:**
- View all feedback with filters (status, type)
- Update feedback status
- Add admin notes (visible to user)
- Delete feedback
- Stats: Total, Pending, Bugs, Features

### /admin/announcements - Announcement Management

**Purpose:** Create and manage app-wide announcements.

**Features:**
- Create/edit/delete announcements
- Set type: Info, Warning, Success, Error, Update
- Target audience: All, Free, Premium, New Users
- Schedule start/end dates
- Set priority for ordering
- Toggle active/inactive
- Dismissible option

### /admin/logs - System Logs

**Purpose:** Monitor system events and errors.

**Features:**
- View all system logs
- Filter by level (Debug, Info, Warn, Error, Fatal)
- Filter by category
- Search logs
- View log details with JSON data
- Clear logs by level or all

### /admin/reports - Reports & Analytics

**Purpose:** Generate reports on app performance.

**Features:**
- Key metrics: Users, Active Users, Habits, Completions
- Completion rate and average streak
- Total revenue
- Top habits chart
- User growth chart
- Date range filter (7d, 30d, 90d, 1y)
- Export to CSV

---

## Testing Checklist

- [ ] User registration/login
- [ ] Habit CRUD operations
- [ ] Habit completion logging
- [ ] XP/coin calculations
- [ ] Streak tracking
- [ ] Badge assignment
- [ ] Challenge progress
- [ ] Shop purchases
- [ ] Payment processing
- [ ] Admin operations
- [ ] RLS policy enforcement
- [ ] Concurrent update handling
- [ ] Projects CRUD and task management
- [ ] Freelance client drag-and-drop
- [ ] Instagram post pipeline
- [ ] Social leaderboard friend rankings
- [ ] Templates preview and apply
- [ ] Feedback submission and tracking
- [ ] Announcements display and dismissal
- [ ] Admin feedback management
- [ ] Admin announcements CRUD
- [ ] Admin logs viewing
- [ ] Admin reports generation
